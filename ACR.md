# Publicar as imagens no Azure Container Registry

O projeto gera duas imagens: `emprego-social/api` e `emprego-social/web`. Este guia publica ambas no ACR. Para executar a aplicação depois, será necessário um serviço de hospedagem e armazenamento persistente; o registry armazena as imagens.

## Release de produção com identidade Entra

Em 10/10/2026, publicadas as imagens AMD64 `v2-pg-20261010-04`, com login Entra OIDC/PKCE, administração auditada, política de privacidade 1.2.0 e dependências corrigidas:

| Imagem | Digest imutável |
| --- | --- |
| `emprego-social/api` | `sha256:749224d488f4f7f93aa50b92b2745f6108bce4214bb73d6340a761fa1393806c` |
| `emprego-social/web` | `sha256:6baf796a7a6ba782b3914b4564def86c9d61d92b1ed5ac5f9e2e600547e71c69` |

O ACR foi reduzido de Standard para Basic após conferir aproximadamente 127 MB de uso; o usuário administrador permanece desabilitado. O deploy usa digests, nunca tags mutáveis. Veja [registro de implantação](infra/azure/IMPLANTACAO.md).

## Primeira versão PostgreSQL publicada

As duas imagens Linux AMD64 foram publicadas com a tag `v2-pg-20261010-01` em 10/10/2026:

| Imagem | Digest imutável |
| --- | --- |
| `emprego-social/api` | `sha256:b7beaee2127811a99fb066bd58a7f2da84ecb9cc13351fba89794a53726a4e1b` |
| `emprego-social/web` | `sha256:294b1d4a15807ad3f72ad0cd2963c2593b538f8126b63ed272b4834464609e61` |

As imagens `v1-20261010-01` registradas abaixo são históricas, usam SQLite e não são compatíveis com a infraestrutura PostgreSQL. A primeira versão PostgreSQL também foi substituída pela release corrigida acima. Consulte [infra/azure/README.md](infra/azure/README.md) para Container Apps, banco privado, identidades gerenciadas e Key Vault. A publicação das imagens não provisiona a aplicação nem o banco.


## ACR deste projeto — configuração conferida

Em 10/10/2026, a sessão local confirmou:

| Campo | Valor |
| --- | --- |
| Assinatura | `e7ab0c25-090c-4159-b2c2-9d401e356796` |
| Grupo de recursos | `rg-adote1` |
| Registry | `adote1` |
| Login server | `adote1-emajexd8e5cvf4b9.azurecr.io` |
| Região informada | `eastus` |
| Modo de permissões | `LegacyRegistryPermissions` (RBAC clássico) |
| Acesso público | Habilitado |

O login Docker via `az acr login` foi aprovado. Não recrie o ACR nem habilite o usuário administrador. Para usar este registry nos comandos genéricos abaixo:

```sh
AZURE_SUBSCRIPTION_ID="e7ab0c25-090c-4159-b2c2-9d401e356796"
RESOURCE_GROUP="rg-adote1"
ACR_NAME="adote1"
ACR_LOGIN_SERVER="adote1-emajexd8e5cvf4b9.azurecr.io"
IMAGE_TAG="v2-pg-20261010-01"
```

Pule a criação do grupo e do registry. Nas próximas releases, altere a tag.

## O que você precisa

- Assinatura Azure ativa e ID da assinatura.
- Azure CLI atualizada, Docker em execução e plugin Docker Buildx.
- Grupo de recursos e região Azure escolhidos.
- Um ACR existente ou permissão para criar um. Para o exemplo, use nome globalmente disponível com 5–50 caracteres alfanuméricos minúsculos, sem hífen.
- Permissão para enviar imagens: `AcrPush` no modo RBAC usado abaixo. Quem atribui permissões precisa de autorização para gerenciar RBAC.
- Conectividade com o registry. Se houver firewall ou private endpoint, a máquina que publica precisa alcançar os endpoints autorizados.

O exemplo cria recursos faturáveis com SKU Basic; ajuste região, SKU e nomes às regras da sua assinatura. Não há necessidade de ativar o usuário administrador do ACR.

