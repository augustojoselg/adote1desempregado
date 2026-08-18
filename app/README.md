# Adote um Desempregado — App Web

React + Vite PWA para a corrente voluntária de recolocação profissional.

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:3000`.

## Build

```bash
npm run build
```

Saída em `dist/`.

## Estrutura

- `src/components/` — componentes reutilizáveis (Header, Stats, Directory, JobBoard, EloTracker)
- `src/pages/` — telas (Entry, Dashboard)
- `src/store.js` — estado global com Zustand (localStorage)
- `src/index.css` — variáveis e reset global
- `public/sw.js` — service worker PWA

## Recursos

✅ Entrada simples (nome + role)  
✅ Diretório de mentores e profissionais  
✅ Criação de elos (conexões)  
✅ Postagem de vagas (empresas)  
✅ Tracker de status de elos  
✅ Estatísticas em tempo real  
✅ PWA (offline fallback, manifest)  
✅ Responsivo mobile-first  
✅ Paleta visual TISL + EmpregoSocial
