import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,legalVersion} from '../src/core.js';

const origin = 'https://school.instructure.com';
let stored = {}, registrations = [], granted = new Set(), fetchCalls = [], notificationCalls = [], panelMessages = [];
const event = () => ({listeners: [], addListener(fn) {this.listeners.push(fn);}});
globalThis.chrome = {
  runtime: {id: 'test-extension', getURL: path => 'chrome-extension://test-extension/' + path, onInstalled: event(), onStartup: event(), onMessage: event()},
  storage: {onChanged: event(), local: {
    async get(key) { if (key == null) return structuredClone(stored); if (typeof key === 'string') return {[key]: structuredClone(stored[key])}; return {}; },
    async set(values) { for (const [key, value] of Object.entries(values)) stored[key] = structuredClone(value); }
  }},
  permissions: {onAdded: event(), onRemoved: event(), contains: async ({origins}) => origins.every(o => granted.has(o))},
  scripting: {
    async getRegisteredContentScripts() {return registrations.filter(r => r.id === 'campus-sites');},
    async unregisterContentScripts({ids}) {registrations = registrations.filter(r => !ids.includes(r.id));},
    async registerContentScripts(scripts) {registrations.push(...scripts);},
    async executeScript() {return [{result: await background.collectLMS()}];}
  },
  alarms: {onAlarm: event(), async get() {return null;}, async create() {}},
  tabs: {query: async () => [{id: 1, url: origin + '/'}], sendMessage: async (id,message) => {panelMessages.push({id,message});return {ok:true};}},
  notifications: {async create(opts) {notificationCalls.push(opts); return 'n1';}}
};
let background = await import('../src/background.js');
const own = {id: 'test-extension', url: 'chrome-extension://test-extension/index.html'};
function reset() {
  stored = {campus: initial()}; stored.campus.legalAcceptance={version:legalVersion,acceptedAt:'2026-10-18T00:00:00.000Z'}; stored.campus.settings.lmsOrigins = [origin];
  registrations = [{id: 'unrelated', matches: ['https://other.test/*']}];
  granted = new Set([origin + '/*']); fetchCalls = []; notificationCalls = []; panelMessages = [];
  globalThis.location = new URL(origin + '/');
  globalThis.document = {querySelector: () => ({}), querySelectorAll: () => []};
  chrome.tabs.query = async () => [{id: 1, url: origin + '/'}];
  chrome.scripting.executeScript = async () => [{result: await background.collectLMS()}];
}
function response(data, next = '', status = 200) {return {ok: status === 200, status, json: async () => data, headers: {get: () => next}};}
function canvasFixture() {
  globalThis.fetch = async (url, opts) => {
    const u = new URL(url); fetchCalls.push({url, opts});
    if (u.pathname === '/api/v1/users/self/profile') return response({id: 7});
    if (u.pathname === '/api/v1/courses') {
      if (u.searchParams.get('page') === '2') return response([{id: 84, name: 'History', enrollments: [{type: 'student', computed_current_score: 0}]}]);
      return response([{id: 42, name: 'Biology', course_code: 'BIO', enrollments: [{type: 'student', computed_current_score: 93}]}], `<${origin}/api/v1/courses?page=2> ; rel="next"`);
    }
    if (u.pathname === '/api/v1/courses/42/assignments') {
      if (u.searchParams.get('page') === '2') return response([{id: 2, name: 'Reading', due_at: 'invalid', html_url: 'javascript:alert(1)'}]);
      return response([{id: 1, name: 'Lab', due_at: '2026-10-20T12:00:00Z', description: '<p>Observe</p>', points_possible: 100, assignment_group_id: 9, submission: {score: 93, workflow_state: 'graded'}}], '</api/v1/courses/42/assignments?page=2>; rel="next"');
    }
    if (u.pathname === '/api/v1/courses/84/assignments') return response({}, '', 403);
    if (u.pathname === '/api/v1/courses/42/assignment_groups') return response([{id: 9, name: 'Labs', group_weight: 40, rules: {drop_lowest: 1, never_drop: [1]}}]);
    if (u.pathname === '/api/v1/courses/84/assignment_groups') return response([]);
    if (u.pathname === '/api/v1/announcements') return response([{id: 5, context_code: 'course_42', title: 'Exam moved', message: '<p>Room <b>210</b> &amp; bring ID<script>steal()</script></p>', posted_at: '2026-10-20T12:00:00Z', html_url: 'javascript:alert(1)'}, {id: 6, context_code: 'course_999', title: 'Other'}]);
    throw Error('Unexpected URL ' + url);
  };
}

