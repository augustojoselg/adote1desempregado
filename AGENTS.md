# Repository Guidelines

## Estrutura

- `app/src`: frontend React; entrada em `main.jsx`, cliente HTTP em `api.js`, estado em `store.js`.
- `backend/src`: API Express; `start.js` inicia o servidor, `server.js` monta a aplicação, `db.js` inicializa SQLite e migração aditiva de sessão.
- `backend/test/*.test.js`: testes de integração com banco em memória e servidor em porta temporária.
- `site.html`, `divulgacao.html`: páginas estáticas existentes.
- `PLANO-EVOLUCAO.md`: escopo e situação das entregas.

## Comandos

Em `backend`: `npm ci`, `npm test`, `npm run dev`, `npm start`.
Em `app`: `npm ci`, `npm run dev`, `npm run build`.
Os testes precisam de permissão para abrir uma porta local. Use Node.js compatível com better-sqlite3; validação inicial em Node 25.8.1.

## Convenções e validação

Preservar os módulos ES e estilo existente. Testar autorização por recurso e regressões de privacidade com contas distintas. Para mudanças de frontend, executar build. Não há lint validado nesta entrega.

Nunca versionar tokens, bancos locais, `.env` ou credenciais. Usar mensagens de commit imperativas e registrar validação e limitações em PRs. Não declarar prontidão para produção sem cumprir os critérios operacionais do plano.
