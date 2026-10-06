/* ==========================================================================
   CONFIGURAÇÃO COMERCIAL — preencha com os dados REAIS da empresa.
   Nada aqui pode ser inventado. Enquanto um campo estiver vazio, o canal
   correspondente simplesmente não aparece no site e os botões levam ao formulário.
   ATENÇÃO: antes de publicar, defina pelo menos "formEndpoint" ou "whatsapp" —
   sem um deles o formulário não tem para onde enviar os pedidos.
   ========================================================================== */
window.SITE_CONFIG = {
  // WhatsApp com DDI + DDD, só números. Ex.: "5512999999999"
  whatsapp: "",

  // Telefone para o link tel:, só números com DDI. Ex.: "551239999999"
  telefone: "",
  // Como o telefone aparece na tela. Ex.: "(12) 3999-9999"
  telefoneExibicao: "",

  email: "",

  // Endpoint que recebe o formulário via POST (Formspree, Getform, backend próprio...).
  // Se vazio, o formulário monta a mensagem e abre o WhatsApp.
  formEndpoint: "",

  // Mensagem inicial do WhatsApp
  mensagemPadrao: "Olá! Vim pelo site e gostaria de solicitar um orçamento."
};
