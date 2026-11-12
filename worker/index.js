// Cloudflare Worker for Digital: secured admin APIs + static assets.
// Credentials are Cloudflare secrets. No private value is committed to GitHub.
const defaultTheme = {
  title: "Seu primeiro passo no digital começa aqui.",
  subtitle: "APRENDA • APLIQUE • EVOLUA",
  description: "Conteúdos práticos para transformar ideias em ação, aprender a vender online e desenvolver habilidades no mercado digital.",
  bg: "#080d13", panel: "#111a23", border: "#233741",
  button: "#0db983", buttonBorder: "#39e5ad", particle: "#a5f7d0",
  orb: "#18cc92", titleColor: "#f4fff9",
  buttons: [{
    id: "primeira-venda",
    title: "Como fazer a sua primeira venda no digital",
    description: "Um caminho direto para sair do zero: escolha do produto, oferta, divulgação e os primeiros passos para conquistar clientes.",
    tag: "COMECE POR AQUI", url: "", visible: true
  }]
};
const colors = ["bg", "panel", "border", "button", "buttonBorder", "particle", "orb", "titleColor"];
const previousPalettes = [{"bg":"#f8fbf9","panel":"#ffffff","border":"#e2ebe6","button":"#047857","buttonBorder":"#047857","particle":"#10b981","orb":"#059669","titleColor":"#15332c"},{"bg":"#090b16","panel":"#13172b","border":"#343b5f","button":"#1a2040","buttonBorder":"#7772ed","particle":"#aca8ff","orb":"#7566ff","titleColor":"#f7f8ff"}];
const text = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {status, headers: {...jsonHeaders, ...extraHeaders}});
}
function allowedUrl(input) {
  if (!input) return true;
  try {
    const url = new URL(input);
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname;
  } catch { return false; }
}
function normalize(raw) {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const out = {...defaultTheme};
  for (const key of colors) if (typeof value[key] === "string" && /^#[0-9a-f]{6}$/i.test(value[key])) out[key] = value[key];
  // Converte apenas cores padrao antigas (claro/roxo); edicoes proprias sao mantidas.
  for(const key of colors) {
    if(previousPalettes.some(palette => out[key] === palette[key])) out[key]=defaultTheme[key];
  }
  for (const [key, limit] of [["title",110],["subtitle",90],["description",480]]) {
    const v = text(value[key], limit);
    if (v && v !== "🤍 AMO A LORENA 🤍") out[key] = v;
  }
  if (Array.isArray(value.buttons)) {
    out.buttons = value.buttons.slice(0,24).map((item,index) => {
      if (!item || typeof item !== "object" || !text(item.title,100) || !allowedUrl(text(item.url,2048))) return null;
      return {
        id: text(item.id,64) || "item-" + index,
        title: text(item.title,100),
        description: text(item.description,300),
        tag: text(item.tag,38),
        url: text(item.url,2048),
        visible: item.visible !== false
      };
    }).filter(Boolean);
  }
  return out;
}
function validate(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Configuração inválida.");
  for (const [key, limit] of [["title",110],["subtitle",90],["description",480]]) {
    if (typeof input[key] !== "string" || !input[key].trim() || input[key].trim().length > limit) throw Error("Preencha o campo: " + key);
  }
  for (const key of colors) if (typeof input[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(input[key])) throw Error("Cor inválida: " + key);
  if (!Array.isArray(input.buttons) || input.buttons.length > 24) throw Error("Máximo de 24 botões.");
  const ids = new Set();
  for (const item of input.buttons) {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw Error("Botão inválido.");
    if (typeof item.id !== "string" || !item.id.trim() || item.id.length > 64 || ids.has(item.id)) throw Error("Identificador duplicado ou inválido.");
    ids.add(item.id);
    if (typeof item.title !== "string" || !item.title.trim() || item.title.length > 100) throw Error("Nome de botão inválido.");
    if (typeof item.description !== "string" || item.description.length > 300) throw Error("Descrição de botão muito longa.");
    if (typeof item.tag !== "string" || item.tag.length > 38) throw Error("Etiqueta de botão muito longa.");
    if (typeof item.url !== "string" || item.url.length > 2048 || !allowedUrl(item.url.trim())) throw Error("URL inválida. Use https:// ou http://.");
    if (typeof item.visible !== "boolean") throw Error("Visibilidade inválida.");
  }
  return normalize(input);
}
const enc = new TextEncoder();
function b64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function unb64url(input) {
  const padded = input.replace(/-/g,"+").replace(/_/g,"/") + "=".repeat((4-input.length%4)%4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
async function mac(secret, message) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}
function equal(a,b) {
  if (a.length !== b.length) return false;
  let diff = 0; for (let i=0;i<a.length;i++) diff |= a[i]^b[i];
  return diff === 0;
}
function adminEmail(env) { return (env.ADMIN_EMAIL || "").trim().toLowerCase(); }
function missingAdminSecrets(env) {
  return ["ADMIN_EMAIL","ADMIN_PASSWORD","ADMIN_SESSION_SECRET"].filter((key) =>
    typeof env[key] !== "string" || !env[key].trim()
  );
}
function adminReady(env) { return missingAdminSecrets(env).length === 0; }
async function validPassword(input, env) {
  if (typeof input !== "string" || input.length > 256 || !env.ADMIN_PASSWORD) return false;
  // Password remains encrypted as a Cloudflare Secret; comparing hashes avoids branching on character positions.
  const expected = new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(env.ADMIN_PASSWORD)));
  const actual = new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(input)));
  return equal(expected,actual);
}
async function sessionToken(env) {
  const payload = b64url(enc.encode(JSON.stringify({e:adminEmail(env),x:Math.floor(Date.now()/1000)+8*3600,n:crypto.randomUUID()})));
  return payload + "." + b64url(await mac(env.ADMIN_SESSION_SECRET,payload));
}
function cookie(value, request, age) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return "digital_admin_session=" + value + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + age + secure;
}
function readCookie(request) {
  const raw = request.headers.get("cookie") || "";
  for (const item of raw.split(";")) {
    const str = item.trim();
    if (str.startsWith("digital_admin_session=")) return str.slice("digital_admin_session=".length);
  }
  return "";
}
async function authorized(request, env) {
  if (!adminReady(env)) return false;
  const token = readCookie(request);
  const match = /^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/.exec(token);
  if (!match || match[1].length > 4096) return false;
  try {
    const expected = await mac(env.ADMIN_SESSION_SECRET, match[1]);
    if (!equal(expected, unb64url(match[2]))) return false;
    const payload = JSON.parse(new TextDecoder().decode(unb64url(match[1])));
    return payload.e === adminEmail(env) && Number.isFinite(payload.x) && payload.x > Math.floor(Date.now()/1000);
  } catch { return false; }
}
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  const site = request.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}
async function parseBody(request,max=65536) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > max) throw Error("Dados muito grandes.");
  const raw = await request.text();
  if (raw.length > max) throw Error("Dados muito grandes.");
  try { return JSON.parse(raw); }
  catch { throw Error("JSON inválido."); }
}
async function readSaved(env) {
  if (env.SITE_CONFIG) return await env.SITE_CONFIG.get("digital_settings", "json");
  if (env.SUPABASE_URL && env.SUPABASE_SECRET_KEY) {
    const base = env.SUPABASE_URL.replace(/\/+$/,"");
    const key = env.SUPABASE_SECRET_KEY;
    const r = await fetch(base+"/rest/v1/site_theme?id=eq.1&select=settings",{
      headers:{apikey:key,Authorization:"Bearer "+key}
    });
    if (!r.ok) throw Error("Não foi possível consultar o Supabase.");
    const rows = await r.json();
    return rows[0]?.settings || null;
  }
  return null;
}
async function writeSaved(env,settings) {
  if (env.SITE_CONFIG) {
    await env.SITE_CONFIG.put("digital_settings",JSON.stringify(settings));
    return;
  }
  if (env.SUPABASE_URL && env.SUPABASE_SECRET_KEY) {
    const base = env.SUPABASE_URL.replace(/\/+$/,"");
    const key = env.SUPABASE_SECRET_KEY;
    const response = await fetch(base+"/rest/v1/site_theme?on_conflict=id",{
      method:"POST",
      headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify({id:1,settings})
    });
    if (!response.ok) throw Error("Não foi possível salvar no Supabase.");
    return;
  }
  throw Error("Conecte um KV chamado SITE_CONFIG ou configure o Supabase no Cloudflare.");
}
export default {
  async fetch(request,env) {
    const path = new URL(request.url).pathname;
    if (!path.startsWith("/api/")) return env.ASSETS.fetch(request);
    const method = request.method;
    if (path === "/api/admin-config" && method === "GET") {
      return json({panel:true,provider:"cloudflare",authConfigured:adminReady(env),missingSecrets:missingAdminSecrets(env),storageConfigured:!!(env.SITE_CONFIG || (env.SUPABASE_URL && env.SUPABASE_SECRET_KEY))});
    }
    if (path === "/api/admin-login") {
      if (method === "DELETE") {
        if (!sameOrigin(request)) return json({error:"Origem inválida"},403);
        return json({ok:true},200,{"set-cookie":cookie("",request,0)});
      }
      if (method !== "POST") return json({error:"Método não permitido"},405);
      if (!sameOrigin(request)) return json({error:"Origem inválida"},403);
      if (!adminReady(env)) return json({error:"Variáveis ausentes ou indisponíveis neste deploy: " + missingAdminSecrets(env).join(", ") + ". Confira os Secrets e publique a versão atual."},503);
      try {
        const body = await parseBody(request,2048);
        const passwordOk = await validPassword(body?.password,env);
        if (!passwordOk || typeof body?.email !== "string" || body.email.trim().toLowerCase() !== adminEmail(env)) {
          return json({error:"E-mail ou senha incorretos."},401);
        }
        return json({ok:true},200,{"set-cookie":cookie(await sessionToken(env),request,8*3600)});
      } catch (error) { return json({error:error.message},400); }
    }
    if (path === "/api/admin-check") {
      if (method !== "GET") return json({error:"Método não permitido"},405);
      if (!adminReady(env)) return json({error:"Configure o acesso administrativo nos Secrets."},503);
      return await authorized(request,env) ? json({ok:true}) : json({error:"Sessão inválida."},401);
    }
    if (path === "/api/theme") {
      if (method === "GET") {
        try { return json({theme:normalize(await readSaved(env))}); }
        catch (error) { console.error("theme read",error); return json({error:"Não foi possível carregar as configurações."},503); }
      }
      if (method !== "PUT") return json({error:"Método não permitido"},405);
      if (!sameOrigin(request)) return json({error:"Origem inválida"},403);
      if (!await authorized(request,env)) return json({error:"Faça login no painel."},401);
      try {
        const body = await parseBody(request);
        const theme = validate(body?.theme);
        await writeSaved(env,theme);
        return json({success:true,theme});
      } catch(error) {
        const status = /Conecte um KV|Não foi possível salvar/.test(error.message) ? 503 : 400;
        return json({error:error.message},status);
      }
    }
    return json({error:"Rota não encontrada."},404);
  }
};
