# Repository Guidelines

## Estrutura

- `app/src`: frontend React; entrada em `main.jsx`, cliente HTTP em `api.js`, estado em `store.js`.
- `backend/src`: API Express; `start.js` inicia o servidor, `server.js` monta a aplicação, `db.js` gerencia pool PostgreSQL; migrações explícitas em `backend/migrations`.
- `backend/test/*.test.js`: testes de integração com schemas PostgreSQL temporários e servidor em porta temporária.
- `site.html`, `divulgacao.html`: páginas estáticas existentes.
- `PLANO-EVOLUCAO.md`: escopo e situação das entregas.

## Comandos

Em `backend`: `npm ci`, `npm test`, `npm run dev`, `npm start`.
Em `app`: `npm ci`, `npm run dev`, `npm run build`.
Na raiz, `docker compose --profile test run --build --rm test` executa testes com PostgreSQL 17. Validação em Node 24 na imagem.

## Convenções e validação

Preservar os módulos ES e estilo existente. Testar autorização por recurso e regressões de privacidade com contas distintas. Para mudanças de frontend, executar build. Não há lint validado nesta entrega.

Nunca versionar tokens, bancos locais, `.env` ou credenciais. Usar mensagens de commit imperativas e registrar validação e limitações em PRs. Não declarar prontidão para produção sem cumprir os critérios operacionais do plano.

## Containers

`backend/Dockerfile` gera a API; `app/Dockerfile` gera o frontend servido por Nginx. Os dois usam contexto na raiz. `compose.yaml` é exclusivo de desenvolvimento local, conecta os serviços e persiste PostgreSQL. `deploy/nginx` contém o proxy configurável em runtime. Instruções e comandos de validação em `DOCKER.md`. Nunca incluir dados ou segredos no contexto de build; manter `.dockerignore`.

Infraestrutura Azure em `infra/azure/main.bicep`: Bicep, identidades gerenciadas, Key Vault e banco privado. Validar compilação e what-if antes de provisionar. Nunca usar imagens SQLite v1 com essa infraestrutura. Custos, permissões e limitações em `infra/azure/README.md`.
