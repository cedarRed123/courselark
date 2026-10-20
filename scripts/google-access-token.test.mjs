import {generateKeyPairSync, createVerify} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAssertion, getAccessToken} from './google-access-token.mjs';

const {privateKey, publicKey} = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
  publicKeyEncoding: {type: 'spki', format: 'pem'},
});
const credentials = {
  type: 'service_account',
  client_email: 'release@example.iam.gserviceaccount.com',
  private_key_id: 'test-key',
  private_key: privateKey,
};
const decode = value => JSON.parse(Buffer.from(value, 'base64url').toString());

test('creates a signed JWT scoped only to Chrome Web Store publishing', () => {
  const assertion = createAssertion(credentials, 1_800_000_000);
  const [headerPart, claimsPart, signature] = assertion.split('.');
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${headerPart}.${claimsPart}`);
  verifier.end();
  assert.equal(verifier.verify(publicKey, signature, 'base64url'), true);
  assert.deepEqual(decode(headerPart), {alg: 'RS256', typ: 'JWT', kid: 'test-key'});
  assert.deepEqual(decode(claimsPart), {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/chromewebstore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: 1_800_000_000,
    exp: 1_800_003_600,
  });
});

test('exchanges the assertion at Google OAuth and returns only the access token', async () => {
  let requestUrl;
  let requestOptions;
  const token = await getAccessToken(credentials, {
    now: 1_800_000_000,
    request: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return {ok: true, status: 200, json: async () => ({access_token: 'short-lived-token'})};
    },
  });
  assert.equal(requestUrl, 'https://oauth2.googleapis.com/token');
  assert.equal(requestOptions.method, 'POST');
  assert.equal(requestOptions.headers['Content-Type'], 'application/x-www-form-urlencoded');
  const body = new URLSearchParams(requestOptions.body);
  assert.equal(body.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  assert.equal(body.get('assertion').split('.').length, 3);
  assert.equal(token, 'short-lived-token');
});

test('rejects invalid credentials and OAuth errors', async () => {
  assert.throws(() => createAssertion({}, 1_800_000_000), /service-account JSON key/);
  await assert.rejects(getAccessToken(credentials, {
    now: 1_800_000_000,
    request: async () => ({ok: false, status: 401, json: async () => ({error: 'invalid_grant'})}),
  }), /Google OAuth token exchange failed \(401\)/);
});