Referências: [criação pela CLI](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-azure-cli), [permissões do ACR](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-built-in-roles-overview).

## 1. Entrar na assinatura

Execute em Bash ou Zsh, na raiz deste repositório, onde estão `compose.yaml`, `app/` e `backend/`. Os valores abaixo são exemplos; substitua antes de executar. Mantenha a mesma sessão do terminal para reutilizar as variáveis.

```sh
az version
docker version
docker buildx version

AZURE_SUBSCRIPTION_ID="SUBSTITUA-PELO-ID-DA-ASSINATURA"
RESOURCE_GROUP="rg-emprego-social"
AZURE_LOCATION="brazilsouth"
ACR_NAME="SUBSTITUA_POR_NOME_VALIDO"
IMAGE_TAG="v2-pg-20261010-01"

az login
az account set --subscription "$AZURE_SUBSCRIPTION_ID"
az account show --query '{subscription:name,id:id}' --output table
```

Use uma tag nova para cada release; evite sobrescrever uma tag já implantada.

## 2. Criar ou selecionar o ACR

Se já existe, defina `ACR_NAME` e `RESOURCE_GROUP` com os valores reais e pule os dois comandos de criação.

```sh
az group create --name "$RESOURCE_GROUP" --location "$AZURE_LOCATION"
az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" \
  --sku Basic --admin-enabled false --role-assignment-mode rbac
```

Consulte o endereço real de login. Não monte o domínio manualmente, pois ele pode incluir um sufixo gerado pelo Azure.

```sh
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer --output tsv)
ACR_RESOURCE_ID=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query id --output tsv)
az acr show --name "$ACR_NAME" --query '{loginServer:loginServer,permissions:roleAssignmentMode}' --output table
```

