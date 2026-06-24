/* Galovich · Introduction to Mathematical Structures — study repo
   Loads content.json, builds the chapter nav, renders entries block-by-block,
   and provides a registry of reusable, parametrized graph widgets. */

/* TRON light — luminous light-ground panels: cyan primary, amber energy accent */
const PALETTE = {
  r:'#e07b0a', q:'#0891b2', qm:'#059669',
  diag:'#64748b', mark:'#ea580c',
  grid:'rgba(12,74,90,0.10)', zero:'rgba(12,74,90,0.32)',
  markGrid:'rgba(234,88,12,0.42)',
  tick:'#3f5a64', font:"'Share Tech Mono', monospace",
  amber:'#c2410c',
  // svg
  cellFill:'#ffffff', cellStroke:'rgba(8,145,178,0.32)', cellText:'#16414c',
  zeroFill:'rgba(8,145,178,0.13)',
  markFill:'rgba(234,88,12,0.13)', markText:'#c2410c',
  cyanRamp:['#0a4f5c','#0d7c91','#159fb6','#37bccf']
};

let CHARTS = [];
const mod = (x,n)=>((x%n)+n)%n;
const range = (a,b)=>{const o=[];for(let i=a;i<=b;i++)o.push(i);return o;};

/* ---------- boot ---------- */
let DATA = null;
async function boot(){
  try{
    const res = await fetch('content.json',{cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    DATA = await res.json();
  }catch(e){
    document.getElementById('main').innerHTML =
      "<div class='content'><div class='err'><h3>Couldn't load <code>content.json</code></h3>"+
      "<p>Browsers block <code>fetch()</code> on <code>file://</code>. Serve the folder over HTTP — from the repo root run:</p>"+
      "<p><code>python3 -m http.server 8000</code></p>"+
      "<p>then open <code>http://localhost:8000</code>. On GitHub Pages it works with no setup.</p></div></div>";
    return;
  }
  buildNav();
  window.addEventListener('hashchange', route);
  route();
}

/* ---------- nav ---------- */
function buildNav(){
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  DATA.chapters.forEach(ch=>{
    const hasEntries = (ch.sections||[]).some(s=>(s.entries||[]).length);
    const wrap = el('div','nav-chapter'+(hasEntries?'':' ch-empty'));
    const head = el('div','ch-head');
    head.innerHTML = `<span class="ch-num">${ch.number}</span><span class="ch-title">${ch.title}</span>`;
    head.onclick = ()=> wrap.classList.toggle('open');
    wrap.appendChild(head);

    const body = el('div','ch-body');
    if(!(ch.sections||[]).length){
      body.appendChild(el('div','sec-empty','No sections yet'));
    }
    (ch.sections||[]).forEach(sec=>{
      const swrap = el('div','nav-section');
      swrap.appendChild(el('div','sec-head',`§ ${sec.number||''} ${sec.title}`));
      if(!(sec.entries||[]).length){
        swrap.appendChild(el('div','sec-empty','No entries yet'));
      }
      (sec.entries||[]).forEach(en=>{
        const a = el('a','nav-entry');
        a.href = '#'+en.id;
        a.dataset.id = en.id;
        a.innerHTML = `<span class="e-label">${en.label||''}</span>${en.title}`;
        swrap.appendChild(a);
      });
      body.appendChild(swrap);
    });
    wrap.appendChild(body);
    if(hasEntries) wrap.classList.add('open');
    nav.appendChild(wrap);
  });
}

function findEntry(id){
  for(const ch of DATA.chapters)
    for(const sec of (ch.sections||[]))
      for(const en of (sec.entries||[]))
        if(en.id===id) return {ch,sec,en};
  return null;
}

/* ---------- routing ---------- */
function route(){
  CHARTS.forEach(c=>{try{c.destroy();}catch(e){}}); CHARTS=[];
  const id = location.hash.replace(/^#/,'');
  document.querySelectorAll('.nav-entry').forEach(a=>a.classList.toggle('active', a.dataset.id===id));
  closeMenu();
  const hit = id ? findEntry(id) : null;
  if(hit) renderEntry(hit); else renderHome();
  window.scrollTo(0,0);
}

/* ---------- home ---------- */
function renderHome(){
  const m = document.getElementById('main');
  let cards='';
  DATA.chapters.forEach(ch=>{
    const n = (ch.sections||[]).reduce((k,s)=>k+(s.entries||[]).length,0);
    const first = (ch.sections||[]).flatMap(s=>s.entries||[])[0];
    cards += `<div class="ch-card" ${first?`onclick="location.hash='${first.id}'"`:''}>`+
      `<div class="n">CH ${ch.number}</div><div class="t">${ch.title}</div>`+
      `<div class="c">${n? n+' entr'+(n>1?'ies':'y'):'—'}</div></div>`;
  });
  m.innerHTML =
    `<div class="content"><div class="home-hero">`+
    `<div class="eyebrow">${DATA.book.author}</div>`+
    `<h2>${DATA.book.title}</h2>`+
    `<p>${DATA.book.tagline||''}</p></div>`+
    `<div class="ch-grid">${cards}</div></div>`;
}

/* ---------- entry ---------- */
function renderEntry({ch,sec,en}){
  const m = document.getElementById('main');
  const content = el('div','content');

  content.appendChild(htmlEl(
    `<div class="breadcrumb">Ch ${ch.number} ${ch.title}<span class="sep">/</span>`+
    `§ ${sec.number} ${sec.title}<span class="sep">/</span><b>${en.label||en.title}</b></div>`));

  const head = el('div','entry-head');
  let meta = `<span class="pill page">p. ${en.page||'—'}</span>`;
  (en.tags||[]).forEach(t=> meta += `<span class="pill tag">${t}</span>`);
  head.innerHTML = `<div class="label">${en.label||''}</div><h2>${en.title}</h2><div class="meta">${meta}</div>`;
  content.appendChild(head);

  (en.blocks||[]).forEach(b=> content.appendChild(renderBlock(b)));
  m.innerHTML = '';
  m.appendChild(content);

  // typeset math, then draw widgets (canvas needs to be in the DOM)
  if(window.renderMathInElement){
    renderMathInElement(content,{delimiters:[
      {left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}
    ],throwOnError:false});
  }
  content.querySelectorAll('[data-widget]').forEach(host=>{
    const fn = WIDGETS[host.dataset.widget];
    if(fn) fn(host, JSON.parse(host.dataset.params||'{}'));
  });
}

const CALLOUTS = {theorem:'Theorem',proof:'Proof',note:'Note',insight:'Insight',limitation:'Limitation',summary:'Summary'};

function renderBlock(b){
  if(b.type==='prose'){ const d=el('div','block prose'); d.innerHTML=b.html; return d; }
  if(CALLOUTS[b.type]){
    const d=el('div','block');
    const title = b.label || b.title || CALLOUTS[b.type];
    const page = b.page? ` · p.${b.page}`:'';
    d.innerHTML = `<div class="callout ${b.type}"><div class="c-title">${title}${page}</div>${b.html}</div>`;
    return d;
  }
  if(b.type==='table'){ return renderTable(b); }
  if(b.type==='widget'){
    const d=el('div','block');
    const fig=el('div','figure');
    const host=el('div','widget-host');
    host.dataset.widget=b.widget;
    host.dataset.params=JSON.stringify(b.params||{});
    fig.appendChild(host);
    if(b.caption){ const cap=el('div','caption'); cap.innerHTML=b.caption; fig.appendChild(cap); }
    d.appendChild(fig);
    return d;
  }
  const d=el('div','block prose'); d.innerHTML=b.html||''; return d;
}

function renderTable(b){
  const d=el('div','block');
  let h = `<div class="tbl-wrap">`;
  if(b.title) h += `<div class="tbl-title">${b.title}</div>`;
  h += '<table><thead><tr>'+ b.columns.map(c=>`<th>${c}</th>`).join('') +'</tr></thead><tbody>';
  b.rows.forEach(row=> h += '<tr>'+ row.map(c=>`<td>${c}</td>`).join('') +'</tr>');
  h += '</tbody></table></div>';
  d.innerHTML = h;
  return d;
}

/* ---------- chart helpers ---------- */
function canvasIn(host,h){
  const w=el('div','chart-wrap'); if(h) w.style.height=h+'px';
  const c=document.createElement('canvas'); w.appendChild(c); host.appendChild(w); return c;
}
function mkChart(c,cfg){ const ch=new Chart(c,cfg); CHARTS.push(ch); return ch; }
function ds(label,data,color,extra){
  return Object.assign({label,data,borderColor:color,backgroundColor:color,
    borderWidth:2,tension:0,pointBackgroundColor:color,pointRadius:3},extra||{});
}
function axes(xt,yt,labels,markX,yStep){
  return {
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{enabled:true,
      titleFont:{family:PALETTE.font},bodyFont:{family:PALETTE.font}}},
    scales:{
      x:{title:{display:!!xt,text:xt,color:PALETTE.tick,font:{family:PALETTE.font}},
         ticks:{color:PALETTE.tick,font:{family:PALETTE.font},autoSkip:false},
         grid:{color:(ctx)=> (markX!=null && ctx.tick && labels[ctx.index]===markX)?PALETTE.markGrid:PALETTE.grid}},
      y:{title:{display:!!yt,text:yt,color:PALETTE.tick,font:{family:PALETTE.font}},
         ticks:{color:PALETTE.tick,font:{family:PALETTE.font},stepSize:yStep||1},
         grid:{color:(ctx)=> ctx.tick.value===0?PALETTE.zero:PALETTE.grid}}
    }
  };
}
function legend(host,items){
  const l=el('div','legend');
  l.innerHTML = items.map(it=>{
    const cls = it.diamond?'swatch diamond':(it.dash?'swatch dash':'swatch');
    const sty = it.diamond?`background:${it.color}`:(it.dash?`border-color:${it.color}`:`background:${it.color}`);
    return `<span class="item"><span class="${cls}" style="${sty}"></span>${it.label}</span>`;
  }).join('');
  host.appendChild(l);
}

/* ---------- widget registry ---------- */
const WIDGETS = {
  sawtooth(host,p){
    const b=p.b??4, a=range(p.aMin??0,p.aMax??13);
    const r=a.map(x=>mod(x,b)), q=a.map(x=>Math.floor(x/b));
    const c=canvasIn(host,340);
    mkChart(c,{type:'line',data:{labels:a,datasets:[
      ds('r',r,PALETTE.r,{pointRadius:4}),
      ds('q',q,PALETTE.q,{stepped:true,borderDash:[6,4]})
    ]},options:axes('a','value',a,null)});
    legend(host,[{label:'r — remainder (sawtooth)',color:PALETTE.r},
                 {label:'q — quotient (staircase)',color:PALETTE.q,dash:true}]);
  },

  signed(host,p){
    const b=p.b??4, a=range(p.aMin??-8,p.aMax??12), mark=p.mark;
    const r=a.map(x=>mod(x,b));
    const qp=a.map(x=>(x-mod(x,b))/b), qn=a.map(x=>-(x-mod(x,b))/b);
    const marker=a.map(x=>x===mark?mod(x,b):null);
    const c=canvasIn(host,340);
    mkChart(c,{type:'line',data:{labels:a,datasets:[
      ds('r',r,PALETTE.r,{pointRadius:3.5,order:2}),
      ds('q+',qp,PALETTE.q,{stepped:true,borderDash:[6,4],order:3}),
      ds('q-',qn,PALETTE.qm,{stepped:true,borderDash:[6,4],order:4}),
      ds('mark',marker,'rgba(0,0,0,0)',{pointRadius:7,pointStyle:'rectRot',pointBackgroundColor:PALETTE.mark,showLine:false,order:1})
    ]},options:axes('a','value',a,mark)});
    legend(host,[{label:'r — same for ±b (uses |b|)',color:PALETTE.r},
                 {label:'q for b=+4',color:PALETTE.q,dash:true},
                 {label:'q for b=−4 (mirror)',color:PALETTE.qm,dash:true},
                 mark!=null?{label:`a = ${mark}`,color:PALETTE.mark,diamond:true}:null].filter(Boolean));
  },

  complement(host,p){
    const b=p.b??4, a=range(p.aMin??0,p.aMax??12), mark=p.mark;
    const r=a.map(x=>mod(x,b)), bq=a.map(x=>Math.floor(x/b)*b), diag=a.slice();
    const c=canvasIn(host,340);
    mkChart(c,{type:'line',data:{labels:a,datasets:[
      ds('y=a',diag,PALETTE.diag,{pointRadius:0,borderWidth:1.5,borderDash:[2,3]}),
      ds('bq',bq,PALETTE.q,{stepped:true}),
      ds('r',r,PALETTE.r,{pointRadius:3.5})
    ]},options:axes('a (input)','value · bq + r = a',a,mark,2)});
    legend(host,[{label:'y = a (the input, diagonal)',color:PALETTE.diag,dash:true},
                 {label:'b·q (output: staircase)',color:PALETTE.q},
                 {label:'r (output: the gap)',color:PALETTE.r}]);
  },

  parallel_q(host,p){
    const b=p.b??4, qMax=p.qMax??3, mark=p.mark;
    const qs=range(0,qMax);
    const sets=[];
    for(let r=0;r<b;r++){
      const col=PALETTE.cyanRamp[r% PALETTE.cyanRamp.length];
      sets.push(ds('r='+r, qs.map(x=>b*x+r), col, {pointRadius:3}));
    }
    if(mark!=null){
      const qm=Math.floor(mark/b);
      sets.push(ds('mark', qs.map(x=>x===qm?mark:null),'rgba(0,0,0,0)',
        {pointRadius:8,pointStyle:'rectRot',pointBackgroundColor:PALETTE.mark,showLine:false}));
    }
    const c=canvasIn(host,360);
    mkChart(c,{type:'line',data:{labels:qs,datasets:sets},options:axes('q (quotient)','a',qs,null,2)});
    const items=[];
    for(let r=0;r<b;r++) items.push({label:'r = '+r+(r===0?' (intercept 0)':''),color:PALETTE.cyanRamp[r%PALETTE.cyanRamp.length]});
    if(mark!=null) items.push({label:'a = '+mark,color:PALETTE.mark,diamond:true});
    legend(host,items);
  },

  lattice(host,p){
    const b=p.b??4, cols=p.qCols??6, mark=p.mark;
    const cw=64,chh=44,gap=6,padL=52,padB=34,padT=22,padR=10;
    const gridW=cols*(cw+gap)-gap, gridH=b*(chh+gap)-gap;
    const W=padL+gridW+padR, H=padT+gridH+padB;
    let s=`<svg viewBox="0 0 ${W} ${H}" class="svgfig" preserveAspectRatio="xMidYMid meet" role="img"><title>a = b·q + r lattice</title><defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    for(let ri=0;ri<b;ri++){
      const rval=b-1-ri, y=padT+ri*(chh+gap);
      for(let qq=0;qq<cols;qq++){
        const x=padL+qq*(cw+gap), aVal=b*qq+rval;
        const isMark=(aVal===mark), isZero=(rval===0);
        const fill=isMark?PALETTE.markFill:(isZero?PALETTE.zeroFill:PALETTE.cellFill);
        const stroke=isMark?PALETTE.mark:(isZero?PALETTE.q:PALETTE.cellStroke);
        const tcol=isMark?PALETTE.markText:(isZero?PALETTE.q:PALETTE.cellText);
        s+=`<rect x="${x}" y="${y}" width="${cw}" height="${chh}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="${isMark?1.6:0.75}"${isMark?' filter="url(#glow)"':''}/>`;
        s+=`<text x="${x+cw/2}" y="${y+chh/2}" text-anchor="middle" dominant-baseline="central" font-family="${PALETTE.font}" font-size="15" fill="${tcol}">${aVal}</text>`;
      }
      s+=`<text x="${padL-18}" y="${y+chh/2}" text-anchor="middle" dominant-baseline="central" font-family="${PALETTE.font}" font-size="13" fill="${PALETTE.tick}">${rval}</text>`;
    }
    s+=`<text x="${padL-18}" y="${padT-8}" text-anchor="middle" font-family="${PALETTE.font}" font-size="13" fill="${PALETTE.amber||'#fbbf24'}">r</text>`;
    for(let qq=0;qq<cols;qq++){const x=padL+qq*(cw+gap);
      s+=`<text x="${x+cw/2}" y="${padT+gridH+20}" text-anchor="middle" font-family="${PALETTE.font}" font-size="13" fill="${PALETTE.tick}">${qq}</text>`;}
    s+=`<text x="${padL-18}" y="${padT+gridH+20}" text-anchor="middle" font-family="${PALETTE.font}" font-size="13" fill="${PALETTE.q}">q</text>`;
    s+=`</svg>`;
    host.innerHTML=s;
    legend(host,[{label:'cell = a = b·q + r',color:PALETTE.cellStroke},
                 {label:'r = 0 → multiple of b',color:PALETTE.q},
                 mark!=null?{label:'a = '+mark,color:PALETTE.mark,diamond:true}:null].filter(Boolean));
  },

  fixedq_slice(host,p){
    const q=p.q??2, bMax=p.bMax??6, aMax=p.aMax??12, bSlice=p.bSlice??4, mark=p.mark;
    const W=680,H=300, left=56,right=600,top=28,bottom=250;
    const X=b=>left+(b/bMax)*(right-left);
    const Y=a=>bottom-(a/aMax)*(bottom-top);
    let s=`<svg viewBox="0 0 ${W} ${H}" class="svgfig" preserveAspectRatio="xMidYMid meet" role="img"><title>Fix q=${q}: parallel lines a=${q}b+r, sliced at b=${bSlice}</title><defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    // axes
    s+=`<line x1="${left}" y1="${bottom}" x2="${left}" y2="${top-4}" stroke="${PALETTE.tick}" stroke-width="1.2"/>`;
    s+=`<line x1="${left}" y1="${bottom}" x2="${right+8}" y2="${bottom}" stroke="${PALETTE.tick}" stroke-width="1.2"/>`;
    s+=`<text x="${left}" y="${top-10}" text-anchor="middle" font-family="${PALETTE.font}" font-size="13" fill="${PALETTE.r}">a</text>`;
    s+=`<text x="${(left+right)/2}" y="${H-6}" text-anchor="middle" font-family="${PALETTE.font}" font-size="12" fill="${PALETTE.tick}">b  (divisor — the variable)</text>`;
    // b ticks
    for(let b=0;b<=bMax;b++){s+=`<text x="${X(b)}" y="${bottom+18}" text-anchor="middle" font-family="${PALETTE.font}" font-size="11" fill="${PALETTE.tick}">${b}</text>`;}
    // a ticks every 4
    for(let a=0;a<=aMax;a+=4){s+=`<text x="${left-10}" y="${Y(a)}" text-anchor="end" dominant-baseline="central" font-family="${PALETTE.font}" font-size="11" fill="${PALETTE.tick}">${a}</text>`;}
    // parallel lines for r=0..bSlice-1
    const rmax=bSlice-1;
    for(let r=0;r<=rmax;r++){
      const col=PALETTE.cyanRamp[r%PALETTE.cyanRamp.length];
      const bEnd=Math.min(bMax,(aMax-r)/q);
      s+=`<line x1="${X(0)}" y1="${Y(r)}" x2="${X(bEnd)}" y2="${Y(q*bEnd+r)}" stroke="${col}" stroke-width="2"/>`;
      s+=`<text x="${X(bEnd)+4}" y="${Y(q*bEnd+r)-2}" font-family="${PALETTE.font}" font-size="11" fill="${col}">r=${r}</text>`;
    }
    // slice
    s+=`<line x1="${X(bSlice)}" y1="${bottom}" x2="${X(bSlice)}" y2="${top}" stroke="${PALETTE.tick}" stroke-width="1.1" stroke-dasharray="4 4"/>`;
    s+=`<text x="${X(bSlice)}" y="${top-12}" text-anchor="middle" font-family="${PALETTE.font}" font-size="12" fill="#dcecf2">b = ${bSlice}</text>`;
    // crossing dots
    for(let r=0;r<=rmax;r++){
      const a=q*bSlice+r, isMark=(a===mark);
      const col=isMark?PALETTE.mark:PALETTE.cyanRamp[r%PALETTE.cyanRamp.length];
      s+=`<circle cx="${X(bSlice)}" cy="${Y(a)}" r="${isMark?7:5}" fill="${col}"${isMark?' filter="url(#glow)"':''}/>`;
      s+=`<text x="${X(bSlice)+12}" y="${Y(a)}" dominant-baseline="central" font-family="${PALETTE.font}" font-size="11" fill="${isMark?PALETTE.mark:PALETTE.tick}">r = ${r}${isMark?'  (a = '+mark+')':''}</text>`;
    }
    // reset open dot
    const aReset=q*bSlice+bSlice;
    if(aReset<=aMax){
      s+=`<circle cx="${X(bSlice)}" cy="${Y(aReset)}" r="5" fill="none" stroke="${PALETTE.tick}" stroke-width="1.5"/>`;
      s+=`<text x="${X(bSlice)+12}" y="${Y(aReset)}" dominant-baseline="central" font-family="${PALETTE.font}" font-size="11" fill="${PALETTE.tick}">r = 0 again — q ticks to ${q+1}</text>`;
    }
    s+=`</svg>`;
    host.innerHTML=s;
    legend(host,[{label:`fix q=${q}: lines a = ${q}b + r`,color:PALETTE.cyanRamp[2]},
                 {label:`slice at b=${bSlice} reads r = 0..${rmax} once`,color:PALETTE.tick},
                 mark!=null?{label:'a = '+mark,color:PALETTE.mark,diamond:true}:null].filter(Boolean));
  }
};

/* ---------- dom utils ---------- */
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function htmlEl(h){const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild;}
function toggleMenu(){document.getElementById('sidebar').classList.toggle('show');}
function closeMenu(){document.getElementById('sidebar').classList.remove('show');}

boot();
