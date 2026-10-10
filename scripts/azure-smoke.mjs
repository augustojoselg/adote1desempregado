// Restricted deployment only. Uses fictional accounts and removes them afterwards.
import assert from 'node:assert/strict';
const origin = process.env.APP_ORIGIN;
if (!origin || !/^https:\/\/[a-z0-9.-]+\.azurecontainerapps\.io$/.test(origin)) {
  throw new Error('APP_ORIGIN deve ser a origem HTTPS do Container App autorizado.');
}
const accounts = [];
async function request(path, { method = 'GET', body, cookie, requestOrigin = origin } = {}) {
  return fetch(origin + '/api' + path, {
    method, redirect: 'error', signal: AbortSignal.timeout(180000),
    headers: { 'Content-Type': 'application/json', Origin: requestOrigin,
      ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function signup(role) {
  const response = await request('/auth/signup', {
    method: 'POST', body: { name: `Validação técnica ${role}`, role, consent: true },
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const data = await response.json();
  assert.equal(data.token, undefined);
  const header = response.headers.get('set-cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict']) assert.ok(header.includes(flag));
  const account = { id: data.user.id, cookie: header.split(';')[0] };
  accounts.push(account);
  return account;
}
try {
  assert.equal((await request('/health')).status, 200);
  assert.equal((await request('/ready')).status, 200);
  assert.equal((await request('/users')).status, 401);
  assert.equal((await request('/auth/signup', { method: 'POST', requestOrigin: 'https://invalid.example',
    body: { name: 'CSRF inválido', role: 'Mentor', consent: true } })).status, 403);
  const mentor = await signup('Mentor');
  const professional = await signup('Profissional');
  const company = await signup('Empresa');
  assert.equal((await request('/auth/me', { cookie: mentor.cookie })).status, 200);
  assert.equal((await request('/jobs', { method: 'POST', cookie: mentor.cookie,
    body: { company: 'Teste', title: 'Teste', link: 'https://example.com' } })).status, 403);
  const created = await request('/elos', { method: 'POST', cookie: mentor.cookie,
    body: { targetUserId: professional.id } });
  assert.equal(created.status, 201);
  const { elo } = await created.json();
  assert.equal((await request(`/elos/${elo.id}/status`, { method: 'PATCH', cookie: company.cookie,
    body: { status: 'Em contato' } })).status, 403);
  assert.equal((await request(`/elos/${elo.id}/status`, { method: 'PATCH', cookie: mentor.cookie,
    body: { status: 'Recolocado' } })).status, 409);
  for (const status of ['Em contato', 'Entrevistas', 'Recolocado']) {
    assert.equal((await request(`/elos/${elo.id}/status`, { method: 'PATCH', cookie: mentor.cookie,
      body: { status } })).status, 200);
  }
  const job = await request('/jobs', { method: 'POST', cookie: company.cookie,
    body: { company: 'Validação técnica', title: 'Vaga fictícia', link: 'https://example.com' } });
  assert.equal(job.status, 201);
  const exported = await request('/account/export', { cookie: mentor.cookie });
  assert.equal(exported.status, 200);
  const data = await exported.json();
  assert.equal(data.profile.id, mentor.id);
  assert.equal(data.profile.token_hash, undefined);
} finally {
  const cleanup = await Promise.allSettled(accounts.map(async (account) => {
    assert.equal((await request('/account', { method: 'DELETE', cookie: account.cookie })).status, 200);
    assert.equal((await request('/auth/me', { cookie: account.cookie })).status, 401);
  }));
  if (cleanup.some(result => result.status === 'rejected')) {
    throw new Error('Limpeza de contas de teste incompleta; operação deve verificar privadamente.');
  }
}
console.log('Azure: readiness, cookies, CSRF, autorização, elos, vagas, exportação e exclusão aprovados.');
