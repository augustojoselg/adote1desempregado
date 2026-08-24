# Backend — Adote um Desempregado

API em Node.js + Express + SQLite (via `better-sqlite3`). Substitui o antigo armazenamento em `localStorage` do frontend por um banco de dados real e compartilhado entre todos os usuários.

## Rodando localmente

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

O servidor sobe em `http://localhost:3001` por padrão. `npm run dev` reinicia automaticamente a cada alteração (usa `node --watch`). Para produção, use `npm start`.

O banco SQLite é criado automaticamente em `backend/data/adote.db` na primeira execução — não precisa criar nada manualmente.

## Variáveis de ambiente (`.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta da API |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Origem permitida pelo CORS — em produção, aponte para o domínio real do app |
| `DB_PATH` | `./data/adote.db` | Caminho do arquivo SQLite |

## Endpoints principais

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Cadastro. Exige `consent: true` |
| GET | `/api/auth/me` | ✓ | Confirma sessão |
| GET | `/api/users` | ✓ | Diretório |
| GET | `/api/users/stats` | — | Contadores públicos |
| PATCH | `/api/account` | ✓ | Editar perfil (direito de retificação) |
| GET | `/api/account/export` | ✓ | Baixar meus dados (portabilidade) |
| DELETE | `/api/account` | ✓ | Excluir/anonimizar perfil (direito ao esquecimento) |
| POST | `/api/elos` | ✓ | Criar conexão mentor↔profissional |
| GET | `/api/elos/mine` | ✓ | Meus elos |
| PATCH | `/api/elos/:id/status` | ✓ | Avançar etapa do elo |
| GET | `/api/jobs` | ✓ | Listar vagas |
| POST | `/api/jobs` | ✓ (Empresa) | Publicar vaga |

Autenticação: envie o token retornado no signup como `Authorization: Bearer <token>`.

## Segurança já incluída

- `helmet` para cabeçalhos de segurança
- `express-rate-limit` (geral + limite mais rígido no signup, contra spam de cadastro)
- CORS restrito à origem do frontend
- Tokens de sessão nunca armazenados em texto puro — só o hash SHA-256
- Validação de entrada com `zod` em todas as rotas que recebem dados

## Limitações conhecidas / próximos passos para produção

1. **Autenticação por token simples, sem senha nem e-mail.** Quem tiver o token consegue agir como aquele usuário. Funciona para uma rede de confiança em fase inicial, mas para uso profissional em maior escala, recomenda-se evoluir para login por e-mail (magic link) ou OAuth.
2. **SQLite é um arquivo local.** Ótimo para começar ou rodar em um único servidor, mas não escala para múltiplas instâncias/regiões. Se o volume crescer, migrar para Postgres (o schema em `src/db.js` é simples de portar).
3. **Sem HTTPS embutido.** Em produção, rode atrás de um proxy reverso (nginx, Caddy, ou a plataforma de hospedagem) que termine TLS.
4. **Sem backup automático do banco.** Configure backup periódico do arquivo `data/adote.db` (ou do Postgres, se migrar).
5. **Sem envio de e-mail transacional** (confirmação de cadastro, aviso de exclusão de conta, etc.) — hoje tudo acontece só na interface.
