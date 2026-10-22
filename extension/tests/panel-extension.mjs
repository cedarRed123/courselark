// Verify the packaged panel in an isolated Chromium profile. The temporary test
// copy has a fixture host grant so no interactive permission prompt is needed.
import assert from 'node:assert/strict';
import {cp,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.OPEN_CAMPUS_PLAYWRIGHT||'playwright');
const original=fileURLToPath(new URL('../',import.meta.url));
const temporary=await mkdtemp(join(tmpdir(),'open-campus-panel-'));
const extension=join(temporary,'extension'),profile=join(temporary,'profile');
const origin='https://fixture.instructure.com';
let context;
try {
  await cp(original,extension,{recursive:true,filter:path=>!path.includes('/node_modules/')});
  const manifestPath=join(extension,'manifest.json');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  manifest.host_permissions=[origin+'/*'];
  await writeFile(manifestPath,JSON.stringify(manifest));
  context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,viewport:{width:1280,height:850},ignoreDefaultArgs:['--disable-extensions'],args:['--enable-unsafe-extension-debugging']});
  const cdp=await context.browser().newBrowserCDPSession();
  const loaded=await cdp.send('Extensions.loadUnpacked',{path:extension});
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker',{timeout:15000});
  const root=`chrome-extension://${loaded.id}/`;
  await worker.evaluate(async site=>{let stored;for(let i=0;i<20;i++){stored=(await chrome.storage.local.get('campus')).campus;if(stored)break;await new Promise(r=>setTimeout(r,100));}stored.settings.lmsOrigins=[site];stored.legalAcceptance={version:'2026-10-21.2',acceptedAt:'2026-10-18T00:00:00.000Z'};await chrome.storage.local.set({campus:stored});},origin);
  await context.route(origin+'/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><title>Canvas fixture</title></head><body><nav id="header"><ul id="menu"></ul></nav><main id="dashboard"><div class="ic-DashboardCard__box"></div></main></body></html>'}));
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(origin+'/');
  const tab=await worker.evaluate(async site=>(await chrome.tabs.query({url:site+'/*'}))[0],origin);
  await worker.evaluate(async id=>chrome.scripting.executeScript({target:{tabId:id},files:['src/content.js']}),tab.id);
  await page.locator('#open-campus-launch').click();
  await page.locator('#open-campus-panel[open] iframe').waitFor();
  await page.frameLocator('#open-campus-panel iframe').locator('.hero').waitFor();
  assert.equal(await page.locator('#open-campus-panel iframe').getAttribute('src'),root+'index.html');
  assert.equal((await context.pages()).filter(p=>p.url().startsWith(root+'index.html')).length,0);
  await page.locator('#open-campus-panel .oc-panel-bar button').click();
  await page.locator('#open-campus-panel').waitFor({state:'detached'});
  assert.equal((await worker.evaluate(async id=>chrome.tabs.sendMessage(id,{type:'OPEN_PANEL',page:'grades'}),tab.id)).ok,true);
  await page.frameLocator('#open-campus-panel iframe').locator('#title').getByText('Grades & GPA').waitFor();
  await page.keyboard.press('Escape');await page.locator('#open-campus-panel').waitFor({state:'detached'});
  assert.deepEqual(errors,[]);
  console.log('PASS: real extension workspace opens, closes, and routes to Grades inside the Canvas tab.');
} finally {await context?.close();await rm(temporary,{recursive:true,force:true});}
