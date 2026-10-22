/* One-way calendar sync. Requests go straight from this browser to the provider the user connected; no CourseLark server. */
import {calendarICS} from './core.js';
import {googleClientId, microsoftClientId} from './calendar-config.js';

const key = 'calendarSync';
export const providerOrigins = {
  google: ['https://www.googleapis.com/*'],
  microsoft: ['https://graph.microsoft.com/*', 'https://login.microsoftonline.com/*'],
  apple: ['https://caldav.icloud.com/*', 'https://*.icloud.com/*']
};
export const configured = {google: !!googleClientId, microsoft: !!microsoftClientId, apple: true};
const googleScope = 'https://www.googleapis.com/auth/calendar.app.created';
const microsoftScope = 'offline_access Calendars.ReadWrite';
const msAuthority = 'https://login.microsoftonline.com/common/oauth2/v2.0';

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
  google: {
    label: 'Google Calendar',
    headers: a => ({Authorization: 'Bearer ' + a.token, 'Content-Type': 'application/json'}),
    async ensure(a, request) {
      if (a.calendarId) return;
      a.calendarId = (await call(request, 'https://www.googleapis.com/calendar/v3/calendars', {method: 'POST', headers: this.headers(a), body: JSON.stringify({summary: 'CourseLark'})}, this.label)).id;
    },
    async put(a, e, id, request) {
      const body = JSON.stringify({summary: e.title, description: e.url, start: {dateTime: e.start}, end: {dateTime: e.end}, extendedProperties: {private: {courselark: e.taskId}}});
      const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(a.calendarId)}/events`;
      if (id) { const r = await call(request, `${base}/${encodeURIComponent(id)}`, {method: 'PUT', headers: this.headers(a), body}, this.label); if (!r.missing) return id; }
      return (await call(request, base, {method: 'POST', headers: this.headers(a), body}, this.label)).id;
    },
    async remove(a, id, request) { await call(request, `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(a.calendarId)}/events/${encodeURIComponent(id)}`, {method: 'DELETE', headers: this.headers(a)}, this.label); }
  },
  microsoft: {
    label: 'Outlook Calendar',
    headers: a => ({Authorization: 'Bearer ' + a.token, 'Content-Type': 'application/json'}),
    async ensure(a, request) {
      if (a.calendarId) return;
      a.calendarId = (await call(request, 'https://graph.microsoft.com/v1.0/me/calendars', {method: 'POST', headers: this.headers(a), body: JSON.stringify({name: 'CourseLark'})}, this.label)).id;
    },
    async put(a, e, id, request) {
      const time = value => ({dateTime: value.replace('Z', ''), timeZone: 'UTC'});
      const body = JSON.stringify({subject: e.title, body: {contentType: 'text', content: e.url}, start: time(e.start), end: time(e.end)});
      if (id) { const r = await call(request, `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(id)}`, {method: 'PATCH', headers: this.headers(a), body}, this.label); if (!r.missing) return id; }
      return (await call(request, `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(a.calendarId)}/events`, {method: 'POST', headers: this.headers(a), body}, this.label)).id;
    },
    async remove(a, id, request) { await call(request, `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(id)}`, {method: 'DELETE', headers: this.headers(a)}, this.label); }
  },
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

async function refresh(name, a, {request, identity}) {
  if (name === 'apple' || a.expires > Date.now() + 60000) return;
  if (name === 'microsoft' && a.refresh) {
    const r = await request(msAuthority + '/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({client_id: microsoftClientId, grant_type: 'refresh_token', refresh_token: a.refresh, scope: microsoftScope})});
    if (r.ok) { const t = await r.json(); Object.assign(a, {token: t.access_token, refresh: t.refresh_token || a.refresh, expires: Date.now() + t.expires_in * 1000}); return; }
  }
  Object.assign(a, await authorize(name, {interactive: false, identity, request}));
}

// Pushes current tasks into each connected provider's CourseLark calendar and removes finished or deleted ones.
export async function syncCalendars(tasks, {request = fetch, identity = globalThis.chrome?.identity} = {}) {
  const store = await readSync(), events = syncEvents(tasks), results = {};
  for (const name of Object.keys(providers)) {
    const a = store[name];
    if (!a?.connected) continue;
    try {
      await refresh(name, a, {request, identity});
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

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function authorize(name, {interactive = true, identity = chrome.identity, request = fetch, scope = googleScope} = {}) {
  const redirect = identity.getRedirectURL(), state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  if (name === 'google') {
    if (!googleClientId) throw Error('Google Calendar is not configured in this build.');
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({client_id: googleClientId, response_type: 'token', redirect_uri: redirect, scope, state, ...(interactive ? {} : {prompt: 'none'})});
    const params = new URLSearchParams(new URL(await identity.launchWebAuthFlow({url, interactive})).hash.slice(1));
    if (params.get('state') !== state || !params.get('access_token')) throw Error('Google sign-in was not completed.');
    return {token: params.get('access_token'), expires: Date.now() + Number(params.get('expires_in') || 3600) * 1000};
  }
  if (name === 'microsoft') {
    if (!microsoftClientId) throw Error('Outlook Calendar is not configured in this build.');
    const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    const url = msAuthority + '/authorize?' + new URLSearchParams({client_id: microsoftClientId, response_type: 'code', redirect_uri: redirect, scope: microsoftScope, state, code_challenge: challenge, code_challenge_method: 'S256', ...(interactive ? {} : {prompt: 'none'})});
    const params = new URL(await identity.launchWebAuthFlow({url, interactive})).searchParams;
    if (params.get('state') !== state || !params.get('code')) throw Error('Microsoft sign-in was not completed.');
    const r = await request(msAuthority + '/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({client_id: microsoftClientId, grant_type: 'authorization_code', code: params.get('code'), redirect_uri: redirect, code_verifier: verifier, scope: microsoftScope})});
    if (!r.ok) throw Error('Microsoft did not issue a calendar token.');
    const t = await r.json();
    return {token: t.access_token, refresh: t.refresh_token, expires: Date.now() + t.expires_in * 1000};
  }
  throw Error('Unknown calendar provider.');
}
