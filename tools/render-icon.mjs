import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '../extension/node_modules/playwright/index.mjs';

const source=fileURLToPath(new URL('../extension/icons/icon.svg',import.meta.url));
const target=fileURLToPath(new URL('../extension/icons/icon.png',import.meta.url));
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:128,height:128},deviceScaleFactor:1});
 await page.setContent(`<html><body style="margin:0;background:transparent">${await readFile(source,'utf8')}</body></html>`);
 await page.locator('svg').screenshot({path:target,omitBackground:true});
} finally {await browser.close();}
