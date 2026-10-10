import { test, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.DB_PATH = ':memory:';
const { default: app } = await import('../src/server.js');
const { db } = await import('../src/db.js');
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(() => { server.close(); db.close(); });
async function request(path, token, method = 'GET', body) {
  const res = await fetch(base + path, { method, headers: {
    'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json().catch(() => null) };
}
async function signup(name, role) {
  const res = await request('/auth/signup', null, 'POST', { name, role, consent: true, bio: 'Privado', linkedin: 'https://example.com/perfil' });
  assert.equal(res.status, 201);
  return res.data;
}
test('autorização, privacidade, estados, exclusão e revogação', async () => {
  const mentor = await signup('Mentor', 'Mentor');
  const person = await signup('Pessoa', 'Profissional');
  const outsider = await signup('Outro', 'Mentor');
  const company = await signup('Empresa A', 'Empresa');
  const companyB = await signup('Empresa B', 'Empresa');
  assert.equal((await request('/users')).status, 401);
  const directory = await request('/users?limit=1', outsider.token);
  assert.equal(directory.data.users.length, 1);
  assert.equal(directory.data.users[0].linkedin, '');
  assert.equal((await request('/users?limit=101', mentor.token)).status, 400);
  assert.equal((await request('/users?role=Admin', mentor.token)).status, 400);
  const job = { company: 'Empresa A', title: 'Vaga', link: 'https://example.com/vaga' };
  assert.equal((await request('/jobs', person.token, 'POST', job)).status, 403);
  assert.equal((await request('/jobs', company.token, 'POST', { ...job, link: 'javascript:alert(1)' })).status, 400);
  assert.equal((await request('/jobs', company.token, 'POST', job)).status, 201);
  assert.equal((await request('/account', person.token, 'PATCH', { linkedin: 'ftp://example.com' })).status, 400);
  const created = await request('/elos', mentor.token, 'POST', { targetUserId: person.user.id });
  assert.equal(created.status, 201);
  const id = created.data.elo.id;
  const profiles = (await request('/users', mentor.token)).data.users;
  assert.equal(profiles.find(user => user.id === person.user.id).linkedin, '');
  assert.equal(profiles.find(user => user.id === person.user.id).bio, '');
  assert.equal((await request(`/elos/${id}/status`, outsider.token, 'PATCH', { status: 'Em contato' })).status, 403);
  assert.equal((await request(`/elos/${id}/status`, mentor.token, 'PATCH', { status: 'Recolocado' })).status, 409);
  assert.equal((await request(`/elos/${id}/status`, person.token, 'PATCH', { status: 'Em contato' })).status, 200);
  assert.equal((await request(`/elos/${id}/status`, mentor.token, 'PATCH', { status: 'Combinado' })).status, 409);
  assert.equal((await request('/account/export', companyB.token)).data.vagas_publicadas.length, 0);
  assert.equal((await request('/account', company.token, 'DELETE')).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM jobs').get().n, 0);
  assert.equal((await request('/auth/me', company.token)).status, 401);
  assert.equal((await request('/account', person.token, 'DELETE')).status, 200);
  assert.equal((await request('/elos/mine', mentor.token)).data.elos.length, 0);
  db.prepare('UPDATE users SET session_expires_at = ? WHERE id = ?').run('2000-01-01T00:00:00.000Z', outsider.user.id);
  assert.equal((await request('/auth/me', outsider.token)).status, 401);
  assert.equal((await request('/auth/logout', mentor.token, 'POST')).status, 204);
  assert.equal((await request('/auth/me', mentor.token)).status, 401);
});