test('register only permitted origins, preserve unrelated registrations, remove revoked registrations', async () => {
  reset(); stored.campus.settings.lmsOrigins.push('https://other.school.test');
  assert.equal(await background.registerSites(), 1);
  assert.deepEqual(registrations.find(r => r.id === 'campus-sites').matches, [origin + '/*']);
  assert.ok(registrations.some(r => r.id === 'unrelated'));
  granted.clear(); assert.equal(await background.registerSites(), 0);
  assert.equal(registrations.length, 1);
});

test('unaccepted terms prevent LMS registration and import', async () => {
  reset(); stored.campus.legalAcceptance=null;
  assert.equal(await background.registerSites(),0);
  await assert.rejects(background.handleMessage({type:'IMPORT_LMS'},own),/accept the Terms/);
  assert.equal(registrations.length,1);
});

test('reject unsafe or overly broad site origins', () => {
  for (const value of ['https://*.example.com', 'javascript:alert(1)', 'https://user:secret@example.com', 'https://example.com/courses/1', 'http://example.com']) assert.throws(() => background.normalizeSite(value));
  assert.equal(background.normalizeSite('https://school.example.edu'), 'https://school.example.edu');
  assert.equal(background.normalizeSite('http://127.0.0.1:8080'), 'http://127.0.0.1:8080');
});

test('Canvas imports both course and assignment pages, reports access errors, keeps zero grades and safe links', async () => {
  reset(); canvasFixture(); const result = await background.collectLMS();
  assert.equal(result.courses.length, 2); assert.equal(result.tasks.length, 2);
  assert.equal(result.userId, '7'); assert.equal(result.courses[1].grade, 0);
  assert.match(result.warnings[0], /History.*403/);
  assert.equal(result.tasks[0].done, true); assert.equal(result.tasks[0].score, 93);
  assert.equal(result.tasks[1].due, null);
  assert.equal(result.tasks[1].url, origin + '/courses/42/assignments/2');
  assert.match(result.tasks[0].id, /user:7\|assignment:1$/);
  assert.ok(fetchCalls.every(c => c.opts.credentials === 'same-origin' && (!c.opts.method || c.opts.method === 'GET')));
  assert.ok(fetchCalls.every(c => new URL(c.url).origin === origin));
  assert.deepEqual(result.courses[0].groups, [{id: 9, name: 'Labs', weight: 40, dropLowest: 1, dropHighest: 0, neverDrop: ['1']}]);
  assert.equal(result.announcements.length, 1);
  assert.equal(result.announcements[0].message, 'Room 210 & bring ID');
  assert.equal(result.announcements[0].url, origin + '/courses/42/discussion_topics/5');
  const announcementCall = new URL(fetchCalls.find(c => c.url.includes('/announcements')).url);
  assert.deepEqual(announcementCall.searchParams.getAll('context_codes[]'), ['course_42', 'course_84']);
});

test('refuse cross-origin, changed-endpoint and repeated pagination before fetching the link', async () => {
  for (const next of ['https://attacker.example/steal', origin + '/api/v1/users/self/profile', 'repeat-current-request']) {
    reset(); const calls = [];
    globalThis.fetch = async url => {calls.push(url); return new URL(url).pathname.endsWith('/profile') ? response({id: 7}) : response([], `<${next==='repeat-current-request'?url:next}>; rel="next"`);};
    const result = await background.collectLMS(); assert.match(result.error, /pagination/i); assert.equal(calls.length, 2);
  }
});

