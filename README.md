# Adote um Desempregado

**Um movimento TISL + EmpregoSocial**

> "Quem está empregado pode mudar a vida de quem procura uma oportunidade."

## O que é

A Adote um Desempregado é a maior corrente voluntária de apoio à recolocação profissional do Brasil. O objetivo não é arrecadar dinheiro — é conectar pessoas. Acreditamos que uma indicação, uma conversa, uma revisão de currículo ou uma apresentação para um recrutador pode mudar completamente a vida de alguém.

## Como funciona

O movimento conecta três papéis:

- 🤝 **Mentor** (quem adota) — já está empregado e ajuda com indicação para vagas, revisão de currículo, otimização de LinkedIn, simulação de entrevistas, networking, compartilhamento de vagas e acompanhamento até a contratação.
- 👤 **Profissional** — recebe apoio até conseguir uma recolocação. Não existe mensalidade. Não existe cobrança. Existe compromisso.
- 🏢 **Empresa** — divulga vagas gratuitamente, participa da corrente do bem, apoia a recolocação de profissionais e fortalece sua marca empregadora.

Cada conexão entre mentor e profissional é chamada de **elo**, e avança por quatro etapas: Combinado → Em contato → Entrevistas → Recolocado.

## Estrutura do repositório

```
├── site.html          # site institucional (uma página)
├── divulgacao.html     # página de divulgação, sem links de acesso ao app
└── app/                # aplicativo web (PWA) — diretório, elos, vagas
    └── README.md       # documentação técnica do app
```

- **`site.html`** — site institucional com propósito, como funciona e chamadas para o app.
- **`divulgacao.html`** — página feita para compartilhamento em redes/grupos, com CTAs diretos para os formulários de cadastro (mentor, profissional, empresa parceira), sem expor o app.
- **`app/`** — aplicativo React (PWA) onde mentores e profissionais se cadastram, se conectam e acompanham o elo até a recolocação, e empresas publicam vagas. Veja `app/README.md` para instruções de instalação e desenvolvimento.

## Identidade visual

O símbolo do movimento é o **elo**: dois anéis entrelaçados, em verde-mata e âmbar, representando a conexão entre quem já está empregado e quem procura uma oportunidade. Paleta, tipografia e regras de uso da marca completas em `identidade-visual.md` (pasta de identidade do projeto).

## Privacidade e LGPD

Este projeto coleta dados pessoais (nome, papel, cidade, LinkedIn) para operar a rede de conexões. Consulte a Política de Privacidade antes de contribuir com o cadastro ou fluxo de dados, e veja `LGPD.md` para o status de conformidade e pendências conhecidas.

## Contato

`contato@empregosocial.com.br`
