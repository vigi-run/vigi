export default {
  // Meta
  siteTitle: "Vigi - Modern Self-Hosted Monitoring",
  siteDescription:
    "Modern self-hosted uptime monitoring solution - Monitor websites, APIs, and services with real-time notifications, beautiful status pages, and comprehensive analytics",

  // Header
  nav: {
    monitors: "Monitors",
    alerts: "Alerts",
    testimonials: "Testimonials",
    docs: "Docs",
    getStarted: "Get Started",
    goToGithub: "Go to Vigi's GitHub repository",
  },

  // Hero
  hero: {
    title: {
      openSource: "Open Source",
      and: "&",
      selfHosted: "Self-Hosted",
      subtitle: "uptime monitoring for",
      smallTeams: "small teams",
      ending: "to catch outages before users do",
    },
    description:
      "Engineering-grade uptime monitoring you own and control. No cloud dependencies, no vendor lock-in.",
    labels: {
      openSource: "🔓 100% Open Source",
      selfHosted: "🏠 Self-Hosted Only (for now)",
    },
    buttons: {
      tryDemo: "Try Demo",
      quickStart: "Quick Start",
      starOnGithub: "Star on GitHub",
    },
  },

  // Monitors Section
  monitors: {
    title: "Available Monitors",
    categories: {
      webNetwork: "Web & Network",
      appInfra: "Application & Infrastructure",
      databases: "Databases & Caches",
      messaging: "Messaging & Streaming",
    },
    items: {
      http: "<strong>HTTP/HTTPS</strong> — Monitor websites, APIs, and web services",
      tcp: "<strong>TCP</strong> — Check TCP port connectivity and availability",
      ping: "<strong>Ping (ICMP)</strong> — Measure reachability and round-trip latency",
      dns: "<strong>DNS</strong> — Verify query responses and resolution times",
      push: "<strong>Push (inbound webhook)</strong> — Accept heartbeats from jobs and services",
      docker: "<strong>Docker Container</strong> — Track container status and health",
      grpc: "<strong>gRPC</strong> — Run gRPC health/service checks and latency",
      snmp: "<strong>SNMP</strong> — Query device availability and key OIDs",
      postgresql: "<strong>PostgreSQL</strong> — Connect and run a lightweight query",
      mssql: "<strong>Microsoft SQL Server</strong> — Connect and run a lightweight query",
      mongodb: "<strong>MongoDB</strong> — Ping/handshake and simple read",
      redis: "<strong>Redis</strong> — PING/latency and basic health",
      mqtt: "<strong>MQTT Broker</strong> — Connection/subscribe/publish smoke test",
      rabbitmq: "<strong>RabbitMQ</strong> — Connection and queue health",
      kafka: "<strong>Kafka Producer</strong> — Produce a test message to a topic",
    },
  },

  // Alerts Section
  alerts: {
    title: "Alert Channels",
    categories: {
      emailWebhooks: "Email & Webhooks",
      chatCollab: "Chat & Collaboration",
      onCall: "On-Call & Incident",
      mobilePush: "Mobile Push & Self-Hosted",
    },
    items: {
      email: "<strong>Email (SMTP)</strong> — Send alerts through your SMTP server",
      webhook: "<strong>Webhook</strong> — POST JSON payloads to any HTTP endpoint",
      telegram: "<strong>Telegram</strong> — Bot messages to users/channels",
      slack: "<strong>Slack</strong> — Incoming webhook to channels",
      googleChat: "<strong>Google Chat</strong> — Space webhooks",
      signal: "<strong>Signal</strong> — Secure messages via bot/integration",
      mattermost: "<strong>Mattermost</strong> — Incoming webhook to channels",
      matrix: "<strong>Matrix</strong> — Send to rooms via access token",
      discord: "<strong>Discord</strong> — Channel webhooks",
      wecom: "<strong>WeCom</strong> — Enterprise messages to groups",
      whatsapp: "<strong>WhatsApp (WAHA)</strong> — Via WAHA gateway",
      pagerduty: "<strong>PagerDuty</strong> — Trigger incidents and escalations",
      opsgenie: "<strong>Opsgenie</strong> — Alerts, routing, and on-call",
      grafana: "<strong>Grafana OnCall</strong> — Integrate with on-call schedules",
      ntfy: "<strong>NTFY</strong> — Simple pub/sub push notifications",
      gotify: "<strong>Gotify</strong> — Self-hosted push server",
      pushover: "<strong>Pushover</strong> — Reliable mobile/desktop push",
    },
  },

  // Tech Stack Section
  techStack: {
    title: "Tech Stack",
    categories: {
      dataStorage: "Data Storage (Selectable)",
    },
    items: {
      go: "<strong>Go (Golang)</strong> — High-performance lightweight concurrency",
      react: "<strong>React + TypeScript</strong> — Type-safe admin panel and status pages",
      docker: "<strong>Docker</strong> — Easy to deploy and run",
      postgresql: "<strong>PostgreSQL</strong> — Relational database for structured data",
      mongodb: "<strong>MongoDB</strong> — Flexible document storage",
      sqlite: "<strong>SQLite</strong> — Single-file database for lightweight/self-hosted setups",
    },
  },

  // Testimonials Section
  testimonials: {
    sectionName: "Testimonials",
    title: "What the",
    titleHighlight: "Community Says",
    contributionBanner: "We welcome contributions!",
    quotes: [
      "I've been following your releases and you guys have been putting in the work. I just updated and it's pinging great. Thanks! My first time following a project so early and I'm excited to see what the future holds.",
      "This might be a great alternative. I've definitely experienced performance issues with UK [the alternative service]. Thanks for building this!",
      "Looks cool and modern.",
    ],
  },

  // FAQ Section
  faq: {
    sectionName: "FAQ",
    title: "Still Have",
    titleHighlight: "Questions?",
    items: [
      {
        question: "What is Vigi?",
        answer:
          "Vigi is an open-source, self-hosted uptime monitoring and status page tool built with Go and React. It monitors websites, APIs, and internal services and sends real-time notifications when issues occur.",
      },
      {
        question: "How does Vigi compare to Uptime Kuma?",
        answer:
          "Vigi offers a similar experience with a focus on strongly-typed code (Go + TypeScript), an API-first design with Swagger, and a modular architecture that makes it easy to extend and swap storage backends.",
      },
      {
        question: "Does Vigi have public status pages?",
        answer:
          "Yes. You can publish branded public status pages that display uptime and performance metrics.",
      },
      {
        question: "How do I deploy Vigi?",
        answer:
          "Use the official Docker images and docker-compose for a quick setup, or run the Go API and the React web app on a VM or bare metal.",
      },
      {
        question: "What databases are supported?",
        answer:
          "Vigi supports MongoDB with options for PostgreSQL and SQLite through its pluggable storage design.",
      },
      {
        question: "Is there a REST API?",
        answer:
          "Yes. Vigi is API-first and includes Swagger/OpenAPI documentation for automation and integrations.",
      },
      {
        question: "Can I migrate from Uptime Kuma?",
        answer:
          "A migration tool is under development. For now, you can migrate manually.",
      },
      {
        question: "Is Vigi free for commercial use?",
        answer:
          "Yes. It is MIT licensed and free for personal and commercial projects.",
      },
    ],
  },

  // Footer
  footer: {
    cta: "Deploy fast, track checks in real-time, publish status pages and get alerts only when it really matters",
    ctaButton: "Get Started",
    goToGithub: "Go to Vigi's GitHub repository",
    goToDiscord: "Go to Vigi's Discord",
    copyright: "Vigi. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms and Conditions",
    madeWith: "Made with 💜 by the Vigi team",
  },

  // SEO Content
  seo: {
    showMore: "Show More",
    showLess: "Show Less",
    title: "Self-hosted uptime monitor for service availability control",
    paragraphs: [
      "A self-hosted uptime monitor is the foundation of stable and predictable infrastructure. When websites, APIs, or internal services become unavailable, it's important to know immediately, not from users. Our service allows you to track infrastructure availability and operability in real-time, entirely within your environment and under your control.",
      "The platform is deployed on your server or in your cloud and does not depend on external services. All monitoring data is stored with you, without being transferred to third parties. This approach is especially important for projects with increased security, privacy, and infrastructure management requirements.",
      "Our self-hosted uptime monitor is suitable for both small teams and growing projects with distributed architecture. The system scales easily, doesn't tie you to third-party providers, and provides a transparent understanding of service status at any time.",
    ],
    capabilitiesTitle: "Self-hosted uptime monitor capabilities",
    capabilitiesParagraphs: [
      "The platform supports a wide range of checks required for modern availability monitoring. You can track HTTP and HTTPS websites, API endpoints, TCP ports, ICMP ping, DNS queries, Webhook checks in push mode, databases, and message brokers. Docker container monitoring, gRPC services, and SNMP services are also supported, allowing you to control both the external perimeter and internal infrastructure components.",
      "When problems occur, the service instantly sends notifications through convenient channels: Telegram, Slack, Email, WhatsApp, Discord, Webhook, and others. Notifications can be flexibly configured, separated by severity levels, and adapted to team processes so that responses are fast and without unnecessary noise.",
      "For availability transparency, status pages are provided. They can be public for customers or private for internal use and display the current state of services in a clear, visual format. This helps reduce the number of support requests and increase trust in the service.",
      "The platform is fully self-hosted: you choose the database — SQLite for an easy start or PostgreSQL and MongoDB for production workloads. You control data storage, access, and security. Two-factor authentication, brute-force attack protection, and SSL certificate expiration date monitoring are supported.",
      "Our service is focused on teams that need a reliable self-hosted uptime monitor without vendor lock-in, with flexible configuration, a modern interface, and the ability to fully control the infrastructure. It helps detect failures in a timely manner, maintain service stability, and ensure operational transparency.",
    ],
  },
} as const;
