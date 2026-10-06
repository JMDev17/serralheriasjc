/* ==========================================================================
   Serralheria SJC — comportamento do site (JavaScript puro, sem dependências)
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var doc = document;
  var $ = function (s, ctx) { return (ctx || doc).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(s)); };
  var onlyDigits = function (v) { return String(v || "").replace(/\D+/g, ""); };

  /* ---------- Contatos: preenche links e textos a partir da configuração ---------- */
  function waUrl(text) {
    return "https://wa.me/" + onlyDigits(CFG.whatsapp) + "?text=" + encodeURIComponent(text || CFG.mensagemPadrao || "");
  }

  // Serviço da página (pelo formulário pré-selecionado), em forma curta: "Portão automático / ..." → "Portão automático"
  function servicoDaPagina() {
    var f = $("form[data-lead-form]");
    var slug = f && f.getAttribute("data-servico");
    var opt = slug && f.querySelector('option[value="' + slug + '"]');
    return opt ? opt.textContent.split(" — ")[0].split(" / ")[0].trim() : "";
  }
  function mensagemOrcamento() {
    var s = servicoDaPagina();
    return "Olá! Vim pelo site e gostaria de solicitar um orçamento" + (s ? " de: " + s : "") + ".";
  }

  if (onlyDigits(CFG.whatsapp)) {
    $$("[data-wa]").forEach(function (a) {
      a.href = waUrl(a.getAttribute("data-wa") || mensagemOrcamento());
      a.target = "_blank";
      a.rel = "noopener";
    });
    // TODOS os botões e links de orçamento vão direto para o WhatsApp, com mensagem do serviço da página.
    // (Sem número configurado, continuam levando ao formulário.)
    $$('a[href*="#orcamento"]').forEach(function (a) {
      a.href = waUrl(mensagemOrcamento());
      a.target = "_blank";
      a.rel = "noopener";
    });
  }
  if (onlyDigits(CFG.telefone)) {
    $$("[data-tel]").forEach(function (a) { a.href = "tel:+" + onlyDigits(CFG.telefone); });
  }
  [["telefone-texto", CFG.telefoneExibicao], ["whatsapp-texto", CFG.whatsapp ? formatPhone(onlyDigits(CFG.whatsapp).replace(/^55/, "")) : ""], ["email-texto", CFG.email]].forEach(function (pair) {
    if (!pair[1]) return;
    $$('[data-biz="' + pair[0] + '"]').forEach(function (el) {
      el.textContent = pair[1];
      if (el.tagName === "A" && pair[0] === "email-texto") el.href = "mailto:" + pair[1];
    });
  });

  // Canais de contato só aparecem quando existem de verdade na configuração
  var temCanal = {
    whatsapp: !!onlyDigits(CFG.whatsapp),
    telefone: !!onlyDigits(CFG.telefone) && !!CFG.telefoneExibicao,
    email: !!CFG.email
  };
  $$("[data-requires]").forEach(function (el) {
    if (temCanal[el.getAttribute("data-requires")]) el.removeAttribute("hidden");
  });
  $$("[data-requires-any]").forEach(function (el) {
    var ok = el.getAttribute("data-requires-any").split(" ").some(function (k) { return temCanal[k]; });
    if (ok) el.removeAttribute("hidden");
  });

  /* ---------- Menu desktop (mega) ---------- */
  var megaBtn = $("[data-mega-toggle]");
  var mega = $("#mega");
  function setMega(open) {
    if (!megaBtn || !mega) return;
    megaBtn.setAttribute("aria-expanded", String(open));
    mega.classList.toggle("is-open", open);
  }
  if (megaBtn && mega) {
    megaBtn.addEventListener("click", function (e) {
      e.preventDefault();
      setMega(megaBtn.getAttribute("aria-expanded") !== "true");
    });
    doc.addEventListener("click", function (e) {
      if (!mega.contains(e.target) && !megaBtn.contains(e.target)) setMega(false);
    });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMega(false); } });
  }

  /* ---------- Menu mobile ---------- */
  var mBtn = $("[data-menu-toggle]");
  var mNav = $("#mobile-nav");
  function setMobile(open) {
    if (!mBtn || !mNav) return;
    mBtn.setAttribute("aria-expanded", String(open));
    mBtn.querySelector(".label").textContent = open ? "Fechar" : "Menu";
    mNav.classList.toggle("is-open", open);
    mNav.toggleAttribute("inert", !open);
    doc.body.classList.toggle("nav-open", open);
  }
  if (mBtn && mNav) {
    mNav.setAttribute("inert", "");
    mBtn.addEventListener("click", function () { setMobile(mBtn.getAttribute("aria-expanded") !== "true"); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") setMobile(false); });
    $$("a", mNav).forEach(function (a) { a.addEventListener("click", function () { setMobile(false); }); });
  }

  /* ---------- CTA fixo no celular ---------- */
  var sticky = $(".sticky-cta");
  if (sticky) {
    var formsVisible = 0;
    var update = function () {
      var show = window.scrollY > Math.min(560, window.innerHeight * 0.7) && formsVisible === 0;
      sticky.classList.toggle("is-visible", show);
    };
    if ("IntersectionObserver" in window) {
      var fo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { formsVisible += en.isIntersecting ? 1 : -1; if (formsVisible < 0) formsVisible = 0; });
        update();
      }, { threshold: 0.05 });
      $$(".form, .site-footer").forEach(function (f) { fo.observe(f); });
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- Sumário: destaca a seção atual ---------- */
  var tocLinks = $$(".article-aside .toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var to = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          tocLinks.forEach(function (a) { a.classList.remove("is-active"); });
          map[en.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach(function (id) { var h = doc.getElementById(id); if (h) to.observe(h); });
  }

  /* ---------- Revelação ao rolar ---------- */
  var reveals = $$(".reveal");
  if (reveals.length) {
    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); ro.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { ro.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  /* ---------- Formulário de orçamento ---------- */
  function formatPhone(d) {
    d = onlyDigits(d).slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  var params = new URLSearchParams(window.location.search);

  $$("form[data-lead-form]").forEach(function (form) {
    var status = $(".form-status", form);
    var phone = form.elements.whatsapp;
    var service = form.elements.servico;

    // Pré-seleção do serviço: ?servico=slug na URL ou data-servico no formulário
    var pre = params.get("servico") || form.getAttribute("data-servico");
    if (service && pre && $('option[value="' + pre + '"]', service)) service.value = pre;

    if (phone) {
      phone.addEventListener("input", function () { phone.value = formatPhone(phone.value); });
    }

    function setError(field, msg) {
      var box = $("#" + field.id + "-err");
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      if (box) box.textContent = msg || "";
    }

    function validate() {
      var ok = true, first = null;
      var nome = form.elements.nome;
      if (!nome.value.trim()) { setError(nome, "Informe seu nome."); ok = false; first = first || nome; } else setError(nome, "");
      if (onlyDigits(phone.value).length < 10) { setError(phone, "Informe um WhatsApp com DDD."); ok = false; first = first || phone; } else setError(phone, "");
      if (!service.value) { setError(service, "Escolha o tipo de serviço."); ok = false; first = first || service; } else setError(service, "");
      if (first) first.focus();
      return ok;
    }

    function show(type, html) {
      status.className = "form-status " + (type === "ok" ? "is-ok" : "is-err");
      status.innerHTML = html;
      status.setAttribute("tabindex", "-1");
      status.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.website && form.elements.website.value) return; // honeypot
      if (!validate()) return;

      var data = new FormData(form);
      data.append("pagina", window.location.pathname);
      var serviceLabel = service.options[service.selectedIndex].text;

      var msg = [
        "Olá! Gostaria de um orçamento.",
        "Nome: " + data.get("nome"),
        "Serviço: " + serviceLabel,
        data.get("bairro") ? "Bairro: " + data.get("bairro") : "",
        data.get("descricao") ? "Detalhes: " + data.get("descricao") : "",
        "Página: " + window.location.pathname
      ].filter(Boolean).join("\n");

      if (window.dataLayer) window.dataLayer.push({ event: "lead_submit", servico: service.value });

      var btn = $('button[type="submit"]', form);

      // Prioridade: WhatsApp. Se também houver endpoint, ele só guarda uma cópia do pedido.
      if (onlyDigits(CFG.whatsapp)) {
        window.open(waUrl(msg), "_blank", "noopener");
        if (CFG.formEndpoint) {
          fetch(CFG.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } }).catch(function () {});
        }
        show("ok", "<strong>Abrimos o WhatsApp com seu pedido pronto.</strong> É só enviar a mensagem — e, se puder, anexe fotos e medidas do local.");
        return;
      }

      if (CFG.formEndpoint) {
        btn.disabled = true;
        fetch(CFG.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            form.reset();
            show("ok", "<strong>Pedido enviado.</strong> Recebemos suas informações e vamos responder pelo WhatsApp informado." +
              (onlyDigits(CFG.whatsapp) ? ' Se quiser, envie fotos do local <a href="' + waUrl(msg) + '" target="_blank" rel="noopener">pelo WhatsApp</a>.' : ""));
          })
          .catch(function () {
            show("err", "Não foi possível enviar agora." + (onlyDigits(CFG.whatsapp) ? ' Tente <a href="' + waUrl(msg) + '" target="_blank" rel="noopener">pelo WhatsApp</a>.' : " Tente novamente em instantes."));
          })
          .then(function () { btn.disabled = false; });
        return;
      }

      if (window.console) console.warn("Formulário sem canal de recebimento: defina whatsapp ou formEndpoint em assets/js/config.js.");
      show("err", "Não foi possível enviar seu pedido agora. Tente novamente em alguns minutos.");
    });
  });

  /* ---------- Medição de cliques nos botões de conversão (GTM/GA4, se instalado) ---------- */
  doc.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-cta]") : null;
    if (el && window.dataLayer) window.dataLayer.push({ event: "cta_click", cta_posicao: el.getAttribute("data-cta"), pagina: window.location.pathname });
  });

  /* ---------- Ano no rodapé ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
