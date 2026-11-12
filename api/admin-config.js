// Mantida para diagnostico; nao entrega chaves ou configuracao sensivel.
const auth = require("../lib/admin-session");
module.exports = (req,res) => {
  res.setHeader("Cache-Control","no-store");
  if (req.method !== "GET") return res.status(405).json({error:"Método não permitido"});
  return res.status(200).json({panel:true,authConfigured:auth.configured(),storageConfigured:Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SECRET_KEY)});
};
