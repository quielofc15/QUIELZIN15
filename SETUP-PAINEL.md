# Painel administrativo Digital

Página pública: / • Painel: /admin/.

## Hospedagem

Este projeto precisa de hospedagem que execute funções Node em api/, como a Vercel. Hospedagens somente estáticas retornam 404 nas rotas /api/admin-login, /api/admin-config e /api/theme. O endpoint /api/admin-config deve retornar JSON.

Se o deploy responder 402 DEPLOYMENT_DISABLED, o projeto foi bloqueado pela hospedagem e nenhuma alteração de código remove essa restrição.

## Credenciais do administrador

O login aceita somente o endereço definido em ADMIN_EMAIL e a senha correspondente ao hash scrypt definido em ADMIN_PASSWORD_HASH. O servidor emite cookie HttpOnly, SameSite=Strict, com assinatura HMAC e validade de oito horas. **Não armazene senhas em arquivos do GitHub.**

Vercel > Project > Settings > Environment Variables:

- ADMIN_EMAIL: e-mail autorizado no painel.
- ADMIN_PASSWORD_HASH: valor no formato salt_hex:scrypt_hex (salt 16 bytes; scrypt N=16384, r=8, p=1, dklen=64).
- ADMIN_SESSION_SECRET: segredo randômico com ao menos 32 bytes.
- SUPABASE_URL: URL do Supabase.
- SUPABASE_SECRET_KEY: chave de acesso somente servidor do Supabase.

O login não depende mais de um usuário no Supabase Authentication ou de SUPABASE_ANON_KEY. Após mudar qualquer variável, faça novo deploy. Nunca compartilhe a senha nem a chave secreta.

## Tabela para as configurações

Execute no Supabase SQL Editor se a tabela ainda não existir:

    create table if not exists public.site_theme (
      id integer primary key check (id = 1),
      settings jsonb not null default '{}'::jsonb
    );

    alter table public.site_theme enable row level security;
    revoke all on public.site_theme from anon, authenticated;

A API usa a chave de servidor para ler e atualizar essa tabela; o navegador nunca recebe a chave secreta.

## Uso

1. Abra /admin/ no domínio hospedado e faça login.
2. Na seção Botões e conteúdos, edite "Como fazer a sua primeira venda no digital".
3. Informe a URL real de checkout/acesso. Se ficar vazia, o site exibirá "Link em configuração".
4. Adicione, oculte, exclua ou reordene com as setas.
5. Clique em Salvar e publicar.

Para testar localmente, use vercel dev com as variáveis configuradas. Abrir diretamente o HTML ou publicar somente em GitHub Pages não executa as APIs.
