import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export async function publish({token, publisher, item, version, archive, request = fetch, sleep = ms => new Promise(r => setTimeout(r, ms))}) {
  if (!token || !publisher || !item || !version) throw Error('Chrome publishing credentials and IDs are required');
  const name = `publishers/${encodeURIComponent(publisher)}/items/${encodeURIComponent(item)}`;
  const api = `https://chromewebstore.googleapis.com/v2/${name}`;
  const call = async (url, options = {}) => {
    const response = await request(url, {...options, signal: AbortSignal.timeout(120000), headers: {Authorization: `Bearer ${token}`, ...options.headers}});
    const data = await response.json();
    if (!response.ok) throw Error(`Chrome API ${response.status}: ${JSON.stringify(data)}`);
    return data;
  };
  const status = await call(`${api}:fetchStatus`);
  const published = status.publishedItemRevisionStatus;
  const submitted = status.submittedItemRevisionStatus;
  const hasVersion = revision => revision?.distributionChannels?.some(c => c.crxVersion === version);
  if (hasVersion(published) || (hasVersion(submitted) && ['PENDING_REVIEW', 'STAGED'].includes(submitted.state))) {
    console.log(`Version ${version} is already published or submitted.`);
    return;
  }
  if (submitted?.state === 'PENDING_REVIEW') throw Error('An earlier version is under Chrome review. Rerun the latest release after review finishes.');
  const compare = (a, b) => { const x=a.split('.').map(Number), y=b.split('.').map(Number); for(let i=0;i<4;i++) {if((x[i]||0)!==(y[i]||0))return (x[i]||0)-(y[i]||0);} return 0; };
  if ([published, submitted].some(r => r?.distributionChannels?.some(c => compare(c.crxVersion, version) > 0))) throw Error('Refusing to upload an older version than the store already has.');
  let upload = await call(`https://chromewebstore.googleapis.com/upload/v2/${name}:upload`, {method:'POST', headers:{'Content-Type':'application/zip'}, body:await readFile(archive)});
  for (let attempt=0; ['IN_PROGRESS', 'UPLOAD_IN_PROGRESS'].includes(upload.uploadState) && attempt<30; attempt++) {
    await sleep(10000);
    const polled = await call(`${api}:fetchStatus`);
    upload = {...polled, uploadState:polled.lastAsyncUploadState};
  }
  if (upload.uploadState !== 'SUCCEEDED') throw Error(`Chrome upload did not succeed: ${JSON.stringify(upload)}`);
  const result = await call(`${api}:publish`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({publishType:'DEFAULT_PUBLISH'})});
  if (!['PENDING_REVIEW', 'PUBLISHED', 'STAGED'].includes(result.state)) throw Error(`Unexpected publishing state: ${JSON.stringify(result)}`);
  console.log(`Chrome submission ${version}: ${result.state}. Availability depends on Google review.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await publish({token:process.env.CWS_ACCESS_TOKEN, publisher:process.env.CWS_PUBLISHER_ID, item:process.env.CWS_EXTENSION_ID, version:process.env.RELEASE_VERSION, archive:process.argv[2]});
}
