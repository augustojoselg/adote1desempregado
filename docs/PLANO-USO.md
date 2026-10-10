# Plano de uso e implantação operacional

## Objetivo e público

Conectar profissionais a mentores e vagas, com acompanhamento da recolocação. A implantação começa em acesso restrito e avança para usuários reais somente após a liberação dos controles de identidade, negócio e operação. Guias: [usuários](GUIA-USUARIOS.md) e [administradores](GUIA-ADMINISTRADORES.md).

## Etapas de adoção

| Etapa | Participantes e tarefas | Critério de conclusão |
| --- | --- | --- |
| Preparação técnica | Operação implanta recursos, executa migração e testa identidades, rede e cookies | Readiness aprovado e banco/API sem acesso público direto |
| Validação funcional | Operação testa mentor, profissional, empresa, elo, vaga, exportação e exclusão com dados fictícios | Jornadas e negações de acesso documentadas |
| Liberação de identidade | Operação autoriza contas Entra; equipe testa login interativo, recuperação pelo provedor e revogação | Conta pode voltar a acessar com segurança após sair/expirar |
| Preparação operacional | Designar atendimento e encarregado; validar empresas, privacidade, alertas, custos e recuperação | Responsáveis e procedimentos aprovados; restauração e carga ensaiadas |
| Piloto com usuários reais | Grupo autorizado recebe treinamento e canal de suporte | Problemas críticos resolvidos e acessos revisados |
| Abertura pública | Revisão final dos controles e capacidade; domínio e HTTPS validados | Liberação registrada e monitoramento acompanhado |

A existência da URL ou o sucesso do deploy não concluem as etapas seguintes. Não realizar importação de dados pessoais legados até definir vínculo com a nova identidade e testar reconciliação numa cópia.

## Treinamento e acompanhamento

Reserve uma sessão com cada público. Profissionais praticam perfil, pedido de apoio, vagas e privacidade. Mentores praticam criação e avanço do elo com confirmação da outra pessoa. Empresas praticam publicação e verificação do link externo. Administradores praticam consulta de saúde, release, revogação de acesso, incidente e recuperação.

A operação acompanha acessos com falha, tempo de resposta, elos em cada etapa, vagas e pedidos de suporte. Recolocações contam elos finalizados e precisam de validação antes de divulgação como pessoas contratadas. Registre feedback sem incluir documentos ou dados sensíveis.

## Regras da comunidade

Participação voluntária e gratuita; nenhuma promessa de contratação. Compartilhe somente dados necessários, não publique documentos pessoais e confira sites externos. Combine o apoio antes de criar um elo enquanto não existir convite com aceite. Informações falsas, cobrança indevida e assédio devem ser encaminhados ao atendimento definido pela operação.

## Decisões ainda necessárias

Login inicial: Microsoft Entra single-tenant, com convidados B2B e papéis Member, Company e Admin. Definir responsáveis por atendimento/privacidade, aprovação empresarial, orçamento mensal e alertas, critérios de carga, RPO/RTO e domínio do aplicativo. O domínio institucional conhecido é `empregosocial.com.br`; a troca de DNS depende do acesso ao provedor e da avaliação do site existente, para evitar interrompê-lo.
