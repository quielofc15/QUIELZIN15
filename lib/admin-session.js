// Autenticacao do painel. Nenhuma senha ou segredo e enviada ao navegador.
const crypto = require("node:crypto");
const COOKIE = "digital_admin_session";
const TTL_SECONDS = 8 * 60 * 60;
function configured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_SESSION_SECRET);
}
function email() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}
function checkPassword(candidate) {
  const stored = process.env.ADMIN_PASSWORD_HASH || "";
  if (typeof candidate !== "string" || candidate.length > 256 || !/^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(stored)) return false;
  const [salt, expected] = stored.split(":");
  const actual = crypto.scryptSync(candidate, Buffer.from(salt, "hex"), 64, { N: 16384, r: 8, p: 1 });
  const expectedBuffer = Buffer.from(expected, "hex");
  return crypto.timingSafeEqual(actual, expectedBuffer);
}
function sign(message) {
  return crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "").update(message).digest("base64url");
}
function createSession() {
  const body = Buffer.from(JSON.stringify({ email: email(), exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })).toString("base64url");
  return body + "." + sign(body);
}
function getCookie(req) {
  const raw = req.headers.cookie || "";
  for (const entry of raw.split(";")) {
    const trimmed = entry.trim();
    if (trimmed.startsWith(COOKIE + "=")) return trimmed.slice(COOKIE.length + 1);
  }
  return "";
}
function isAuthenticated(req) {
  if (!configured()) return false;
  const value = getCookie(req);
  const match = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(value);
  if (!match) return false;
  const expected = Buffer.from(sign(match[1]));
  const supplied = Buffer.from(match[2]);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return false;
  try {
    const data = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
    return data.email === email() && Number.isFinite(data.exp) && data.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}
function cookie(value, req, maxAge) {
  // HTTPS no deploy; localhost HTTP e aceito durante desenvolvimento.
  const secure = req.headers["x-forwarded-proto"] === "https" || (req.headers.host && !/^localhost(?::\d+)?$/.test(req.headers.host));
  return COOKIE + "=" + value + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" + maxAge + (secure ? "; Secure" : "");
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return !!host && originUrl.host === host && (originUrl.protocol === "https:" || (originUrl.protocol === "http:" && /^localhost(?::\d+)?$/.test(host)));
  } catch { return false; }
}
module.exports = { configured, email, checkPassword, createSession, isAuthenticated, cookie, sameOrigin };
