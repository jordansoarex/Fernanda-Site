# Fernanda Site

Site público de `fernandafsoares.com.br`, separado dos sistemas internos e dos dados de leads.

## Canais públicos

O site divulga Instagram, LinkedIn, o e-mail `contato@fernandafsoares.com.br` e WhatsApp profissional.

Os ícones de canais usam Font Awesome Free 6.7.2, disponibilizado sob CC BY 4.0. A assinatura FS e a composição visual dos serviços são ativos próprios do projeto.

## Operação interna

Detalhes de infraestrutura e atalhos operacionais não são documentados neste repositório público. O conteúdo interno permanece separado do site institucional.

## Publicação segura

`npm run prepare:deploy` monta `.dist/` apenas com páginas, imagens e arquivos públicos. Credenciais locais, dependências e arquivos temporários não entram no pacote. `npm run deploy` prepara esse pacote antes de publicar no Cloudflare Pages.
