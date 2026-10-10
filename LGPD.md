# Privacidade — comportamento e pendências

Revisão do código local em 10/10/2026. Este inventário não certifica conformidade jurídica nem descreve uma inspeção de produção.

## Dados e acesso

A API Express armazena nome, papel, bio, cidade, LinkedIn, hash de token, datas de cadastro, consentimento e expiração em PostgreSQL. Também mantém elos, vagas, histórico de consentimento, identificador de identidade Entra (tenant e object ID), permissões e eventos de administração de contas. Não armazena senhas Microsoft nem tokens do provedor. O frontend usa a API; a sessão fica em cookie HttpOnly; em produção também Secure e SameSite=Strict. Tokens antigos no armazenamento do navegador são descartados.

O diretório autenticado retorna ID, nome, papel e data de cadastro, com limite de 30 registros por padrão e máximo de 100 por consulta. Bio e LinkedIn só são retornados ao próprio titular; cidade não é exposta no diretório. Os nomes seguem visíveis a contas autenticadas. Ainda falta visibilidade configurável por titular e compartilhamento autorizado.

Cadastro e consentimento são gravados juntos em transação. O titular pode corrigir o perfil, exportar os próprios registros e excluir a conta. Exclusão anonimiza o perfil, revoga a sessão, remove vagas e elos associados e registra exclusão e revogação em transação. O outro participante deixa de ver o elo removido. O histórico de consentimento e identificadores pseudônimos permanecem no banco.

## Pendências de governança e operação

- Definir controlador, canal de atendimento, finalidades, fundamentos de tratamento e responsáveis.
- Aprovar prazos de retenção do histórico e política de expurgo de backups. A exclusão atual não remove cópias de backup.
- Revisar a política exibida no frontend antes da publicação; não presumir que o texto atual acompanha este inventário.
- Revisar e aplicar políticas MFA para acessos privilegiados no tenant Entra, conforme licenças e governança. O login de produção usa identidade Entra recuperável pelo provedor e sessões de 24 horas; a atribuição de acesso é obrigatória.
- Implementar aceite de convites, organizações verificadas, autorização por campo e moderação.
- Validar proteção do banco, backups, restauração, incidentes e acesso operacional no ambiente escolhido.

Os testes locais verificam controles técnicos específicos. Não substituem revisão da governança nem testes do ambiente implantado.

A infraestrutura Azure usa banco privado e identidade gerenciada. Backup retido por sete dias no template requer revisão com responsáveis; exclusão de perfil não elimina automaticamente backups. Homologação começa restrita ao IP do operador; a publicação do login não libera dados sem autenticação. Não houve certificação ou revisão jurídica.

## Provedores e conteúdo externo

Microsoft Entra autentica as contas autorizadas; Azure hospeda aplicação, banco, logs e Key Vault. A região selecionada é Central US e o ACR existente fica em East US. Avaliar transferências internacionais e contratos com os responsáveis. O frontend carrega fontes Google Fonts, com requisições do navegador a esse provedor; revisar essa dependência no inventário. Links de candidatura direcionam para sites externos.
