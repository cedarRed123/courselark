import test from 'node:test';
import assert from 'node:assert/strict';
import {initial} from '../src/core.js';

const area = () => ({data: {}, async get(keys) { if (keys === null) return structuredClone(this.data); const list = Array.isArray(keys) ? keys : [keys]; return Object.fromEntries(list.filter(k => k in this.data).map(k => [k, structuredClone(this.data[k])])); }, async set(v) { Object.assign(this.data, structuredClone(v)); }, async remove(keys) { for (const k of [].concat(keys)) delete this.data[k]; }});
const sync = area();
const device = name => { const local = area(); local.data.clDevice = name; return local; };
globalThis.chrome = {storage: {sync, local: device('A')}};
const {pushSync, pullSync, applyPayload, clearDeviceSync} = await import('../src/device-sync.js');

test('settings and themes round trip between devices while per-device site access stays local', async () => {
  const a = initial(); Object.assign(a.settings, {font: 'Jost', customCSS: 'a{}', lmsOrigins: ['https://a.edu'], activeAccounts: {'https://a.edu': '1'}, syncAcrossDevices: true});
  a.themes = [{id: 't1', name: 'Mine'}];
  await pushSync(a);
  assert.equal(await pullSync(), null, 'a device ignores its own write');
  chrome.storage.local = device('B');
  const payload = await pullSync();
  assert.equal(payload.settings.font, 'Jost'); assert.equal(payload.settings.lmsOrigins, undefined);
  const b = initial(); b.settings.lmsOrigins = ['https://b.edu'];
  const merged = applyPayload(b, payload);
  assert.deepEqual(merged.settings.lmsOrigins, ['https://b.edu']); assert.equal(merged.settings.customCSS, 'a{}'); assert.equal(merged.themes[0].name, 'Mine');
});

test('large payloads are chunked under the per-item quota, shrink cleanly, and erase removes them', async () => {
  const s = initial(); s.themes = Array.from({length: 6}, (_, i) => ({id: 't' + i, css: 'x'.repeat(6000)}));
  chrome.storage.local = device('A'); await pushSync(s);
  const keys = Object.keys(sync.data).filter(k => /^cl-sync-\d+$/.test(k));
  assert.ok(keys.length > 4 && keys.every(k => new TextEncoder().encode(JSON.stringify(sync.data[k])).length < 8192));
  s.themes = []; await pushSync(s);
  assert.equal(Object.keys(sync.data).filter(k => /^cl-sync-\d+$/.test(k)).length, 1);
  s.themes = Array.from({length: 20}, (_, i) => ({id: 't' + i, css: 'x'.repeat(6000)}));
  await assert.rejects(pushSync(s), /too large/);
  sync.data.other = 1; await clearDeviceSync();
  assert.deepEqual(Object.keys(sync.data), ['other']);
});

test('corrupt synced data is ignored', async () => {
  sync.data = {'cl-sync-meta': {n: 1, device: 'Z'}, 'cl-sync-0': '{"settings":'};
  assert.equal(await pullSync(), null);
});
