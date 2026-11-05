// Configuração central do site ANPAQ. Preencha os endpoints antes de publicar.
window.ANPAQ_CONFIG = {
  // Webhook que recebe o pré-cadastro (hoje: n8n). Mover para infraestrutura da ANPAQ.
  preCadastroEndpoint: "https://n8n-n8n.6djmf0.easypanel.host/webhook/8949862c-9616-40d2-b3ca-658cd80b5beb",
  // Endpoint do formulário de contato (a definir).
  contatoEndpoint: "",
  // URL do Apps Script publicado como aplicativo da web (retorna JSON das abas públicas).
  sheetsEndpoint: "",
  contato: {
    telefone1: "(31) 3442-9181",
    telefone2: "(31) 99828-7495",
    whatsapp: "5531998287495",
    horario: "09h às 14h",
    endereco: "Rua Levindo Lopes, 333 — loja 08 — Funcionários — 30140-170 — Belo Horizonte/MG"
  }
};
