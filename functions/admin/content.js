import { CONTENT_LIMITS, loadContent } from "../_lib/admin.js";
import { readSmallForm, redirect, requestHasValidOrigin, requireCsrf, verifySession } from "../_lib/security.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.SESSION_SECRET || !env.ADMIN_USER || !env.SITE_ADMIN) return new Response("Unavailable", { status: 503 });
  if (!requestHasValidOrigin(request)) return new Response("Forbidden", { status: 403 });

  const session = await verifySession(request, env.SESSION_SECRET);
  if (!session || session.u !== env.ADMIN_USER) return redirect("/acesso");

  let form;
  try { form = await readSmallForm(request, 32 * 1024); }
  catch { return new Response("Payload too large", { status: 413 }); }
  if (!requireCsrf(form, session)) return new Response("Forbidden", { status: 403 });

  const next = await loadContent(env.SITE_ADMIN);
  for (const [key, max] of Object.entries(CONTENT_LIMITS)) {
    if (!form.has(key)) continue;
    const value = String(form.get(key) || "").trim();
    if (!value || value.length > max) return new Response("Invalid content", { status: 400 });
    next[key] = value;
  }

  await env.SITE_ADMIN.put("site:content", JSON.stringify(next));
  return redirect("/acesso?ok=content");
}
