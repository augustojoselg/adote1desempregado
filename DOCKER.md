# Docker — PostgreSQL e frontend

Execute os comandos na raiz do repositório.

```sh
docker compose up -d --build --wait
```

Frontend em `http://localhost:8080`; páginas institucionais em `/site.html` e `/divulgacao.html`. O Nginx encaminha `/api` para a API. Apenas a porta web é publicada. PostgreSQL usa volume persistente; a migração executa antes da API.

**O Compose é exclusivo para desenvolvimento local:** o PostgreSQL aceita conexões sem senha dentro dessa rede isolada e a API usa NODE_ENV=development para permitir HTTP local. O deploy Azure usa Entra, TLS e NODE_ENV=production conforme `infra/azure/main.bicep`.

```sh
docker compose --profile test run --build --rm test
node scripts/docker-smoke.mjs
docker compose logs --tail=100
docker compose down
```

O teste funcional cria uma conta temporária, recria os containers e verifica persistência. `down` preserva volumes; `down -v` apaga os dados. O volume legado de SQLite não é removido nem importado automaticamente.

## Imagens

`backend/Dockerfile` gera a API e um target test. `app/Dockerfile` compila React e gera Nginx sem root. As imagens de runtime não contêm ferramentas de compilação, credenciais, banco ou arquivos .env. Frontend usa `/api` e recebe API_UPSTREAM em runtime.

```sh
docker buildx build --platform linux/amd64 -f backend/Dockerfile -t SEU_REGISTRY/emprego-social/api:NOVA_TAG --push .
docker buildx build --platform linux/amd64 -f app/Dockerfile -t SEU_REGISTRY/emprego-social/web:NOVA_TAG --push .
```

Para ARM64 e AMD64 na mesma tag, use `--platform linux/amd64,linux/arm64` com builder compatível. Use nova tag e registre o digest; o deploy Azure exige referências por digest. As imagens v1 publicadas anteriormente ainda usam SQLite e não servem para a nova infraestrutura.

## Runtime em nuvem

| Container | Configuração |
| --- | --- |
| web | PORT=8080; API_UPSTREAM com origem interna HTTPS da API |
| api | PORT=3001; PG_AUTH=entra; AZURE_CLIENT_ID, PGHOST, PGDATABASE, PGUSER; FRONTEND_ORIGIN HTTPS |
| api | TRUST_PROXY_HOPS correspondente à cadeia de proxies confiáveis; PGPOOL_MAX=5 |

Cookie Secure é obrigatório no deploy proposto. O cliente não precisa nem recebe senha de banco. Key Vault é usado por referência quando houver segredos externos. A API precisa de /tmp gravável; não precisa de volume de banco. Saúde: `/healthz` no frontend, `/api/health` e `/api/ready` na API.

O Compose usa filesystem somente leitura e remove capabilities das imagens da aplicação. No Azure, os controles suportados pelo Container Apps e as identidades são definidos no Bicep; não presumir que todas as opções Compose são transferidas ao serviço.

Instruções de ACR em [ACR.md](ACR.md) e infraestrutura, custos e segurança em [infra/azure/README.md](infra/azure/README.md).
