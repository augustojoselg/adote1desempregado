# Registro de implantação Azure

## Solicitação de 10/10/2026

O responsável autorizou provisionamento, commit/push, PR e documentação de uso. A implantação utiliza `rg-adote1`, região definitiva `centralus`, prefixo `adote1p`, ACR existente `adote1`, Bicep e imagens PostgreSQL por digest registrados em [ACR.md](../../ACR.md).

## Estado

Ambiente `adote1p-env` provisionado com sucesso em Central US. PostgreSQL 17 privado, autenticação Entra e Key Vault provisionados. Os recursos provisórios `adote1-*` foram removidos; o ACR existente foi preservado e reduzido para Basic.

Job `adote1p-migrate-099he7o` finalizado com status Succeeded em 10/10/2026 às 22:43:47 UTC: esquema e permissões de runtime aplicados. A API e o frontend estão em implantação, inicialmente com ingresso restrito ao operador.

Origem prevista: `https://adote1p-web.bluewave-facfb082.centralus.azurecontainerapps.io`. O retorno OIDC foi configurado nessa origem com `/api/auth/callback`. A atribuição de acesso no Entra é obrigatória; o operador tem permissão Admin. Secrets OIDC estão no Key Vault, sem valores no código.

Não houve importação de dados SQLite. Login interativo, restauração e testes de carga ainda devem ser verificados. Este registro será atualizado após as verificações HTTP.

## Evidências prévias

Bicep compilado, validação Azure sem erro e what-if Succeeded. O administrador Entra depende do OID da nova identidade e não pôde ser analisado antecipadamente pelo what-if. Testes PostgreSQL e smoke test local aprovados na preparação. Guias em [docs/PLANO-USO.md](../../docs/PLANO-USO.md).