test('imports reread state after collection, preserve local notes/subtasks/goals, and honor new submission completion', async () => {
  reset(); canvasFixture();
  const payload = await background.collectLMS(), course = payload.courses[0], task = payload.tasks[0];
  stored.campus.courses = [{...course, credits: 5, goal: 85}];
  stored.campus.tasks = [{...task, done: false, notes: 'personal notes', subtasks: [{id: 'a', title: 'Check rubric', done: true}], workStart: '2026-10-19T12:00:00Z'}];
  chrome.scripting.executeScript = async () => {
    stored.campus.notes.push({id: 'new-note', body: 'Written while import was running'});
    stored.campus.courses[0].credits = 6;
    return [{result: payload}];
  };
  const result = await background.handleMessage({type: 'IMPORT_LMS'}, own);
  assert.equal(result.ok, true);
  assert.equal(stored.campus.notes.length, 1); assert.equal(stored.campus.courses[0].credits, 6); assert.equal(stored.campus.courses[0].goal, 85);
  assert.equal(stored.campus.tasks[0].notes, 'personal notes'); assert.equal(stored.campus.tasks[0].subtasks.length, 1); assert.equal(stored.campus.tasks[0].done, true);
  assert.equal(stored.campus.settings.activeAccounts[origin], '7');
});

test('permission revocation or navigation during import prevents persistence', async () => {
  reset(); granted.clear(); await assert.rejects(background.handleMessage({type: 'IMPORT_LMS'}, own), /permission/);
  reset(); chrome.scripting.executeScript = async () => [{result: {origin: 'https://different.example', courses: [], tasks: []}}];
  await assert.rejects(background.handleMessage({type: 'IMPORT_LMS'}, own), /tab changed/);
  assert.equal(stored.campus.tasks.length, 0);
});

test('content pages open the workspace inside Canvas but cannot invoke privileged imports', async () => {
  reset(); const content = {id: 'test-extension', url: origin + '/', tab: {id: 1,url:origin+'/'}};
  assert.equal((await background.handleMessage({type: 'OPEN'}, content)).ok, true);
  assert.deepEqual(panelMessages[0],{id:1,message:{type:'OPEN_PANEL',page:'dashboard'}});
  await assert.rejects(background.handleMessage({type: 'IMPORT_LMS'}, content), /extension/);
  await assert.rejects(background.handleMessage({type: 'OPEN'}, {id: 'foreign', url: origin, tab: {id: 1}}), /extension/);
});

test('connected tabs auto-import their own origin, throttle repeat visits, and reject frames or unconnected sites', async () => {
  reset(); canvasFixture(); const content = {id: 'test-extension', url: origin + '/courses', tab: {id: 9, url: origin + '/courses'}, frameId: 0};
  let target; chrome.scripting.executeScript = async options => {target = options.target.tabId; return [{result: await background.collectLMS()}];};
  const first = await background.handleMessage({type: 'AUTO_SYNC'}, content);
  assert.equal(first.ok, true); assert.equal(target, 9); assert.equal(stored.campus.tasks.length, 2);
  target = null; assert.equal((await background.handleMessage({type: 'AUTO_SYNC'}, content)).skipped, true); assert.equal(target, null);
  stored.campus.settings.lastImport.at -= 31 * 60000; assert.equal((await background.handleMessage({type: 'AUTO_SYNC'}, content)).skipped, undefined); assert.equal(target, 9);
  await assert.rejects(background.handleMessage({type: 'AUTO_SYNC'}, {...content, frameId: 3}), /connected LMS tab/);
  stored.campus.settings.lmsOrigins = []; await assert.rejects(background.handleMessage({type: 'AUTO_SYNC'}, content), /connected LMS tab/);
  reset(); stored.campus.legalAcceptance = null; await assert.rejects(background.handleMessage({type: 'AUTO_SYNC'}, content), /connected LMS tab/);
});

