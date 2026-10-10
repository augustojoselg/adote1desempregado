# API — Emprego Social

Express + PostgreSQL 17. Não há mais banco SQLite em runtime.

## Desenvolvimento e testes

Na raiz: `docker compose up -d --build --wait`. O Compose cria PostgreSQL sem porta publicada, executa a migração e inicia API e frontend. O modo trust do banco é exclusivo da rede local de desenvolvimento; não usar este Compose em nuvem.

Testes: `docker compose --profile test run --build --rm test`. Eles usam schemas temporários distintos no PostgreSQL e verificam autorização, transações, migração, cookies e CSRF.

Para Node instalado localmente: `npm ci`, configurar as variáveis de `.env.example`, executar `node src/migrate.js` e `npm run dev`. Esse caminho requer um PostgreSQL já disponível. Entrada em `src/start.js`; aplicação em `src/server.js`.

## Banco e produção

`PG_AUTH=entra` usa ManagedIdentityCredential para obter um token em cada nova conexão do pool, com TLS e validação do certificado. `AZURE_CLIENT_ID` seleciona a identidade atribuída pelo usuário; host, database e usuário são configuração não secreta. Em produção, conexões com senha estática são rejeitadas.

`src/migrate.js` aplica as migrações SQL em transação com advisory lock; a API não executa DDL ao iniciar. `src/bootstrap-db.js` cria a role Entra por OID e concede ao runtime somente operações nas tabelas da aplicação e uso das sequências. Esse bootstrap roda como job com identidade administrativa separada e não disponível à API.

Variáveis: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PG_AUTH`, `AZURE_CLIENT_ID`, `PGPOOL_MAX` (padrão 5), `FRONTEND_ORIGIN`, `TRUST_PROXY_HOPS`, `PORT`. `PGSSL=disable` só é utilizado no desenvolvimento; Entra exige validação TLS independentemente desse valor.

## Sessões e proteção

Produção usa cookie HttpOnly, Secure, SameSite=Strict; o token não é retornado no JSON e bearer tokens são recusados. Escritas exigem Origin igual a FRONTEND_ORIGIN. O cliente usa credentials: include e não persiste credenciais em localStorage/sessionStorage. A sessão expira em sete dias e logout a revoga.

Ainda falta login recuperável e identidade de usuário verificada. Não abrir para cadastro público antes de implementar esse fluxo e aprovação de empresas. A infraestrutura Azure proposta restringe o frontend ao IP do operador para homologação.

`GET /api/health` verifica o processo; `GET /api/ready` verifica conexão ao banco. Diretório e vagas usam limit de 1–100 (padrão 30) e offset. Bio e LinkedIn só são devolvidos ao titular. Elos avançam sequencialmente, com atualização condicional contra concorrência. Exclusão anonimiza perfil e remove vagas e elos em transação.

## Legado SQLite

Pare as escritas e faça exportação consistente com `scripts/export-sqlite.py`. A importação com `node src/import-sqlite.js ARQUIVO` exige schema migrado e destino vazio; confere contagens e chaves estrangeiras em transação. Tokens antigos são invalidados. Não carregar dados pessoais no repositório ou na imagem. Revise os procedimentos em `infra/azure/README.md` antes de uma migração real.
