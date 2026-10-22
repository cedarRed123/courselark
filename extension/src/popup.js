import {read,write} from './store.js';
import {legalVersion} from './core.js';
import {language,translate} from './i18n.js';
const status=document.querySelector('#status');
const run=fn=>async()=>{try{status.textContent='Working…';await fn();}catch(e){status.textContent=e.message;}};
async function updateLegal(){const accepted=(await read()).legalAcceptance?.version===legalVersion;document.querySelector('#legal').hidden=accepted;document.querySelector('#controls').hidden=!accepted;}
document.querySelector('#agree').onclick=run(async()=>{const access=chrome.permissions.request({origins:['https://*/*']});const state=await read();state.legalAcceptance={version:legalVersion,acceptedAt:new Date().toISOString()};await write(state);status.textContent='Terms accepted on this device.';await updateLegal();access.then(ok=>{status.textContent=ok?'Terms accepted. Open your school site and CourseLark sets itself up.':'Terms accepted. Without school-site access, CourseLark cannot read your LMS automatically.';return updateAccess();}).catch(()=>{});});
await updateLegal();
const lang=language((await read()).settings.language);document.documentElement.lang=lang;translate(document.body,lang);
document.querySelector('#open').onclick=run(async()=>{await chrome.runtime.sendMessage({type:'OPEN'});window.close();});
async function updateAccess(){const granted=await chrome.permissions.contains({origins:['https://*/*']});document.querySelector('#access').hidden=granted;const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const origin=tab?.url?.startsWith('https://')?new URL(tab.url).origin:'';const s=await read();if(granted&&origin&&s.settings.lmsOrigins.includes(origin)){const last=s.settings.lastImport;status.textContent=`${origin} syncs automatically.`+(last?.origin===origin?` Last import ${new Date(last.at).toLocaleTimeString()}.`:'');}}
await updateAccess();
document.querySelector('#access').onclick=run(async()=>{if(!(await chrome.permissions.request({origins:['https://*/*']})))throw Error('School-site access was not granted.');await chrome.runtime.sendMessage({type:'REGISTER'});const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(tab?.id&&tab.url?.startsWith('https://'))await chrome.tabs.reload(tab.id);await updateAccess();status.textContent='Done. School sites now set themselves up when you visit.';});
