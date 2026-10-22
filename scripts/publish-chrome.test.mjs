import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {publish} from './publish-chrome.mjs';
const revision = (state, version) => ({state, distributionChannels:[{crxVersion:version}]});
const {privateKey} = generateKeyPairSync('rsa', {modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
async function run(responses) {
  const calls=[];
  await publish({token:'test-token',publisher:'publisher',item:'item',version:'0.3.2.1',archive:new URL('../extension/manifest.json',import.meta.url),sleep:async()=>{},request:async(url,options)=>{
    calls.push({url,options});
    const response=responses.shift();
    assert.ok(response, 'Unexpected API request');
    return {ok:true,json:async()=>response};
  }});
  return calls;
}
test('waits for upload before submitting',async()=>{
  const calls=await run([{}, {uploadState:'IN_PROGRESS'}, {lastAsyncUploadState:'SUCCEEDED'}, {state:'PENDING_REVIEW'}]);
  assert.equal(calls.length,4);
  assert.match(calls[1].url,/\/upload\/v2\//);
  assert.match(calls[2].url,/:fetchStatus$/);
  assert.equal(JSON.parse(calls[3].options.body).publishType,'DEFAULT_PUBLISH');
});
test('authenticates directly with a service-account JWT before using the Chrome API',async()=>{
  const calls=[];
  await publish({serviceAccount:{type:'service_account',client_email:'release@example.iam.gserviceaccount.com',private_key:privateKey},publisher:'publisher',item:'item',version:'0.3.2.1',archive:new URL('../extension/manifest.json',import.meta.url),sleep:async()=>{},request:async(url,options)=>{
    calls.push({url,options});
    if(url==='https://oauth2.googleapis.com/token') return {ok:true,status:200,json:async()=>({access_token:'short-lived-token'})};
    return {ok:true,status:200,json:async()=>({publishedItemRevisionStatus:revision('PUBLISHED','0.3.2.1')})};
  }});
  assert.equal(calls.length,2);
  assert.equal(calls[1].options.headers.Authorization,'Bearer short-lived-token');
});
test('does not submit a failed upload',async()=>{
  await assert.rejects(run([{}, {uploadState:'FAILED'}]),/did not succeed/);
});
test('rerun skips a version already in review',async()=>{
  assert.equal((await run([{submittedItemRevisionStatus:revision('PENDING_REVIEW','0.3.2.1')}])).length,1);
});
test('cancels an older pending review, then submits the newer version',async()=>{
  const calls=await run([{submittedItemRevisionStatus:revision('PENDING_REVIEW','0.3.2')}, {}, {uploadState:'SUCCEEDED'}, {state:'PENDING_REVIEW'}]);
  assert.match(calls[1].url,/:cancelSubmission$/);
  assert.match(calls[2].url,/\/upload\/v2\//);
  assert.match(calls[3].url,/:publish$/);
});
test('rejects a stale rerun',async()=>{
  await assert.rejects(run([{publishedItemRevisionStatus:revision('PUBLISHED','0.3.2.2')}]),/older version/);
});
test('rejects unexpected publication state',async()=>{
  await assert.rejects(run([{}, {uploadState:'SUCCEEDED'}, {state:'REJECTED'}]),/Unexpected publishing state/);
});
