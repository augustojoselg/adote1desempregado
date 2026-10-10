import EloIcon from '../components/EloIcon'
import './Entry.css'
import './Privacy.css'

export default function Privacy({ onClose }) {
  return (
    <div className="entry-container">
      <div className="entry-card privacy-card">
        <div className="entry-header">
          <EloIcon size={48} />
          <h1>Política de Privacidade</h1>
          <p className="entry-subtitle">Adote um Desempregado — TISL + EmpregoSocial</p>
        </div>

        <div className="privacy-body">
          <p><strong>Última atualização:</strong> 10/10/2026 — versão 1.2.0</p>

          <h2>1. Quem somos (controlador dos dados)</h2>
          <p>
            O tratamento de dados pessoais nesta plataforma é de responsabilidade do movimento
            TISL + EmpregoSocial ("Adote um Desempregado"). Para qualquer solicitação relacionada
            aos seus dados, entre em contato pelo e-mail{' '}
            <a href="mailto:contato@empregosocial.com.br">contato@empregosocial.com.br</a>.
          </p>

          <h2>2. Quais dados coletamos</h2>
          <p>Coletamos apenas o necessário para conectar você a outras pessoas da rede: nome, papel (mentor, profissional ou empresa), cidade, uma breve biografia e, opcionalmente, seu LinkedIn. No login, recebemos o identificador da sua conta Microsoft no tenant autorizado e suas permissões, sem armazenar senhas Microsoft ou tokens do provedor. Registros administrativos guardam identificadores técnicos, ação e horário. Não solicitamos dados sensíveis (saúde, biometria, origem racial, religião, etc.).</p>

          <h2>3. Por que coletamos (finalidade e base legal)</h2>
          <p>Usamos seus dados exclusivamente para operar o diretório de mentores e profissionais, viabilizar a criação de elos (conexões) e, no caso de empresas, publicar vagas. A base legal é o seu <strong>consentimento</strong> (Art. 7º, I da LGPD), dado de forma explícita no cadastro.</p>

          <h2>4. Com quem compartilhamos</h2>
          <p>O diretório autenticado mostra nome, papel e data de cadastro. Cidade, bio e LinkedIn de terceiros não são disponibilizados nesta versão. Os participantes veem seus próprios elos; vagas incluem os dados informados pela empresa e o nome de quem publicou. A infraestrutura Azure processa os dados para hospedar o serviço. Links de candidatura levam a sites externos, com políticas próprias.</p>

          <h2>5. Seus direitos</h2>
          <ul>
            <li><strong>Acesso e portabilidade:</strong> você pode baixar uma cópia de todos os seus dados a qualquer momento, na aba "Minha conta".</li>
            <li><strong>Correção:</strong> você pode editar seu perfil (cidade, bio, LinkedIn) a qualquer momento.</li>
            <li><strong>Exclusão:</strong> você pode excluir seu perfil a qualquer momento — seus dados pessoais são anonimizados imediatamente.</li>
            <li><strong>Revogação do consentimento:</strong> excluir seu perfil também revoga o consentimento dado.</li>
          </ul>

          <h2>6. Retenção</h2>
          <p>Mantemos o perfil enquanto a conta estiver ativa. Ao excluir, removemos seus elos e vagas, limpamos nome, cidade, bio e LinkedIn e revogamos a sessão. Permanecem identificadores técnicos e registros de consentimento; os prazos de expurgo precisam ser definidos pela operação. Backups anteriores podem conservar dados durante a retenção configurada de sete dias. Exclusões devem ser reaplicadas antes de liberar dados restaurados.</p>

          <h2>7. Segurança</h2>
          <p>O servidor guarda somente o hash do token de sessão. Em produção, a sessão usa cookie HttpOnly, Secure e SameSite=Strict, expira em até 24 horas e é revogada ao sair ou por ação administrativa. Para entrar novamente, use sua conta Microsoft autorizada. A recuperação dessa conta acontece pelo provedor Microsoft; o aplicativo não solicita sua senha. Logs operacionais podem conter IP e informações técnicas, com retenção de 30 dias. Nenhum sistema é imune a incidentes; a operação avalia e realiza as comunicações exigidas pela legislação.</p>

          <h2>8. Contato do encarregado (DPO)</h2>
          <p>
            Para dúvidas, reclamações ou exercício de qualquer direito descrito acima, escreva para{' '}
            <a href="mailto:contato@empregosocial.com.br">contato@empregosocial.com.br</a>.
          </p>
        </div>

        {onClose && (
          <button type="button" className="btn-submit" onClick={onClose}>
            Voltar
          </button>
        )}
      </div>
    </div>
  )
}
