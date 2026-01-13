export default {
  // Meta
  siteTitle: "Vigi - Monitoramento Moderno e Auto-Hospedado",
  siteDescription:
    "Solução moderna de monitoramento de tempo de atividade auto-hospedada - Monitore sites, APIs e serviços com notificações em tempo real, belas páginas de status e análises abrangentes",

  // Header
  nav: {
    monitors: "Monitores",
    alerts: "Alertas",
    testimonials: "Depoimentos",
    docs: "Docs",
    getStarted: "Comece agora",
    goToGithub: "Ir para o repositório do Vigi no GitHub",
  },

  // Hero
  hero: {
    title: {
      openSource: "Código Aberto",
      and: "&",
      selfHosted: "Auto-Hospedado",
      subtitle: "monitoramento de tempo de atividade para",
      smallTeams: "pequenas equipes",
      ending: "para detectar interrupções antes que os usuários o façam",
    },
    description:
      "Monitoramento de tempo de atividade de nível de engenharia que você possui e controla. Sem dependências de nuvem, sem aprisionamento de fornecedor.",
    labels: {
      openSource: "🔓 100% Código Aberto",
      selfHosted: "🏠 Somente Auto-Hospedado (por enquanto)",
    },
    buttons: {
      tryDemo: "Experimente a Demo",
      quickStart: "Início Rápido",
      starOnGithub: "Marcar com Estrela no GitHub",
    },
  },

  // Monitors Section
  monitors: {
    title: "Monitores Disponíveis",
    categories: {
      webNetwork: "Web & Rede",
      appInfra: "Aplicação & Infraestrutura",
      databases: "Bancos de Dados & Caches",
      messaging: "Mensagens & Streaming",
    },
    items: {
      http: "<strong>HTTP/HTTPS</strong> — Monitore sites, APIs e serviços web",
      tcp: "<strong>TCP</strong> — Verifique a conectividade e disponibilidade de portas TCP",
      ping: "<strong>Ping (ICMP)</strong> — Meça a alcançabilidade e a latência de ida e volta",
      dns: "<strong>DNS</strong> — Verifique as respostas de consulta e os tempos de resolução",
      push: "<strong>Push (webhook de entrada)</strong> — Aceite heartbeats de trabalhos e serviços",
      docker: "<strong>Contêiner Docker</strong> — Acompanhe o status e a saúde do contêiner",
      grpc: "<strong>gRPC</strong> — Execute verificações de saúde/serviço gRPC e latência",
      snmp: "<strong>SNMP</strong> — Consulte a disponibilidade de dispositivos e OIDs chave",
      postgresql: "<strong>PostgreSQL</strong> — Conecte e execute uma consulta leve",
      mssql: "<strong>Microsoft SQL Server</strong> — Conecte e execute uma consulta leve",
      mongodb: "<strong>MongoDB</strong> — Ping/handshake e leitura simples",
      redis: "<strong>Redis</strong> — PING/latência e saúde básica",
      mqtt: "<strong>Broker MQTT</strong> — Teste de fumaça de conexão/inscrição/publicação",
      rabbitmq: "<strong>RabbitMQ</strong> — Conexão e saúde da fila",
      kafka: "<strong>Produtor Kafka</strong> — Produza uma mensagem de teste para um tópico",
    },
  },

  // Alerts Section
  alerts: {
    title: "Canais de Alerta",
    categories: {
      emailWebhooks: "Email & Webhooks",
      chatCollab: "Chat & Colaboração",
      onCall: "On-Call & Incidente",
      mobilePush: "Push Móvel & Auto-Hospedado",
    },
    items: {
      email: "<strong>Email (SMTP)</strong> — Envie alertas através do seu servidor SMTP",
      webhook: "<strong>Webhook</strong> — POST JSON payloads para qualquer endpoint HTTP",
      telegram: "<strong>Telegram</strong> — Mensagens de bot para usuários/canais",
      slack: "<strong>Slack</strong> — Webhook de entrada para canais",
      googleChat: "<strong>Google Chat</strong> — Webhooks de espaço",
      signal: "<strong>Signal</strong> — Mensagens seguras via bot/integração",
      mattermost: "<strong>Mattermost</strong> — Webhook de entrada para canais",
      matrix: "<strong>Matrix</strong> — Envie para salas via token de acesso",
      discord: "<strong>Discord</strong> — Webhooks de canal",
      wecom: "<strong>WeCom</strong> — Mensagens empresariais para grupos",
      whatsapp: "<strong>WhatsApp (WAHA)</strong> — Via gateway WAHA",
      pagerduty: "<strong>PagerDuty</strong> — Acione incidentes e escalonamentos",
      opsgenie: "<strong>Opsgenie</strong> — Alertas, roteamento e plantão",
      grafana: "<strong>Grafana OnCall</strong> — Integre com agendamentos de plantão",
      ntfy: "<strong>NTFY</strong> — Notificações push pub/sub simples",
      gotify: "<strong>Gotify</strong> — Servidor de push auto-hospedado",
      pushover: "<strong>Pushover</strong> — Push móvel/desktop confiável",
    },
  },

  // Tech Stack Section
  techStack: {
    title: "Pilha Tecnológica",
    categories: {
      dataStorage: "Armazenamento de Dados (Selecionável)",
    },
    items: {
      go: "<strong>Go (Golang)</strong> — Concorrência leve de alto desempenho",
      react: "<strong>React + TypeScript</strong> — Painel de administração e páginas de status com segurança de tipo",
      docker: "<strong>Docker</strong> — Fácil de implantar e executar",
      postgresql: "<strong>PostgreSQL</strong> — Banco de dados relacional para dados estruturados",
      mongodb: "<strong>MongoDB</strong> — Armazenamento de documentos flexível",
      sqlite: "<strong>SQLite</strong> — Banco de dados de arquivo único para configurações leves/auto-hospedadas",
    },
  },

  // Testimonials Section
  testimonials: {
    sectionName: "Depoimentos",
    title: "O que a",
    titleHighlight: "Comunidade Diz",
    contributionBanner: "Aceitamos contribuições!",
    quotes: [
      "Tenho acompanhado seus lançamentos e vocês têm trabalhado duro. Eu acabei de atualizar e está pingando ótimo. Obrigado! Minha primeira vez seguindo um projeto tão cedo e estou animado para ver o que o futuro reserva.",
      "Esta pode ser uma ótima alternativa. Eu definitivamente experimentei problemas de desempenho com o UK [o serviço alternativo]. Obrigado por construir isso!",
      "Parece legal e moderno.",
    ],
  },

  // FAQ Section
  faq: {
    sectionName: "FAQ",
    title: "Ainda",
    titleHighlight: "Tem Dúvidas?",
    items: [
      {
        question: "O que é o Vigi?",
        answer:
          "O Vigi é uma ferramenta de monitoramento de tempo de atividade e página de status de código aberto e auto-hospedada, construída com Go e React. Ele monitora sites, APIs e serviços internos e envia notificações em tempo real quando ocorrem problemas.",
      },
      {
        question: "Como o Vigi se compara ao Uptime Kuma?",
        answer:
          "O Vigi oferece uma experiência semelhante com foco em código fortemente tipado (Go + TypeScript), um design API-first com Swagger e uma arquitetura modular que facilita a extensão e a troca de back-ends de armazenamento.",
      },
      {
        question: "O Vigi possui páginas de status públicas?",
        answer:
          "Sim. Você pode publicar páginas de status públicas com sua marca que mostram o tempo de atividade e métricas de desempenho.",
      },
      {
        question: "Como eu implanto o Vigi?",
        answer:
          "Use as imagens Docker oficiais e o docker-compose para uma configuração rápida, ou execute a API Go e o aplicativo da web React em uma VM ou bare metal.",
      },
      {
        question: "Quais bancos de dados são suportados?",
        answer:
          "O Vigi suporta MongoDB com opções para PostgreSQL e SQLite através de seu design de armazenamento plugável.",
      },
      {
        question: "Existe uma API REST?",
        answer:
          "Sim. O Vigi é API-first e inclui documentação Swagger/OpenAPI para automação e integrações.",
      },
      {
        question: "Posso migrar do Uptime Kuma?",
        answer:
          "Uma ferramenta de migração está sendo desenvolvida. Por enquanto, você pode migrar manualmente.",
      },
      {
        question: "O Vigi é gratuito para uso comercial?",
        answer:
          "Sim. Ele é licenciado pelo MIT e gratuito para projetos pessoais e comerciais.",
      },
    ],
  },

  // Footer
  footer: {
    cta: "Implante rapidamente, acompanhe verificações em tempo real, publique páginas de status e receba alertas apenas quando realmente importa",
    ctaButton: "Comece Agora",
    goToGithub: "Ir para o repositório do Vigi no GitHub",
    goToDiscord: "Ir para o Discord do Vigi",
    copyright: "Vigi. Todos os direitos reservados.",
    privacyPolicy: "Política de Privacidade",
    termsConditions: "Termos e Condições",
    madeWith: "Feito com 💜 pela equipe Vigi",
  },

  // SEO Content
  seo: {
    showMore: "Mostrar Mais",
    showLess: "Mostrar Menos",
    title: "Monitor de tempo de atividade auto-hospedado para controle de disponibilidade de serviço",
    paragraphs: [
      "Um monitor de tempo de atividade auto-hospedado é a base de uma infraestrutura estável e previsível. Quando sites, APIs ou serviços internos ficam indisponíveis, é importante saber disso imediatamente, não pelos usuários. Nosso serviço permite que você acompanhe a disponibilidade e a operacionalidade da infraestrutura em tempo real, totalmente dentro do seu ambiente e sob seu controle.",
      "A plataforma é implantada em seu servidor ou em sua nuvem e não depende de serviços externos. Todos os dados de monitoramento são armazenados com você, sem serem transferidos para terceiros. Essa abordagem é especialmente importante para projetos com requisitos aumentados de segurança, privacidade e gerenciamento de infraestrutura.",
      "Nosso monitor de tempo de atividade auto-hospedado é adequado tanto para pequenas equipes quanto para projetos em crescimento com arquitetura distribuída. O sistema escala facilmente, não o vincula a provedores de terceiros e fornece uma compreensão transparente do estado dos serviços a qualquer momento.",
    ],
    capabilitiesTitle: "Capacidades do monitor de tempo de atividade auto-hospedado",
    capabilitiesParagraphs: [
      "A plataforma suporta uma ampla gama de verificações necessárias para o monitoramento de disponibilidade moderno. Você pode rastrear sites HTTP e HTTPS, endpoints de API, portas TCP, ping ICMP, consultas DNS, verificações de Webhook no modo push, bancos de dados e corretores de mensagens. O monitoramento de contêineres Docker, serviços gRPC e serviços SNMP também é suportado, o que permite controlar tanto o perímetro externo quanto os componentes internos da infraestrutura.",
      "Quando ocorrem problemas, o serviço envia instantaneamente notificações através de canais convenientes: Telegram, Slack, Email, WhatsApp, Discord, Webhook e outros. As notificações podem ser configuradas de forma flexível, separadas por níveis de gravidade e adaptadas aos processos da equipe para que as respostas sejam rápidas e sem ruído desnecessário.",
      "Para transparência de disponibilidade, são fornecidas páginas de status. Elas podem ser públicas para clientes ou privadas para uso interno e exibir o estado atual dos serviços em um formato claro e visual. Isso ajuda a reduzir o número de solicitações de suporte e aumentar a confiança no serviço.",
      "A plataforma é totalmente auto-hospedada: você escolhe o banco de dados — SQLite para um início fácil ou PostgreSQL e MongoDB para cargas de trabalho de produção. Você controla o armazenamento, o acesso e a segurança dos dados. Autenticação de dois fatores, proteção contra ataques de força bruta e monitoramento das datas de expiração do certificado SSL são suportados.",
      "Nosso serviço é focado em equipes que precisam de um monitor de tempo de atividade auto-hospedado confiável sem aprisionamento de fornecedor, com configuração flexível, uma interface moderna e a capacidade de controlar totalmente a infraestrutura. Ajuda a detectar falhas em tempo hábil, manter a estabilidade do serviço e garantir a transparência de sua operação.",
    ],
  },
} as const;
