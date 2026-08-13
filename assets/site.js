document.documentElement.classList.add("js");

const SITE_CONFIG={
  whatsapp:"5592993547755",
  instagram:"https://instagram.com/fernandafisio_pericias",
  linkedin:"https://www.linkedin.com/in/fernanda-soares-02aa25269/",
  institutionalEmail:"contato@fernandafsoares.com.br",
  leadEndpoint:""
};

const qs=(selector,root=document)=>root.querySelector(selector);
const qsa=(selector,root=document)=>[...root.querySelectorAll(selector)];

function captureAttribution(){
  const params=new URLSearchParams(location.search),keys=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","gclid"],current={};
  keys.forEach(key=>{if(params.get(key))current[key]=params.get(key)});
  if(Object.keys(current).length){current.landing_page=location.pathname;current.captured_at=new Date().toISOString();sessionStorage.setItem("fernanda_attribution",JSON.stringify(current))}
  try{return JSON.parse(sessionStorage.getItem("fernanda_attribution")||"{}")}catch{return {}}
}

function track(name,detail={}){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name,...detail});window.dispatchEvent(new CustomEvent("fernanda:conversion",{detail:{name,...detail}}))}
function whatsappUrl(message,source){const suffix=source?`\n\nOrigem: ${source}`:"";return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(message+suffix)}`}

function configureChannels(){
  qsa("[data-whatsapp]").forEach(link=>{const message=link.dataset.message||"Olá, Fernanda. Gostaria de conversar sobre apoio técnico pericial.";link.href=whatsappUrl(message,"Site");link.target="_blank";link.rel="noopener noreferrer";if(link.matches(".button,.nav-cta")&&!link.querySelector(".button-icon")){const icon=document.createElement("img");icon.className="button-icon";icon.src="assets/icon-whatsapp.svg";icon.alt="";link.prepend(icon)}link.addEventListener("click",()=>track("whatsapp_click",{placement:link.dataset.placement||"site"}))});
  const channels={instagram:SITE_CONFIG.instagram,linkedin:SITE_CONFIG.linkedin};
  Object.entries(channels).forEach(([name,url])=>qsa(`[data-channel="${name}"]`).forEach(link=>{if(!url){link.hidden=true;return}link.href=url;link.target="_blank";link.rel="noopener noreferrer";link.addEventListener("click",()=>track("social_click",{channel:name}))}));
  qsa("[data-email]").forEach(link=>{if(!SITE_CONFIG.institutionalEmail)link.hidden=true;else link.href=`mailto:${SITE_CONFIG.institutionalEmail}`});
}

function addFloatingWhatsApp(){if(!qs("[data-whatsapp]")||qs(".whatsapp-float"))return;const link=document.createElement("a");link.className="whatsapp-float";link.href="#";link.dataset.whatsapp="";link.dataset.placement="floating";link.setAttribute("aria-label","Conversar pelo WhatsApp");link.innerHTML='<img src="assets/icon-whatsapp.svg" alt="" width="29" height="29">';document.body.append(link)}

function bindMenu(){const button=qs(".menu-button"),links=qs(".nav-links");if(!button||!links)return;const close=()=>{links.classList.remove("open");button.setAttribute("aria-expanded","false")};button.addEventListener("click",()=>{const open=links.classList.toggle("open");button.setAttribute("aria-expanded",String(open))});links.addEventListener("click",event=>{if(event.target.closest("a"))close()});document.addEventListener("keydown",event=>{if(event.key==="Escape")close()});window.addEventListener("resize",()=>{if(window.innerWidth>900)close()})}

function bindLeadForm(){
  const form=qs("[data-lead-form]");if(!form)return;
  form.addEventListener("submit",event=>{event.preventDefault();const status=qs(".form-status",form),data=Object.fromEntries(new FormData(form).entries());if(!data.privacy_consent){status.textContent="Confirme o aviso de privacidade para continuar.";return}const attribution=captureAttribution();const payload={name:String(data.name||"").trim(),company:String(data.company||"").trim(),role:String(data.role||"").trim(),service:String(data.service||"").trim(),message:String(data.message||"").trim(),privacy_consent:true,source:"institutional_site",attribution};track("lead_form_submit",{service:payload.service,source:attribution.utm_source||"direct"});const message=`Olá, Fernanda. Meu nome é ${payload.name}${payload.company?`, da ${payload.company}`:""}. Tenho interesse em ${payload.service}. ${payload.message}`.trim();location.href=whatsappUrl(message,attribution.utm_source||"formulario-site")});
}

function bindReveals(){if(!("IntersectionObserver" in window))return;const elements=qsa("main > section,.card,.service-card,.step");const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:"0px 0px -30px"});elements.forEach((element,index)=>{element.classList.add("reveal");element.style.setProperty("--reveal-delay",`${(index%4)*55}ms`);observer.observe(element)})}

function configureInternalAccess(){qsa('a[href="acesso.html"],a[href="./acesso.html"]').forEach(link=>{link.href="/acesso"})}

function addPublicationsNavigation(){
  qsa(".nav-links").forEach(nav=>{if(nav.querySelector('a[href="publicacoes.html"]'))return;const link=document.createElement("a");link.href="publicacoes.html";link.textContent="Publicações";const before=[...nav.querySelectorAll("a")].find(a=>a.getAttribute("href")==="sobre.html");before?nav.insertBefore(link,before):nav.append(link)});
  qsa(".footer-grid").forEach(footer=>{const nav=[...footer.querySelectorAll("div")].find(div=>div.querySelector("h3")?.textContent.trim()==="Navegação");if(nav&&!nav.querySelector('a[href="publicacoes.html"]')){const link=document.createElement("a");link.href="publicacoes.html";link.textContent="Publicações";const privacy=nav.querySelector('a[href="privacidade.html"]');privacy?nav.insertBefore(link,privacy):nav.append(link)}});
}

async function applyManagedContent(){
  const bindings=[];
  if(location.pathname==="/"||location.pathname.endsWith("/index.html"))bindings.push([".hero .eyebrow","home.hero.eyebrow"],[".hero h1","home.hero.title"],[".hero .lead","home.hero.lead"],[".cta-band h2","home.cta.title"],[".cta-band p","home.cta.body"]);
  if(location.pathname.endsWith("/contato.html")||location.pathname==="/contato")bindings.push([".page-hero h1","contact.hero.title"],[".page-hero p","contact.hero.body"]);
  if(!bindings.length)return;
  try{const response=await fetch("/api/conteudo",{headers:{Accept:"application/json"}});if(!response.ok)return;const content=await response.json();bindings.forEach(([selector,key])=>{const node=qs(selector),value=content?.[key];if(node&&typeof value==="string"&&value.trim())node.textContent=value})}catch{}
}

document.addEventListener("DOMContentLoaded",()=>{captureAttribution();configureInternalAccess();addPublicationsNavigation();addFloatingWhatsApp();configureChannels();bindMenu();bindLeadForm();bindReveals();applyManagedContent();qs("[data-year]")?.replaceChildren(String(new Date().getFullYear()))});
