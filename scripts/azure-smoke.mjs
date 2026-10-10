// Read-only smoke checks: production signup must require a verified Entra identity.
import assert from 'node:assert/strict';
const origin = process.env.APP_ORIGIN;
if (!origin || !/^https:\/\/[a-z0-9.-]+\.azurecontainerapps\.io$/.test(origin)) {
  throw new Error('APP_ORIGIN deve ser a origem HTTPS do Container App autorizado.');
}
async function request(path, options = {}) {
  return fetch(origin + '/api' + path, { ...options, redirect: 'manual', signal: AbortSignal.timeout(180000),
    headers: { 'Content-Type': 'application/json', Origin: origin, ...options.headers } });
}
assert.equal((await request('/health')).status, 200);
assert.equal((await request('/ready')).status, 200);
assert.equal((await request('/users')).status, 401);
assert.equal((await request('/admin/users')).status, 401);
const config = await (await request('/auth/config')).json();
assert.equal(config.provider, 'entra');
assert.equal(config.identityReady, false);
const signup = { method: 'POST', body: JSON.stringify({ name: 'Cadastro inválido', role: 'Profissional', consent: true }) };
assert.equal((await request('/auth/signup', signup)).status, 401);
assert.equal((await request('/auth/signup', { ...signup, headers: { Origin: 'https://invalid.example' } })).status, 403);
const login = await request('/auth/login');
assert.equal(login.status, 303);
assert.equal(login.headers.get('cache-control'), 'no-store');
const url = new URL(login.headers.get('location'));
assert.equal(url.hostname, 'login.microsoftonline.com');
assert.equal(url.searchParams.get('response_type'), 'code');
assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
assert.equal(url.searchParams.get('redirect_uri'), origin + '/api/auth/callback');
assert.ok(url.searchParams.get('state'));
assert.ok(url.searchParams.get('nonce'));
assert.equal(url.searchParams.has('client_secret'), false);
const cookie = login.headers.get('set-cookie');
for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax']) assert.ok(cookie.includes(flag));
console.log('Azure: readiness, acesso negado sem identidade, CSRF e início OIDC com PKCE aprovados. Login interativo deve ser validado por usuário autorizado.');
