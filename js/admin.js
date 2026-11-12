/* Painel: sessao protegida pelo servidor, CRUD e ordem dos botoes. */
(() => {
  "use strict";
  const defaults = {
    title: "Seu primeiro passo no digital começa aqui.",
    subtitle: "APRENDA • APLIQUE • EVOLUA",
    description: "Conteúdos práticos para transformar ideias em ação, aprender a vender online e desenvolver habilidades no mercado digital.",
    bg: "#f8fbf9", panel: "#ffffff", border: "#e2ebe6",
    button: "#047857", buttonBorder: "#047857", particle: "#10b981", orb: "#059669", titleColor: "#15332c",
    buttons: [{
      id: "primeira-venda", title: "Como fazer a sua primeira venda no digital",
      description: "Um caminho direto para sair do zero: escolha do produto, oferta, divulgação e os primeiros passos para conquistar clientes.",
      tag: "COMECE POR AQUI", url: "", visible: true
    }]
  };
  const colorLabels = {
    bg: "Fundo da página", panel: "Fundo dos cartões", border: "Bordas dos cartões",
    button: "Fundo dos botões", buttonBorder: "Bordas dos botões", particle: "Cor de destaque",
    orb: "Brilhos e botões", titleColor: "Cor do título"
  };
  const vars = {
    bg: "--theme-bg", panel: "--theme-panel", border: "--theme-border", button: "--theme-button",
    buttonBorder: "--theme-button-border", particle: "--theme-particle", orb: "--theme-orb", titleColor: "--theme-title"
  };
  const $ = (id) => document.getElementById(id);
  const make = (tag, className, content) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = content;
    return el;
  };
  let state = JSON.parse(JSON.stringify(defaults));
  let token = "";
  function status(message) { $("saveStatus").textContent = message; }
  function updatePreview() {
    for (const [key, cssVar] of Object.entries(vars)) {
      document.documentElement.style.setProperty(cssVar, state[key]);
      const hex = $("hex-" + key);
      const input = $("color-" + key);
      if (hex) hex.textContent = state[key].toUpperCase();
      if (input) input.value = state[key];
    }
    $("previewTitle").textContent = state.title;
    $("previewDescription").textContent = state.description;
    const list = $("previewButtons");
    list.replaceChildren();
    let count = 0;
    for (const item of state.buttons) {
      if (item.visible === false) continue;
      count += 1;
      const pill = make("div", "preview-pill");
      pill.append(make("span", "", String(count).padStart(2, "0") + "  " + item.title));
      pill.append(make("small", "", item.url.trim() ? "↗" : "SEM LINK"));
      list.append(pill);
    }
    if (!count) list.append(make("p", "preview-empty", "Nenhum botão visível no momento."));
  }
  function textField(labelText, value, max, onInput, multiline, placeholder) {
    const label = make("label");
    label.append(document.createTextNode(labelText));
    const input = document.createElement(multiline ? "textarea" : "input");
    if (!multiline) input.type = "text";
    if (multiline) input.rows = 2;
    input.maxLength = max;
    input.value = value;
    if (placeholder) input.placeholder = placeholder;
    input.addEventListener("input", () => { onInput(input.value); updatePreview(); });
    label.append(input);
    return label;
  }
  function move(index, offset) {
    const target = index + offset;
    if (target < 0 || target >= state.buttons.length) return;
    const item = state.buttons[index];
    state.buttons[index] = state.buttons[target];
    state.buttons[target] = item;
    renderButtons();
    status("Ordem alterada na prévia. Clique em Salvar para publicar.");
  }
  function renderButtons() {
    const list = $("buttons");
    list.replaceChildren();
    state.buttons.forEach((item, index) => {
      const card = make("div", "button-editor");
      const head = make("div", "button-editor-head");
      head.append(make("strong", "", "Botão " + String(index + 1).padStart(2, "0")));
      const tools = make("div", "button-tools");
      const up = make("button", "small-btn", "↑");
      up.type = "button"; up.title = "Mover para cima"; up.setAttribute("aria-label", "Mover botão " + (index + 1) + " para cima");
      up.disabled = index === 0; up.addEventListener("click", () => move(index, -1));
      const down = make("button", "small-btn", "↓");
      down.type = "button"; down.title = "Mover para baixo"; down.setAttribute("aria-label", "Mover botão " + (index + 1) + " para baixo");
      down.disabled = index === state.buttons.length - 1; down.addEventListener("click", () => move(index, 1));
      const remove = make("button", "small-btn danger", "Excluir");
      remove.type = "button"; remove.addEventListener("click", () => {
        if (!window.confirm("Excluir este botão? A exclusão será publicada somente após salvar.")) return;
        state.buttons.splice(index, 1);
        renderButtons();
        status("Botão removido da prévia. Clique em Salvar para publicar.");
      });
      tools.append(up, down, remove); head.append(tools); card.append(head);
      const fields = make("div", "button-fields");
      const title = textField("Nome do botão / conteúdo", item.title, 100, (v) => item.title = v);
      title.classList.add("wide");
      const desc = textField("Descrição", item.description, 300, (v) => item.description = v, true);
      desc.classList.add("wide");
      const tag = textField("Etiqueta", item.tag, 38, (v) => item.tag = v);
      const url = textField("URL de destino (https://...)", item.url, 2048, (v) => item.url = v, false, "https://seusite.com/checkout");
      url.classList.add("wide");
      url.querySelector("input").type = "url";
      url.querySelector("input").inputMode = "url";
      const visibility = make("label", "checkbox-line");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox"; checkbox.checked = item.visible !== false;
      checkbox.addEventListener("change", () => { item.visible = checkbox.checked; updatePreview(); });
      visibility.append(checkbox, document.createTextNode("Mostrar este botão na página"));
      fields.append(title, desc, tag, url); card.append(fields, visibility); list.append(card);
    });
    if (!state.buttons.length) {
      list.append(make("p", "preview-empty", "Nenhum botão cadastrado. Clique em “Adicionar botão” para criar o primeiro."));
    }
    $("addButton").disabled = state.buttons.length >= 24;
    updatePreview();
  }
  function renderEditor() {
    $("title").value = state.title;
    $("subtitle").value = state.subtitle;
    $("description").value = state.description;
    renderButtons();
  }
  const colorRoot = $("colors");
  for (const [key, labelText] of Object.entries(colorLabels)) {
    const card = make("div", "color-card");
    const label = make("label", "", labelText);
    const code = make("code", "", state[key].toUpperCase()); code.id = "hex-" + key;
    label.append(code);
    const input = document.createElement("input");
    input.type = "color"; input.id = "color-" + key; input.setAttribute("aria-label", labelText);
    input.value = state[key];
    input.addEventListener("input", () => { state[key] = input.value; updatePreview(); });
    card.append(label, input); colorRoot.append(card);
  }
  for (const key of ["title","subtitle","description"]) {
    $(key).addEventListener("input", (e) => { state[key] = e.target.value; updatePreview(); });
  }
  $("addButton").addEventListener("click", () => {
    if (state.buttons.length >= 24) return;
    const id = "item-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
    state.buttons.push({ id, title: "Novo conteúdo digital", description: "", tag: "NOVO", url: "", visible: true });
    renderButtons();
    $("buttons").lastElementChild.scrollIntoView({ behavior: "smooth", block: "nearest" });
    status("Novo botão criado na prévia. Configure e salve para publicar.");
  });
  $("resetColors").addEventListener("click", () => {
    for (const key of Object.keys(colorLabels)) state[key] = defaults[key];
    updatePreview();
    status("Cores originais restauradas na prévia. Salve para publicar.");
  });
  async function readResponse(response) {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(result.error || "Erro HTTP " + response.status);
    return result;
  }
  async function loadSettings() {
    const result = await readResponse(await fetch("/api/theme", {cache:"no-store"}));
    state = { ...JSON.parse(JSON.stringify(defaults)), ...(result.theme || {}) };
    state.buttons = Array.isArray(state.buttons) ? state.buttons.map((b) => ({...b})) : JSON.parse(JSON.stringify(defaults.buttons));
    renderEditor();
  }
  function setLoggedIn(ok) {
    token = ok ? "cookie-session" : "";
    $("editor").hidden = !ok;
    $("logout").hidden = !ok;
    $("login").hidden = ok;
  }
  $("login").addEventListener("click", async () => {
    const button = $("login");
    button.disabled = true;
    $("authStatus").textContent = "Autenticando...";
    try {
      await readResponse(await fetch("/api/admin-login", {
        method: "POST",
        credentials: "same-origin",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email: $("email").value.trim(),password: $("password").value})
      }));
      await loadSettings();
      setLoggedIn(true);
      $("password").value = "";
      $("authStatus").textContent = "✓ Administrador autenticado.";
    } catch (error) {
      setLoggedIn(false);
      $("authStatus").textContent = error.message;
    } finally { button.disabled = false; }
  });
  $("logout").addEventListener("click", async () => {
    try { await fetch("/api/admin-login", {method:"DELETE",credentials:"same-origin"}); }
    catch { /* A interface tambem encerra a sessao visual. */ }
    setLoggedIn(false);
    $("authStatus").textContent = "Sessão encerrada.";
    status("");
  });
  $("password").addEventListener("keydown", (e) => { if (e.key === "Enter") $("login").click(); });
  $("save").addEventListener("click", async () => {
    const button = $("save");
    if (!token) { status("Entre no painel antes de salvar."); return; }
    if (!state.title.trim() || !state.subtitle.trim() || !state.description.trim()) {
      status("Preencha o título, a frase de destaque e a descrição."); return;
    }
    if (state.buttons.some((item) => !item.title.trim())) {
      status("Todos os botões precisam ter um nome."); return;
    }
    button.disabled = true;
    status("Publicando alterações...");
    try {
      const result = await readResponse(await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ theme: state })
      }));
      state = result.theme;
      renderEditor();
      status("✓ Publicado! As alterações já estão disponíveis na página pública.");
    } catch (error) {
      status("Não foi possível publicar: " + error.message);
    } finally { button.disabled = false; }
  });
  updatePreview();
  // Recupera sessão segura já autenticada ao atualizar a página.
  (async () => {
    try {
      await readResponse(await fetch("/api/admin-check", {credentials:"same-origin",cache:"no-store"}));
      await loadSettings();
      setLoggedIn(true);
      $("authStatus").textContent = "✓ Sessão administrativa restaurada.";
    } catch { /* Login será necessário. */ }
  })();
})();