Os parâmetros de criação estão na [referência de `az acr`](https://learn.microsoft.com/en-us/cli/azure/acr?view=azure-cli-latest).

## 3. Autorizar publicação e autenticar

Se sua conta já possui acesso efetivo de push, basta autenticar. Caso contrário, um administrador com permissão para atribuir papéis pode executar o bloco a seguir para o usuário conectado:

```sh
PUBLISHER_OBJECT_ID=$(az ad signed-in-user show --query id --output tsv)
az role assignment create --assignee-object-id "$PUBLISHER_OBJECT_ID" \
  --assignee-principal-type User --role AcrPush --scope "$ACR_RESOURCE_ID"
```

Em um ACR existente com modo **RBAC + ABAC**, o papel de publicação é `Container Registry Repository Writer`, e o de download é `Container Registry Repository Reader`. Não aplique automaticamente `AcrPush` nesse modo. Listar todo o catálogo exige também `Container Registry Repository Catalog Lister`; condições ABAC podem restringir repositórios. [Papéis por modo de autorização](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-built-in-roles-overview).

Depois que as permissões estiverem efetivas:

```sh
az acr login --name "$ACR_NAME"
```

Use o nome do recurso nesse comando, sem `.azurecr.io`. O fluxo usa sua identidade Microsoft Entra e o Docker local. [Autenticação e push](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-docker-cli?tabs=azure-cli).

## 4. Construir para Linux AMD64 e publicar

As imagens locais criadas em um Mac ARM64 não devem ser enviadas como se fossem AMD64. Os comandos abaixo constroem explicitamente para Linux AMD64, independentemente da arquitetura local, e publicam diretamente no ACR. O builder precisa suportar essa plataforma.

```sh
docker buildx inspect --bootstrap

docker buildx build --platform linux/amd64 \
  -f backend/Dockerfile \
  -t "$ACR_LOGIN_SERVER/emprego-social/api:$IMAGE_TAG" --push .

docker buildx build --platform linux/amd64 \
  -f app/Dockerfile \
  -t "$ACR_LOGIN_SERVER/emprego-social/web:$IMAGE_TAG" --push .
```

Para publicar uma tag com suporte às duas arquiteturas, troque `--platform linux/amd64` por `--platform linux/amd64,linux/arm64` em ambos os comandos. Confira o suporte do builder antes. [Builds multiplataforma do Docker](https://docs.docker.com/build/building/multi-platform/).

O contexto de build deve ser a raiz (`.`). O `.dockerignore` exclui banco local, dependências e arquivos `.env`. O frontend usa `/api`; o endereço de destino é definido em `API_UPSTREAM` ao executar o container.

## 5. Confirmar as imagens publicadas

```sh
az acr repository show-tags --name "$ACR_NAME" --repository emprego-social/api --output table
az acr repository show-tags --name "$ACR_NAME" --repository emprego-social/web --output table

docker buildx imagetools inspect "$ACR_LOGIN_SERVER/emprego-social/api:$IMAGE_TAG"
docker buildx imagetools inspect "$ACR_LOGIN_SERVER/emprego-social/web:$IMAGE_TAG"
```

Confira a tag, as plataformas e registre os digests para o deploy. Resultado esperado:

```text
<login-server-real>/emprego-social/api:v1-20261010-01
<login-server-real>/emprego-social/web:v1-20261010-01
```

## 6. O que falta para rodar no Azure

Escolher o serviço que executará os containers, configurar a identidade de download das imagens e definir rede, domínio e HTTPS. Para baixar imagens, use identidade gerenciada com `AcrPull` no ACR em modo RBAC, ou o papel Reader correspondente no modo ABAC. Não coloque senha de registry no repositório.

| Container | Configuração deste projeto |
| --- | --- |
| web | Porta 8080; `API_UPSTREAM` com a origem interna da API; `/healthz` para saúde |
| api | Porta 3001; `FRONTEND_ORIGIN` com a origem HTTPS pública; `/api/health` para saúde |
| api | `DB_PATH=/data/adote.db`; diretório `/data` persistente e gravável pelo UID/GID 1000 |
| ambos | `/tmp` gravável; API restrita ao proxy; configurar `TRUST_PROXY_HOPS` conforme a rede real |

Com SQLite, mantenha **uma réplica da API** e armazenamento com semântica de disco local adequado ao banco. O volume nomeado do Compose não é provisionado automaticamente em serviços Azure. Serviços com disco efêmero ou armazenamento de rede inadequado exigem migrar para PostgreSQL antes do deploy. Consulte [DOCKER.md](DOCKER.md) para persistência, proxy e execução em VM.

## Problemas comuns

- `unauthorized` ou `denied`: confira assinatura, modo RBAC/ABAC, papel e repositório; autentique novamente após a propagação das permissões.
- Nome indisponível: escolha outro `ACR_NAME` válido e globalmente disponível.
- Falha de conexão: confira Docker em execução, DNS, firewall e acesso ao endpoint do registry.
- `exec format error`: confirme a plataforma da imagem e da máquina de destino.
- Dockerfile não encontra arquivos: execute o build na raiz do projeto.

## Status deste guia

Comandos revisados com a documentação oficial em 10/10/2026 e caminhos conferidos no repositório. Na execução posterior deste guia, a sessão Azure existente foi utilizada e as duas imagens Linux AMD64 foram publicadas no ACR adote1. Nenhum recurso de hospedagem foi criado.

## Publicação realizada — 10/10/2026

Registry: `adote1-emajexd8e5cvf4b9.azurecr.io`. Tag: `v1-20261010-01`. Plataforma: `linux/amd64`.

| Repositório | Digest publicado |
| --- | --- |
| emprego-social/api | `sha256:c48038c2700a95b45af1eed75e91d56e2f5cec35e740e3d7248d83612faf6904` |
| emprego-social/web | `sha256:072bd0981be9ecdb960d32fc4ccadf0a04333b86f935c748093e09ed8238e4f5` |

Ambos os pushes concluíram com sucesso. A publicação utilizou o código local com as alterações Docker ainda não commitadas; não representa uma release vinculada exclusivamente ao último commit Git. Para a próxima release, faça commit das alterações e use uma nova tag.

Próxima etapa: escolher a hospedagem e configurar a identidade de pull, rede, HTTPS e persistência do banco. Publicar no ACR não inicia a aplicação.
