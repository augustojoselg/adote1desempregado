# Registro de implantação Azure

## Implantação de 10/10/2026

O responsável autorizou provisionamento, commit/push, PR e documentação de uso. Recursos definitivos em `rg-adote1`, região `centralus`, prefixo `adote1p`; ACR existente `adote1` em East US.

## Endereço e acesso

**https://adote1p-web.bluewave-facfb082.centralus.azurecontainerapps.io**

API e frontend provisionados e em execução. O frontend possui HTTPS público; o uso exige login Microsoft Entra e atribuição explícita Member, Company ou Admin. O operador recebeu Admin. No primeiro login, é necessário concluir o perfil e consentimento. Contas externas precisam ser convidadas no tenant e autorizadas pela operação.

O retorno OIDC é `/api/auth/callback` na origem acima. Fluxo authorization code com PKCE, state e nonce; implicit grant desabilitado. Secrets OIDC referenciados no Key Vault `kv-adote1p-uoyqfbfnmfp6u`, sem valores no código ou nas imagens.

## Recursos e versões

- Ambiente `adote1p-env`: Succeeded; API `adote1p-api` interna e web `adote1p-web` pública.
- PostgreSQL `pg-adote1p-uoyqfbfnmfp6u`: Ready, versão 17, acesso público desabilitado, Entra habilitado e senha desabilitada. Backup de sete dias; sem alta disponibilidade.
- Job `adote1p-migrate-099he7o`: Succeeded em 10/10/2026 às 22:43:47 UTC; esquema e permissões de runtime aplicados.
- API: `v2-pg-20261010-04`, digest `sha256:749224d488f4f7f93aa50b92b2745f6108bce4214bb73d6340a761fa1393806c`.
- Web: `v2-pg-20261010-05`, digest `sha256:c9d3b34cae8e953bda30f3e166b5e0dc31300c1ea961a7dbf1084f80c7a0c5e6`.
- ACR reduzido para Basic; usuário administrador desabilitado. Recursos provisórios `adote1-*` removidos; nenhuma importação SQLite realizada.

## Verificações concluídas

Bicep compilado, validação Azure aprovada e what-if revisado. Quatro testes de integração PostgreSQL aprovados: autorização/privacidade, OIDC, sessão de produção e migração/transações. Build frontend aprovado; CI da PR #6 aprovado antes do ajuste final do proxy.

Smoke HTTPS no Azure aprovado: health e readiness 200, diretório e administração sem sessão 401, cadastro sem identidade 401, origem indevida 403, início de login 303 com PKCE, state, nonce e cookies HttpOnly/Secure/SameSite=Lax. O proxy teve a profundidade de validação TLS ajustada para a cadeia completa do certificado Azure; a validação continua habilitada. A API interna retornou 404 quando acessada diretamente pela internet.

## Validações ainda pendentes

O responsável confirmou acesso pelo login Microsoft em 10/10/2026. Conclusão do cadastro e jornada administrativa ainda não foram confirmadas. Validar MFA conforme políticas/licenças do tenant, restauração de backup e carga antes de ampliar o público. O limitador atual depende da cadeia de proxies; revisar identificação do IP original e comportamento sob carga antes de escalar o uso.

Os containers podem reduzir a zero, causando espera no primeiro acesso. O custo fixo estimado é US$ 23,18/mês antes de consumo, rede, logs, operações, impostos e excedentes; não representa limite de cobrança. Não foram configurados domínio próprio, alertas orçamentários ou alta disponibilidade.

Guias: [usuários](../../docs/GUIA-USUARIOS.md), [administradores](../../docs/GUIA-ADMINISTRADORES.md) e [plano de uso](../../docs/PLANO-USO.md). PR: [#6](https://github.com/augustojoselg/adote1desempregado/pull/6).

## Retomada

Checklist de continuidade e ponto de parada em [próximos passos](../../docs/PROXIMOS-PASSOS.md).
