# LGPD — Status de conformidade e pendências

Análise feita sobre o código em `app/src` (fluxo de cadastro, diretório e vagas).

## O que já está adequado

- Coleta de dados mínima: nome, papel, bio, cidade e LinkedIn — nenhum dado sensível (saúde, biometria, origem racial, etc.)
- Sem rastreadores ou analytics de terceiros no `package.json`
- Dados armazenados apenas em `localStorage` do navegador — não trafegam para nenhum servidor externo hoje

## Pendências

| # | Item | Onde | Por quê |
|---|------|------|---------|
| 1 | Consentimento não é uma ação afirmativa — o cadastro ocorre ao clicar "Entrar na corrente", sem checkbox | `app/src/pages/Entry.jsx` | Art. 8º LGPD exige consentimento livre, informado e inequívoco |
| 2 | Link "termos de privacidade" aponta para `#` (não existe) | `app/src/pages/Entry.jsx` | Art. 9º exige transparência sobre uso dos dados |
| 3 | Não há como editar ou excluir o próprio perfil | App (nenhuma tela) | Art. 18º garante acesso, correção, exclusão e revogação de consentimento |
| 4 | Não há identificação do controlador nem canal de contato para pedidos de LGPD | Site e app | Necessário para o titular saber a quem dirigir solicitações |
| 5 | Dados ficam em `localStorage`, isolados por navegador — o diretório não é de fato compartilhado entre usuários diferentes | `app/src/store.js` | Não é uma falha de LGPD em si, mas muda a análise quando migrar para backend: aí sim vai existir dado pessoal armazenado em servidor, exigindo controle de acesso e criptografia em repouso |

## Prioridade sugerida

1. Checkbox de consentimento explícito no cadastro
2. Política de Privacidade real (documento acessível)
3. Botão "Excluir meu perfil" no Dashboard
4. Identificação do controlador (TISL + EmpregoSocial) e e-mail de contato para pedidos de LGPD, no rodapé do site e dentro do app
5. Ao migrar para backend real: revisar controles de acesso, criptografia em repouso e plano de resposta a incidentes
