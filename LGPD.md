# Privacidade — comportamento e pendências

Revisão do código local em 10/10/2026. Este inventário não certifica conformidade jurídica nem descreve uma inspeção de produção.

## Dados e acesso

A API Express armazena nome, papel, bio, cidade, LinkedIn, hash de token, datas de cadastro, consentimento e expiração em PostgreSQL. Também mantém elos, vagas e histórico de consentimento. O frontend usa a API; a sessão fica em cookie HttpOnly; em produção também Secure e SameSite=Strict. Tokens antigos no armazenamento do navegador são descartados.

O diretório autenticado retorna ID, nome, papel e data de cadastro, com limite de 30 registros por padrão e máximo de 100 por consulta. Bio e LinkedIn só são retornados ao próprio titular; cidade não é exposta no diretório. Os nomes seguem visíveis a contas autenticadas. Ainda falta visibilidade configurável por titular e compartilhamento autorizado.

Cadastro e consentimento são gravados juntos em transação. O titular pode corrigir o perfil, exportar os próprios registros e excluir a conta. Exclusão anonimiza o perfil, revoga a sessão, remove vagas e elos associados e registra exclusão e revogação em transação. O outro participante deixa de ver o elo removido. O histórico de consentimento e identificadores pseudônimos permanecem no banco.

## Pendências de governança e operação

- Definir controlador, canal de atendimento, finalidades, fundamentos de tratamento e responsáveis.
- Aprovar prazos de retenção do histórico e política de expurgo de backups. A exclusão atual não remove cópias de backup.
- Revisar a política exibida no frontend antes da publicação; não presumir que o texto atual acompanha este inventário.
- Implantar identidade recuperável, verificação de e-mail e MFA para acessos privilegiados. A sessão provisória expira em sete dias e ainda não há recuperação de acesso.
- Implementar aceite de convites, organizações verificadas, autorização por campo e moderação.
- Validar proteção do banco, backups, restauração, incidentes e acesso operacional no ambiente escolhido.

Os testes locais verificam controles técnicos específicos. Não substituem revisão da governança nem testes do ambiente implantado.

A infraestrutura Azure proposta usa banco privado e identidade gerenciada. Backup retido por sete dias no template requer revisão com responsáveis; exclusão de perfil não elimina automaticamente backups. Homologação fica restrita ao IP do operador. Não houve certificação ou revisão jurídica.
