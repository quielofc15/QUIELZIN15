/* Página pública digital: conteúdo vem do painel via /api/theme. */
(() => {
  "use strict";
  const defaults = {
    title: "Seu primeiro passo no digital começa aqui.",
    subtitle: "APRENDA • APLIQUE • EVOLUA",
    description: "Conteúdos práticos para transformar ideias em ação, aprender a vender online e desenvolver habilidades no mercado digital.",
    bg: "#090b16", panel: "#13172b", border: "#343b5f",
    button: "#1a2040", buttonBorder: "#7772ed", particle: "#aca8ff", orb: "#7566ff", titleColor: "#f7f8ff",
    buttons: [{
      id: "primeira-venda", title: "Como fazer a sua primeira venda no digital",
      description: "Um caminho direto para sair do zero: escolha do produto, oferta, divulgação e os primeiros passos para conquistar clientes.",
      tag: "COMECE POR AQUI", url: "", visible: true
    }]
  };
  const vars = {
    bg: "--theme-bg", panel: "--theme-panel", border: "--theme-border", button: "--theme-button",
    buttonBorder: "--theme-button-border", particle: "--theme-particle", orb: "--theme-orb", titleColor: "--theme-title"
  };
  const $ = (id) => document.getElementById(id);
  function safeUrl(input) {
    if (!input || typeof input !== "string") return "";
    try {
      const url = new URL(input);
      return ["http:", "https:"].includes(url.protocol) && url.hostname ? url.href : "";
    } catch { return ""; }
  }
  function make(tag, className, content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = content;
    return el;
  }
  function render(data) {
    const theme = { ...defaults, ...data };
    for (const [key, cssVar] of Object.entries(vars)) {
      if (typeof theme[key] === "string" && /^#[0-9a-fA-F]{6}$/.test(theme[key])) {
        document.documentElement.style.setProperty(cssVar, theme[key]);
      }
    }
    $("siteTitle").textContent = theme.title || defaults.title;
    $("siteSubtitle").textContent = theme.subtitle || defaults.subtitle;
    $("siteDescription").textContent = theme.description || defaults.description;
    const items = Array.isArray(theme.buttons) ? theme.buttons.filter((b) => b && b.visible !== false) : defaults.buttons;
    const list = $("buttonList");
    list.replaceChildren();
    for (const [index, item] of items.entries()) {
      const card = make("article", "course-card" + (index === 0 ? " featured" : ""));
      const top = make("div", "card-top");
      top.append(make("span", "card-number", String(index + 1).padStart(2, "0") + (index === 0 ? " / DESTAQUE" : " / CONTEÚDO")));
      if (item.tag) top.append(make("span", "card-tag", item.tag));
      card.append(top);
      card.append(make("div", "card-symbol", index === 0 ? "↗" : "✦"));
      card.lastChild.setAttribute("aria-hidden", "true");
      card.append(make("h3", "", item.title || "Conteúdo digital"));
      if (item.description) card.append(make("p", "", item.description));
      const href = safeUrl(item.url);
      const cta = make(href ? "a" : "span", "course-action" + (href ? "" : " course-action-disabled"));
      if (href) {
        cta.href = href;
        cta.target = "_blank";
        cta.rel = "noopener noreferrer";
      } else {
        cta.setAttribute("aria-label", "Link ainda não configurado para " + item.title);
      }
      cta.append(document.createTextNode(href ? "Acessar conteúdo" : "Link em configuração"));
      const arrow = make("span", "", "↗");
      arrow.setAttribute("aria-hidden", "true");
      cta.append(arrow);
      card.append(cta);
      list.append(card);
    }
    if (items.length === 0) {
      const empty = make("div", "empty-state");
      empty.append(make("h3", "", "Novos conteúdos em breve"));
      empty.append(make("p", "", "Volte em breve para conhecer os próximos lançamentos."));
      list.append(empty);
    }
    $("courseCount").textContent = String(items.length).padStart(2,"0") + (items.length === 1 ? " conteúdo" : " conteúdos");
  }
  $("footerYear").textContent = new Date().getFullYear();
  render(defaults);
  fetch("/api/theme", { cache: "no-store" })
    .then((response) => { if (!response.ok) throw Error("API indisponível"); return response.json(); })
    .then((json) => { if (json.theme) render(json.theme); })
    .catch(() => { /* Mantém o conteúdo inicial quando offline ou em preview estático. */ });
})();
