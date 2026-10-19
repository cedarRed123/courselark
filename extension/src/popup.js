import {read,write} from './store.js';
import {legalVersion} from './core.js';
const status=document.querySelector('#status');
const run=fn=>async()=>{try{status.textContent='Working…';await fn();}catch(e){status.textContent=e.message;}};
async function updateLegal(){const accepted=(await read()).legalAcceptance?.version===legalVersion;document.querySelector('#legal').hidden=accepted;document.querySelector('#controls').hidden=!accepted;}
document.querySelector('#agree').onclick=run(async()=>{const state=await read();state.legalAcceptance={version:legalVersion,acceptedAt:new Date().toISOString()};await write(state);status.textContent='Terms accepted on this device.';await updateLegal();});
await updateLegal();
document.querySelector('#open').onclick=run(async()=>{await chrome.runtime.sendMessage({type:'OPEN'});window.close();});
document.querySelector('#connect').onclick=run(async()=>{
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.url?.startsWith('https://'))throw Error('Open your school’s HTTPS LMS site first.');const origin=new URL(tab.url).origin;
 const allowed=await chrome.permissions.request({origins:[origin+'/*']});if(!allowed)throw Error('Site access was not granted.');const s=await read();if(!s.settings.lmsOrigins.includes(origin))s.settings.lmsOrigins.push(origin);await write(s);
 const result=await chrome.runtime.sendMessage({type:'REGISTER'});if(!result.ok)throw Error(result.error);await chrome.scripting.executeScript({target:{tabId:tab.id},files:['src/content.js']});status.textContent=`Connected ${origin}. Import to bring in Canvas assignments.`;
});
document.querySelector('#sync').onclick=run(async()=>{const result=await chrome.runtime.sendMessage({type:'IMPORT_LMS'});if(!result.ok)throw Error(result.error);status.textContent=`Imported ${result.courses} courses and ${result.tasks} assignments. ${(result.warnings||[]).join(' ')}`;});
