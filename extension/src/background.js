import {read, write} from './store.js';
import {mergeLMS, gpaSummary, legalVersion} from './core.js';
import {syncCalendars} from './calendar-sync.js';
import {syncPayload, applyPayload, pushSync, pullSync} from './device-sync.js';

const own = sender => sender.id === chrome.runtime.id && sender.url?.startsWith(chrome.runtime.getURL(''));
let registrationQueue = Promise.resolve();
let alarmRunning = false;
const autoSyncMinutes = 30;

export function normalizeSite(value) {
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (!(url.protocol === 'https:' || (url.protocol === 'http:' && local)) || url.username || url.password || url.hostname.includes('*')) throw Error('Connect one HTTPS LMS origin at a time.');
  if (url.pathname !== '/' || url.search || url.hash) throw Error('Use the LMS origin without a page path.');
  return url.origin;
}
export function registerSites() {
  const run = registrationQueue.then(async () => {
    const state = await read();
    const origins = state.legalAcceptance?.version===legalVersion ? [...new Set((state.settings.lmsOrigins || []).map(normalizeSite))] : [];
    const allowed = [];
    for (const origin of origins) if (await chrome.permissions.contains({origins: [origin + '/*']})) allowed.push(origin + '/*');
    const existing = await chrome.scripting.getRegisteredContentScripts({ids: ['campus-sites']});
    if (existing.length) await chrome.scripting.unregisterContentScripts({ids: ['campus-sites']});
    if (allowed.length) await chrome.scripting.registerContentScripts([{id: 'campus-sites', matches: allowed, js: ['src/content.js'], runAt: 'document_idle', persistAcrossSessions: true}]);
    return allowed.length;
  });
  registrationQueue = run.catch(() => {});
  return run;
}
async function initialize() {
  if (!(await chrome.storage.local.get('campus')).campus) await write(await read());
  await registerSites();
  if (!(await chrome.alarms.get('reminders'))) await chrome.alarms.create('reminders', {periodInMinutes: 1});
  if (!(await chrome.alarms.get('calendar-sync'))) await chrome.alarms.create('calendar-sync', {periodInMinutes: 5});
}
chrome.runtime.onInstalled.addListener(() => initialize().catch(console.error));
chrome.runtime.onStartup.addListener(() => initialize().catch(console.error));
chrome.permissions.onAdded.addListener(() => registerSites().catch(console.error));
chrome.permissions.onRemoved.addListener(() => registerSites().catch(console.error));
let pushTimer;
export async function pullRemote() {
  const state = await read();
  if (!state.settings.syncAcrossDevices) return false;
  const payload = await pullSync();
  if (!payload) return false;
  await write(applyPayload(state, payload));
  return true;
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes['cl-sync-meta']) pullRemote().catch(console.error);
  const next = area === 'local' && changes.campus?.newValue, prev = changes.campus?.oldValue;
  if (next?.settings?.syncAcrossDevices) {
    // Turning sync on adopts another device's copy first; later local edits are pushed.
    if (!prev?.settings?.syncAcrossDevices) pullRemote().then(pulled => pulled || pushSync(next)).catch(console.error);
    else if (JSON.stringify(syncPayload(prev)) !== JSON.stringify(syncPayload(next))) { clearTimeout(pushTimer); pushTimer = setTimeout(() => read().then(pushSync).catch(console.error), 2000); }
  }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.campus && (JSON.stringify(changes.campus.oldValue?.settings?.lmsOrigins) !== JSON.stringify(changes.campus.newValue?.settings?.lmsOrigins) || changes.campus.oldValue?.legalAcceptance?.version !== changes.campus.newValue?.legalAcceptance?.version)) registerSites().catch(console.error);
});
async function connectedSender(sender) {
  if (sender.id !== chrome.runtime.id || !sender.tab || !sender.url) return false;
  const origin = new URL(sender.url).origin;
  const state=await read();return state.legalAcceptance?.version===legalVersion && state.settings.lmsOrigins.includes(origin) && await chrome.permissions.contains({origins: [origin + '/*']});
}
export async function handleMessage(message, sender) {
  if (message.type === 'GPA_SUMMARY') {
    if (!(await connectedSender(sender)) || sender.frameId && sender.frameId!==0 || !sender.tab?.url) throw Error('GPA summary is available only on your connected LMS tab.');
    const origin = new URL(sender.tab.url).origin;
    if(new URL(sender.url).origin!==origin)throw Error('The LMS tab changed. Reload it and try again.');
    const state = await read(), userId = state.settings.activeAccounts?.[origin];
    if(!userId)throw Error('Import this Canvas account to load its GPA.');
    if(message.userId!==undefined&&String(message.userId)!==String(userId))throw Error('This tab belongs to a different imported Canvas account. Refresh its import.');
    return {ok:true,origin,userId:String(userId),summary:gpaSummary(state,{origin,userId:String(userId),activeAccounts:state.settings.activeAccounts})};
  }
  if (message.type === 'OPEN' && (own(sender) || await connectedSender(sender))) {
    const pages = new Set(['dashboard','tasks','planner','grades','notes','study','themes','focus','settings']);
    if(message.page!==undefined&&!pages.has(message.page))throw Error('Unknown workspace page.');
    const tab=sender.tab&&!own(sender)?sender.tab:(await chrome.tabs.query({active:true,currentWindow:true}))[0];
    if(!tab?.id||!tab.url)throw Error('Open your connected Canvas tab first.');
    const origin=new URL(tab.url).origin;
    if(!(await read()).settings.lmsOrigins.includes(origin)||!(await chrome.permissions.contains({origins:[origin+'/*']})))throw Error('Connect this Canvas tab in CourseLark first.');
    const response=await chrome.tabs.sendMessage(tab.id,{type:'OPEN_PANEL',page:message.page||'dashboard'});
    if(!response?.ok)throw Error('Reload this Canvas tab, then try opening CourseLark again.');
    return {ok:true};
  }
  if (message.type === 'AUTO_SYNC') {
    // Connected top-level LMS tabs refresh their own import; repeat visits are throttled.
    if (!(await connectedSender(sender)) || sender.frameId || !sender.tab?.url || new URL(sender.tab.url).origin !== new URL(sender.url).origin) throw Error('Automatic import is available only on your connected LMS tab.');
    const state = await read(), origin = new URL(sender.url).origin, last = state.settings.lastImport;
    if (last?.origin === origin && Date.now() - last.at < autoSyncMinutes * 60000) return {ok: true, skipped: true};
    return importTab(sender.tab, state);
  }
  if (!own(sender)) throw Error('This action is available only from the CourseLark extension.');
  if (message.type === 'REGISTER') return {ok: true, connected: await registerSites()};
  if (message.type === 'CALENDAR_SYNC') return {ok: true, results: await calendarSync()};
  if (message.type !== 'IMPORT_LMS') throw Error('Unknown operation.');
  const state = await read();
  if(state.legalAcceptance?.version!==legalVersion)throw Error('Review and accept the Terms of Use before importing LMS data.');
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  let tab = tabs[0];
  if (tab?.url?.startsWith(chrome.runtime.getURL(''))) {
    // Import from the most recently used connected LMS when the workspace is active.
    const candidates = state.settings.lmsOrigins.length ? await chrome.tabs.query({url: state.settings.lmsOrigins.map(o => o + '/*')}) : [];
    tab = candidates.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
  }
  return importTab(tab, state);
}
async function importTab(tab, state) {
  if (!tab?.id || !tab.url) throw Error('Open your signed-in LMS tab first.');
  const origin = new URL(tab.url).origin;
  normalizeSite(origin);
  if (!state.settings.lmsOrigins.includes(origin)) throw Error('Enable this LMS site in the CourseLark popup first.');
  if (!(await chrome.permissions.contains({origins: [origin + '/*']}))) throw Error('Site permission was removed. Enable your LMS site again.');
  const executions = await chrome.scripting.executeScript({target: {tabId: tab.id}, func: collectLMS});
  const result = executions[0]?.result;
  if (!result || result.error) throw Error(result?.error || 'Canvas import did not return data. Reload the LMS tab and try again.');
  if (result.origin !== origin || !Array.isArray(result.courses) || !Array.isArray(result.tasks)) throw Error('The LMS tab changed during import. Retry on the intended site.');
  // API collection can take seconds. Merge into the latest state, preserving edits made meanwhile.
  const latest = await read();
  if (!latest.settings.lmsOrigins.includes(origin)) throw Error('The LMS site was disconnected during import.');
  const merged = mergeLMS(latest, result);
  for (const incoming of result.tasks) if (incoming.submitted || incoming.excused) {
    const task = merged.tasks.find(t => t.id === incoming.id); if (task) task.done = true;
  }
  merged.settings.activeAccounts = {...merged.settings.activeAccounts, ...(result.userId ? {[origin]: String(result.userId)} : {})};
  merged.settings.lastImport = {origin, at: Date.now(), warnings: result.warnings || []};
  await write(merged);
  return {ok: true, courses: result.courses.length, tasks: result.tasks.length, warnings: result.warnings || []};
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return;
  handleMessage(message, sender).then(respond, error => respond({ok: false, error: error.message}));
  return true;
});

