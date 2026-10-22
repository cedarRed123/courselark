/* Optional cross-device sync of settings and themes through the browser's own account sync (chrome.storage.sync). */
const prefix = 'cl-sync-', chunk = 7000, maxChunks = 12;
// Per-device values: site access and signed-in accounts differ between browsers.
const localOnly = ['lmsOrigins', 'activeAccounts', 'lastImport'];

export function syncPayload(state) {
  const settings = {...state.settings};
  for (const key of localOnly) delete settings[key];
  return {settings, themes: state.themes || [], themeHistory: (state.themeHistory || []).slice(-20)};
}
export function applyPayload(state, payload) {
  const keep = Object.fromEntries(localOnly.filter(k => k in state.settings).map(k => [k, state.settings[k]]));
  return {...state, settings: {...state.settings, ...payload.settings, ...keep, syncAcrossDevices: true}, themes: payload.themes, themeHistory: payload.themeHistory};
}
async function deviceId() {
  let {clDevice} = await chrome.storage.local.get('clDevice');
  if (!clDevice) { clDevice = crypto.randomUUID(); await chrome.storage.local.set({clDevice}); }
  return clDevice;
}
export async function pushSync(state) {
  const json = JSON.stringify(syncPayload(state)), parts = [];
  for (let i = 0; i < json.length; i += chunk) parts.push(json.slice(i, i + chunk));
  if (parts.length > maxChunks) throw Error('Settings and themes are too large for browser sync. Remove some saved themes.');
  const old = (await chrome.storage.sync.get(prefix + 'meta'))[prefix + 'meta'];
  await chrome.storage.sync.set(Object.fromEntries(parts.map((p, i) => [prefix + i, p])));
  await chrome.storage.sync.set({[prefix + 'meta']: {n: parts.length, device: await deviceId(), at: Date.now()}});
  if (old?.n > parts.length) await chrome.storage.sync.remove(Array.from({length: old.n - parts.length}, (_, i) => prefix + (parts.length + i)));
}
// Returns the synced payload when another device wrote it, else null.
export async function pullSync() {
  const meta = (await chrome.storage.sync.get(prefix + 'meta'))[prefix + 'meta'];
  if (!meta?.n || meta.n > maxChunks || meta.device === await deviceId()) return null;
  const keys = Array.from({length: meta.n}, (_, i) => prefix + i), data = await chrome.storage.sync.get(keys);
  try { const payload = JSON.parse(keys.map(k => data[k] ?? '').join('')); return payload && typeof payload.settings === 'object' && Array.isArray(payload.themes) ? payload : null; } catch { return null; }
}
export async function clearDeviceSync() {
  const all = await chrome.storage.sync.get(null);
  await chrome.storage.sync.remove(Object.keys(all).filter(k => k.startsWith(prefix)));
}
