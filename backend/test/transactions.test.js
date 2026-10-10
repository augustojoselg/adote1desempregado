import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
process.env.PGSCHEMA = 'test_' + randomUUID().replaceAll('-', '');
const { db } = await import('../src/db.js');
const { migrate } = await import('../src/migrate.js');
await db.exec(`CREATE SCHEMA ${process.env.PGSCHEMA}`);
await migrate();
after(async () => { await db.exec(`DROP SCHEMA ${process.env.PGSCHEMA} CASCADE`); await db.close(); });
test('migração idempotente e rollback completo diante de violação de chave estrangeira', async () => {
  await migrate();
  assert.equal(Number((await db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get()).n), 1);
  const id = randomUUID();
  await assert.rejects(db.transaction(async () => {
    await db.prepare("INSERT INTO users(id,name,role,token_hash) VALUES (?, ?, 'Empresa', '')").run(id, 'Conta temporária');
    await db.prepare('INSERT INTO jobs(id,company,title,link,posted_by) VALUES (?, ?, ?, ?, ?)').run(randomUUID(), 'Empresa', 'Vaga', 'https://example.com', randomUUID());
  })());
  assert.equal(Number((await db.prepare('SELECT COUNT(*) AS n FROM users WHERE id = ?').get(id)).n), 0);
  const literal = "O'Neil; DROP TABLE users; --";
  const result = await db.prepare('SELECT CAST(@value AS TEXT) AS value, CAST(@value AS TEXT) AS repeated').get({ value: literal });
  assert.equal(result.value, literal);
  assert.equal(result.repeated, literal);
});
