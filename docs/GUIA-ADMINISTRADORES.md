# Guia de operação — administradores

## Responsabilidades e acesso

A área Administração aparece somente para contas com papel Admin atribuído no Entra e atualizado no login. Permite listar participantes com paginação, revogar sessão, suspender e restabelecer acesso. Cada ação registra ator, alvo, tipo e horário em tabela sem permissão de alteração/exclusão pelo runtime. Mentor, Profissional e Empresa são papéis de negócio; ser Owner no Azure não concede automaticamente Admin no app.

A operação deve designar responsáveis por infraestrutura, segurança, atendimento e privacidade. Use contas nominativas com MFA; mantenha a identidade de migração separada da API. Conceda leitura de monitoramento aos operadores e eleve permissões de implantação somente quando necessário. Evite Owner/Contributor para atividades cotidianas. Não compartilhe a sessão do administrador.

## Recursos e configuração

O grupo `rg-adote1` reúne Container Apps, PostgreSQL privado, Key Vault, identidades e rede. O ACR existente `adote1` fornece imagens por digest. Consulte [infraestrutura](../infra/azure/README.md), [registro da implantação](../infra/azure/IMPLANTACAO.md) e [ACR](../ACR.md) para a situação real, região, versões e endereço.

`infra/azure/parameters.local.json` é configuração local ignorada pelo Git. Não coloque senhas nele. Mudanças de rede, identidade, referência de imagem ou escala devem ser feitas em Bicep e revisadas em PR. O job `adote1p-migrate` possui privilégios de migração; a API recebe apenas permissões de dados. Nunca coloque a identidade do job no runtime da API.

Durante a validação, o frontend fica limitado ao IP autorizado. Depois da liberação, a página HTTPS de login pode ser pública, mas os dados requerem sessão Entra. A API tem ingresso interno e o banco não tem endpoint público habilitado. Para alterar o IP do operador, atualize o parâmetro e execute validate, plan e apply. Não remova o firewall para diagnosticar conectividade.

## Rotina operacional

| Frequência | Atividade |
| --- | --- |
| A cada release | Testes, revisão de dependências, validação Bicep, what-if, migração e verificação funcional |
| Diariamente durante uso | Conferir health/readiness, revisões, falhas de jobs, consumo e reclamações de acesso |
| Semanalmente | Revisar acessos, vagas e relatos; conferir backups e capacidade do PostgreSQL |
| Mensalmente | Revisar custo, expiração de credenciais externas, acessos privilegiados e plano de recuperação |
| Antes de abrir ao público e após mudanças no banco | Ensaio de restauração, reconciliação de exclusões, testes de autorização e capacidade |

Comandos de consulta que não mostram valores de segredos:

```sh
az containerapp list --resource-group rg-adote1 --query '[].{name:name,state:properties.provisioningState,fqdn:properties.configuration.ingress.fqdn}' -o table
az containerapp revision list --resource-group rg-adote1 --name adote1p-api -o table
az containerapp job execution list --resource-group rg-adote1 --name adote1p-migrate -o table
az postgres flexible-server show --resource-group rg-adote1 --name pg-adote1p-uoyqfbfnmfp6u --query '{state:state,network:network,backup:backup}' -o json
```

Use Azure Monitor para falhas e latência. Logs podem conter IP e identificadores técnicos: restrinja acesso e retenção. Não habilite dumps de ambiente, tokens, corpos de requisições ou logging SQL com parâmetros. A quota diária de logs pode suspender ingestão e não é um teto financeiro.

## Releases e rollback

1. Trabalhe na feature e abra PR para a branch principal. Registre testes e limitações.
2. Publique imagens AMD64 com tag inédita e registre os digests.
3. Atualize parâmetros locais com os digests aprovados; execute validate e plan.
4. Aplique a infraestrutura. Execute o job de migração e aguarde Succeeded antes de liberar os apps.
5. Valide HTTPS, cookies, origem, readiness, autorização, exclusão e indisponibilidade pública da API/banco.
6. Registre commit, digests e resultado em IMPLANTACAO.md. O estado observado deve prevalecer sobre instruções planejadas.

