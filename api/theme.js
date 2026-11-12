// Configuracao publica e administracao do catalogo digital.
// As credenciais sensiveis ficam apenas no servidor.
const defaults = {
  title: "Seu primeiro passo no digital começa aqui.",
  subtitle: "APRENDA • APLIQUE • EVOLUA",
  description: "Conteúdos práticos para transformar ideias em ação, aprender a vender online e desenvolver habilidades no mercado digital.",
  bg: "#090b16", panel: "#13172b", border: "#343b5f",
  button: "#1a2040", buttonBorder: "#7772ed", particle: "#aca8ff",
  orb: "#7566ff", titleColor: "#f7f8ff",
  buttons: [{
    id: "primeira-venda",
    title: "Como fazer a sua primeira venda no digital",
    description: "Um caminho direto para sair do zero: escolha do produto, oferta, divulgação e os primeiros passos para conquistar clientes.",
    tag: "COMECE POR AQUI",
    url: "",
    visible: true
  }]
};
const colorKeys = ["bg","panel","border","button","buttonBorder","particle","orb","titleColor"];
const legacyTitle = "🤍 AMO A LORENA 🤍";
const text = (value, limit) => typeof value === "string" ? value.trim().slice(0, limit) : "";
function validUrl(value) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return (u.protocol === "https:" || u.protocol === "http:") && Boolean(u.hostname);
  } catch { return false; }
}
function normalize(saved) {
  const source = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  const out = { ...defaults };
  for (const k of colorKeys) {
    if (typeof source[k] === "string" && /^#[0-9a-fA-F]{6}$/.test(source[k])) out[k] = source[k];
  }
  for (const [key, limit] of [["title",110],["subtitle",90],["description",480]]) {
    const value = text(source[key], limit);
    if (value && value !== legacyTitle) out[key] = value;
  }
  if (Array.isArray(source.buttons)) {
    out.buttons = source.buttons.slice(0, 24).map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const title = text(item.title, 100);
      const url = text(item.url, 2048);
      if (!title || !validUrl(url)) return null;
      return {
        id: text(item.id, 64) || "item-" + i,
        title,
        description: text(item.description, 300),
        tag: text(item.tag, 38),
        url,
        visible: item.visible !== false
      };
    }).filter(Boolean);
  }
  return out;
}
function validate(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Configuração inválida.");
  for (const [key, limit] of [["title",110],["subtitle",90],["description",480]]) {
    if (typeof input[key] !== "string" || !input[key].trim() || input[key].trim().length > limit) {
      throw Error("Preencha corretamente o campo: " + key);
    }
  }
  for (const key of colorKeys) {
    if (typeof input[key] !== "string" || !/^#[0-9a-fA-F]{6}$/.test(input[key])) {
      throw Error("Cor inválida: " + key);
    }
  }
  if (!Array.isArray(input.buttons) || input.buttons.length > 24) throw Error("Limite de 24 botões por página.");
  const ids = new Set();
  for (const item of input.buttons) {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw Error("Botão inválido.");
    if (!text(item.id, 64) || item.id.length > 64 || ids.has(item.id)) throw Error("IDs dos botões inválidos ou duplicados.");
    ids.add(item.id);
    if (!text(item.title, 100) || item.title.trim().length > 100) throw Error("Cada botão precisa ter um nome de até 100 caracteres.");
    if (typeof item.description !== "string" || item.description.length > 300) throw Error("Descrição do botão muito longa.");
    if (typeof item.tag !== "string" || item.tag.length > 38) throw Error("Etiqueta do botão muito longa.");
    if (typeof item.url !== "string" || item.url.length > 2048 || !validUrl(item.url.trim())) {
      throw Error("Use uma URL HTTP ou HTTPS válida, ou deixe em branco.");
    }
    if (typeof item.visible !== "boolean") throw Error("Visibilidade inválida.");
  }
  return normalize(input);
}
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "PUT") return res.status(405).json({ error: "Método não permitido" });
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return res.status(503).json({ error: "Configure SUPABASE_URL e SUPABASE_SECRET_KEY na Vercel." });
  const headers = { apikey: key, Authorization: "Bearer " + key };
  try {
    if (req.method === "GET") {
      const response = await fetch(url + "/rest/v1/site_theme?id=eq.1&select=settings", { headers });
      if (!response.ok) throw Error("Leitura do Supabase falhou: " + response.status);
      const rows = await response.json();
      return res.status(200).json({ theme: normalize(rows[0]?.settings) });
    }
    const token = (req.headers.authorization || "").match(/^Bearer (.+)$/)?.[1];
    if (!token) return res.status(401).json({ error: "Entre como administrador." });
    const auth = await fetch(url + "/auth/v1/user", { headers: { apikey: key, Authorization: "Bearer " + token } });
    if (!auth.ok) return res.status(401).json({ error: "Sessão expirada ou inválida." });
    const user = await auth.json();
    const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!admin || user.email?.toLowerCase() !== admin || !user.email_confirmed_at) {
      return res.status(403).json({ error: "Conta sem acesso administrativo." });
    }
    let settings;
    try { settings = validate(req.body?.theme); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    const response = await fetch(url + "/rest/v1/site_theme?on_conflict=id", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: 1, settings })
    });
    if (!response.ok) throw Error("Gravação no Supabase falhou: " + response.status);
    return res.status(200).json({ success: true, theme: settings });
  } catch (error) {
    console.error("API digital:", error);
    return res.status(500).json({ error: "Não foi possível acessar a configuração do site. Confira a tabela site_theme." });
  }
};
