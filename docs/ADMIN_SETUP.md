# Área restrita e gestão do site

Este documento descreve somente a configuração. Nenhuma credencial deve ser gravada no GitHub.

## Componentes

- `/acesso`: login e painel via Cloudflare Pages Function.
- `SITE_ADMIN`: binding KV para tentativas de login, conteúdo leve e publicações.
- `/admin/content`: grava somente campos de conteúdo previamente permitidos.
- `/admin/publicacao`: cria publicação em rascunho ou publicada.
- `/api/conteudo`: entrega somente os campos públicos gerenciáveis.
- `/api/publicacoes`: entrega somente publicações com status `published`.

## Bindings e segredos necessários no Cloudflare Pages

Criar/bindar um namespace KV com o nome de binding `SITE_ADMIN`.

Configurar no ambiente de produção, sem versionar valores:

- `ADMIN_USER`: usuário autorizado.
- `ADMIN_PASSWORD`: segredo de autenticação.
- `SESSION_SECRET`: segredo aleatório forte, independente da senha.
- `ZOHO_URL`: URL operacional do e-mail, visível somente após login.
- `RADAR_URL`: URL operacional do Radar, visível somente após login.
- `STUDIO_URL`: URL operacional do Estúdio, visível somente após login.

`ADMIN_PASSWORD` e `SESSION_SECRET` devem ser cadastrados como Secrets. Os demais valores internos também podem ser Secrets para reduzir exposição operacional no painel e nos logs de configuração.

## Regras de segurança

- Nunca armazenar senha no HTML, JavaScript público, JSON público ou repositório.
- Não substituir a autenticação server-side por validação JavaScript.
- Manter `Radar` e `Estúdio` com a própria camada de Cloudflare Access; o login do site não substitui a proteção dos subdomínios.
- Manter o runtime em fail-closed para rotas administrativas.
- Não ativar endpoint de captura de leads até reconciliar `lead-capture.schema.json`, antispam e retenção.

## Teste antes da publicação

1. Abrir `/acesso` em janela anônima: deve mostrar somente marca, usuário, senha, botão Entrar e retorno ao site.
2. Confirmar que `/acesso.html` redireciona para `/acesso`.
3. Credencial inválida deve retornar mensagem genérica, sem revelar usuário válido ou configuração.
4. Após cinco falhas do mesmo IP, novas tentativas devem ser temporariamente limitadas.
5. Credencial válida deve criar cookie `__Host-fs_session` com `HttpOnly`, `Secure` e `SameSite=Strict`.
6. O painel deve mostrar os atalhos somente após sessão válida.
7. Alteração de conteúdo deve exigir CSRF e sessão válida.
8. `/api/publicacoes` não pode retornar rascunhos.
9. Verificar headers de segurança diretamente nas respostas geradas por Functions.
10. Testar mobile e desktop antes do merge/deploy definitivo.

## Estado de implantação

O código pode ser revisado e integrado somente quando os bindings/secrets do ambiente estiverem prontos. Até lá, manter a implementação em branch/PR e não expor uma versão parcialmente configurada em produção.

### Verificação em 13/08/2026

- A implementação foi sincronizada com o `main`, incluindo currículo, portfólio, fotografia limpa e correções de contraste.
- A compilação local das Pages Functions foi concluída com o binding KV local `SITE_ADMIN`.
- O login local respondeu `401` para credencial inválida e `303` para credencial válida; o cookie emitido contém `HttpOnly`, `Secure` e `SameSite=Strict`.
- A persistência local confirmou que rascunhos não são retornados pela API pública.
- O domínio público ainda recebe conteúdo do GitHub Pages por trás da Cloudflare. A troca para Cloudflare Pages deve ocorrer somente depois de criar o projeto, configurar KV/secrets e validar a URL de prévia.
- O acesso ao painel Cloudflare exige o código do autenticador da conta. Nenhuma configuração de produção foi alterada sem essa verificação.
