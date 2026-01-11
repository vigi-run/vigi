export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
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
];

export default faqItems;


