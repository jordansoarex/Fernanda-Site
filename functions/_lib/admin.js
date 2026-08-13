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
  return { ...DEFAULT_CONTENT, ...((await store.get("site:content", "json")) || {}) };
}

export async function loadPosts(store) {
  if (!store) return [];
  const posts = await store.get("site:posts", "json");
  return Array.isArray(posts) ? posts : [];
}

export async function savePosts(store, posts) {
  await store.put("site:posts", JSON.stringify(posts.slice(0, 100)));
}

function layout(title, body) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet"><title>${htmlEscape(title)} | Fernanda Soares</title><link rel="icon" type="image/png" href="/assets/fernanda-soares-clean.png"><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/refinement.css"><link rel="stylesheet" href="/assets/admin.css"></head><body class="admin-body">${body}</body></html>`;
}

export function renderLogin(error = "") {
  return layout("Área restrita", `<main class="login-shell"><section class="login-card"><a class="admin-brand" href="/"><img src="/assets/fs-signature-v1.png" alt="" width="68" height="42"><span><strong>Fernanda Soares</strong><small>Área restrita</small></span></a><span class="eyebrow">Acesso autorizado</span><h1>Entrar</h1>${error ? `<p class="admin-alert" role="alert">${htmlEscape(error)}</p>` : ""}<form method="post" action="/acesso" class="admin-form"><label>Usuário<input name="username" autocomplete="username" maxlength="120" required autofocus></label><label>Senha<input name="password" type="password" autocomplete="current-password" maxlength="256" required></label><input name="company" class="hp-field" tabindex="-1" autocomplete="off"><button class="button" type="submit">Entrar</button></form><a class="back-link" href="/">← Voltar ao site</a></section></main>`);
}

function systemLink(url, title, note) {
  if (!url) return "";
  return `<a class="admin-system" href="${htmlEscape(url)}" target="_blank" rel="noopener noreferrer"><strong>${htmlEscape(title)}</strong><span>${htmlEscape(note)}</span></a>`;
}

function field(key, label, value) {
  const max = CONTENT_LIMITS[key];
  return `<label>${htmlEscape(label)}${max > 180 ? `<textarea name="${htmlEscape(key)}" maxlength="${max}" rows="4">${htmlEscape(value)}</textarea>` : `<input name="${htmlEscape(key)}" maxlength="${max}" value="${htmlEscape(value)}">`}</label>`;
}

function postList(posts) {
  if (!posts.length) return `<p class="admin-empty">Nenhuma publicação criada.</p>`;
  return posts.map(post => `<article class="admin-post"><div class="admin-post-head"><strong>${htmlEscape(post.title || "Sem título")}</strong><span>${post.status === "published" ? "Publicado" : "Rascunho"}</span></div>${post.summary ? `<p>${htmlEscape(post.summary)}</p>` : ""}<small>${htmlEscape(post.updatedAt || post.createdAt || "")}</small></article>`).join("");
}

export function renderDashboard({ session, content, posts, env, notice = "" }) {
  const systems = [
    systemLink(env.ZOHO_URL, "E-mail", "Caixa institucional"),
    systemLink(env.RADAR_URL, "Radar", "Oportunidades e operação comercial"),
    systemLink(env.STUDIO_URL, "Estúdio", "Conteúdo e fluxo editorial")
  ].filter(Boolean).join("");

  return layout("Gestão", `<header class="admin-header"><div class="admin-header-inner"><a class="admin-brand" href="/"><img src="/assets/fs-signature-v1.png" alt="" width="68" height="42"><span><strong>Fernanda Soares</strong><small>Gestão do site</small></span></a><a class="button secondary" href="/">Voltar ao site</a></div></header><main class="admin-main">${notice ? `<p class="admin-success">${htmlEscape(notice)}</p>` : ""}<section class="admin-section"><span class="eyebrow">Sistemas</span><h1>Painel</h1><div class="admin-systems">${systems || `<p class="admin-empty">Atalhos ainda não configurados.</p>`}</div></section><section class="admin-section"><span class="eyebrow">Edições leves</span><h2>Conteúdo principal</h2><form class="admin-form admin-grid" method="post" action="/admin/content"><input type="hidden" name="csrf" value="${htmlEscape(session.csrf)}">${field("home.hero.eyebrow", "Home · linha superior", content["home.hero.eyebrow"])}${field("home.hero.title", "Home · título", content["home.hero.title"])}${field("home.hero.lead", "Home · apresentação", content["home.hero.lead"])}${field("home.cta.title", "Home · CTA final", content["home.cta.title"])}${field("home.cta.body", "Home · texto do CTA", content["home.cta.body"])}${field("contact.hero.title", "Contato · título", content["contact.hero.title"])}${field("contact.hero.body", "Contato · apresentação", content["contact.hero.body"])}<button class="button full" type="submit">Salvar alterações</button></form></section><section class="admin-section"><span class="eyebrow">Publicações</span><h2>Conteúdo editorial</h2><details class="admin-new-post"><summary>Nova publicação</summary><form class="admin-form compact" method="post" action="/admin/publicacao"><input type="hidden" name="csrf" value="${htmlEscape(session.csrf)}"><label>Título<input name="title" maxlength="140" required></label><label>Resumo<textarea name="summary" maxlength="320" rows="3"></textarea></label><label>Texto<textarea name="body" maxlength="8000" rows="8" required></textarea></label><label>Status<select name="status"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label><button class="button" type="submit">Criar publicação</button></form></details><div class="admin-posts">${postList(posts)}</div></section></main>`);
}
