# Adote um Desempregado — App Web

React + Vite PWA para a corrente voluntária de recolocação profissional. Consome a API em `../backend` — não funciona mais isolado com apenas `localStorage`.

## Instalação

```bash
npm install
cp .env.example .env
```

Edite `.env` se o backend não estiver em `http://localhost:3001` (padrão).

## Desenvolvimento

Com o backend já rodando (veja `../backend/README.md`):

```bash
npm run dev
```

Abre em `http://localhost:5173` (padrão do Vite).

## Build

```bash
npm run build
```

Saída em `dist/`. Antes de publicar em produção, configure `VITE_API_URL` apontando para a URL pública da API.

## Estrutura

- `src/api.js` — cliente HTTP que fala com o backend, guarda o token de sessão
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
