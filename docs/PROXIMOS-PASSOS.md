# Próximos passos — retomada após 10/10/2026

## Ponto de parada

A aplicação está publicada em **https://adote1p-web.bluewave-facfb082.centralus.azurecontainerapps.io**. O responsável confirmou nesta sessão que conseguiu acessar usando o login Microsoft. Isso confirma o login interativo; conclusão do perfil, visualização do painel administrativo e demais jornadas ainda precisam ser registradas.

API, frontend e PostgreSQL foram provisionados; migração e smoke HTTPS passaram. O banco é privado, usa identidade Entra e não aceita senha. Secrets OIDC ficam no Key Vault. Detalhes e digests no [registro da implantação](../infra/azure/IMPLANTACAO.md).

Branch: `feature/sistema-novo-10102026`. [PR #6](https://github.com/augustojoselg/adote1desempregado/pull/6) aberta como rascunho ao encerrar os trabalhos de implantação. Conferir o estado da PR e seus checks ao retomar; não presumir que foi integrada. Git usa SSH; a CLI `gh` também foi autenticada para gerenciar a PR.

Nenhum recurso Azure será desligado como parte deste encerramento. Containers podem reduzir a zero; PostgreSQL, ACR e demais recursos continuam sujeitos a cobrança. A estimativa base de US$ 23,18/mês não inclui todo o consumo e não é limite de cobrança. Não foram configurados alertas orçamentários.

## 1. Validar uso e administração com dados fictícios

- [ ] Concluir o primeiro cadastro e aceite da política, caso ainda apareçam.
- [ ] Confirmar que a conta do operador vê a aba de administração; a atribuição Admin no Entra já foi conferida.
- [ ] Autorizar duas contas de teste com Member no aplicativo empresarial Entra. Para contas externas, concluir convite B2B e atribuição de acesso.
- [ ] Em sessões separadas, cadastrar Mentor e Profissional, localizar no diretório e criar um elo.
- [ ] Avançar Combinado → Em contato → Entrevistas → Recolocado; confirmar bloqueio de saltos e de alterações por terceiros.
- [ ] Autorizar uma terceira conta com Company, cadastrar Empresa e publicar vaga com link controlado. Confirmar que Member não obtém permissão de empresa.
- [ ] Alterar perfil, recarregar e conferir persistência. Exportar os próprios dados, verificar o JSON em local privado e excluir a conta de teste ao final.
- [ ] Suspender uma conta de teste pelo painel Admin e confirmar perda de acesso; reativar e entrar novamente. Testar também revogação de sessão e registro de auditoria.
- [ ] Sair e entrar novamente com a mesma conta Microsoft, confirmando retorno ao mesmo perfil.

Registrar resultado, horário e comportamento esperado/observado. Não incluir cookies, tokens, senhas ou exportações pessoais nas evidências. Guias: [usuários](GUIA-USUARIOS.md) e [administradores](GUIA-ADMINISTRADORES.md).

## 2. Concluir segurança e preparação operacional

- [ ] Revisar políticas MFA do tenant, principalmente para administradores, conforme licenças e impacto nos acessos existentes.
- [ ] Revisar a cadeia de proxies e a identificação confiável do IP original no rate limiter; testar cabeçalhos forjados e limites entre usuários diferentes.
- [ ] Definir RPO/RTO e ensaiar restauração do PostgreSQL em ambiente separado, verificando integridade e reaplicação de exclusões antes de disponibilizar dados restaurados.
- [ ] Executar teste de carga controlado; medir latência, erros, conexões do banco e comportamento do primeiro acesso após redução a zero.
- [ ] Configurar monitoramento e alertas de disponibilidade, falhas, capacidade e expiração/rotação de secrets OIDC. O bootstrap configurou credenciais com validade de 180 dias; confirmar a data real no Entra/Key Vault e programar rotação antecipada, sem expor valores.
- [ ] Definir orçamento mensal e destinatários; configurar alertas de custos e conferir o consumo real no Azure.
- [ ] Definir responsáveis por atendimento, privacidade, incidentes e aprovação de empresas; revisar retenção e política de privacidade, inclusive provedores externos e região dos dados.

## 3. Preparar piloto e finalizar entrega

- [ ] Consolidar evidências das jornadas, corrigir falhas e atualizar o registro da implantação.
- [ ] Conferir checks e revisão da PR #6; retirar do rascunho quando a validação funcional estiver concluída e registrar as pendências operacionais remanescentes. Não integrar automaticamente sem revisão.
- [ ] Definir grupo pequeno de participantes autorizados, canal de suporte e critérios de sucesso do piloto.
- [ ] Se desejado, definir domínio do aplicativo e configurar DNS/HTTPS sem interromper o site institucional. Atualizar FRONTEND_ORIGIN e redirect URI Entra em conjunto e repetir os testes.
- [ ] Autorizar usuários reais somente após cumprir os critérios do [plano de uso](PLANO-USO.md). Não importar dados SQLite legados sem plano de vínculo com as identidades e reconciliação testada.

## Comandos úteis ao retomar

Na raiz do repositório, com Azure CLI e GitHub CLI autenticadas:

```sh
git status --short
gh pr view 6
gh pr checks 6
az containerapp list -g rg-adote1 --query '[].{nome:name,estado:properties.provisioningState}' -o table
APP_ORIGIN=https://adote1p-web.bluewave-facfb082.centralus.azurecontainerapps.io node scripts/azure-smoke.mjs
```

O smoke é somente leitura e verifica saúde, acesso anônimo negado, proteção de origem e início do login OIDC. Não substitui as jornadas manuais nem um ensaio de restauração. O arquivo local de parâmetros Azure é ignorado pelo Git; os exemplos versionados não contêm os valores necessários para reaplicar produção sem revisão. Conferir [infraestrutura Azure](../infra/azure/README.md) antes de qualquer novo deploy.
