import { loadPosts } from "../_lib/admin.js";

export async function onRequestGet({ env }) {
  const posts = (await loadPosts(env.SITE_ADMIN))
    .filter(post => post.status === "published")
    .sort((a, b) => String(b.publishedAt || b.updatedAt || "").localeCompare(String(a.publishedAt || a.updatedAt || "")))
    .map(({ id, title, summary, body, publishedAt, updatedAt }) => ({ id, title, summary, body, publishedAt, updatedAt }));

  return new Response(JSON.stringify(posts), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
