import { loadPosts, savePosts } from "../_lib/admin.js";
import { readSmallForm, redirect, requestHasValidOrigin, requireCsrf, verifySession } from "../_lib/security.js";

export async function onRequestPost({ request, env }) {
  if (!env.SESSION_SECRET || !env.ADMIN_USER || !env.SITE_ADMIN) return new Response("Unavailable", { status: 503 });
  if (!requestHasValidOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await verifySession(request, env.SESSION_SECRET);
  if (!session || session.u !== env.ADMIN_USER) return redirect("/acesso");

  let form;
  try { form = await readSmallForm(request, 16 * 1024); }
  catch { return new Response("Payload too large", { status: 413 }); }
  if (!requireCsrf(form, session)) return new Response("Forbidden", { status: 403 });

  const id = String(form.get("id") || "").trim().slice(0, 80);
  const title = String(form.get("title") || "").trim().slice(0, 140);
  const summary = String(form.get("summary") || "").trim().slice(0, 320);
  const body = String(form.get("body") || "").trim().slice(0, 8000);
  const status = form.get("status") === "published" ? "published" : "draft";
  if (!title || !body) return new Response("Invalid content", { status: 400 });

  const now = new Date().toISOString();
  const posts = await loadPosts(env.SITE_ADMIN);
  const index = id ? posts.findIndex(post => post.id === id) : -1;

  if (index >= 0) {
    const previous = posts[index];
    posts[index] = {
      ...previous,
      title,
      summary,
      body,
      status,
      updatedAt: now,
      publishedAt: status === "published" ? (previous.publishedAt || now) : null
    };
  } else {
    posts.unshift({
      id: crypto.randomUUID(),
      title,
      summary,
      body,
      status,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === "published" ? now : null
    });
  }

  await savePosts(env.SITE_ADMIN, posts);
  return redirect("/acesso?ok=post");
}
