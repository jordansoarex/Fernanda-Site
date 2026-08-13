import { htmlEscape } from "./security.js";

export const DEFAULT_CONTENT = {
  "home.hero.eyebrow": "Manaus/AM · atendimento técnico B2B",
  "home.hero.title": "Clareza técnica para decisões periciais e ocupacionais.",
  "home.hero.lead": "Assistência técnica pericial, quesitos, pareceres, ergonomia e NR-17 para empresas, escritórios, Jurídico, RH e SST — com atuação presencial em Manaus e entregas remotas quando compatíveis com o caso.",
  "home.cta.title": "Precisa avaliar uma demanda?",
  "home.cta.body": "Descreva apenas o contexto empresarial, o tipo de apoio e o prazo. Documentos e dados sensíveis serão solicitados somente após validação.",
  "contact.hero.title": "Conte o contexto. A triagem começa pelo essencial.",
  "contact.hero.body": "Não envie dados clínicos, documentos pessoais ou arquivos sensíveis pelo primeiro contato. Informe apenas empresa, tipo de demanda, prazo e objetivo."
};

export const CONTENT_LIMITS = {
  "home.hero.eyebrow": 90,
  "home.hero.title": 150,
  "home.hero.lead": 520,
  "home.cta.title": 120,
  "home.cta.body": 420,
  "contact.hero.title": 150,
  "contact.hero.body": 420
};

export async function loadContent(store) {
  if (!store) return { ...DEFAULT_CONTENT };
  const stored = await store.get("site:content", "json");
  return { ...DEFAULT_CONTENT, ...(stored || {}) };
}

export async function loadPosts(store) {
  if (!store) return [];
  const stored = await store.get("site:posts", "json");
  return Array.isArray(stored) ? stored : [];
}

export async function savePosts(store, posts) {
  await store.put("site:posts", JSON.stringify(posts.slice(0, 100)));
}

function layout(title, body) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
  <title>${htmlEscape(title)} | Fernanda Soares</title>
  <link rel="icon" type="image/jpeg" href="/assets/fernanda-soares.jpeg">
  <link rel="stylesheet" href="/assets/styles.css">
  <link rel="stylesheet" href="/assets/refinement.css">
  <link rel="stylesheet" href="/assets/admin.css">
</head>
<body class="admin-body">${body}</body>
</html>`;
}

export function renderLogin(error = "") {
  return layout("Área restrita", `
<main class="login-shell">
  <section class="login-card" aria-labelledby="login-title">
    <a class="admin-brand" href="/"><img src="/assets/fs-signature-v1.png" alt="" width="68" height="42"><span><strong>Fernanda Soares</strong><small>Área restrita</small></span></a>
    <div class="login-copy"><span class="eyebrow">Acesso autorizado</span><h1 id="login-title">Entrar</h1></div>
    ${error ? `<p class="admin-alert" role="alert">${htmlEscape(error)}</p>` : ""}
    <form method="post" action="/acesso" class="admin-form" autocomplete="on">
      <label>Usuário<input name="username" type="text" autocomplete="username" maxlength="120" required autofocus></label>
      <label>Senha<input name="password" type="password" autocomplete="current-password" maxlength="256" required></label>
      <input name="company" type="text" tabindex="-1" autocomplete="off" class="hp-field" aria-hidden="true">
      <button class="button" type="submit">Entrar</button>
    </form>
    <a class="back-link" href="/">← Voltar ao site</a>
  </section>
