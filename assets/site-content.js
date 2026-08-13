document.addEventListener("DOMContentLoaded",async()=>{
  const pathname=location.pathname;
  const bindings=[];
  if(pathname==="/"||pathname.endsWith("/index.html")){
    bindings.push(
      [".hero .eyebrow","home.hero.eyebrow"],
      [".hero h1","home.hero.title"],
      [".hero .lead","home.hero.lead"],
      [".cta-band h2","home.cta.title"],
      [".cta-band p","home.cta.body"]
    );
  }
  if(pathname.endsWith("/contato.html")||pathname==="/contato"){
    bindings.push(
      [".page-hero h1","contact.hero.title"],
      [".page-hero p","contact.hero.body"]
    );
  }
  if(!bindings.length)return;
  try{
    const response=await fetch("/api/conteudo",{headers:{Accept:"application/json"}});
    if(!response.ok)return;
    const content=await response.json();
    bindings.forEach(([selector,key])=>{
      const node=document.querySelector(selector);
      const value=content?.[key];
      if(node&&typeof value==="string"&&value.trim())node.textContent=value;
    });
  }catch{}
});
