document.addEventListener("DOMContentLoaded",async()=>{
  const targets=[...document.querySelectorAll("[data-content-key]")];
  if(!targets.length)return;
  try{
    const response=await fetch("/api/conteudo",{headers:{Accept:"application/json"}});
    if(!response.ok)return;
    const content=await response.json();
    targets.forEach(node=>{
      const value=content?.[node.dataset.contentKey];
      if(typeof value==="string"&&value.trim())node.textContent=value;
    });
  }catch{}
});
