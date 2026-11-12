const auth = require("../lib/admin-session");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST" && req.method !== "DELETE") return res.status(405).json({error:"Método não permitido"});
  if (!auth.sameOrigin(req)) return res.status(403).json({error:"Origem inválida"});
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie",auth.cookie("",req,0));
    return res.status(200).json({ok:true});
  }
  if (!auth.configured()) return res.status(503).json({error:"Autenticação não configurada na hospedagem"});
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body?.password;
  const valid = auth.checkPassword(password) && email === auth.email();
  if (!valid) return res.status(401).json({error:"E-mail ou senha incorretos"});
  res.setHeader("Set-Cookie",auth.cookie(auth.createSession(),req,8*60*60));
  return res.status(200).json({ok:true});
};
