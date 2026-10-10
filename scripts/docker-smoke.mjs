// Run against the local Compose stack, from the repository root.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const origin = `http://127.0.0.1:${process.env.HTTP_PORT || 8080}`;
const compose = (...args) => execFileSync('docker', ['compose', ...args], { stdio: 'inherit' });
compose('up', '-d', '--wait');
async function request(path, options = {}) {
  return fetch(origin + path, { ...options, headers: { ...options.headers, Connection: 'close' } });
}
assert.equal((await request('/healthz')).status, 200);
assert.equal((await request('/api/health')).status, 200);
assert.equal((await request('/painel')).status, 200); // SPA fallback
assert.equal((await request('/assets/missing.js')).status, 404);
assert.equal((await request('/api/auth/me')).status, 401);
const signup = await request('/api/auth/signup', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: process.env.FRONTEND_ORIGIN || `http://localhost:${process.env.HTTP_PORT || 8080}` },
  body: JSON.stringify({ name: 'Teste Docker temporário', role: 'Profissional', consent: true }),
});
assert.equal(signup.status, 201);
const { user } = await signup.json();
const headers = { Cookie: signup.headers.get('set-cookie').split(';')[0], Origin: process.env.FRONTEND_ORIGIN || `http://localhost:${process.env.HTTP_PORT || 8080}` };
try {
  // Recreate both services: a new writable container layer must retain the account.
  compose('up', '-d', '--force-recreate', '--wait');
  const restored = await request('/api/auth/me', { headers });
  assert.equal(restored.status, 200);
  assert.equal((await restored.json()).user.id, user.id);
} finally {
  const removed = await request('/api/account', { method: 'DELETE', headers });
  assert.equal(removed.status, 200);
}
assert.equal((await request('/api/auth/me', { headers })).status, 401);
console.log('Docker: proxy, SPA, autenticação e persistência após recriação aprovados.');
