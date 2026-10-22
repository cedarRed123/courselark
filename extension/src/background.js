import {read, write} from './store.js';
import {mergeLMS, gpaSummary, legalVersion} from './core.js';
import {syncCalendars} from './calendar-sync.js';

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
  if (!isCanvas) {
    const selector = 'a[href*="/courses/"],a[href*="/d2l/home/"],a[href*="/course/view.php"],a[href*="/ultra/courses/"],a[href*="classroom.google.com/c/"]';
    for (const link of document.querySelectorAll(selector)) {
      try {
        const url = new URL(link.href, origin), name = link.textContent.trim();
        if (url.origin === origin && name && !courses.some(c => c.url === url.href)) courses.push({id: origin + '|page:' + url.pathname, name, url: url.href, grade: null, sourceOrigin: origin, source: 'page'});
      } catch {}
    }
    warnings.push('Page-only import: visible courses. Automatic assignments and grades are implemented for Canvas; use manual entry or backups on other LMSs.');
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
    return {origin, userId: String(profile.id), courses, tasks, warnings};
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