test('workspace import selects most recent connected school tab', async () => {
  reset(); chrome.tabs.query = async query => query.url ? [{id: 2, url: origin, lastAccessed: 2}, {id: 3, url: origin + '/courses/42', lastAccessed: 3}] : [{id: 4, url: chrome.runtime.getURL('index.html')}];
  chrome.scripting.executeScript = async options => {assert.equal(options.target.tabId, 3); return [{result: {origin, courses: [], tasks: [], warnings: []}}];};
  assert.equal((await background.handleMessage({type: 'IMPORT_LMS'}, own)).ok, true);
});

test('reminders notify once, skip completed/stale accounts, and expire old ledger entries', async () => {
  reset(); const now = Date.now(); stored.campus.settings.reminders = true; stored.campus.settings.activeAccounts = {[origin]: '7'};
  const due = new Date(now + 20 * 60000).toISOString();
  stored.campus.tasks = [{id: 'a', title: 'Lab', due, done: false, sourceOrigin: origin, userId: '7'}, {id: 'b', title: 'Done', due, done: true}, {id: 'c', title: 'Another account', due, done: false, sourceOrigin: origin, userId: '8'}];
  stored.reminderLedger = {expired: now - 8 * 86400000};
  await Promise.all([background.checkReminders(now), background.checkReminders(now)]);
  await background.checkReminders(now);
  assert.equal(notificationCalls.length, 1); assert.equal(notificationCalls[0].message, 'Lab');
  assert.equal(stored.reminderLedger.expired, undefined);
});

test('Canvas term/posted-grade metadata includes historical courses without collecting their old assignments', async () => {
  reset(); const calls=[];
  globalThis.fetch=async url=>{
    const u=new URL(url);calls.push(u);
    if(u.pathname==='/api/v1/users/self/profile')return response({id:7});
    if(u.pathname==='/api/v1/courses'){
      assert.ok(u.searchParams.getAll('state[]').includes('completed'));
      assert.ok(u.searchParams.getAll('include[]').includes('term'));
      return response([
        {id:42,name:'Biology',workflow_state:'available',term:{id:20,name:'Fall 2026',start_at:'2026-08-01',end_at:'2026-12-31'},enrollments:[{type:'student',user_id:999,computed_current_score:20},{type:'student',user_id:7,enrollment_state:'active',computed_current_score:91,computed_current_grade:'A-',computed_final_score:70,has_grading_periods:true,current_grading_period_id:3,current_grading_period_title:'Quarter 1',current_period_computed_current_score:94}]},
        {id:84,name:'History',workflow_state:'completed',concluded:true,access_restricted_by_date:true,term:{id:10,name:'Spring 2026',start_at:'2026-01-01',end_at:'2026-05-31'},enrollments:[{type:'student',user_id:7,enrollment_state:'completed',computed_current_score:82,computed_final_score:88,computed_final_grade:'B+',override_score:90,override_grade:'A'}]},
        {id:90,name:'Student organization',term:{id:20,name:'Fall 2026'},enrollments:[{type:'student',enrollment_state:'active',computed_current_score:'',computed_final_score:0}]}
      ]);
    }
    if(u.pathname==='/api/v1/courses/42/assignments'||u.pathname==='/api/v1/courses/90/assignments')return response([]);
    if(/^\/api\/v1\/courses\/(42|90)\/assignment_groups$/.test(u.pathname))return response([]);
    if(u.pathname==='/api/v1/announcements'){assert.deepEqual(u.searchParams.getAll('context_codes[]'),['course_42','course_90']);return response([]);}
    throw Error('Historical assignments must not be fetched: '+url);
  };
  const result=await background.collectLMS();assert.equal(result.courses.length,3);
  const current=result.courses[0],history=result.courses[1],organization=result.courses[2];
  assert.equal(current.grade,91);assert.equal(current.currentGrade,91);assert.equal(current.finalGrade,70);assert.equal(current.currentLetter,'A-');
  assert.equal(current.termName,'Fall 2026');assert.equal(current.termKey,origin+'|term:20');assert.equal(current.gradingPeriodId,3);assert.equal(current.currentPeriodGrade,94);
  assert.equal(history.finalGrade,90);assert.equal(history.finalLetter,'A');assert.equal(history.concluded,true);assert.equal(history.accessRestricted,true);
  assert.equal(organization.grade,null);assert.equal(organization.finalGrade,0);
  assert.ok(!calls.some(u=>u.pathname==='/api/v1/courses/84/assignments'));assert.deepEqual(result.warnings,[]);
});

