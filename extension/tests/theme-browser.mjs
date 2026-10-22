import assert from 'node:assert/strict';
const {chromium}=await import(process.env.COURSELARK_PLAYWRIGHT||'playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const theme={code:'test123',title:'Test ocean',credits:'Example creator',exports:JSON.stringify({dark_mode:true,dark_preset:{'background-0':'#112233','background-1':'#223344','text-0':'#eeeeee',links:'#aabbcc'},card_colors:['#123456'],custom_cards:['https://example.com/card.png'],gpa_calc:false,better_todo:false})};
try{
 await page.route('https://api.bettercampus.com/themes**',route=>{const url=new URL(route.request().url());const row={code:theme.code,title:theme.title,credits:theme.credits,category:'ocean'};const message=url.pathname.endsWith('/test123')?theme:url.searchParams.has('search')?[row]:url.searchParams.get('page')==='2'?[{...row,title:'Second page theme'}]:Array.from({length:20},(_,i)=>({...row,title:i?`Example ${i}`:row.title}));return route.fulfill({contentType:'application/json',body:JSON.stringify({message})});});
 await page.goto((process.env.COURSELARK_BASE_URL||'http://127.0.0.1:4317')+'/#themes');
 await page.locator('[data-action="legal-accept"]').click();
 await page.getByRole('button',{name:'Community themes',exact:true}).click();
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByText('Second page theme',{exact:true}).waitFor();await page.locator('#community-search').fill('ocean');await page.getByRole('button',{name:'Search community',exact:true}).click();await page.getByText('Test ocean',{exact:true}).waitFor();assert.equal(await page.locator('#community-page').textContent(),'Page 1');await page.getByRole('button',{name:'Preview',exact:true}).click();
 await page.getByRole('button',{name:'Install & apply',exact:true}).click();
 await page.getByRole('heading',{name:'Test ocean',exact:true}).waitFor();
 let stored=await page.evaluate(()=>JSON.parse(localStorage.campus));assert.equal(stored.settings.showGpa,false);assert.equal(stored.settings.theme.images[0],'https://example.com/card.png');assert.equal(stored.settings.theme.credits,'Example creator');
 await page.reload();await page.getByRole('heading',{name:'Test ocean',exact:true}).waitFor();
 await page.getByRole('checkbox',{name:'Canvas GPA widget',exact:true}).check();await page.getByRole('checkbox',{name:'Workspace companion',exact:true}).uncheck();await page.getByRole('button',{name:'Save display settings',exact:true}).click();
 await page.getByRole('link',{name:'Overview',exact:true}).click();assert.equal(await page.locator('.pet').isVisible(),false);
 await page.getByRole('link',{name:'Appearance',exact:true}).click();
 await page.getByRole('button',{name:'Paste theme JSON',exact:true}).click();await page.locator('[name=json]').fill('{"card_colors":["url(javascript:alert(1))"]}');await page.getByRole('button',{name:'Preview import',exact:true}).click();await page.getByText('Invalid card palette. Use six-digit hex colors.',{exact:true}).waitFor();await page.locator('#close-dialog').click();
 stored=await page.evaluate(()=>JSON.parse(localStorage.campus));assert.equal(stored.themes.length,1);assert.equal(stored.settings.showGpa,true);
 if(process.env.COURSELARK_SCREENSHOT)await page.screenshot({path:process.env.COURSELARK_SCREENSHOT,fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS community preview/install, attribution, persistence, display controls and malformed-import rejection.');
}finally{await browser.close();}