Rollback de código: volte os parâmetros aos digests PostgreSQL da release anterior e faça validate/plan/apply. Nunca use imagens SQLite v1. Migrações devem manter compatibilidade com a versão anterior; rollback de imagem não desfaz SQL. Se houver migração incompatível ou corrupção de dados, interrompa escritas e siga recuperação de banco, com avaliação de perda de dados.

## Backup, restauração e exclusões

PostgreSQL usa backup gerenciado de sete dias sem redundância geográfica e sem HA nesta configuração econômica. RPO/RTO ainda precisam ser medidos e aprovados; não prometa recuperação imediata. O backup não cobre configurações fora do repositório nem sites externos.

Para o ensaio, restaure um ponto em um **novo servidor privado**, preservando o original, usando o portal ou `az postgres flexible-server restore`. Confira subnet, DNS e autenticação Entra. Conecte um job autorizado ao restaurado e reconcilie esquema, contagens e integridade. Aplique todas as exclusões ocorridas após o ponto restaurado antes de permitir acesso aos dados. Registre tempo e resultados e remova o recurso temporário após aprovação. A restauração cria cobrança adicional; nunca substitua ou exclua o servidor original como parte de um teste.

Referência: [backup e restauração PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/concepts-backup-restore).

## Key Vault e incidentes

Banco e ACR usam identidade gerenciada e não precisam de senha armazenada. Para integrações que exijam chave, grave o segredo diretamente no Key Vault por interface autorizada; revise a permissão por segredo e a referência do Container App. Nunca coloque o valor em argumentos do terminal, Git, imagem, frontend ou evidência de suporte. Teste rotação com a integração e remova a versão antiga somente após confirmar funcionamento.

Em suspeita de exposição, limite o ingresso, preserve evidências de acesso restrito, revogue a credencial comprometida e revise RBAC e sessões. Registre horário, impacto e responsável; o encarregado avalia os procedimentos legais de comunicação. Não publique dados pessoais em issues ou PRs. Identidades gerenciadas eliminam senhas fixas, mas administradores continuam capazes de acessar dados conforme suas permissões.

## Atendimento e entrada em produção pública

No portal Entra, abra Aplicativos empresariais → EmpregoSocial-Production → Usuários e grupos. Convide pessoas externas pelo fluxo B2B e atribua Member para participantes, Company para representantes empresariais validados ou Admin para operadores. A atribuição de usuário é obrigatória; autenticação sem um desses papéis é negada. Defina MFA no tenant conforme as licenças e políticas disponíveis; esta entrega não altera políticas globais do tenant.

Na aplicação, abra Administração para Encerrar sessão, Suspender acesso ou Restabelecer acesso. O sistema impede atuar sobre a própria conta nessa tela. Restabelecer não contorna o Entra: o próximo login ainda precisa de permissão no provedor. Ao remover ou reduzir papel no Entra, revogue também a sessão existente no app para aplicar a mudança imediatamente; sem revogação, a sessão dura até 24 horas. Para acesso administrativo comprometido, outro administrador autorizado deve suspender a conta e revisar o Entra. Não altere diretamente dados de papéis, identidade ou sessões no banco.

Senha e recuperação de conta são tratadas pela Microsoft; não solicite senhas ao usuário. Empresas e links de vagas precisam de verificação operacional. Não há edição/moderação de vagas no painel desta versão; suspender o publicador não remove automaticamente suas vagas. Havendo conteúdo indevido, limite o acesso e siga o procedimento de incidente até existir ferramenta de moderação autorizada.

São dependências da liberação operacional: teste interativo real do login, MFA e acessos revisados, canal de atendimento, revisão de privacidade, responsáveis, monitoramento com alertas, orçamento e ensaios de recuperação/carga. Convites de elo com aceite e moderação de conteúdo continuam no roadmap; combine o apoio previamente e opere inicialmente com participantes autorizados. A infraestrutura pode estar criada enquanto essa liberação continua pendente. Consulte [plano de uso](PLANO-USO.md).