test('workspace OPEN accepts whitelisted grade page and rejects arbitrary fragments', async () => {
  reset();const sender={id:'test-extension',url:origin+'/',tab:{id:1,url:origin+'/'}};
  assert.equal((await background.handleMessage({type:'OPEN',page:'grades'},sender)).ok,true);
  assert.deepEqual(panelMessages[0],{id:1,message:{type:'OPEN_PANEL',page:'grades'}});
  await assert.rejects(background.handleMessage({type:'OPEN',page:'javascript:alert(1)'},sender),/Unknown workspace page/);
});

test('read-only GPA message scopes grades to connected top-level tab and active account', async () => {
  reset();stored.campus.settings.activeAccounts={[origin]:'7'};
  stored.campus.courses=[{id:'mine',name:'My course',source:'canvas',sourceOrigin:origin,userId:'7',grade:92,credits:3},{id:'other',name:'Other account',sourceOrigin:origin,userId:'8',grade:60,credits:3},{id:'other-school',name:'Other school',sourceOrigin:'https://elsewhere.example',userId:'7',grade:60,credits:3}];
  const before=structuredClone(stored);
  const sender={id:'test-extension',url:origin+'/',frameId:0,tab:{id:1,url:origin+'/'}};
  const result=await background.handleMessage({type:'GPA_SUMMARY',origin:'https://elsewhere.example'},sender);
  assert.equal(result.ok,true);assert.equal(result.origin,origin);assert.equal(result.userId,'7');assert.equal(result.summary.current.gpa,4);assert.equal(result.summary.current.count,1);
  assert.deepEqual(stored,before);
  await assert.rejects(background.handleMessage({type:'GPA_SUMMARY',userId:'8'},sender),/different imported/);
  await assert.rejects(background.handleMessage({type:'GPA_SUMMARY'},{...sender,tab:{id:1,url:'https://other.example'}}),/tab changed/);
  await assert.rejects(background.handleMessage({type:'GPA_SUMMARY'},{...sender,frameId:1}),/connected LMS/);
  granted.clear();await assert.rejects(background.handleMessage({type:'GPA_SUMMARY'},sender),/connected LMS/);
  reset();await assert.rejects(background.handleMessage({type:'GPA_SUMMARY'},sender),/Import this Canvas account/);
});

const lmsOrigin = 'https://lms.school.edu';
const lmsPage = (path, selectors = {}) => { globalThis.location = new URL(lmsOrigin + path); globalThis.document = {querySelector: s => Object.entries(selectors).find(([k]) => s.includes(k))?.[1] ?? null, querySelectorAll: () => []}; };