// Self-contained because Chrome serializes this function into the isolated LMS tab.
// Reads only authenticated same-origin APIs; never posts or submits coursework.
export async function collectLMS() {
  const origin = location.origin, courses = [], tasks = [], warnings = [];
  const isCanvas = !!document.querySelector('#global_nav_dashboard_link,.ic-app-header,.ic-DashboardCard') || location.hostname.endsWith('.instructure.com');
  // Same-origin, read-only JSON helper for the non-Canvas adapters below.
  const json = async (path, options = {}) => {
    const url = new URL(path, origin);
    if (url.origin !== origin) throw Error('Refused a request outside this LMS.');
    const response = await fetch(url.href, {credentials: 'same-origin', signal: AbortSignal.timeout(20000), ...options});
    if (!response.ok) throw Error(`LMS returned ${response.status}.`);
    return response.json();
  };
  const num = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
  const iso = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
  const pct = (n, d) => num(n) !== null && num(d) > 0 ? Math.round(10000 * num(n) / num(d)) / 100 : null;
  const brightspace = location.pathname.startsWith('/d2l/') || !!document.querySelector('d2l-navigation,d2l-navigation-main-header');
  const moodleSession = document.querySelector('a[href*="/login/logout.php?sesskey="]')?.href?.match(/sesskey=([\w]+)/)?.[1];
  const blackboard = location.pathname.startsWith('/ultra/') || location.pathname.startsWith('/webapps/') || !!document.querySelector('#bb-session-key,bb-base-layout');
  if (!isCanvas && brightspace) {
    try {
      const versions = await json('/d2l/api/versions/');
      const latest = code => versions.find(v => v.ProductCode === code)?.LatestVersion;
      const lp = latest('lp'), le = latest('le');
      if (!lp || !le) throw Error('Brightspace did not report its API versions.');
      const me = await json(`/d2l/api/lp/${lp}/users/whoami`);
      if (!/^\d+$/.test(String(me.Identifier))) throw Error('Brightspace did not return a signed-in user.');
      const prefix = origin + '|user:' + me.Identifier + '|';
      let bookmark = '', pages = 0, items = [];
      do {
        const page = await json(`/d2l/api/lp/${lp}/enrollments/myenrollments/?orgUnitTypeId=3${bookmark ? '&bookmark=' + encodeURIComponent(bookmark) : ''}`);
        items.push(...(page.Items || []));
        bookmark = page.PagingInfo?.HasMoreItems ? page.PagingInfo.Bookmark : '';
      } while (bookmark && ++pages < 50);
      for (const item of items) {
        const unit = item.OrgUnit || {}, access = item.Access || {};
        if (!/^\d+$/.test(String(unit.Id)) || access.CanAccess === false) continue;
        const courseId = prefix + 'course:' + unit.Id;
        let grade = null;
        try { const g = await json(`/d2l/api/le/${le}/${unit.Id}/grades/final/values/myGradeValue`); grade = pct(g.PointsNumerator, g.PointsDenominator) ?? pct(g.WeightedNumerator, g.WeightedDenominator); } catch {}
        courses.push({id: courseId, userId: String(me.Identifier), sourceOrigin: origin, name: String(unit.Name || 'Course ' + unit.Id), code: String(unit.Code || ''), url: origin + '/d2l/home/' + unit.Id, grade, currentGrade: grade, courseStart: iso(access.StartDate), courseEnd: iso(access.EndDate), enrollmentType: 'student', importedAt: Date.now(), source: 'brightspace'});
        if (access.IsActive === false) continue;
        try {
          for (const f of await json(`/d2l/api/le/${le}/${unit.Id}/dropbox/folders/`)) {
            if (!/^\d+$/.test(String(f.Id))) continue;
            tasks.push({id: prefix + 'assignment:' + f.Id, userId: String(me.Identifier), sourceOrigin: origin, title: String(f.Name || 'Assignment'), courseId, due: iso(f.DueDate), url: `${origin}/d2l/lms/dropbox/user/folder_submit_files.d2l?ou=${unit.Id}&db=${f.Id}`, description: '', points: num(f.Assessment?.ScoreDenominator), score: null, source: 'brightspace'});
          }
        } catch (e) { warnings.push(`${unit.Name || unit.Id}: ${e.message}`); }
      }
      return {origin, userId: String(me.Identifier), courses, tasks, warnings};
    } catch (e) { return {error: 'Brightspace import failed: ' + e.message}; }
  }
  if (!isCanvas && moodleSession) {
    try {
      // Moodle's AJAX services are POST-only; these calls are read-only lookups.
      const call = async (methodname, args) => {
        const [result] = await json(`/lib/ajax/service.php?sesskey=${encodeURIComponent(moodleSession)}&info=${methodname}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify([{index: 0, methodname, args}])});
        if (!result || result.error) throw Error(result?.exception?.message || 'Moodle request failed.');
        return result.data;
      };
      const enrolled = await call('core_course_get_enrolled_courses_by_timeline_classification', {offset: 0, limit: 0, classification: 'inprogress', sort: 'fullname'});
      const userId = String(document.querySelector('[data-userid]')?.dataset.userid || 'session');
      const prefix = origin + '|user:' + userId + '|';
      for (const c of enrolled.courses || []) {
        if (!/^\d+$/.test(String(c.id))) continue;
        courses.push({id: prefix + 'course:' + c.id, userId, sourceOrigin: origin, name: String(c.fullname || c.shortname || 'Course ' + c.id), code: String(c.shortname || ''), url: origin + '/course/view.php?id=' + c.id, grade: null, enrollmentType: 'student', importedAt: Date.now(), source: 'moodle'});
      }
      const events = await call('core_calendar_get_action_events_by_timesort', {timesortfrom: Math.floor(Date.now() / 1000) - 14 * 86400, limitnum: 50});
      for (const e of events.events || []) {
        if (!/^\d+$/.test(String(e.id)) || !/^\d+$/.test(String(e.course?.id))) continue;
        let url = origin + '/course/view.php?id=' + e.course.id;
        try { const u = new URL(e.url || url, origin); if (u.origin === origin) url = u.href; } catch {}
        tasks.push({id: prefix + 'event:' + e.id, userId, sourceOrigin: origin, title: String(e.activityname || e.name || 'Activity'), courseId: prefix + 'course:' + e.course.id, due: e.timesort ? new Date(e.timesort * 1000).toISOString() : null, url, description: '', points: null, score: null, source: 'moodle'});
      }
      warnings.push('Moodle import includes in-progress courses and upcoming activities; grades are not imported.');
      return {origin, userId, courses, tasks, warnings};
    } catch (e) { return {error: 'Moodle import failed: ' + e.message}; }
  }
  if (!isCanvas && blackboard) {
    try {
      const me = await json('/learn/api/public/v1/users/me');
      if (!me?.id) throw Error('Blackboard did not return a signed-in user.');
      const userId = String(me.id), prefix = origin + '|user:' + userId + '|', base = '/learn/api/public/v1';
      const memberships = (await json(`${base}/users/${encodeURIComponent(userId)}/courses?expand=course&limit=100`)).results || [];
      for (const m of memberships) {
        const c = m.course || {};
        if (!c.id || m.availability?.available === 'No' || c.availability?.available === 'No') continue;
        const courseId = prefix + 'course:' + c.id;
        courses.push({id: courseId, userId, sourceOrigin: origin, name: String(c.name || c.courseId || 'Course'), code: String(c.courseId || ''), url: `${origin}/ultra/courses/${encodeURIComponent(c.id)}/outline`, grade: null, enrollmentType: m.courseRoleId === 'Student' ? 'student' : m.courseRoleId || 'student', importedAt: Date.now(), source: 'blackboard'});
        try {
          const columns = (await json(`${base}/courses/${encodeURIComponent(c.id)}/gradebook/columns?limit=100`)).results || [];
          const grades = new Map(((await json(`${base}/courses/${encodeURIComponent(c.id)}/gradebook/users/${encodeURIComponent(userId)}`).catch(() => ({}))).results || []).map(g => [g.columnId, g]));
          for (const col of columns) {
            if (!col.id || col.externalGrade) continue;
            const g = grades.get(col.id), points = num(col.score?.possible);
            tasks.push({id: prefix + 'column:' + col.id, userId, sourceOrigin: origin, title: String(col.name || 'Assignment'), courseId, due: iso(col.grading?.due), url: `${origin}/ultra/courses/${encodeURIComponent(c.id)}/grades`, description: '', points, score: num(g?.score), done: ['Graded', 'NeedsGrading'].includes(g?.status), submitted: ['Graded', 'NeedsGrading'].includes(g?.status), source: 'blackboard'});
          }
          const total = columns.find(col => col.externalGrade), g = total && grades.get(total.id);
          if (g) courses.at(-1).grade = courses.at(-1).currentGrade = pct(g.score, total.score?.possible);
        } catch (e) { warnings.push(`${c.name || c.id}: ${e.message}`); }
      }
      return {origin, userId, courses, tasks, warnings};
    } catch (e) { return {error: 'Blackboard import failed: ' + e.message}; }
  }
  if (!isCanvas) {
    const selector = 'a[href*="/courses/"],a[href*="/d2l/home/"],a[href*="/course/view.php"],a[href*="/ultra/courses/"],a[href*="classroom.google.com/c/"]';
    for (const link of document.querySelectorAll(selector)) {
      try {
        const url = new URL(link.href, origin), name = link.textContent.trim();
        if (url.origin === origin && name && !courses.some(c => c.url === url.href)) courses.push({id: origin + '|page:' + url.pathname, name, url: url.href, grade: null, sourceOrigin: origin, source: 'page'});
      } catch {}
    }
    warnings.push('Page-only import: visible courses. Automatic assignments and grades are implemented for Canvas, Brightspace, Moodle (assignments) and Blackboard Learn; use manual entry on other LMSs.');
    return {origin, courses, tasks, warnings};
  }
  async function get(path, array = true) {
    const first = new URL(path, origin), seen = new Set();
    let next = first, items = [];
    while (next) {
      if (next.origin !== origin || next.pathname !== first.pathname || !next.pathname.startsWith('/api/v1/')) throw Error('Refused pagination outside the selected Canvas API.');
      if (seen.has(next.href) || seen.size >= 100) throw Error('Repeated or excessive pagination.');
      seen.add(next.href);
      const response = await fetch(next.href, {credentials: 'same-origin', signal: AbortSignal.timeout(20000)});
      if (!response.ok) throw Error(`Canvas returned ${response.status}. Check login and course access.`);
      const data = await response.json();
      if (!array) { if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Canvas did not return a profile.'); return data; }
      if (!Array.isArray(data)) throw Error('Canvas did not return a list.');
      items.push(...data);
      const link = (response.headers.get('link') || '').match(/<([^>]+)>\s*;\s*rel="?next"?/);
      next = link ? new URL(link[1], origin) : null;
    }
    return items;
  }
  try {
    const profile = await get('/api/v1/users/self/profile', false);
    if (!/^\d+$/.test(String(profile.id))) throw Error('Canvas did not return a signed-in user.');
    const prefix = origin + '|user:' + profile.id + '|';
    const list = await get('/api/v1/courses?state[]=available&state[]=completed&include[]=total_scores&include[]=term&include[]=concluded&include[]=grading_periods&include[]=current_grading_period_scores&per_page=100');
    const score = value => (typeof value==='number'||typeof value==='string') && String(value).trim() && Number.isFinite(Number(value)) ? Number(value) : null;
    const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
    const letter = value => typeof value==='string' && value.trim() ? value.trim() : null;
    const active = [], announcements = [];
    for (const c of list) {
      if (!/^\d+$/.test(String(c.id))) continue;
      const courseId = prefix + 'course:' + c.id;
      const enrollments = (c.enrollments||[]).filter(e => ['student','StudentEnrollment'].includes(e.type) && (e.user_id==null || String(e.user_id)===String(profile.id)));
      const student = enrollments.find(e => e.enrollment_state==='active') || enrollments[0];
      const currentGrade = score(student?.computed_current_score ?? student?.grades?.current_score);
      const finalGrade = score(student?.override_score ?? student?.grades?.override_score ?? student?.computed_final_score ?? student?.grades?.final_score);
      const termId = c.term?.id ?? c.enrollment_term_id ?? null;
      const currentLetter = letter(student?.computed_current_grade ?? student?.grades?.current_grade);
      const finalLetter = letter(student?.override_grade ?? student?.grades?.override_grade ?? student?.computed_final_grade ?? student?.grades?.final_grade);
      const enrollmentState = student?.enrollment_state || null;
      const concluded = c.concluded===true || c.workflow_state==='completed' || enrollmentState==='completed';
      courses.push({id:courseId,canvasId:c.id,userId:String(profile.id),sourceOrigin:origin,
        name:c.name||c.course_code||`Course ${c.id}`,code:c.course_code||'',url:origin+'/courses/'+c.id,
        grade:currentGrade,currentGrade,finalGrade,currentLetter,finalLetter,
        termId,termKey:termId===null?null:origin+'|term:'+termId,termName:c.term?.name||'',termStart:date(c.term?.start_at),termEnd:date(c.term?.end_at),
        courseStart:date(c.start_at),courseEnd:date(c.end_at),restrictCourseDates:c.restrict_enrollments_to_course_dates===true,
        enrollmentState,enrollmentType:student?.type||(c.enrollments||[])[0]?.type||null,courseState:c.workflow_state||null,concluded,
        accessRestricted:c.access_restricted_by_date===true,hideFinalGrades:c.hide_final_grades===true,gradingStandardId:c.grading_standard_id??null,
        hasGradingPeriods:student?.has_grading_periods===true,gradingPeriodId:student?.current_grading_period_id??null,
        gradingPeriodTitle:student?.current_grading_period_title||'',gradingPeriods:Array.isArray(c.grading_periods)?c.grading_periods:[],
        currentPeriodGrade:score(student?.current_period_computed_current_score??student?.current_period_current_score),
        finalPeriodGrade:score(student?.current_period_override_score??student?.current_period_computed_final_score??student?.current_period_final_score),
        currentPeriodLetter:letter(student?.current_period_computed_current_grade??student?.current_period_current_grade),
        finalPeriodLetter:letter(student?.current_period_override_grade??student?.current_period_computed_final_grade??student?.current_period_final_grade),
        importedAt:Date.now(),source:'canvas'});
      // Historical grades remain available for GPA without flooding today's tasks with old assignments.
      const effectiveEnd = date(c.restrict_enrollments_to_course_dates?c.end_at||c.term?.end_at:c.term?.end_at||c.end_at);
      const effectiveStart = date(c.restrict_enrollments_to_course_dates?c.start_at||c.term?.start_at:c.term?.start_at||c.start_at);
      if (concluded || c.access_restricted_by_date || (effectiveEnd&&Date.parse(effectiveEnd)<=Date.now()) || (effectiveStart&&Date.parse(effectiveStart)>Date.now())) continue;
      active.push(c);
      try {
        courses.at(-1).weighted = c.apply_assignment_group_weights === true;
        courses.at(-1).groups = (await get(`/api/v1/courses/${c.id}/assignment_groups?per_page=100`)).filter(g => /^\d+$/.test(String(g.id))).map(g => ({id: g.id, name: String(g.name || 'Group'), weight: score(g.group_weight) ?? 0, dropLowest: Number(g.rules?.drop_lowest) || 0, dropHighest: Number(g.rules?.drop_highest) || 0, neverDrop: (g.rules?.never_drop || []).map(String)}));
      } catch (e) { warnings.push(`${c.name || c.id} grade groups: ${e.message}`); }
      try {
        const assignments = await get(`/api/v1/courses/${c.id}/assignments?include[]=submission&per_page=100`);
        for (const a of assignments) {
          if (!/^\d+$/.test(String(a.id))) continue;
          const submission = a.submission || {};
          let url = origin + '/courses/' + c.id + '/assignments/' + a.id;
          try { const u = new URL(a.html_url || url, origin); if (u.origin === origin) url = u.href; } catch {}
          const due = a.due_at && Number.isFinite(Date.parse(a.due_at)) ? new Date(a.due_at).toISOString() : null;
          const submitted = !!(submission.submitted_at || submission.excused || ['submitted', 'graded', 'pending_review'].includes(submission.workflow_state));
          tasks.push({id: prefix + 'assignment:' + a.id, canvasId: a.id, userId: String(profile.id), sourceOrigin: origin, title: String(a.name || 'Untitled assignment'), courseId, due, url, description: a.description || '', points: score(a.points_possible), score: score(submission.score), group: a.assignment_group_id, excused: !!submission.excused, submitted, done: submitted, source: 'canvas'});
        }
      } catch (e) { warnings.push(`${c.name || c.course_code || c.id}: ${e.message}`); }
    }
    // Recent announcements (last 21 days) as plain text for the dashboard preview.
    const text = html => String(html || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    const since = new Date(Date.now() - 21 * 86400000).toISOString();
    for (let i = 0; i < active.length; i += 10) {
      const chunk = active.slice(i, i + 10), query = new URLSearchParams({start_date: since, per_page: '50'});
      for (const c of chunk) query.append('context_codes[]', 'course_' + c.id);
      try {
        for (const a of await get('/api/v1/announcements?' + query)) {
          const course = chunk.find(c => 'course_' + c.id === a.context_code);
          if (!course || !/^\d+$/.test(String(a.id))) continue;
          let url = origin + '/courses/' + course.id + '/discussion_topics/' + a.id;
          try { const u = new URL(a.html_url || url, origin); if (u.origin === origin) url = u.href; } catch {}
          announcements.push({id: prefix + 'announcement:' + a.id, courseId: prefix + 'course:' + course.id, userId: String(profile.id), sourceOrigin: origin, title: String(a.title || 'Announcement').slice(0, 300), message: text(a.message).slice(0, 2000), posted: date(a.posted_at), url});
        }
      } catch (e) { warnings.push(`Announcements: ${e.message}`); }
    }
    return {origin, userId: String(profile.id), courses, tasks, announcements, warnings};
  } catch (e) { return {error: e.message}; }
}
export async function checkReminders(now = Date.now()) {
  if (alarmRunning) return;
  alarmRunning = true;
  try {
    const state = await read(); if (!state.settings.reminders) return;
    const lead = Math.min(10080, Math.max(1, Number(state.settings.reminderMinutes) || 60)) * 60000;
    const ledger = (await chrome.storage.local.get('reminderLedger')).reminderLedger || {};
    for (const task of state.tasks) {
      const due = Date.parse(task.due), key = task.id + '|' + task.due;
      const active = !task.sourceOrigin || !task.userId || state.settings.activeAccounts?.[task.sourceOrigin] === task.userId;
      if (active && !task.done && Number.isFinite(due) && due > now && due - now <= lead && !ledger[key]) {
        await chrome.notifications.create({type: 'basic', iconUrl: 'icons/icon.png', title: 'Assignment coming up', message: String(task.title || 'Assignment'), priority: 1});
        ledger[key] = now;
      }
    }
    for (const key of Object.keys(ledger)) if (now - ledger[key] > 7 * 86400000) delete ledger[key];
    await chrome.storage.local.set({reminderLedger: ledger});
  } finally { alarmRunning = false; }
}
let calendarRun = null;
// One sync at a time; overlapping alarms and Sync now share the running pass.
function calendarSync() { return calendarRun ||= read().then(state => syncCalendars(state.tasks)).finally(() => { calendarRun = null; }); }
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === 'reminders') checkReminders().catch(console.error); if (alarm.name === 'calendar-sync') calendarSync().catch(console.error); });
