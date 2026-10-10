# Registro de implantação Azure

## Solicitação de 10/10/2026

O responsável autorizou provisionamento, commit/push, PR e documentação de uso. A implantação utiliza `rg-adote1`, região definitiva `centralus`, prefixo `adote1p`, ACR existente `adote1`, Bicep e imagens PostgreSQL por digest registrados em [ACR.md](../../ACR.md).

## Estado

Provisionamento em andamento. A tentativa East US 2 foi cancelada após o PostgreSQL retornar restrição regional. O ambiente vazio adote1-env está em exclusão para liberar a quota de um ambiente por assinatura. Identidades, permissões AcrPull, vault vazio e workspace provisórios já foram removidos. A rede provisória será removida após a exclusão do ambiente. O ACR foi reduzido para Basic e preserva as imagens. Este arquivo será atualizado com o resultado observado, migração, endereço e verificações. O ingresso permanece restrito até concluir a autenticação recuperável e os critérios de liberação pública. Não há migração automática dos dados SQLite.

## Evidências prévias

Bicep compilado, validação Azure sem erro e what-if Succeeded. O administrador Entra depende do OID da nova identidade e não pôde ser analisado antecipadamente pelo what-if. Testes PostgreSQL e smoke test local aprovados na preparação. Guias em [docs/PLANO-USO.md](../../docs/PLANO-USO.md).