test('Brightspace import pages enrollments, reads dropbox due dates and released final grades, stays same-origin', async () => {
  reset(); lmsPage('/d2l/home'); const calls = [];
  globalThis.fetch = async (url, opts) => {
    const u = new URL(url); calls.push({u, opts});
    if (u.pathname === '/d2l/api/versions/') return response([{ProductCode: 'lp', LatestVersion: '1.47'}, {ProductCode: 'le', LatestVersion: '1.75'}]);
    if (u.pathname === '/d2l/api/lp/1.47/users/whoami') return response({Identifier: '55'});
    if (u.pathname === '/d2l/api/lp/1.47/enrollments/myenrollments/') return u.searchParams.get('bookmark') ? response({Items: [{OrgUnit: {Id: 8, Name: 'Old'}, Access: {IsActive: false}}], PagingInfo: {HasMoreItems: false}}) : response({Items: [{OrgUnit: {Id: 7, Name: 'Chemistry', Code: 'CHEM'}, Access: {IsActive: true, CanAccess: true}}], PagingInfo: {HasMoreItems: true, Bookmark: 'b1'}});
    if (u.pathname === '/d2l/api/le/1.75/7/grades/final/values/myGradeValue') return response({PointsNumerator: 87, PointsDenominator: 100});
    if (u.pathname === '/d2l/api/le/1.75/8/grades/final/values/myGradeValue') return response({}, '', 403);
    if (u.pathname === '/d2l/api/le/1.75/7/dropbox/folders/') return response([{Id: 3, Name: 'Lab 1', DueDate: '2026-11-01T05:00:00Z', Assessment: {ScoreDenominator: 20}}]);
    throw Error('Unexpected ' + url);
  };
  const result = await background.collectLMS();
  assert.equal(result.error, undefined);
  assert.deepEqual(result.courses.map(c => [c.name, c.grade]), [['Chemistry', 87], ['Old', null]]);
  assert.equal(result.tasks.length, 1); assert.equal(result.tasks[0].points, 20); assert.equal(result.tasks[0].due, '2026-11-01T05:00:00.000Z');
  assert.ok(calls.every(c => c.u.origin === lmsOrigin && !c.opts.method));
});

test('Moodle import uses the page sesskey for read-only AJAX lookups', async () => {
  reset(); lmsPage('/my/', {'logout.php': {href: lmsOrigin + '/login/logout.php?sesskey=abc123'}, 'data-userid': {dataset: {userid: '9'}}}); const bodies = [];
  globalThis.fetch = async (url, opts) => {
    const u = new URL(url); assert.equal(u.searchParams.get('sesskey'), 'abc123'); const [req] = JSON.parse(opts.body); bodies.push(req.methodname);
    if (req.methodname === 'core_course_get_enrolled_courses_by_timeline_classification') return response([{error: false, data: {courses: [{id: 4, fullname: 'Physics', shortname: 'PHY'}]}}]);
    return response([{error: false, data: {events: [{id: 11, name: 'Essay is due', activityname: 'Essay', timesort: 1793000000, url: 'https://evil.example/x', course: {id: 4}}]}}]);
  };
  const result = await background.collectLMS();
  assert.deepEqual(bodies, ['core_course_get_enrolled_courses_by_timeline_classification', 'core_calendar_get_action_events_by_timesort']);
  assert.equal(result.courses[0].name, 'Physics'); assert.equal(result.tasks[0].title, 'Essay');
  assert.equal(result.tasks[0].url, lmsOrigin + '/course/view.php?id=4'); assert.equal(result.tasks[0].courseId, result.courses[0].id);
});

test('Blackboard import reads memberships, gradebook columns, user grades and the external total', async () => {
  reset(); lmsPage('/ultra/course');
  globalThis.fetch = async url => {
    const u = new URL(url);
    if (u.pathname === '/learn/api/public/v1/users/me') return response({id: '_5_1'});
    if (u.pathname === '/learn/api/public/v1/users/_5_1/courses') return response({results: [{courseRoleId: 'Student', course: {id: '_9_1', name: 'History', courseId: 'HIST'}}, {course: {id: '_10_1'}, availability: {available: 'No'}}]});
    if (u.pathname === '/learn/api/public/v1/courses/_9_1/gradebook/columns') return response({results: [{id: 'c1', name: 'Quiz', score: {possible: 10}, grading: {due: '2026-11-02T00:00:00Z'}}, {id: 'tot', name: 'Total', externalGrade: true, score: {possible: 200}}]});
    if (u.pathname === '/learn/api/public/v1/courses/_9_1/gradebook/users/_5_1') return response({results: [{columnId: 'c1', score: 8, status: 'Graded'}, {columnId: 'tot', score: 180}]});
    throw Error('Unexpected ' + url);
  };
  const result = await background.collectLMS();
  assert.equal(result.courses.length, 1); assert.equal(result.courses[0].grade, 90);
  assert.equal(result.tasks.length, 1); assert.equal(result.tasks[0].score, 8); assert.equal(result.tasks[0].done, true);
});
