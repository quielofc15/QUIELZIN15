# Configuração do painel Digital

A página pública fica em / e o painel administrativo em /admin/.

## 1. Supabase

No SQL Editor do Supabase, execute (se a tabela ainda não existir):

    create table if not exists public.site_theme (
      id integer primary key check (id = 1),
      settings jsonb not null default '{}'::jsonb
    );

    alter table public.site_theme enable row level security;
    revoke all on public.site_theme from anon, authenticated;

A API usa a chave de serviço somente no servidor. Os botões e as cores são salvos na coluna JSONB settings. Não é necessária uma nova tabela, mesmo se você já usava o painel antigo.

## 2. Usuário administrador

Supabase > Authentication > Users: crie um usuário com e-mail confirmado e senha forte.

## 3. Vercel > Settings > Environment Variables

- SUPABASE_URL: URL do seu projeto Supabase.
- SUPABASE_SECRET_KEY: chave service_role/secret do projeto. **Somente no servidor. Nunca exponha no JavaScript público.**
- SUPABASE_ANON_KEY: chave pública anon/publishable do projeto, usada apenas no login.
- ADMIN_EMAIL: e-mail exato do administrador cadastrado e confirmado.

Faça deploy novamente depois de salvar as variáveis.

## 4. Publicar conteúdo

1. Abra /admin/ no domínio publicado e faça login.
2. Em Botões e conteúdos, edite o primeiro: "Como fazer a sua primeira venda no digital".
3. Informe a URL verdadeira de checkout ou de acesso. Se ficar vazia, o visitante verá "Link em configuração", sem abrir um destino inventado.
4. Clique em "+ Adicionar botão" para criar outros conteúdos.
5. Use ↑ ou ↓ para reordenar. Use "Excluir" para remover. Desmarque "Mostrar este botão" para ocultá-lo.
6. Personalize o título, descrição e cores; revise a prévia; clique em "Salvar e publicar".

Excluir e reordenar só têm efeito público depois de salvar. A página mantém o conteúdo padrão quando a API está temporariamente indisponível.

Para testar a API localmente, rode vercel dev com as variáveis configuradas. Abrir index.html no navegador não executa as funções /api/.
