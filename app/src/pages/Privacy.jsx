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
          <p><strong>Última atualização:</strong> versão 1.0.0</p>

          <h2>1. Quem somos (controlador dos dados)</h2>
          <p>
            O tratamento de dados pessoais nesta plataforma é de responsabilidade do movimento
            TISL + EmpregoSocial ("Adote um Desempregado"). Para qualquer solicitação relacionada
            aos seus dados, entre em contato pelo e-mail{' '}
            <a href="mailto:contato@empregosocial.com.br">contato@empregosocial.com.br</a>.
          </p>

          <h2>2. Quais dados coletamos</h2>
          <p>Coletamos apenas o necessário para conectar você a outras pessoas da rede: nome, papel (mentor, profissional ou empresa), cidade, uma breve biografia e, opcionalmente, seu LinkedIn. Não coletamos dados sensíveis (saúde, biometria, origem racial, religião, etc.).</p>

          <h2>3. Por que coletamos (finalidade e base legal)</h2>
          <p>Usamos seus dados exclusivamente para operar o diretório de mentores e profissionais, viabilizar a criação de elos (conexões) e, no caso de empresas, publicar vagas. A base legal é o seu <strong>consentimento</strong> (Art. 7º, I da LGPD), dado de forma explícita no cadastro.</p>

          <h2>4. Com quem compartilhamos</h2>
          <p>Seu nome, cidade, papel, bio e LinkedIn ficam visíveis para as demais pessoas cadastradas na rede — é assim que o diretório de mentores e profissionais funciona. Não vendemos nem compartilhamos seus dados com terceiros fora da plataforma.</p>

          <h2>5. Seus direitos</h2>
          <ul>
            <li><strong>Acesso e portabilidade:</strong> você pode baixar uma cópia de todos os seus dados a qualquer momento, na aba "Minha conta".</li>
            <li><strong>Correção:</strong> você pode editar seu perfil (cidade, bio, LinkedIn) a qualquer momento.</li>
            <li><strong>Exclusão:</strong> você pode excluir seu perfil a qualquer momento — seus dados pessoais são anonimizados imediatamente.</li>
            <li><strong>Revogação do consentimento:</strong> excluir seu perfil também revoga o consentimento dado.</li>
          </ul>

          <h2>6. Retenção</h2>
          <p>Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir seu perfil, seus dados pessoais (nome, cidade, bio, LinkedIn) são substituídos por informações anônimas imediatamente; registros de elos e vagas já existentes são mantidos de forma anonimizada para preservar o histórico de outras pessoas da rede.</p>

          <h2>7. Segurança</h2>
          <p>Senhas e tokens de acesso são armazenados de forma criptografada (hash). O acesso à API é protegido por autenticação e limitação de requisições. Nenhum sistema é 100% imune a incidentes — em caso de vazamento de dados, notificaremos os titulares afetados e a ANPD conforme exigido pela LGPD.</p>

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
