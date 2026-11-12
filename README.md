# Digital — Conteúdos e Cursos

Página única de conteúdo digital com primeiro destaque **Como fazer a sua primeira venda no digital**. Redes sociais e nomes pessoais não aparecem na página.

## Produção: Cloudflare Workers

- Worker: digital
- Endereço público: https://digital.quielofc15.workers.dev/
- Painel administrativo: https://digital.quielofc15.workers.dev/admin/
- Configuração do deploy: wrangler.jsonc
- API: worker/index.js
- Arquivos estáticos: public/

A versão para Cloudflare inclui APIs de login, sessão, edição de textos/cores e botões configuráveis, com links individuais, ordem e visibilidade.

**Leia CLOUDFLARE-SETUP.md para conectar o GitHub, configurar Cloudflare Secrets (credenciais) e KV ou Supabase para salvar alterações.** Um commit no GitHub só atualiza o Worker automaticamente se o repositório estiver conectado via Cloudflare Workers Builds.

O diretório api/ contém código legado de hospedagem Node/Vercel e não deve ser utilizado para Cloudflare. Nunca grave senhas no GitHub.
