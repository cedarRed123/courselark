import test from 'node:test';
import assert from 'node:assert/strict';

let stored = {};
globalThis.chrome = {storage: {local: {
  async get(key) { return {[key]: structuredClone(stored[key])}; },
  async set(values) { Object.assign(stored, structuredClone(values)); },
  async remove(key) { delete stored[key]; }
}}};
const {syncCalendars, syncEvents, readSync} = await import('../src/calendar-sync.js');
const later = Date.now() + 3600000;
const task = {id: 'https://school.instructure.com|user:7|assignment:1', title: 'Lab report', due: '2026-10-30T17:00:00Z', notes: 'private thoughts', url: 'https://school.instructure.com/courses/1/assignments/1'};

function server(handler) {
  const calls = [];
  const request = async (url, options = {}) => {
    calls.push({url, method: options.method || 'GET', body: options.body, headers: options.headers});
    const [status, data, extra] = handler(url, options, calls) || [200, {}];
    return {status, ok: status >= 200 && status < 300, url, headers: {get: () => typeof data === 'string' ? 'application/xml' : 'application/json'}, json: async () => data, text: async () => typeof data === 'string' ? data : JSON.stringify(data), ...extra};
  };
  return {calls, request};
}

test('events exclude private notes, completed work and unscheduled tasks', () => {
  const events = syncEvents([task, {...task, id: 'b', done: true}, {id: 'c', title: 'No date'}, {...task, id: 'd', url: 'javascript:alert(1)'}]);
  assert.equal(events.length, 2);
  assert.ok(!JSON.stringify(events).includes('private thoughts'));
  assert.equal(events[1].url, '');
  assert.equal(events[0].end, '2026-10-30T17:30:00.000Z');
});

test('iCloud updates changed events in place, deletes finished ones, and ignores old OAuth provider entries', async () => {
  stored = {calendarSync: {google: {connected: true, token: 'old'}, apple: {connected: true, user: 'a', password: 'b', calendarUrl: 'https://p1-caldav.icloud.com/1/calendars/courselark/'}}};
  const {calls, request} = server(() => [201, '']);
  const result = await syncCalendars([task], {request});
  assert.deepEqual(Object.keys(result), ['apple']);
  assert.deepEqual(calls.map(c => c.method), ['PUT']); assert.ok(calls.every(c => new URL(c.url).hostname.endsWith('.icloud.com')));
  calls.length = 0; await syncCalendars([task], {request}); assert.equal(calls.length, 0);
  await syncCalendars([{...task, title: 'Lab report v2'}], {request}); assert.equal(calls[0].method, 'PUT');
  calls.length = 0; await syncCalendars([{...task, done: true}], {request}); assert.equal(calls[0].method, 'DELETE');
  assert.deepEqual((await readSync()).apple.events, {});
});

test('iCloud discovery stays on iCloud, creates the CourseLark calendar and PUTs iCalendar data', async () => {
  stored = {calendarSync: {apple: {connected: true, user: 'a@icloud.com', password: 'abcd-efgh-ijkl-mnop'}}};
  const {calls, request} = server((url, o) => {
    if (o.method === 'PROPFIND' && url === 'https://caldav.icloud.com/') return [207, '<multistatus xmlns="DAV:"><response><propstat><prop><current-user-principal><href>/123/principal/</href></current-user-principal></prop></propstat></response></multistatus>'];
    if (o.method === 'PROPFIND') return [207, '<d:multistatus xmlns:d="DAV:"><d:response><d:propstat><d:prop><cal:calendar-home-set xmlns:cal="urn:ietf:params:xml:ns:caldav"><d:href>https://p42-caldav.icloud.com:443/123/calendars/</d:href></cal:calendar-home-set></d:prop></d:propstat></d:response></d:multistatus>'];
    if (o.method === 'MKCALENDAR') return [201, ''];
    return [201, ''];
  });
  assert.equal((await syncCalendars([task], {request})).apple.ok, true);
  assert.deepEqual(calls.map(c => c.method), ['PROPFIND', 'PROPFIND', 'MKCALENDAR', 'PUT']);
  assert.equal(calls[1].url, 'https://caldav.icloud.com/123/principal/');
  assert.match(calls[3].url, /^https:\/\/p42-caldav\.icloud\.com\/123\/calendars\/courselark\/.+\.ics$/);
  assert.match(calls[3].body, /SUMMARY:Lab report/); assert.ok(!calls[3].body.includes('private'));
  assert.equal(calls[0].headers.Authorization, 'Basic ' + btoa('a@icloud.com:abcd-efgh-ijkl-mnop'));
});

test('iCloud refuses a calendar home outside iCloud and reports bad passwords', async () => {
  stored = {calendarSync: {apple: {connected: true, user: 'a', password: 'b'}}};
  let {request} = server((url, o) => o.method === 'PROPFIND' && url === 'https://caldav.icloud.com/' ? [207, '<current-user-principal><href>/1/</href></current-user-principal>'] : [207, '<calendar-home-set><href>https://evil.example/cal/</href></calendar-home-set>']);
  assert.match((await syncCalendars([task], {request})).apple.error, /unexpected calendar server/);
  ({request} = server(() => [401, '']));
  assert.match((await syncCalendars([task], {request})).apple.error, /app-specific password/);
});

test('disconnecting during a sync is not undone by the finishing pass', async () => {
  stored = {calendarSync: {apple: {connected: true, user: 'a', password: 'b', calendarUrl: 'https://p1-caldav.icloud.com/1/calendars/courselark/'}}};
  const {request} = server(() => { delete stored.calendarSync.apple; return [201, '']; });
  await syncCalendars([task], {request});
  assert.equal((await readSync()).apple, undefined);
});
