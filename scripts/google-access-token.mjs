import {createSign} from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CHROME_WEBSTORE_SCOPE = 'https://www.googleapis.com/auth/chromewebstore';

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');

export function createAssertion(credentials, now = Math.floor(Date.now() / 1000)) {
  if (credentials?.type !== 'service_account' || !credentials.client_email || !credentials.private_key) {
    throw Error('A service-account JSON key is required');
  }
  const header = {alg: 'RS256', typ: 'JWT'};
  if (credentials.private_key_id) header.kid = credentials.private_key_id;
  const claims = {
    iss: credentials.client_email,
    scope: CHROME_WEBSTORE_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${encode(header)}.${encode(claims)}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(credentials.private_key, 'base64url')}`;
}

export async function getAccessToken(credentials, {request = fetch, now} = {}) {
  const assertion = createAssertion(credentials, now);
  const response = await request(TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw Error(`Google OAuth token exchange failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return data.access_token;
}
