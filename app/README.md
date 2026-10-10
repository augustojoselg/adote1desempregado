# Adote um Desempregado — App Web

React 18 + Vite 8 para a corrente voluntária de recolocação profissional. Requer Node 24, validado nos containers, e a API em `../backend`.

## Instalação

```bash
npm ci
cp .env.example .env
```

Edite `.env` se o backend não estiver em `http://localhost:3001` (padrão).

## Desenvolvimento

Com o backend já rodando (veja `../backend/README.md`):

```bash
npm run dev
```

Abre em `http://localhost:3000`, conforme `vite.config.js`. Configure `FRONTEND_ORIGIN=http://localhost:3000` na API para permitir cookies e operações de escrita.

## Build

```bash
npm run build
```

Saída em `dist/`. No container, `VITE_API_URL=/api` mantém frontend e API na mesma origem; o Nginx encaminha requisições ao backend interno. Não exponha a API diretamente nem coloque segredos em variáveis `VITE_*`.

## Estrutura

- `src/api.js` — cliente HTTP com cookie HttpOnly gerenciado pelo servidor; não armazena tokens no navegador
- `src/components/` — componentes reutilizáveis (Header, Stats, Directory, JobBoard, EloTracker, AccountPanel)
- `src/pages/` — telas (Entry, Dashboard, Privacy)
- `src/store.js` — estado global com Zustand, delega toda persistência para a API
- `src/index.css` — variáveis e reset global
- `public/sw.js` — service worker PWA

## Recursos

✅ Cadastro com consentimento explícito (LGPD)
✅ Diretório de mentores e profissionais (via API)
✅ Criação de elos (conexões)
✅ Postagem de vagas (empresas)
✅ Tracker de status de elos
✅ Estatísticas em tempo real
✅ Política de Privacidade completa dentro do app
✅ Editar perfil, exportar meus dados e excluir perfil (LGPD)
✅ PWA (offline fallback, manifest)
✅ Responsivo mobile-first
✅ Paleta visual TISL + EmpregoSocial

O cadastro ainda não tem login recuperável nem validação de empresa. Uso restrito até concluir os critérios do [plano de uso](../docs/PLANO-USO.md). A PWA armazena apenas o shell estático; dados autenticados exigem conexão.