</main>`);
}

function systemLink(url, label, description) {
  if (!url) return "";
  return `<a class="admin-system" href="${htmlEscape(url)}" target="_blank" rel="noopener noreferrer"><strong>${htmlEscape(label)}</strong><span>${htmlEscape(description)}</span></a>`;
}

function contentField(key, label, value) {
  const max = CONTENT_LIMITS[key] || 300;
  const multiline = max > 180;
  return `<label>${htmlEscape(label)}${multiline
    ? `<textarea name="${htmlEscape(key)}" maxlength="${max}" rows="4">${htmlEscape(value)}</textarea>`
    : `<input name="${htmlEscape(key)}" value="${htmlEscape(value)}" maxlength="${max}">`}</label>`;
}

function postCard(post, csrf) {
  const status = post.status === "published" ? "Publicado" : "Rascunho";
  return `<article class="admin-post">
    <div class="admin-post-head"><strong>${htmlEscape(post.title || "Sem título")}</strong><span>${status}</span></div>
    <form class="admin-form compact" method="post" action="/admin/post">
      <input type="hidden" name="csrf" value="${htmlEscape(csrf)}">
      <input type="hidden" name="id" value="${htmlEscape(post.id || "")}">
      <label>Título<input name="title" maxlength="140" required value="${htmlEscape(post.title || "")}"></label>
      <label>Resumo<textarea name="summary" maxlength="320" rows="3">${htmlEscape(post.summary || "")}</textarea></label>
      <label>Texto<textarea name="body" maxlength="8000" rows="7" required>${htmlEscape(post.body || "")}</textarea></label>
      <label>Status<select name="status"><option value="draft"${post.status !== "published" ? " selected" : ""}>Rascunho</option><option value="published"${post.status === "published" ? " selected" : ""}>Publicado</option></select></label>
      <div class="admin-actions"><button class="button" name="action" value="save" type="submit">Salvar</button><button class="button secondary" name="action" value="delete" type="submit">Excluir</button></div>
    </form>
  </article>`;
}

export function renderDashboard({ session, content, posts, env, notice = "" }) {
  const systems = [
    systemLink(env.ZOHO_URL, "E-mail", "Abrir caixa institucional"),
    systemLink(env.RADAR_URL, "Radar", "Oportunidades e operação comercial"),
    systemLink(env.STUDIO_URL, "Estúdio", "Conteúdo e fluxo editorial")
  ].filter(Boolean).join("");

  const postCards = posts.length
    ? posts.map(post => postCard(post, session.csrf)).join("")
    : `<p class="admin-empty">Nenhuma publicação criada.</p>`;

  return layout("Gestão", `
<header class="admin-header"><div class="admin-header-inner"><a class="admin-brand" href="/"><img src="/assets/fs-signature-v1.png" alt="" width="68" height="42"><span><strong>Fernanda Soares</strong><small>Gestão do site</small></span></a><form method="post" action="/logout"><input type="hidden" name="csrf" value="${htmlEscape(session.csrf)}"><button class="button secondary" type="submit">Sair</button></form></div></header>
<main class="admin-main">
  ${notice ? `<p class="admin-success" role="status">${htmlEscape(notice)}</p>` : ""}
  <section class="admin-section"><div class="admin-section-head"><span class="eyebrow">Sistemas</span><h1>Painel</h1></div><div class="admin-systems">${systems || `<p class="admin-empty">Atalhos ainda não configurados no ambiente.</p>`}</div></section>

  <section class="admin-section"><div class="admin-section-head"><span class="eyebrow">Edições leves</span><h2>Conteúdo principal</h2><p>Somente campos seguros e pré-definidos podem ser alterados.</p></div>
    <form class="admin-form admin-grid" method="post" action="/admin/content">
      <input type="hidden" name="csrf" value="${htmlEscape(session.csrf)}">
      ${contentField("home.hero.eyebrow", "Home · linha superior", content["home.hero.eyebrow"])}
      ${contentField("home.hero.title", "Home · título principal", content["home.hero.title"])}
      ${contentField("home.hero.lead", "Home · texto principal", content["home.hero.lead"])}
      ${contentField("home.cta.title", "Home · CTA final", content["home.cta.title"])}
      ${contentField("home.cta.body", "Home · texto do CTA", content["home.cta.body"])}
      ${contentField("contact.hero.title", "Contato · título", content["contact.hero.title"])}
      ${contentField("contact.hero.body", "Contato · texto", content["contact.hero.body"])}
      <div class="admin-actions full"><button class="button" type="submit">Salvar alterações</button></div>
    </form>
  </section>

  <section class="admin-section"><div class="admin-section-head"><span class="eyebrow">Publicações</span><h2>Conteúdo editorial</h2></div>
    <details class="admin-new-post"><summary>Nova publicação</summary>
      <form class="admin-form compact" method="post" action="/admin/post">
        <input type="hidden" name="csrf" value="${htmlEscape(session.csrf)}">
        <label>Título<input name="title" maxlength="140" required></label>
        <label>Resumo<textarea name="summary" maxlength="320" rows="3"></textarea></label>
        <label>Texto<textarea name="body" maxlength="8000" rows="8" required></textarea></label>
        <label>Status<select name="status"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label>
        <button class="button" name="action" value="save" type="submit">Criar publicação</button>
      </form>
    </details>
    <div class="admin-posts">${postCards}</div>
  </section>
</main>`);
}
