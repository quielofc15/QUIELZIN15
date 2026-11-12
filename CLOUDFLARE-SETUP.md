# Digital — Cloudflare Workers

Este projeto é preparado para digital.quielofc15.workers.dev, sem depender da Vercel.

## Arquivos

- worker/index.js — API Cloudflare Workers (login, sessões, cadastro dos botões)
- public/ — site público e painel /admin/
- wrangler.jsonc — configuração do Worker de nome digital
- /api/admin-config — diagnóstico sem segredos
- /api/admin-login — POST login e DELETE logout
- /api/admin-check — GET sessão
- /api/theme — GET público e PUT autenticado

## 1. Conectar e republicar

Cloudflare > Workers & Pages > Worker digital > Settings > Builds.

Conecte o GitHub quielofc15/QUIELZIN15, branch main (se não estiver conectado). Use o repositório raiz, sem comando build obrigatório e com comando deploy: npx wrangler deploy.

O wrangler.jsonc direciona /api/* ao Worker e os demais arquivos ao diretório public/.

## 2. Credenciais do painel

Cloudflare > Worker digital > Settings > Variables and Secrets > Add, tipo SECRET:

- ADMIN_EMAIL: e-mail cadastrado para o administrador
- ADMIN_PASSWORD: senha forte escolhida, inserida diretamente na Cloudflare, nunca no GitHub
- ADMIN_SESSION_SECRET: texto longo aleatório com pelo menos 32 bytes de entropia

Não coloque nenhuma senha no código, wrangler.jsonc, GitHub ou arquivos JavaScript.

Uma senha anterior foi compartilhada por chat. Recomendamos escolher outra senha nova no Cloudflare para evitar reutilização.

## 3. Persistência dos botões (escolha uma opção)

### Cloudflare KV

1. Crie um KV namespace DIGITAL_CONFIG.
2. Worker digital > Settings > Bindings > Add > KV Namespace.
3. Nome do binding: SITE_CONFIG. Namespace: DIGITAL_CONFIG.
4. Salve/deploy. A API usa a chave digital_settings.

O primeiro curso é criado como conteúdo padrão. Após conectar o KV, o painel pode salvar a lista de botões. KV tem consistência eventual.

### Supabase existente

Se já usa a tabela site_theme, insira no Worker os seguintes Secrets:

- SUPABASE_URL
- SUPABASE_SECRET_KEY

Se nenhum KV estiver configurado, o Worker usa o Supabase. Não é necessário SUPABASE_ANON_KEY nem Supabase Auth para o login.

## 4. Testes

- https://digital.quielofc15.workers.dev/api/admin-config — retorna JSON, provider cloudflare, authConfigured true se os segredos estiverem presentes, storageConfigured true se o armazenamento estiver pronto.
- https://digital.quielofc15.workers.dev/api/theme — retorna JSON do conteúdo.
- https://digital.quielofc15.workers.dev/admin/ — login, edição e salvar botões.

Se retornar 404 em /api/admin-config, o build não publicou o Worker ou não usa o wrangler.jsonc. Se authConfigured false, faltam secrets. Se storageConfigured false, falta KV ou Supabase.

## Desenvolver localmente

Execute npx wrangler dev na raiz com Node.js instalado.
Crie .dev.vars apenas na sua máquina, sem versionar.
O diretório legado api/ contém funções Node.js da antiga hospedagem e NÃO é utilizado no Cloudflare.
