import { loadContent } from "../_lib/admin.js";

export async function onRequestGet({ env }) {
  const content = await loadContent(env.SITE_ADMIN);
  return new Response(JSON.stringify(content), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
