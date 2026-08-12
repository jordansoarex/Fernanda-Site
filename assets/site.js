const SITE_CONFIG={
  whatsapp:"5592993547755",
  instagram:"https://instagram.com/fernandafisio_pericias",
  facebook:"",
  tiktok:"",
  googleBusiness:"",
  institutionalEmail:"",
  leadEndpoint:""
};

const qs=(selector,root=document)=>root.querySelector(selector);
const qsa=(selector,root=document)=>[...root.querySelectorAll(selector)];

function captureAttribution(){
  const params=new URLSearchParams(location.search);
  const keys=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","gclid","fbclid","ttclid"];
  const current={};
  keys.forEach(key=>{if(params.get(key))current[key]=params.get(key)});
  if(Object.keys(current).length){
    current.landing_page=location.pathname;
    current.captured_at=new Date().toISOString();
    sessionStorage.setItem("fernanda_attribution",JSON.stringify(current));
  }
  try{return JSON.parse(sessionStorage.getItem("fernanda_attribution")||"{}")}
  catch{return {}}
}

function track(name,detail={}){
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push({event:name,...detail});
  window.dispatchEvent(new CustomEvent("fernanda:conversion",{detail:{name,...detail}}));
}

function whatsappUrl(message,source){
  const suffix=source?`\n\nOrigem: ${source}`:"";
  return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(message+suffix)}`;
}

function configureChannels(){
  qsa("[data-whatsapp]").forEach(link=>{
    const message=link.dataset.message||"Olá, Fernanda. Gostaria de conversar sobre apoio técnico pericial para uma empresa.";
    const attribution=captureAttribution();
    link.href=whatsappUrl(message,attribution.utm_source||document.title);
    link.target="_blank";link.rel="noopener";
    link.addEventListener("click",()=>track("whatsapp_click",{placement:link.dataset.placement||"site"}));
  });
  const channels={instagram:SITE_CONFIG.instagram,facebook:SITE_CONFIG.facebook,tiktok:SITE_CONFIG.tiktok,googleBusiness:SITE_CONFIG.googleBusiness};
  Object.entries(channels).forEach(([name,url])=>qsa(`[data-channel="${name}"]`).forEach(link=>{
    if(!url){link.hidden=true;return}link.href=url;link.target="_blank";link.rel="noopener";
    link.addEventListener("click",()=>track("social_click",{channel:name}));
  }));
  qsa("[data-email]").forEach(link=>{if(!SITE_CONFIG.institutionalEmail){link.hidden=true}else{link.href=`mailto:${SITE_CONFIG.institutionalEmail}`;link.textContent=SITE_CONFIG.institutionalEmail}});
}

function bindMenu(){
  const button=qs(".menu-button"),links=qs(".nav-links");
  if(!button||!links)return;
  button.addEventListener("click",()=>{const open=links.classList.toggle("open");button.setAttribute("aria-expanded",String(open))});
}

function bindLeadForm(){
  const form=qs("[data-lead-form]");if(!form)return;
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const status=qs(".form-status",form),data=Object.fromEntries(new FormData(form).entries());
    if(!data.privacy_consent){status.textContent="Confirme o aviso de privacidade para continuar.";return}
    const attribution=captureAttribution();
    const payload={
      name:String(data.name||"").trim(),company:String(data.company||"").trim(),
      role:String(data.role||"").trim(),email:String(data.email||"").trim(),
      phone:String(data.phone||"").trim(),service:String(data.service||"").trim(),
      message:String(data.message||"").trim(),privacy_consent:true,
      consent_at:new Date().toISOString(),source:"institutional_site",attribution,
      page_url:location.href
    };
    track("lead_form_submit",{service:payload.service,source:attribution.utm_source||"direct"});
    if(SITE_CONFIG.leadEndpoint){
      try{
        const response=await fetch(SITE_CONFIG.leadEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        if(!response.ok)throw new Error("capture_failed");
        status.textContent="Solicitação recebida. Retornaremos pelo canal informado.";form.reset();return;
      }catch{status.textContent="Não foi possível enviar pelo formulário. Abrindo o WhatsApp…"}
    }
    const message=`Olá, Fernanda. Meu nome é ${payload.name}${payload.company?`, da ${payload.company}`:""}. Tenho interesse em ${payload.service}. ${payload.message}`.trim();
    location.href=whatsappUrl(message,attribution.utm_source||"formulario-site");
  });
}

async function revealLocalReview(){
  if(!(location.hostname.endsWith(".local")||["127.0.0.1","localhost"].includes(location.hostname)))return;
  try{
    const response=await fetch("/api/local/portfolio-review");if(!response.ok)return;
    const data=await response.json(),list=qs("#review-list");
    if(!list)return;
    (data.references||[]).forEach(item=>{
      const card=document.createElement("div"),name=document.createElement("b"),note=document.createElement("span");
      name.textContent=item.name;note.textContent=item.note;card.append(name,note);list.append(card);
    });
    qsa(".staging-only").forEach(element=>{element.hidden=false});
  }catch{}
}

document.addEventListener("DOMContentLoaded",()=>{
  captureAttribution();configureChannels();bindMenu();bindLeadForm();
  revealLocalReview();
  qs("[data-year]")?.replaceChildren(String(new Date().getFullYear()));
});
