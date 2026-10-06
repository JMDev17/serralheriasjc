/* ==========================================================================
   Configurador / calculadora de portão — JavaScript puro
   --------------------------------------------------------------------------
   HOJE: coleta a especificação do portão e a envia como pedido de orçamento.
   FUTURO: quando existir uma tabela baseada em orçamentos REAIS, preencha
   window.TABELA_PRECOS (ver formato abaixo) e a estimativa passa a aparecer.
   NÃO inventar valores. Sem tabela, estimarPreco() retorna null.
   ========================================================================== */
(function () {
  "use strict";

  /* Formato esperado (exemplo de ESTRUTURA, sem valores):
  window.TABELA_PRECOS = {
    atualizadoEm: "AAAA-MM",
    amostra: 0,                       // nº de orçamentos reais usados
    basePorM2: { "de-correr": [min, max], "basculante": [min, max], "pivotante": [min, max] },
    fechamento: { "gradeado": 1, "chapa": 1, "lambri": 1, "misto": 1 },        // multiplicadores
    acabamento: { "pintado": 1, "galvanizado": 1 },                            // multiplicadores
    motor: { "de-correr": [min, max], "basculante": [min, max], "pivotante": [min, max] },
    extras: { "fotocelula": [min, max], "bateria": [min, max], "controle-extra": [min, max] }
  };
  */

  function estimarPreco(spec) {
    var t = window.TABELA_PRECOS;
    if (!t || !t.amostra || !t.basePorM2 || !t.basePorM2[spec.tipo]) return null;
    var area = spec.largura * spec.altura;
    var base = t.basePorM2[spec.tipo];
    var mult = (t.fechamento[spec.fechamento] || 1) * (t.acabamento[spec.acabamento] || 1);
    var min = base[0] * area * mult, max = base[1] * area * mult;
    if (spec.acionamento === "automatico" && t.motor && t.motor[spec.tipo]) {
      min += t.motor[spec.tipo][0]; max += t.motor[spec.tipo][1];
    }
    (spec.extras || []).forEach(function (e) {
      if (t.extras && t.extras[e]) { min += t.extras[e][0]; max += t.extras[e][1]; }
    });
    return { min: min, max: max, amostra: t.amostra, atualizadoEm: t.atualizadoEm };
  }
  window.estimarPreco = estimarPreco;

  var form = document.getElementById("configurador");
  if (!form) return;
  var out = document.getElementById("config-resultado");
  var labels = {
    "de-correr": "Portão de correr", "basculante": "Portão basculante", "pivotante": "Portão pivotante",
    "gradeado": "gradeado", "chapa": "chapa fechada", "lambri": "lambri", "misto": "misto",
    "pintado": "ferro pintado", "galvanizado": "galvanizado",
    "manual": "manual", "automatico": "automático",
    "fotocelula": "sensor de obstáculo", "bateria": "bateria/nobreak", "controle-extra": "controles extras", "portao-social": "portão social no mesmo padrão"
  };
  var servicoPorTipo = { "de-correr": "portao-de-correr", "basculante": "portao-basculante", "pivotante": "portao-pivotante" };
  var brl = function (v) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var spec = {
      tipo: d.get("tipo"),
      largura: parseFloat(String(d.get("largura")).replace(",", ".")),
      altura: parseFloat(String(d.get("altura")).replace(",", ".")),
      fechamento: d.get("fechamento"),
      acabamento: d.get("acabamento"),
      acionamento: d.get("acionamento"),
      extras: d.getAll("extras")
    };
    if (!spec.tipo || !(spec.largura > 0) || !(spec.altura > 0)) {
      out.innerHTML = '<p class="form-status is-err" style="display:block">Informe tipo, largura e altura.</p>';
      return;
    }
    var resumo = labels[spec.tipo] + " " + labels[spec.acionamento] + ", " +
      String(spec.largura).replace(".", ",") + " m × " + String(spec.altura).replace(".", ",") + " m, " +
      labels[spec.fechamento] + ", " + labels[spec.acabamento] +
      (spec.extras.length ? ", com " + spec.extras.map(function (x) { return labels[x]; }).join(", ") : "") + ".";

    var est = estimarPreco(spec);
    var html = '<div class="answer"><span class="label">Sua configuração</span>' + resumo + "</div>";
    if (est) {
      html += '<p class="mt-4"><strong>Faixa estimada: ' + brl(est.min) + " a " + brl(est.max) + "</strong></p>" +
        '<p class="table-note">Baseada em ' + est.amostra + " orçamentos reais (atualizado em " + est.atualizadoEm + "). O valor final depende da medição no local.</p>";
    } else {
      html += '<p class="mt-4">A estimativa automática de valores ainda não está disponível: ela será calculada a partir de orçamentos reais, não de tabelas genéricas. Envie sua configuração abaixo e receba o orçamento.</p>';
    }
    out.innerHTML = html;

    // Leva a configuração para o formulário de orçamento
    var lead = document.querySelector("form[data-lead-form]");
    if (lead) {
      if (lead.elements.servico) lead.elements.servico.value = spec.acionamento === "automatico" ? "portao-automatico" : servicoPorTipo[spec.tipo];
      if (lead.elements.descricao) lead.elements.descricao.value = "Configuração: " + resumo;
      lead.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(function () { lead.elements.nome && lead.elements.nome.focus({ preventScroll: true }); }, 600);
    }
  });
})();
