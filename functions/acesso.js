import {
  canAttemptLogin,
  clearFailedLogin,
  clientIp,
  createSession,
  readSmallForm,
  registerFailedLogin,
  requestHasValidOrigin,
  secureHeaders,
  sessionCookie,
  timingSafeTextEqual,
  verifySession
} from "./_lib/security.js";
import { loadContent, loadPosts, renderDashboard, renderLogin } from "./_lib/admin.js";

function responseHtml(html, status = 200, extraHeaders = {}) {
  return new Response(html, { status, headers: { ...secureHeaders(), ...extraHeaders } });
}

function configurationReady(env) {
  return Boolean(env.ADMIN_USER && env.ADMIN_PASSWORD && env.SESSION_SECRET && env.SITE_ADMIN);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!configurationReady(env)) {
    return responseHtml(renderLogin("A área restrita está em configuração."), 503);
  }

  const session = await verifySession(request, env.SESSION_SECRET);
  if (!session || !timingSafeTextEqual(session.u, env.ADMIN_USER)) {
    return responseHtml(renderLogin());
  }

  const [content, posts] = await Promise.all([loadContent(env.SITE_ADMIN), loadPosts(env.SITE_ADMIN)]);
  const url = new URL(request.url);
  const notices = {
    content: "Conteúdo atualizado.",
    post: "Publicação atualizada.",
    deleted: "Publicação excluída."
  };
  return responseHtml(renderDashboard({
    session,
    content,
    posts,
    env,
    notice: notices[url.searchParams.get("ok")] || ""
  }));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!configurationReady(env)) return responseHtml(renderLogin("A área restrita está em configuração."), 503);
  if (!requestHasValidOrigin(request)) return responseHtml(renderLogin("Solicitação inválida."), 403);

  const ip = clientIp(request);
  if (!await canAttemptLogin(env.SITE_ADMIN, ip)) {
    return responseHtml(renderLogin("Muitas tentativas. Tente novamente mais tarde."), 429);
  }

  let form;
  try {
    form = await readSmallForm(request);
  } catch {
    return responseHtml(renderLogin("Solicitação inválida."), 413);
  }

  if ((form.get("company") || "").trim()) return responseHtml(renderLogin("Credenciais inválidas."), 401);

  const username = (form.get("username") || "").trim();
  const password = form.get("password") || "";
  const validUser = timingSafeTextEqual(username, env.ADMIN_USER);
  const validPassword = timingSafeTextEqual(password, env.ADMIN_PASSWORD);

  if (!validUser || !validPassword) {
    await registerFailedLogin(env.SITE_ADMIN, ip);
    return responseHtml(renderLogin("Credenciais inválidas."), 401);
  }

  await clearFailedLogin(env.SITE_ADMIN, ip);
  const session = await createSession(env.ADMIN_USER, env.SESSION_SECRET);
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/acesso",
      "Set-Cookie": sessionCookie(session.token),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
