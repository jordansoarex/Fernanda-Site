document.addEventListener("DOMContentLoaded",async()=>{
  const root=document.querySelector("[data-publications]");
  if(!root)return;
  try{
    const response=await fetch("/api/publicacoes",{headers:{Accept:"application/json"}});
    if(!response.ok)throw new Error("load");
    const posts=await response.json();
    root.replaceChildren();
    if(!Array.isArray(posts)||!posts.length){const p=document.createElement("p");p.textContent="Novos conteúdos serão publicados aqui.";root.append(p);return}
    posts.forEach(post=>{
      const article=document.createElement("article");article.className="publication-card";
      const h2=document.createElement("h2");h2.textContent=post.title||"Publicação";
      const meta=document.createElement("p");meta.className="publication-meta";
      if(post.publishedAt){const d=new Date(post.publishedAt);if(!Number.isNaN(d.getTime()))meta.textContent=d.toLocaleDateString("pt-BR")}
      const summary=document.createElement("p");summary.className="publication-summary";summary.textContent=post.summary||"";
      const body=document.createElement("div");body.className="publication-body";
      String(post.body||"").split(/\n{2,}/).filter(Boolean).forEach(text=>{const p=document.createElement("p");p.textContent=text.trim();body.append(p)});
      article.append(h2,meta);if(summary.textContent)article.append(summary);article.append(body);root.append(article);
    });
  }catch{const p=document.createElement("p");p.textContent="Não foi possível carregar as publicações agora.";root.replaceChildren(p)}
});
