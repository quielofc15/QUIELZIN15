const auth = require("../lib/admin-session");
module.exports = async (req,res) => {
  res.setHeader("Cache-Control","no-store");
  if (req.method !== "GET") return res.status(405).json({error:"Método não permitido"});
  if (!auth.configured()) return res.status(503).json({error:"Autenticação não configurada"});
  if (!auth.isAuthenticated(req)) return res.status(401).json({error:"Sessão expirada. Faça login novamente."});
  return res.status(200).json({ok:true});
};
