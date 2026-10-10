# Guia de uso — usuários

## Acesso e cuidados iniciais

Solicite à operação o endereço e a liberação de acesso. A primeira implantação mantém acesso restrito enquanto a autenticação recuperável e a validação de empresas são concluídas. Não cadastre dados reais durante os testes de liberação.

O cadastro atual pede nome, papel e cidade opcional, além do aceite da Política de Privacidade. Leia a política antes de aceitar. Escolha seu papel com atenção: ele não pode ser alterado em Minha conta. O sistema não solicita pagamento, senha bancária, documentos de identidade ou currículo em arquivo.

A sessão atual dura até sete dias e depende do cookie deste navegador. Sair revoga a sessão; ainda não há fluxo para entrar novamente ou recuperar uma conta. Não crie outra conta para tentar recuperar dados: procure a operação. Essa limitação impede a abertura ao público nesta versão.

## Jornadas por papel

| Papel | Primeiros passos | Resultado esperado |
| --- | --- | --- |
| Profissional | Revise Minha conta, abra Diretório, escolha um mentor e clique em Pedir apoio | Um elo para acompanhar o apoio à recolocação |
| Mentor | Abra Diretório, escolha um profissional e clique em Adotar | Um elo para acompanhar a mentoria |
| Empresa | Abra Vagas, clique em Publicar vaga e informe empresa, cargo e link de candidatura | Uma oportunidade visível aos usuários autenticados |

O papel Empresa é autodeclarado nesta versão; não representa validação da organização. A operação deve validar empresas antes de autorizar uso real. Empresas não criam elos de mentoria.

## Navegação

**Estatísticas:** mostra totais de mentores, profissionais, empresas, vagas e elos marcados como Recolocado. O último indicador conta elos, não pessoas únicas nem contratações verificadas.

**Diretório:** mostra participantes disponíveis. Informações pessoais de terceiros, como bio, cidade e LinkedIn, não são disponibilizadas pelo backend nesta versão. O mesmo par mentor/profissional só pode ter um elo. A criação é imediata; ainda não existe convite com aceite ou recusa. Combine o apoio previamente por um canal autorizado pela operação.

**Meus Elos:** acompanhe Combinado → Em contato → Entrevistas → Recolocado. Os participantes podem avançar uma etapa por vez. O sistema impede retroceder, saltar etapas ou alterar um elo de terceiros. Confirme a informação com a outra pessoa antes de avançar. Recolocado é um estado final.

**Vagas:** clique em Candidatar para abrir o site externo informado pela empresa. A candidatura acontece fora do sistema; não há acompanhamento de candidaturas ou envio de currículo no app. Confira o domínio antes de fornecer dados. Nunca pague para participar de um processo seletivo anunciado na rede.

**Minha conta:** atualize cidade, bio e LinkedIn e clique em Salvar alterações. Nome e papel não são editáveis nessa tela. Informe somente dados necessários; não inclua documentos, informações de saúde ou dados bancários na bio.

## Dados e encerramento

Em Minha conta, **Baixar meus dados** exporta um JSON com perfil, elos, vagas publicadas e histórico de consentimento. Guarde o arquivo em local privado: ele contém dados pessoais.

**Excluir meu perfil** exige confirmação. A operação remove seus elos e vagas, anonimiza o perfil e revoga a sessão, mantendo os registros técnicos de consentimento. Backups anteriores seguem sua retenção; a operação deve reaplicar exclusões antes de liberar qualquer restauração. A exclusão não apaga dados que você forneceu em sites externos de candidatura.

**Sair** encerra a sessão atual. Enquanto não houver login recuperável, use apenas contas de teste no ambiente restrito.

## Problemas comuns

| Situação | Como proceder |
| --- | --- |
| Acesso negado ao endereço | Confirme com a operação se o IP da sua conexão está autorizado; VPN e troca de rede podem alterá-lo |
| Primeira abertura demora | Aguarde o início dos containers; se persistir, informe horário e tela à operação |
| Sessão expirada | Procure a operação; não há recuperação automática nesta versão |
| Elo já existe | Consulte Meus Elos em vez de criar uma duplicação |
| Não consigo publicar vaga | Somente o papel Empresa tem essa permissão |
| Muitas tentativas | Aguarde o período indicado e evite repetir cadastros |
| Falha ao avançar elo | Atualize a página; outra pessoa pode ter avançado a etapa |

Para suporte e privacidade, use o contato oficial divulgado pela operação. Nunca envie cookies, tokens, senhas ou o arquivo completo de exportação em uma conversa de suporte.

## Roteiro de capacitação

1. Em contas de teste separadas, cadastrar um mentor, um profissional e uma empresa.
2. Atualizar perfil e conferir que dados privados não aparecem no diretório de outra conta.
3. Criar um elo e avançá-lo sequencialmente até Recolocado.
4. Publicar uma vaga de teste com URL controlada e abrir a candidatura externa.
5. Exportar dados, conferir o arquivo privadamente e excluir as contas de teste.
6. Registrar dificuldades sem incluir dados pessoais ou credenciais nas evidências.
