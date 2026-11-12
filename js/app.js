/* Vitrine DIGITAL: renderização segura dos conteúdos configurados no painel. */
(() => {
  "use strict";
  const defaults = {
    title: "Seu primeiro passo no digital começa aqui.",
    subtitle: "APRENDA • APLIQUE • EVOLUA",
    description: "Conteúdos práticos para transformar ideias em ação, aprender a vender online e desenvolver habilidades no mercado digital.",
    bg: "#f8fbf9", panel: "#ffffff", border: "#e2ebe6", button: "#047857", buttonBorder: "#047857",
    particle: "#10b981", orb: "#059669", titleColor: "#15332c",
    buttons: [{ id: "primeira-venda", title: "Como fazer a sua primeira venda no digital",
      description: "Um caminho direto para sair do zero: escolha do produto, oferta, divulgação e os primeiros passos para conquistar clientes.",
      tag: "COMECE POR AQUI", url: "", visible: true }]
  };
  const oldPalette = { bg:"#090b16",panel:"#13172b",border:"#343b5f",button:"#1a2040",buttonBorder:"#7772ed",particle:"#aca8ff",orb:"#7566ff",titleColor:"#f7f8ff" };
  const vars = {bg:"--theme-bg",panel:"--theme-panel",border:"--theme-border",button:"--theme-button",buttonBorder:"--theme-button-border",particle:"--theme-particle",orb:"--theme-orb",titleColor:"--theme-title"};
  const $ = id => document.getElementById(id);
  function safeUrl(input) {
    if (typeof input !== "string" || !input.trim()) return "";
    try {
      const u = new URL(input.trim());
      return (u.protocol === "https:" || u.protocol === "http:") && u.hostname ? u.href : "";
    } catch { return ""; }
  }
  function el(tag,className,text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function makeAction(item) {
    const href = safeUrl(item.url);
    const node = el(href ? "a" : "span", "course-action" + (href ? "" : " course-action-disabled"));
    if (href) {
      node.href = href;
      node.target = "_blank";
      node.rel = "noopener noreferrer";
      node.setAttribute("aria-label","Acessar " + item.title);
    } else {
      node.setAttribute("aria-label","Acesso em preparação para " + item.title);
    }
    const texts = el("span","course-action-text");
    texts.append(el("span","course-action-title",href ? "Acessar conteúdo" : "Acesso em preparação"));
    texts.append(el("span","course-action-subtitle",href ? "Ver detalhes e condições" : "O link ainda não foi disponibilizado"));
    const arrow = el("span","course-action-icon",href ? "↗" : "→");
    arrow.setAttribute("aria-hidden","true");
    node.append(texts,arrow);
    return node;
  }
  function makeArt(item,index,featured) {
    const art = el("div","course-art"+(featured?" featured-art":""));
    art.setAttribute("aria-hidden","true");
    const top = el("div","art-top");
    top.append(el("span","", "CONTEÚDO " + String(index + 1).padStart(2,"0")));
    top.append(el("span","art-glyph","✳"));
    const center = el("div","art-large");
    // Arte acompanha o item movido no painel; não presume qual curso está em primeiro lugar.
    const title = String(item.title || "Conteúdo digital").trim().split(/\s+/).slice(0,4);
    const midpoint = Math.max(1, Math.ceil(title.length / 2));
    center.append(document.createTextNode(title.slice(0,midpoint).join(" ")));
    center.append(document.createElement("br"));
    center.append(document.createTextNode(title.slice(midpoint).join(" ") || "digital"));
    center.append(el("span","art-dot","."));
    art.append(top,center,el("div","art-bottom","DIGITAL / APRENDA NA PRÁTICA"));
    return art;
  }
  function makeCard(item,index) {
    const featured=index===0;
    const card=el("article","course-card"+(featured?" featured":""));
    card.append(makeArt(item,index,featured));
    const content=el("div","course-content");
    if(item.tag) content.append(el("span","card-tag",String(item.tag)));
    content.append(el("div","course-eyebrow",featured?"CURSO EM DESTAQUE":"CONTEÚDO DIGITAL"));
    content.append(el("h3","",item.title || "Conteúdo digital"));
    if(item.description) content.append(el("p","",item.description));
    if(featured) {
      const meta=el("div","course-meta");
      meta.append(el("span","","✓ Conteúdo digital"));
      if (item.id === "primeira-venda" || /primeira venda/i.test(item.title)) meta.append(el("span","","✓ Para iniciantes"));
      content.append(meta);
    }
    content.append(makeAction(item));
    card.append(content);
    return card;
  }
  function render(raw) {
    const input=raw && typeof raw==="object"?raw:{};
    const theme={...defaults,...input};
    // Upgrade only the original complete dark default palette. Personalized palettes stay untouched.
    if(Object.entries(oldPalette).every(([key,value])=>theme[key]===value)) {
      for(const key of Object.keys(oldPalette)) theme[key]=defaults[key];
    }
    for(const [key,prop] of Object.entries(vars)) if(typeof theme[key]==="string"&&/^#[0-9a-f]{6}$/i.test(theme[key])) document.documentElement.style.setProperty(prop,theme[key]);
    $("siteTitle").textContent=theme.title || defaults.title;
    $("siteSubtitle").textContent=theme.subtitle || defaults.subtitle;
    $("siteDescription").textContent=theme.description || defaults.description;
    const items=(Array.isArray(theme.buttons)?theme.buttons:defaults.buttons).filter(b=>b && b.visible!==false && typeof b.title==="string" && b.title.trim());
    const list=$("buttonList");
    list.replaceChildren(...items.map((item,index)=>makeCard(item,index)));
    if(!items.length){
      const empty=el("div","empty-state");
      empty.append(el("div","empty-icon","✧"));
      empty.append(el("h3","","Novos conteúdos a caminho"));
      empty.append(el("p","","Estamos preparando novas oportunidades de aprendizado. Volte em breve."));
      list.append(empty);
    }
    $("courseCount").textContent=String(items.length).padStart(2,"0")+(items.length===1?" conteúdo":" conteúdos");
  }
  $("footerYear").textContent=new Date().getFullYear();
  render(defaults);
  fetch("/api/theme",{cache:"no-store"})
    .then(r=>{if(!r.ok)throw Error("Temporariamente indisponível");return r.json();})
    .then(d=>{if(d && d.theme)render(d.theme);})
    .catch(()=>{/* mantém conteúdo padrão em modo estático/offline */});
})();
