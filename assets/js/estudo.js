/* ==========================================================================
   Estudos com dados próprios — JavaScript puro
   --------------------------------------------------------------------------
   Lê um arquivo JSON com orçamentos REAIS (anonimizados) e gera as tabelas
   do estudo. Nenhum dado vem incluído. Uso:

   <div data-estudo="/dados/precos-portoes.json"
        data-agrupar="tipo"           // campo para agrupar (tipo, material, regiao...)
        data-min-amostra="5"></div>   // grupos com menos registros não são exibidos

   Formato do JSON (um objeto por orçamento):
   [
     {
       "data": "AAAA-MM",
       "tipo": "de-correr | basculante | pivotante | ...",
       "largura_m": 0,
       "altura_m": 0,
       "material": "pintado | galvanizado",
       "automatizado": true,
       "valor_min": 0,          // faixa orçada (R$)
       "valor_max": 0,
       "prazo_dias": 0,
       "regiao": "Centro | Norte | Sul | Leste | Oeste | Sudeste"
     }
   ]
   Não publique nome, endereço ou qualquer dado que identifique o cliente.
   ========================================================================== */
(function () {
  "use strict";

  function mediana(arr) {
    if (!arr.length) return null;
    var s = arr.slice().sort(function (a, b) { return a - b; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  var brl = function (v) { return v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); };
  var num = function (v, d) { return v == null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: d || 0 }); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  function render(el, dados) {
    var campo = el.getAttribute("data-agrupar") || "tipo";
    var minN = parseInt(el.getAttribute("data-min-amostra") || "5", 10);
    var grupos = {};
    dados.forEach(function (d) {
      var k = d[campo] == null ? "não informado" : String(d[campo]);
      (grupos[k] = grupos[k] || []).push(d);
    });

    var linhas = Object.keys(grupos).sort().map(function (k) {
      var g = grupos[k];
      if (g.length < minN) return "";
      var meio = g.map(function (d) { return (d.valor_min + d.valor_max) / 2; });
      var m2 = g.filter(function (d) { return d.largura_m && d.altura_m; })
                .map(function (d) { return ((d.valor_min + d.valor_max) / 2) / (d.largura_m * d.altura_m); });
      var prazo = g.filter(function (d) { return d.prazo_dias; }).map(function (d) { return d.prazo_dias; });
      return "<tr><th scope=\"row\">" + esc(k) + "</th>" +
        "<td data-label=\"Amostra\">" + g.length + "</td>" +
        "<td data-label=\"Mediana\">" + brl(mediana(meio)) + "</td>" +
        "<td data-label=\"Mediana por m²\">" + brl(mediana(m2)) + "</td>" +
        "<td data-label=\"Prazo mediano\">" + (prazo.length ? num(mediana(prazo)) + " dias" : "—") + "</td></tr>";
    }).join("");

    if (!linhas) {
      el.innerHTML = "<p class=\"muted\">Amostra ainda insuficiente para publicar este recorte.</p>";
      return;
    }
    el.innerHTML =
      "<div class=\"table-wrap table-stack\" tabindex=\"0\" role=\"region\" aria-label=\"Resultados do estudo\"><table>" +
      "<thead><tr><th scope=\"col\">" + esc(campo) + "</th><th scope=\"col\">Amostra</th><th scope=\"col\">Mediana</th><th scope=\"col\">Mediana por m²</th><th scope=\"col\">Prazo mediano</th></tr></thead>" +
      "<tbody>" + linhas + "</tbody></table></div>" +
      "<p class=\"table-note\">Total de " + dados.length + " orçamentos. Grupos com menos de " + minN + " registros foram omitidos.</p>";
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-estudo]"), function (el) {
    fetch(el.getAttribute("data-estudo"))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (dados) { render(el, Array.isArray(dados) ? dados : []); })
      .catch(function () { el.innerHTML = "<p class=\"muted\">Dados indisponíveis.</p>"; });
  });
})();
