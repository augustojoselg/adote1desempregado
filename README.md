# Adote um Desempregado — Emprego Social

**Um movimento TISL + EmpregoSocial**

Uma rede de apoio à recolocação profissional. Mentores e profissionais formam conexões de apoio, chamadas **elos**, e empresas compartilham oportunidades de trabalho.

## Como funciona

| Papel | Participação |
| --- | --- |
| Mentor | Apoia profissionais com orientação, revisão de currículo, preparação para entrevistas e indicações |
| Profissional | Busca apoio de um mentor e acompanha sua jornada de recolocação |
| Empresa | Publica vagas com links externos de candidatura, mediante autorização da operação |

Cada elo avança uma etapa por vez: **Combinado → Em contato → Entrevistas → Recolocado**. A plataforma oferece diretório de participantes, acompanhamento de elos, vagas, edição de perfil, exportação e exclusão dos próprios dados. Administradores autorizados podem suspender e reativar contas e revogar sessões, com registro de auditoria.

A criação do elo é imediata; convite com aceite, chat e acompanhamento de candidaturas ainda não estão implementados. A candidatura acontece no site externo indicado pela empresa. Consulte o [guia dos usuários](docs/GUIA-USUARIOS.md) para conhecer os fluxos e limites atuais.

## Estado da entrega

A aplicação usa **React, Express e PostgreSQL 17**, com imagens Docker separadas para frontend e API. O ambiente local funciona com Docker Compose.

A aplicação está implantada no Azure em **[acessar o sistema](https://adote1p-web.bluewave-facfb082.centralus.azurecontainerapps.io)**. Os testes técnicos de saúde, banco e proteção de acesso passaram. O login interativo e os ensaios de restauração e carga ainda precisam de validação; consulte o [registro da implantação](infra/azure/IMPLANTACAO.md) antes de ampliar o público.

O acesso de produção usa **Microsoft Entra ID**, com contas autorizadas pela operação, incluindo convidados externos. As permissões de empresa e administrador são atribuídas no Entra. O cadastro simplificado disponível no ambiente local é destinado ao desenvolvimento.

## Executar localmente

Pré-requisito: Docker com Docker Compose v2. Execute na raiz do repositório:

```sh
docker compose up -d --build --wait
```

Acesse **http://localhost:8080**. As páginas institucionais ficam em `/site.html` e `/divulgacao.html`. O Nginx encaminha `/api` para a API; somente a porta web é publicada. As migrações executam antes da inicialização da API, e o PostgreSQL persiste os dados em volume Docker.

```sh
docker compose logs --tail=100
docker compose down
```

`down` preserva os dados; **`down -v` apaga os volumes e seus dados**. O Compose é exclusivo de desenvolvimento: usa HTTP e PostgreSQL sem senha dentro da rede local dos containers. Para configuração, imagens e persistência, consulte [DOCKER.md](DOCKER.md).

## Validar alterações

Execute os testes de integração com PostgreSQL:

```sh
docker compose --profile test run --build --rm test
```

Com a aplicação local iniciada, valide cadastro, persistência após recriação dos containers e exclusão da conta temporária:

```sh
node scripts/docker-smoke.mjs
```

Para compilar o frontend fora do Docker, use Node.js 24 e npm:

```sh
cd app
npm ci
npm run build
```

Os testes cobrem autorização, privacidade, sessões, identidade e transações. As instruções específicas ficam em [app/README.md](app/README.md) e [backend/README.md](backend/README.md). Testes locais não substituem a validação de autenticação e recuperação no Azure.

## Estrutura do repositório

| Caminho | Conteúdo |
| --- | --- |
| `app/` | Frontend React/Vite; entrada em `src/main.jsx` e imagem Nginx |
| `backend/` | API Express; entrada em `src/start.js`, migrações SQL e testes de integração |
| `deploy/nginx/` | Configuração do servidor web e proxy da API |
| `compose.yaml` | Serviços e persistência para desenvolvimento local |
| `infra/azure/` | Infraestrutura Bicep, parâmetros de exemplo, custos e registro da implantação |
| `scripts/` | Automação de implantação, identidade, migração e verificações |
| `docs/` | Guias de usuários, administração e plano de uso |
| `site.html`, `divulgacao.html` | Páginas institucionais e de divulgação |

## Azure e segurança

A arquitetura prevê Container Apps, PostgreSQL em rede privada, identidades gerenciadas e Key Vault. A API acessa o banco por identidade Entra, sem senha de banco. Os segredos OIDC ficam no Key Vault e são referenciados em runtime; nunca devem entrar nas imagens, no frontend ou no Git.

As imagens são publicadas no ACR e implantadas por digest. As imagens legadas v1 com SQLite não são compatíveis com essa infraestrutura; a migração de dados legados é explícita e não acontece automaticamente.

- [Infraestrutura Azure](infra/azure/README.md): arquitetura, custos estimados, permissões e etapas de implantação.
- [Publicação no ACR](ACR.md): construção, publicação e referências das imagens.
- [Registro da implantação](infra/azure/IMPLANTACAO.md): estado observado e verificações.

Não versione `.env`, credenciais, cookies, tokens, exportações de usuários ou cópias de bancos. Use os arquivos de exemplo como referência e mantenha valores sensíveis fora do controle de versão.

## Uso, administração e privacidade

- [Guia dos usuários](docs/GUIA-USUARIOS.md): acesso, perfis, elos, vagas e gestão dos próprios dados.
- [Guia dos administradores](docs/GUIA-ADMINISTRADORES.md): permissões, contas, operação, segredos e recuperação.
- [Plano de uso](docs/PLANO-USO.md): capacitação, piloto e critérios de abertura pública.
- [LGPD](LGPD.md): controles e pendências de privacidade; a política apresentada ao usuário está em [Privacy.jsx](app/src/pages/Privacy.jsx).
- [Plano de evolução](PLANO-EVOLUCAO.md): escopo e histórico das entregas.
- [Orientações para contribuição](AGENTS.md): organização, convenções e validação.

O sistema trata dados pessoais para operar a rede de apoio. A existência de controles técnicos não representa certificação de conformidade com a LGPD. Consulte as pendências documentadas antes de ampliar o uso com dados reais.

## Contato

contato@empregosocial.com.br
