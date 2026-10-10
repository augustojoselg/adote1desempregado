import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes, randomUUID, sign, createHash } from 'node:crypto';
process.env.NODE_ENV = 'test';
process.env.PGSCHEMA = 'test_' + randomUUID().replaceAll('-', '');
const { db } = await import('../src/db.js');
process.env.NODE_ENV = 'production';
process.env.FRONTEND_ORIGIN = 'https://identity.example';
process.env.AUTH_PROVIDER = 'entra';
process.env.OIDC_TENANT_ID = randomUUID();
process.env.OIDC_CLIENT_ID = randomUUID();
process.env.OIDC_CLIENT_SECRET = randomBytes(32).toString('base64');
process.env.OIDC_COOKIE_KEY = randomBytes(32).toString('base64');
const issuer = `https://login.microsoftonline.com/${process.env.OIDC_TENANT_ID}/v2.0`;
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', use: 'sig', alg: 'RS256' };
let selectedOid = randomUUID();
let selectedRoles = ['Admin'];
let expectedNonce;
let expectedChallenge;
let invalidNonce = false;
let invalidIssuer = false;
let exchanges = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.hostname !== 'login.microsoftonline.com') return realFetch(input, options);
  const json = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
  if (url.pathname.endsWith('/.well-known/openid-configuration')) return json({
    issuer, authorization_endpoint: issuer + '/authorize', token_endpoint: issuer + '/token', jwks_uri: issuer + '/keys',
    response_types_supported: ['code'], subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'], token_endpoint_auth_methods_supported: ['client_secret_post'],
    code_challenge_methods_supported: ['S256'],
  });
  if (url.pathname.endsWith('/keys')) return json({ keys: [jwk] });
  if (url.pathname.endsWith('/token')) {
    exchanges++;
    const params = new URLSearchParams(options.body);
    assert.equal(createHash('sha256').update(params.get('code_verifier')).digest('base64url'), expectedChallenge);
    assert.equal(params.get('redirect_uri'), process.env.FRONTEND_ORIGIN + '/api/auth/callback');
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: invalidIssuer ? 'https://invalid.example' : issuer, aud: process.env.OIDC_CLIENT_ID,
      sub: selectedOid, oid: selectedOid, tid: process.env.OIDC_TENANT_ID, roles: selectedRoles,
      nonce: invalidNonce ? 'invalid-nonce' : expectedNonce, iat: now, exp: now + 3600,
    })).toString('base64url');
    const signingInput = header + '.' + payload;
    const idToken = signingInput + '.' + sign('RSA-SHA256', Buffer.from(signingInput), privateKey).toString('base64url');
    return json({ token_type: 'Bearer', access_token: 'unused-test-access-token', expires_in: 3600, id_token: idToken });
  }
  throw new Error('Unexpected identity endpoint');
};
const { default: app } = await import('../src/server.js');
const { migrate } = await import('../src/migrate.js');
await db.exec(`CREATE SCHEMA ${process.env.PGSCHEMA}`);
await migrate();
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(async () => {
  globalThis.fetch = realFetch;
  server.close();
  await db.exec(`DROP SCHEMA ${process.env.PGSCHEMA} CASCADE`);
  await db.close();
});
const cookie = (response, name) => response.headers.getSetCookie().findLast(value => value.startsWith(name + '='))?.split(';')[0];
async function request(path, { method = 'GET', cookies, body } = {}) {
  return realFetch(base + path, { method, redirect: 'manual', headers: {
    Origin: process.env.FRONTEND_ORIGIN, 'Content-Type': 'application/json', ...(cookies ? { Cookie: cookies } : {}),
  }, body: body ? JSON.stringify(body) : undefined });
}
async function startLogin() {
  const response = await request('/auth/login');
  assert.equal(response.status, 303);
  const url = new URL(response.headers.get('location'));
  expectedNonce = url.searchParams.get('nonce');
  expectedChallenge = url.searchParams.get('code_challenge');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  return { cookies: cookie(response, 'adote_oidc'), state: url.searchParams.get('state') };
}
const finishLogin = context => request(`/auth/callback?code=test-code&state=${encodeURIComponent(context.state)}`, context);
test('Entra OIDC: PKCE, state, nonce, issuer, recuperação e administração auditada', async () => {
  const attempt = await startLogin();
  const before = exchanges;
  assert.equal((await finishLogin({ ...attempt, state: 'forged' })).status, 401);
  assert.equal(exchanges, before);
  invalidNonce = true;
  assert.equal((await finishLogin(await startLogin())).status, 401);
  invalidNonce = false;
  invalidIssuer = true;
  assert.equal((await finishLogin(await startLogin())).status, 401);
  invalidIssuer = false;
  selectedRoles = [];
  assert.equal((await finishLogin(await startLogin())).status, 403);
  selectedRoles = ['Admin'];
  const firstLogin = await finishLogin(await startLogin());
  assert.equal(firstLogin.status, 303);
  const signup = await request('/auth/signup', { method: 'POST', cookies: cookie(firstLogin, 'adote_registration'),
    body: { name: 'Administrador de teste', role: 'Mentor', consent: true } });
  assert.equal(signup.status, 201);
  const admin = (await signup.json()).user;
  const adminCookie = cookie(signup, 'adote_session');
  assert.equal(admin.is_admin, true);
  assert.equal((await request('/admin/users', { cookies: adminCookie })).status, 200);
  assert.equal((await request(`/admin/users/${admin.id}/disable`, { method: 'POST', cookies: adminCookie })).status, 409);

  selectedOid = randomUUID();
  selectedRoles = ['Member'];
  const memberLogin = await finishLogin(await startLogin());
  const memberSignup = await request('/auth/signup', { method: 'POST', cookies: cookie(memberLogin, 'adote_registration'),
    body: { name: 'Profissional de teste', role: 'Profissional', consent: true } });
  assert.equal(memberSignup.status, 201);
  const member = (await memberSignup.json()).user;
  let memberCookie = cookie(memberSignup, 'adote_session');
  assert.equal((await request('/admin/users', { cookies: memberCookie })).status, 403);
  assert.equal((await request('/auth/logout', { method: 'POST', cookies: memberCookie })).status, 204);
  const returning = await finishLogin(await startLogin());
  memberCookie = cookie(returning, 'adote_session');
  assert.equal((await (await request('/auth/me', { cookies: memberCookie })).json()).user.id, member.id);
  for (const action of ['revoke', 'disable']) {
    assert.equal((await request(`/admin/users/${member.id}/${action}`, { method: 'POST', cookies: adminCookie })).status, 204);
    assert.equal((await request('/auth/me', { cookies: memberCookie })).status, 401);
  }
  assert.equal((await finishLogin(await startLogin())).status, 403);
  assert.equal((await request(`/admin/users/${member.id}/enable`, { method: 'POST', cookies: adminCookie })).status, 204);
  memberCookie = cookie(await finishLogin(await startLogin()), 'adote_session');
  const exported = await (await request('/account/export', { cookies: memberCookie })).json();
  assert.deepEqual(exported.historico_administrativo.map(row => row.action), ['session_revoked', 'access_disabled', 'access_enabled']);
  assert.equal((await request('/account', { method: 'DELETE', cookies: memberCookie })).status, 200);
  assert.equal((await db.prepare('SELECT identity_subject FROM users WHERE id = ?').get(member.id)).identity_subject, null);
});
