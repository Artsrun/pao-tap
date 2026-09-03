let SEED = null;
async function loadSeed(){
  const r = await fetch('pao.json', {cache:'no-store'});
  if(!r.ok) throw new Error(r.status);
  return await r.json();
}
const KEYS = Array.from({length:20},(_,i)=>String(i).padStart(2,"0"));
const LS = "pao-deck-v2";
const KIND = {person:{tag:"WHO",chip:"PERSON"},action:{tag:"DOES",chip:"ACTION"},object:{tag:"THING",chip:"OBJECT"}};
const state = {mode:"build",i:0,deck:null,draft:{person:null,action:null,object:null},drillStep:"person",pulse:0};
const $=s=>document.querySelector(s);
const toast=t=>{const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1600)};
const buzz=n=>{try{navigator.vibrate?.(n)}catch{}};
const complete=t=>!!(t?.person&&t?.action&&t?.object);
const sceneOf=t=>complete(t)?`${t.person.en} ${t.action.en} ${t.object.en}`:"Need who + does + thing";
const currentKey=()=>KEYS[state.i];
const committed=()=>state.deck.encoding[currentKey()];
function setDraftFromDeck(){const t=committed();state.draft=t?structuredClone(t):{person:null,action:null,object:null}}
function renderDots(){
  const box=$("#dots"); box.innerHTML="";
  KEYS.forEach((k,i)=>{const d=document.createElement("i"); if(i===state.i) d.className="on"; box.appendChild(d);});
}
function renderSlots(){
  const src=state.mode==="build"?state.draft:committed();
  const key=currentKey();
  for(const k of ["person","action","object"]){
    const slot=document.querySelector(`.slot[data-k="${k}"]`);
    slot.querySelector(".v").textContent=src?.[k]?.en||"—";
    slot.classList.toggle("filled",state.mode==="build"&&!!state.draft[k]);
    slot.classList.toggle("need",state.mode==="drill"&&state.drillStep===k);
  }
  $("#digit").textContent=key;
  $("#scene").textContent=sceneOf(src);
  renderDots();
  const lock=$("#lock");
  if(state.mode==="build"){
    $("#hint").innerHTML=`Bind <b>${key}</b>. Tap a piece into who / does / thing. Tap a filled slot to undo.`;
    $("#poolTitle").textContent="Tap a piece — it lands in its slot";
    lock.disabled=!complete(state.draft);
    lock.querySelector("strong").textContent=`Save ${key}`;
    lock.querySelector("span").textContent=complete(state.draft)?"write scene into deck":"need all three";
  }else{
    $("#hint").innerHTML=`Recall <b>${key}</b>. Tap the matching <b>${KIND[state.drillStep].tag}</b>.`;
    $("#poolTitle").textContent=`Tap the ${state.drillStep}`;
    lock.disabled=true;
    lock.querySelector("strong").textContent="Save bind";
    lock.querySelector("span").textContent="switch to Bind to edit";
  }
}
function poolItems(){
  const kinds=state.mode==="drill"?[state.drillStep]:["person","action","object"];
  const items=[];
  for(const k of KEYS){const t=state.deck.encoding[k]; for(const kind of kinds) if(t[kind]) items.push({kind,digit:k,...t[kind]});}
  for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
  return items.slice(0,state.mode==="drill"?6:12);
}
function renderChips(){
  const box=$("#chips"); box.innerHTML="";
  for(const it of poolItems()){
    const b=document.createElement("button");
    b.className=`chip ${it.kind[0]}`;
    b.innerHTML=`<i>${KIND[it.kind].chip}</i>${it.en}`;
    b.onclick=()=>onChip(it);
    box.appendChild(b);
  }
}
function onChip(it){
  buzz(8); state.pulse=1;
  if(state.mode==="build"){state.draft[it.kind]={en:it.en,cue:it.cue}; toast(`${KIND[it.kind].tag} ← ${it.en}`); renderSlots(); return;}
  const truth=committed()?.[state.drillStep];
  if(truth&&it.en===truth.en&&it.kind===state.drillStep){
    document.querySelector(`.slot[data-k="${state.drillStep}"]`).classList.add("flash");
    setTimeout(()=>document.querySelector(`.slot[data-k="${state.drillStep}"]`).classList.remove("flash"),280);
    toast(`yes — ${it.en}`);
    state.drillStep=state.drillStep==="person"?"action":state.drillStep==="action"?"object":"done";
    if(state.drillStep==="done"){toast(`clean ${currentKey()}`); state.i=(state.i+1)%20; state.drillStep="person"; setDraftFromDeck();}
    renderSlots(); renderChips();
  } else {toast(`not the ${state.drillStep} for ${currentKey()}`); buzz(30);}
}
function persist(){localStorage.setItem(LS,JSON.stringify(state.deck))}
function lock(){
  if(!complete(state.draft)){toast("need who + does + thing");return;}
  const key=currentKey(); const used=new Map();
  for(const k of KEYS){if(k===key)continue; const t=state.deck.encoding[k]; if(!t)continue;
    used.set("p:"+t.person.en,k); used.set("a:"+t.action.en,k); used.set("o:"+t.object.en,k);}
  for(const [slot,prefix] of [["person","p:"],["action","a:"],["object","o:"]]){
    const hit=used.get(prefix+state.draft[slot].en); if(hit){toast(`${slot} already used on ${hit}`);return;}}
  state.deck.encoding[key]=structuredClone(state.draft); persist();
  toast(`saved ${key}`); buzz(18); state.i=(state.i+1)%20; setDraftFromDeck(); renderSlots(); renderChips();
}
function exportJson(){
  const txt=JSON.stringify(state.deck,null,2);
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([txt],{type:"application/json"})); a.download="pao.json"; a.click();
  navigator.clipboard?.writeText(txt).then(()=>toast("copied + downloaded")).catch(()=>toast("downloaded"));
}
$("#lock").onclick=lock; $("#export").onclick=exportJson;
$("#prev").onclick=()=>{state.i=(state.i+19)%20;state.drillStep="person";setDraftFromDeck();renderSlots();renderChips();};
$("#next").onclick=()=>{state.i=(state.i+1)%20;state.drillStep="person";setDraftFromDeck();renderSlots();renderChips();};
document.querySelectorAll("#modes button").forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;document.querySelectorAll("#modes button").forEach(x=>x.classList.toggle("on",x===b));state.drillStep="person";setDraftFromDeck();renderSlots();renderChips();});
document.querySelectorAll(".slot").forEach(s=>s.onclick=()=>{if(state.mode!=="build"){toast("switch to Bind to edit");return;} if(!state.draft[s.dataset.k])return; state.draft[s.dataset.k]=null; toast(`${KIND[s.dataset.k].tag} cleared`); renderSlots();});
$("#start").onclick=()=>$("#how").remove();
loadSeed().then(seed=>{
  SEED = seed;
  state.deck = structuredClone(SEED);
  try{const s=JSON.parse(localStorage.getItem(LS)||"null"); if(s?.encoding) state.deck=s;}catch{}
  setDraftFromDeck(); renderSlots(); renderChips();
}).catch(err=>{ toast("failed to load pao.json"); console.error(err); });
const canvas=$("#gl"); const gl=canvas.getContext("webgl",{alpha:false,antialias:false});
if(gl){
  const vs=`attribute vec3 a;attribute float s;attribute vec3 c;uniform float t;uniform vec2 r;varying vec3 vc;varying float al;void main(){float a0=a.x+t*0.21;float b0=a.y+t*0.13;float x=(2.0+cos(a0))*cos(b0);float y=sin(a0)*0.85;float z=(2.0+cos(a0))*sin(b0);float ooz=1.0/(5.2+z);vec2 p=vec2(x,y)*ooz*2.2;p.x*=r.y/r.x;gl_Position=vec4(p,z*0.05,1.0);gl_PointSize=s*ooz*28.0*(1.0+0.35*sin(t*3.0+a.z));vc=c;al=ooz;}`;
  const fs=`precision mediump float;varying vec3 vc;varying float al;void main(){vec2 d=gl_PointCoord-0.5;float l=length(d);if(l>0.5)discard;float g=smoothstep(0.5,0.12,l);gl_FragColor=vec4(vc,g*al*1.6);}`;
  const comp=(t,s)=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh;};
  const prog=gl.createProgram(); gl.attachShader(prog,comp(gl.VERTEX_SHADER,vs)); gl.attachShader(prog,comp(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(prog); gl.useProgram(prog);
  const N=180,a=new Float32Array(N*3),s=new Float32Array(N),c=new Float32Array(N*3);
  const cols=[[0.48,0.82,1],[1,0.70,0.28],[0.83,1,0.31]];
  for(let i=0;i<N;i++){a[i*3]=Math.random()*Math.PI*2;a[i*3+1]=Math.random()*Math.PI*2;a[i*3+2]=Math.random()*6;s[i]=0.6+Math.random()*1.4;const col=cols[i%3];c[i*3]=col[0];c[i*3+1]=col[1];c[i*3+2]=col[2];}
  const buf=(data,size,name)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const loc=gl.getAttribLocation(prog,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);};
  buf(a,3,"a");buf(s,1,"s");buf(c,3,"c");
  const uT=gl.getUniformLocation(prog,"t"),uR=gl.getUniformLocation(prog,"r");
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  const t0=performance.now();
  const resize=()=>{const d=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*d;canvas.height=innerHeight*d;gl.viewport(0,0,canvas.width,canvas.height);};
  addEventListener("resize",resize,{passive:true});resize();
  const loop=now=>{const t=(now-t0)/1000+state.pulse*0.4;state.pulse*=0.92;gl.clearColor(0.027,0.031,0.047,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(uT,t);gl.uniform2f(uR,canvas.width,canvas.height);gl.drawArrays(gl.POINTS,0,N);requestAnimationFrame(loop);};
  requestAnimationFrame(loop);
  canvas.addEventListener("pointerup",e=>{if(e.target!==canvas)return;state.pulse=1;buzz(6);},{passive:true});
}
