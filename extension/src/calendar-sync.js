/* One-way iCloud calendar sync over CalDAV. Requests go straight from this browser to iCloud; no CourseLark server or registered app. */
import {calendarICS} from './core.js';

const key = 'calendarSync';
export const providerOrigins = {
  apple: ['https://caldav.icloud.com/*', 'https://*.icloud.com/*']
};
export const configured = {apple: true};

export async function readSync() { return (await chrome.storage.local.get(key))[key] || {}; }
export async function writeSync(value) { await chrome.storage.local.set({[key]: value}); }
export async function clearSync() { await chrome.storage.local.remove(key); }

// Private notes never leave the device; only title, time and the assignment link are sent.
export function syncEvents(tasks) {
  const events = [];
  for (const task of tasks) {
    const start = task.workStart || task.due;
    if (task.done || !start || !Number.isFinite(Date.parse(start))) continue;
    const end = task.workEnd || new Date(Date.parse(start) + Number(task.minutes || 30) * 60000).toISOString();
    events.push({taskId: task.id, title: String(task.title || 'Assignment').slice(0, 300), start: new Date(start).toISOString(), end: new Date(end).toISOString(), url: /^https:\/\//.test(task.url || '') ? task.url : ''});
  }
  return events;
}
const hash = event => JSON.stringify([event.title, event.start, event.end, event.url]);

async function call(request, url, options, label) {
  const response = await request(url, options);
  if (response.status === 404 || response.status === 410) return {missing: true};
  if (!response.ok) throw Error(`${label} returned ${response.status}.`);
  const type = response.headers?.get?.('content-type') || '';
  return type.includes('json') ? response.json() : {text: await response.text()};
}

const providers = {
  apple: {
    label: 'iCloud Calendar',
    headers: (a, extra = {}) => ({Authorization: 'Basic ' + btoa(unescape(encodeURIComponent(a.user + ':' + a.password))), ...extra}),
    async ensure(a, request) {
      if (a.calendarUrl) return;
      const find = async (url, prop) => {
        const body = `<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop>${prop}</d:prop></d:propfind>`;
        const r = await request(url, {method: 'PROPFIND', headers: this.headers(a, {Depth: '0', 'Content-Type': 'application/xml'}), body});
        if (r.status === 401) throw Error('iCloud rejected the Apple ID or app-specific password.');
        if (!r.ok && r.status !== 207) throw Error(`iCloud Calendar returned ${r.status}.`);
        const text = await r.text(), tag = prop.match(/<(\w+:[\w-]+)/)[1].split(':')[1];
        const href = text.match(new RegExp(`<[\\w]*:?${tag}[^>]*>\\s*<[\\w]*:?href[^>]*>([^<]+)<`, 'i'))?.[1];
        if (!href) throw Error('iCloud Calendar discovery failed.');
        return new URL(href.trim(), r.url || url).href;
      };
      const principal = await find('https://caldav.icloud.com/', '<d:current-user-principal/>');
      const home = await find(principal, '<c:calendar-home-set/>');
      const url = new URL('courselark/', home.endsWith('/') ? home : home + '/');
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.icloud.com') && url.hostname !== 'icloud.com') throw Error('iCloud returned an unexpected calendar server.');
      const made = await request(url.href, {method: 'MKCALENDAR', headers: this.headers(a, {'Content-Type': 'application/xml'}), body: '<?xml version="1.0"?><c:mkcalendar xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:set><d:prop><d:displayname>CourseLark</d:displayname></d:prop></d:set></c:mkcalendar>'});
      if (!made.ok && made.status !== 405) throw Error(`iCloud could not create the CourseLark calendar (${made.status}).`);
      a.calendarUrl = url.href;
    },
    async put(a, e, id, request) {
      const href = id || a.calendarUrl + encodeURIComponent(e.taskId.replace(/[^\w.-]/g, '_')) + '.ics';
      const body = calendarICS([{id: e.taskId, title: e.title, workStart: e.start, workEnd: e.end, notes: e.url}]);
      await call(request, href, {method: 'PUT', headers: this.headers(a, {'Content-Type': 'text/calendar; charset=utf-8'}), body}, this.label);
      return href;
    },
    async remove(a, id, request) { await call(request, id, {method: 'DELETE', headers: this.headers(a)}, this.label); }
  }
};

// Pushes current tasks into each connected provider's CourseLark calendar and removes finished or deleted ones.
export async function syncCalendars(tasks, {request = fetch} = {}) {
  const store = await readSync(), events = syncEvents(tasks), results = {};
  for (const name of Object.keys(providers)) {
    const a = store[name];
    if (!a?.connected) continue;
    try {
      const p = providers[name], mapped = a.events || {}, wanted = new Set(events.map(e => e.taskId));
      await p.ensure(a, request);
      for (const e of events) if (mapped[e.taskId]?.hash !== hash(e)) mapped[e.taskId] = {id: await p.put(a, e, mapped[e.taskId]?.id, request), hash: hash(e)};
      for (const [taskId, entry] of Object.entries(mapped)) if (!wanted.has(taskId)) { await p.remove(a, entry.id, request); delete mapped[taskId]; }
      a.events = mapped; a.lastSync = Date.now(); a.error = ''; results[name] = {ok: true, events: events.length};
    } catch (error) { a.error = error.message; results[name] = {ok: false, error: error.message}; }
    // Re-read so a disconnect made during the network calls wins.
    const latest = await readSync();
    if (latest[name]?.connected) { latest[name] = a; await writeSync(latest); }
  }
  return results;
}
