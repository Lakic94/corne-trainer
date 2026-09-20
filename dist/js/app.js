/* Corne Trainer — typing + layers + shortcuts. No deps. Data in localStorage. */
const LS_KEY = 'corneTrainerV1';

/* ---- physical positions: 6 cols x 3 rows per half + 3 thumbs each ----
   46-key variants (like Corne+ / Corne v4.1 clones) add an inner extra key
   on the top and home rows: L06, L16, R06, R16 */
const POS = [];
['L','R'].forEach(side=>{
  for(let r=0;r<3;r++) for(let c=0;c<6;c++) POS.push(side+r+c);
  for(let t=0;t<3;t++) POS.push(side+'T'+t);
});
['L06','L16','R06','R16'].forEach(p=>POS.push(p));
const isExtraPos = p => p==='L06'||p==='L16'||p==='R06'||p==='R16';
// hasExtras/activePosList/activeDef live in board-def.js (geometry-driven)

/* default physical code per position (US ANSI Mac) */
const DEFAULT_CODE = {
  L00:'Tab', L01:'KeyQ', L02:'KeyW', L03:'KeyE', L04:'KeyR', L05:'KeyT',
  L10:'CapsLock', L11:'KeyA', L12:'KeyS', L13:'KeyD', L14:'KeyF', L15:'KeyG',
  L20:'ShiftLeft', L21:'KeyZ', L22:'KeyX', L23:'KeyC', L24:'KeyV', L25:'KeyB',
  LT0:'ControlLeft', LT1:'AltLeft', LT2:'Space',
  L06:'', L16:'', R06:'', R16:'', // 46-key inner extras: no code until user Captures them
  R00:'KeyY', R01:'KeyU', R02:'KeyI', R03:'KeyO', R04:'KeyP', R05:'Backspace',
  R10:'KeyH', R11:'KeyJ', R12:'KeyK', R13:'KeyL', R14:'Semicolon', R15:'Quote',
  R20:'KeyN', R21:'KeyM', R22:'Comma', R23:'Period', R24:'Slash', R25:'ShiftRight',
  RT0:'Enter', RT1:'AltRight', RT2:'MetaRight',
};

/* finger per position (display cols: L outer->inner, R inner->outer, 6 = inner extra) */
function fingerFor(pos){
  const side = pos[0]==='L'?'Left':'Right';
  if(pos.includes('T')){
    const t = pos[2];
    if(pos[0]==='L') return t==='2' ? 'Left thumb (inner)' : 'Left thumb (layer)';
    return t==='0' ? 'Right thumb (inner)' : 'Right thumb (layer)';
  }
  const d = +pos[2];
  const dist = pos[0]==='L' ? d : (d===6 ? 6 : 5-d);
  const f = ['Pinky','Ring','Middle','Index','Index','Index','Index'][Math.min(6,Math.max(0,dist))];
  return side+' '+f + (d===6 ? ' (inner extra)' : '');
}

function defaultLayers(){
  const B = (label,output,type='print',extra={}) => ({label,output,type,...extra});
  const base = {
    L00:B('Tab','Tab','special'),L01:B('Q','q'),L02:B('W','w'),L03:B('E','e'),L04:B('R','r'),L05:B('T','t'),
    L10:B('Esc','Escape','special'),L11:B('A','a'),L12:B('S','s'),L13:B('D','d'),L14:B('F','f'),L15:B('G','g'),
    L20:B('⇧','Shift','mod'),L21:B('Z','z'),L22:B('X','x'),L23:B('C','c'),L24:B('V','v'),L25:B('B','b'),
    LT0:B('^','Control','mod'),LT1:B('LOWER','', 'layer-hold',{layer:1}),LT2:B('Spc',' ','special'),
    R00:B('Y','y'),R01:B('U','u'),R02:B('I','i'),R03:B('O','o'),R04:B('P','p'),R05:B('⌫','Backspace','special'),
    R10:B('H','h'),R11:B('J','j'),R12:B('K','k'),R13:B('L','l'),R14:B(';',';'),R15:B("'",'\''),
    R20:B('N','n'),R21:B('M','m'),R22:B(',',','),R23:B('.','.'),R24:B('/','/'),R25:B('⇧','Shift','mod'),
    RT0:B('⏎','Enter','special'),RT1:B('RAISE','', 'layer-hold',{layer:2}),RT2:B('⌘','Meta','mod'),
  };
  const lower = {
    L00:B('`','`'),L01:B('1','1'),L02:B('2','2'),L03:B('3','3'),L04:B('4','4'),L05:B('5','5'),
    L10:B('~','~'),L11:B('!','!'),L12:B('@','@'),L13:B('#','#'),L14:B('$','$'),L15:B('%','%'),
    L20:B('⇧','Shift','mod'),L21:B('^','^'),L22:B('&','&'),L23:B('*','*'),L24:B('(','('),L25:B(') ',')'),
    LT0:B('^','Control','mod'),LT1:B('LOWER','', 'layer-hold',{layer:1}),LT2:B('Spc',' ','special'),
    R00:B('6','6'),R01:B('7','7'),R02:B('8','8'),R03:B('9','9'),R04:B('0','0'),R05:B('⌫','Backspace','special'),
    R10:B('-','-'),R11:B('_','_'),R12:B('=','='),R13:B('+','+'),R14:B('[','['),R15:B('] ',']'),
    R20:B('{','{'),R21:B('}','}'),R22:B(';',';'),R23:B(': ',':'),R24:B('/','/'),R25:B('⇧','Shift','mod'),
    RT0:B('⏎','Enter','special'),RT1:B('RAISE','', 'layer-hold',{layer:2}),RT2:B('⌘','Meta','mod'),
  };
  const raise = {
    L00:B('F1','F1','special'),L01:B('F2','F2','special'),L02:B('F3','F3','special'),L03:B('F4','F4','special'),L04:B('F5','F5','special'),L05:B('F6','F6','special'),
    L10:B('◀','ArrowLeft','special'),L11:B('▼','ArrowDown','special'),L12:B('▲','ArrowUp','special'),L13:B('▶','ArrowRight','special'),L14:B('⌂','Home','special'),L15:B('End','End','special'),
    L20:B('⇧','Shift','mod'),L21:B('◀◀','MediaRewind','special'),L22:B('▶⏸','MediaPlay','special'),L23:B('▶▶','MediaFF','special'),L24:B('🔈','AudioVolDown','special'),L25:B('🔊','AudioVolUp','special'),
    LT0:B('^','Control','mod'),LT1:B('LOWER','', 'layer-hold',{layer:1}),LT2:B('Spc',' ','special'),
    R00:B('F7','F7','special'),R01:B('F8','F8','special'),R02:B('F9','F9','special'),R03:B('F10','F10','special'),R04:B('F11','F11','special'),R05:B('F12','F12','special'),
    R10:B('Pg↑','PageUp','special'),R11:B('Pg↓','PageDown','special'),R12:B('⌫w','WordBksp','special'),R13:B('⌦','Delete','special'),R14:B('☀-','BrightDown','special'),R15:B('☀+','BrightUp','special'),
    R20:B('⏮','MediaPrev','special'),R21:B('⏭','MediaNext','special'),R22:B('🔇','AudioMute','special'),R23:B(', ',','),R24:B('. ','.'),R25:B('⇧','Shift','mod'),
    RT0:B('⏎','Enter','special'),RT1:B('RAISE','', 'layer-hold',{layer:2}),RT2:B('⌘','Meta','mod'),
  };
  const adjust = {
    L00:B('RST','Reset','special'),L01:B('Q','q'),L02:B('W','w'),L03:B('E','e'),L04:B('R','r'),L05:B('T','t'),
    L10:B('RGB','RGB','special'),L11:B('H-','HueDown','special'),L12:B('H+','HueUp','special'),L13:B('S-','SatDown','special'),L14:B('S+','SatUp','special'),L15:B('BRT','Bright','special'),
    L20:B('⇧','Shift','mod'),L21:B('Z','z'),L22:B('X','x'),L23:B('C','c'),L24:B('V','v'),L25:B('B','b'),
    LT0:B('ADJ','', 'layer-hold',{layer:3}),LT1:B('LOWER','', 'layer-hold',{layer:1}),LT2:B('Spc',' ','special'),
    R00:B('Y','y'),R01:B('U','u'),R02:B('I','i'),R03:B('O','o'),R04:B('P','p'),R05:B('BOOT','Boot','special'),
    R10:B('H','h'),R11:B('J','j'),R12:B('K','k'),R13:B('L','l'),R14:B(';',';'),R15:B("'",'\''),
    R20:B('N','n'),R21:B('M','m'),R22:B(',',','),R23:B('.','.'),R24:B('/','/'),R25:B('⇧','Shift','mod'),
    RT0:B('⏎','Enter','special'),RT1:B('RAISE','', 'layer-hold',{layer:2}),RT2:B('⌘','Meta','mod'),
  };
  return [
    {name:'Base', keys:base},
    {name:'Lower · nums', keys:lower},
    {name:'Raise · nav', keys:raise},
    {name:'Adjust', keys:adjust},
  ];
}

function defaultShortcuts(){
  return [
    {name:'Copy', mods:{cmd:1}, key:'C', hint:'everywhere'},
    {name:'Paste', mods:{cmd:1}, key:'V', hint:'everywhere'},
    {name:'Cut', mods:{cmd:1}, key:'X', hint:'everywhere'},
    {name:'Undo', mods:{cmd:1}, key:'Z', hint:'everywhere'},
    {name:'Save', mods:{cmd:1}, key:'S', hint:'everywhere'},
    {name:'Find', mods:{cmd:1}, key:'F', hint:'everywhere'},
    {name:'Spotlight', mods:{cmd:1}, key:' ', hint:'macOS search'},
    {name:'Switch app', mods:{cmd:1}, key:'Tab', hint:'⌘ held, Tab cycles'},
    {name:'New tab', mods:{cmd:1}, key:'T', hint:'browser / terminal'},
    {name:'Close tab', mods:{cmd:1}, key:'W', hint:'browser'},
    {name:'Agent palette', mods:{cmd:1,shift:1}, key:'P', hint:'your AI agent — edit me'},
    {name:'Terminal', mods:{ctrl:1,alt:1}, key:'T', hint:'edit to match your setup'},
  ];
}

let store = load() || {layers:defaultLayers(), layerNames:['Base','Lower · nums','Raise · nav','Adjust'], shortcuts:defaultShortcuts(), codes:{...DEFAULT_CODE}, variant:'corne42'};
if(!store.variant) store.variant='corne42'; // backups from before the 46-key update
function load(){ try{ const s = JSON.parse(localStorage.getItem(LS_KEY)); return s && s.layers ? s : null; }catch{ return null; } }
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(store)); }

/* ---------- tabs ---------- */
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  document.getElementById('tab-'+b.dataset.tab).classList.add('active');
});

/* ---------- keyboard render ---------- */
function keyDef(pos, layerIdx){ return store.layers[layerIdx].keys[pos] || {label:'',output:'',type:'print'}; }

/* definition-driven render: keys placed at official x/y (KLE units), stagger + thumb sizes included */
const KEY_PX = 52, KEY_STEP = 58; // 52px cap + 6px gap
function renderBoard(el, layerIdx, opts={}){
  el.innerHTML='';
  const def = activeDef();
  const b = defBounds(def);
  const board=document.createElement('div'); board.className='kbd';
  board.style.width=(b.w*KEY_STEP-6)+'px';
  board.style.height=(b.h*KEY_STEP-6)+'px';
  for(const k of def.keys){
    const keyEl = makeKey(k.pos, layerIdx, opts);
    keyEl.style.left=(k.x*KEY_STEP)+'px';
    keyEl.style.top=(k.y*KEY_STEP)+'px';
    keyEl.style.width=((k.w||1)*KEY_STEP-6)+'px';
    keyEl.style.height=((k.h||1)*KEY_STEP-6)+'px';
    if(k.r){ // rotated clusters (e.g. splayed thumbs): pivot from the definition
      keyEl.style.transform=`rotate(${k.r}deg)`;
      if(k.rx!==undefined && k.ry!==undefined){
        keyEl.style.transformOrigin=`${(k.rx-k.x)*KEY_STEP}px ${(k.ry-k.y)*KEY_STEP}px`;
      }
    }
    board.appendChild(keyEl);
  }
  el.appendChild(board);
}
function makeKey(pos, layerIdx, opts){
  const d=keyDef(pos,layerIdx);
  const k=document.createElement('div');
  k.className='key'+(d.type==='layer-hold'?' layer-key':'')+(d.type==='mod'?' mod-key':'');
  k.dataset.pos=pos;
  const show = d.label || d.output || '';
  k.innerHTML = `<span>${escapeHtml(show)}</span><small>${escapeHtml(pos)}${d.type==='layer-hold'?' ·MO'+d.layer:''}</small>`;
  if(opts.editable){ k.onclick=()=>openEditor(pos); }
  return k;
}
function escapeHtml(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---------- typing engine ---------- */
const DRILLS = {
  home:['as sad lad fad gas had hag flag dash glad shall lass fads','type slowly with home row fingers only, thumbs on space'],
  common:['the quick brown fox jumps over lazy dogs and packs my box with five dozen liquor jugs','agents write prompts while windows switch and shortcuts save the day'],
  code:['const fn = (a, b) => { return a[b] || {x: [1, 2, 3]}; }','if (err && code !== 200) { log(`fail: ${msg}`); } // fix [brackets] (parens) {braces}'],
  numbers:['call 555-0199 at 3:30pm, pay $1,249.00 for 42 items (100%)','lower layer drill: 123 456 7890 !@#$%^&*() []{} ;: +-= _'],
};
let target='', idx=0, errors=0, keystrokes=0, startT=null, errMap={}, errLog=[];
let heldCodes=new Set(), activeLayer=0, baseLayer=0;

const targetEl=document.getElementById('targetText'), area=document.getElementById('typingArea'),
  mistakeBox=document.getElementById('mistakeBox'), fingerEl=document.getElementById('fingerHint');

function newText(){
  const d=document.getElementById('drillSelect').value;
  if(d==='custom'){ target=document.getElementById('customText').value.trim()||'type your custom text here'; }
  else { const lines=DRILLS[d]; target=lines[Math.floor(Math.random()*lines.length)]; }
  idx=0; errors=0; keystrokes=0; startT=null; errMap={}; errLog=[];
  renderTarget(); updateStats(); document.getElementById('errorLog').innerHTML='<li class="empty">No mistakes yet. Nice.</li>';
  document.getElementById('worstKeys').textContent='—';
  mistakeBox.classList.add('hidden'); area.focus();
}
function renderTarget(){
  targetEl.innerHTML='';
  [...target].forEach((ch,i)=>{
    const s=document.createElement('span');
    s.textContent=ch;
    s.className = i<idx ? 'done' : (i===idx?'current':'pending');
    targetEl.appendChild(s);
  });
  updateHint();
}
function expectedPosFor(ch){
  // find pos whose output matches ch (case-insensitive)
  const order=[...new Set([activeLayer,baseLayer,...store.layers.map((_,i)=>i)])];
  for(const li of order){
    for(const pos of activePosList()){
      const d=keyDef(pos,li);
      if((d.output||'').toLowerCase()===ch.toLowerCase() && d.output.length===1) return {pos,layer:li};
    }
  }
  if(ch===' ') return {pos:'LT2',layer:baseLayer};
  if(ch==='\n') return {pos:'RT0',layer:baseLayer};
  return null;
}
function updateHint(){
  const ch=target[idx];
  if(ch===undefined){ fingerEl.textContent='🎉 Done! Press New text.'; return; }
  const f=expectedPosFor(ch);
  const disp = ch===' ' ? 'Space' : ch;
  fingerEl.textContent = f ? `Next: “${disp}” → ${f.pos} · ${fingerFor(f.pos)}${f.layer!==baseLayer?` · hold layer ${store.layerNames[f.layer]}`:''}` : `Next: “${disp}”`;
  // highlight
  document.querySelectorAll('#liveKeyboard .key').forEach(k=>{
    k.classList.toggle('next', document.getElementById('chkHighlight').checked && f && k.dataset.pos===f.pos);
  });
}
function updateStats(){
  const mins=((Date.now()-(startT||Date.now()))/60000)||0;
  const wpm = startT? Math.round((keystrokes/5)/Math.max(mins,0.01)) : 0;
  document.getElementById('statWpm').textContent=wpm;
  const acc = keystrokes? Math.round(100*(keystrokes-errors)/keystrokes):100;
  document.getElementById('statAcc').textContent=acc+'%';
  document.getElementById('statErr').textContent=errors;
  document.getElementById('statLayer').textContent=store.layerNames[activeLayer]||('L'+activeLayer);
}
function posForCode(code){
  return activePosList().filter(p=>store.codes[p]===code);
}
function flashKey(pos, cls){
  document.querySelectorAll(`#liveKeyboard .key[data-pos="${pos}"]`).forEach(k=>{
    k.classList.add(cls); setTimeout(()=>k.classList.remove(cls),350);
  });
}
function logError(expected, e){
  errors++;
  errMap[expected]=(errMap[expected]||0)+1;
  const pressed = e.key===' '?'Space':e.key;
  const posses=posForCode(e.code);
  const where = posses.length? `${posses.join(', ')} · ${posses.map(fingerFor).join('; ')}` : e.code;
  errLog.unshift({expected,pressed,code:e.code,where});
  const li=document.createElement('li');
  li.innerHTML=`expected <code>${escapeHtml(expected===' '?'Space':expected)}</code> — you hit <b>${escapeHtml(pressed)}</b> <code>${escapeHtml(e.code)}</code> <span class="mini">${escapeHtml(where)}</span>`;
  const log=document.getElementById('errorLog');
  log.querySelector('.empty')?.remove(); log.prepend(li);
  mistakeBox.classList.remove('hidden');
  mistakeBox.innerHTML=`❌ Expected <b>“${escapeHtml(expected===' '?'Space':expected)}”</b> — you pressed <b>“${escapeHtml(pressed)}”</b> (<code>${escapeHtml(e.code)}</code>, ${escapeHtml(where)}). Adjust finger and retry.`;
  // worst keys
  const worst=Object.entries(errMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
  document.getElementById('worstKeys').innerHTML=worst.map(([k,n])=>`<span class="chip">${escapeHtml(k===' '?'Space':k)} ×${n}</span>`).join('')||'—';
}

area.addEventListener('click',()=>area.focus());
document.getElementById('btnNew').onclick=newText;
document.getElementById('drillSelect').onchange=e=>{
  document.getElementById('customRow').classList.toggle('hidden', e.target.value!=='custom');
  if(e.target.value!=='custom') newText();
};
document.getElementById('btnDrillWorst').onclick=()=>{
  const worst=Object.entries(errMap).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k])=>k);
  if(!worst.length) return alert('No mistakes recorded yet — make some first!');
  target=(worst.join(' ')+' ').repeat(6).trim();
  idx=0; renderTarget(); area.focus();
};

/* global key tracking: physical press highlight + layer-hold detection */
document.addEventListener('keydown',e=>{
  // skip when typing in inputs (except typing area + shortcut practice capture)
  const tag=(e.target.tagName||'').toLowerCase();
  const inField = tag==='input'||tag==='textarea'||tag==='select'||e.target.isContentEditable;
  if(inField && e.target!==area && !capturing && !scPracticing) return;

  heldCodes.add(e.code);
  recomputeLayer();
  // mark pressed
  posForCode(e.code).forEach(p=>{
    document.querySelectorAll(`.key[data-pos="${p}"]`).forEach(k=>k.classList.add('pressed'));
  });

  if(scPracticing){ handleShortcutKey(e); e.preventDefault(); return; }
  if(capturing){ e.preventDefault(); captureCode(e.code); return; }
  if(document.getElementById('tab-type').classList.contains('active') && !inField || e.target===area){
    handleTypingKey(e);
  }
});
document.addEventListener('keyup',e=>{
  heldCodes.delete(e.code);
  recomputeLayer();
  // keyup: remove pressed only if no other held code maps there — simplify: remove
  posForCode(e.code).forEach(p=>{
    document.querySelectorAll(`.key[data-pos="${p}"]`).forEach(k=>k.classList.remove('pressed'));
  });
});
function recomputeLayer(){
  // any held pos that is a layer-hold activates its layer.
  // checks base layer first, then the currently shown layer (so LOWER -> RAISE chains work)
  let lay=baseLayer;
  for(const code of heldCodes){
    for(const p of posForCode(code)){
      const d0=keyDef(p, baseLayer);
      if(d0.type==='layer-hold' && d0.layer!=null) lay=d0.layer;
      if(activeLayer!==baseLayer){
        const dA=keyDef(p, activeLayer);
        if(dA.type==='layer-hold' && dA.layer!=null) lay=dA.layer;
      }
    }
  }
  if(lay!==activeLayer){
    activeLayer=lay;
    renderBoard(document.getElementById('liveKeyboard'), activeLayer);
    renderTarget(); updateStats();
  }
}
function handleTypingKey(e){
  if(idx>=target.length) return;
  if(['Shift','Control','Alt','Meta'].includes(e.key)) return; // modifiers alone
  if(e.metaKey||e.ctrlKey) return; // let shortcuts pass (browser) unless it's the drill char
  const expected=target[idx];
  if(!startT) startT=Date.now();
  // normalize: Enter vs \n? drills are single-line; treat Enter as nothing
  if(e.key==='Enter' && expected!=='\n'){ e.preventDefault(); return; }
  keystrokes++;
  if(e.key===expected){
    idx++; mistakeBox.classList.add('hidden');
    if(idx>=target.length){ updateStats(); renderTarget(); fingerEl.textContent='🎉 Done! Check WPM above, then New text.'; return; }
  } else {
    logError(expected, e);
    const f=expectedPosFor(e.key);
    if(f) flashKey(f.pos,'error-flash');
    const ef=expectedPosFor(expected);
    if(ef) flashKey(ef.pos,'error-flash');
  }
  if(e.key===' '||e.key==='Tab') e.preventDefault();
  renderTarget(); updateStats();
}

/* ---------- layout editor ---------- */
let editLayer=0, editingPos=null, capturing=false;
function renderLayerTabs(){
  const t=document.getElementById('layerTabs'); t.innerHTML='';
  store.layerNames.forEach((n,i)=>{
    const b=document.createElement('button'); b.textContent=`${i}: ${n}`; if(i===editLayer)b.classList.add('active');
    b.onclick=()=>{editLayer=i; renderLayerTabs(); renderBoard(document.getElementById('editKeyboard'),editLayer,{editable:true}); document.getElementById('layerName').value=n;};
    t.appendChild(b);
  });
  const sel=document.getElementById('keLayer'); sel.innerHTML='';
  store.layerNames.forEach((n,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${i}: ${n}`;sel.appendChild(o);});
}
document.getElementById('layerName').onchange=e=>{
  store.layerNames[editLayer]=e.target.value||('Layer '+editLayer); save(); renderLayerTabs(); updateStats();
};
function bootBoards(){
  renderBoard(document.getElementById('editKeyboard'),editLayer,{editable:true});
  renderBoard(document.getElementById('liveKeyboard'),activeLayer);
  renderTarget();
}
/* USB-installed board (called by the usb module; plain function => window-visible) */
function setCustomBoard(def){ store.customDef = def; store.variant = 'custom'; save(); }
/* manual thumb-order override: cycles the 3 thumb assignments of one half */
function cycleThumbs(side){
  const ids = side==='L' ? ['LT0','LT1','LT2'] : ['RT0','RT1','RT2'];
  const empty=()=>({label:'',output:'',type:'print'});
  for(const L of store.layers){
    const a = ids.map(id => L.keys[id]||empty());
    ids.forEach((id,i)=>{ L.keys[id]=a[(i+1)%3]; });
  }
  save(); bootBoards();
}
document.getElementById('btnThumbsL').onclick=()=>cycleThumbs('L');
document.getElementById('btnThumbsR').onclick=()=>cycleThumbs('R');
document.getElementById('btnUsb').onclick=async()=>{
  const btn=document.getElementById('btnUsb'), status=document.getElementById('usbStatus');
  btn.disabled=true; status.textContent='starting…';
  try{
    if(!window.CorneUSB || !window.CorneUSB.connect) throw new Error('USB module not loaded (use the built app or dev server).');
    const res=await window.CorneUSB.connect((m)=>{ status.textContent=m; });
    syncBoardUI(); bootBoards();
    alert(res.msg);
  }catch(err){ status.textContent='✗ '+(err.message||err); }
  finally{ btn.disabled=false; }
};
function syncBoardUI(){
  const sel=document.getElementById('variantSelect');
  if(store.customDef && ![...sel.options].some(o=>o.value==='custom')){
    const o=document.createElement('option'); o.value='custom'; o.textContent='Custom board'; sel.appendChild(o);
  }
  sel.value=store.variant||'corne42';
  if(sel.value==='custom' && !store.customDef) sel.value='corne42';
}
document.getElementById('variantSelect').onchange=e=>{
  if(e.target.value==='custom' && !store.customDef){ alert('Load a board definition first (info.json).'); syncBoardUI(); return; }
  store.variant=e.target.value; save(); bootBoards();
};
/* load any QMK info.json as a custom board */
let pendingBoard=null;
document.getElementById('btnLoadBoard').onclick=()=>document.getElementById('fileBoard').click();
document.getElementById('fileBoard').onchange=e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const parsed=parseInfoJson(JSON.parse(r.result));
      if(!parsed.layouts.length) throw new Error('no layouts found');
      pendingBoard=parsed;
      const sel=document.getElementById('layoutPick'); sel.innerHTML='';
      parsed.layouts.forEach((l,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=l.name+' ('+l.keys.length+' keys)'; sel.appendChild(o); });
      document.getElementById('layoutRow').classList.remove('hidden');
    }catch(err){ alert('Could not read board file: '+err.message); }
  };
  r.readAsText(f); e.target.value='';
};
document.getElementById('btnUseBoard').onclick=()=>{
  if(!pendingBoard) return;
  const l=pendingBoard.layouts[+document.getElementById('layoutPick').value];
  const keys=assignCanonicalPos(l.keys);
  if(!keys.length){ alert('No keys could be mapped from that layout.'); return; }
  store.customDef={id:'custom', name:pendingBoard.name+' / '+l.name, extras:keys.some(k=>isExtraPos(k.pos)), custom:true, keys};
  store.variant='custom'; save(); syncBoardUI(); bootBoards();
  alert('Board loaded: '+store.customDef.name+' ('+keys.length+' keys mapped). Now Import your .vil.');
};
/* flip the right half's key order (for .vil files stored unmirrored, or to fix a wrong guess) */
function mirrorRightHalf(){
  const empty=()=>({label:'',output:'',type:'print'});
  for(const L of store.layers){
    for(let r=0;r<3;r++){
      const ids=[0,1,2,3,4,5].map(c=>'R'+r+c);
      const vals=ids.map(id=>L.keys[id]||empty());
      ids.forEach((id,i)=>{ L.keys[id]=vals[5-i]; });
    }
    const t0=L.keys['RT0']||empty();
    L.keys['RT0']=L.keys['RT2']||empty(); L.keys['RT2']=t0;
  }
  save();
  renderBoard(document.getElementById('editKeyboard'),editLayer,{editable:true});
  renderBoard(document.getElementById('liveKeyboard'),activeLayer);
  renderTarget();
}
document.getElementById('btnMirror').onclick=()=>mirrorRightHalf();
function openEditor(pos){
  editingPos=pos;
  const d=keyDef(pos,editLayer);
  document.getElementById('keyEditor').classList.remove('hidden');
  document.getElementById('kePos').textContent=pos+' · '+fingerFor(pos);
  document.getElementById('keLabel').value=d.label||'';
  document.getElementById('keOutput').value=d.output||'';
  document.getElementById('keType').value=d.type||'print';
  document.getElementById('keLayer').value=d.layer??1;
  document.getElementById('keCode').value=store.codes[pos]||'';
  document.getElementById('keLayerRow').style.display=(d.type==='layer-hold')?'':'none';
}
document.getElementById('keType').onchange=e=>{
  document.getElementById('keLayerRow').style.display=e.target.value==='layer-hold'?'':'none';
};
document.getElementById('keCancel').onclick=()=>document.getElementById('keyEditor').classList.add('hidden');
document.getElementById('keSave').onclick=()=>{
  const pos=editingPos; if(!pos) return;
  store.layers[editLayer].keys[pos]={
    label:document.getElementById('keLabel').value,
    output:document.getElementById('keOutput').value,
    type:document.getElementById('keType').value,
    layer:+document.getElementById('keLayer').value,
  };
  const code=document.getElementById('keCode').value.trim();
  if(code) store.codes[pos]=code;
  save();
  renderBoard(document.getElementById('editKeyboard'),editLayer,{editable:true});
  renderBoard(document.getElementById('liveKeyboard'),activeLayer);
  document.getElementById('keyEditor').classList.add('hidden');
};
document.getElementById('keCapture').onclick=()=>{capturing=true;document.getElementById('keCapMsg').textContent='…press any key…';};
function captureCode(code){
  capturing=false;
  document.getElementById('keCode').value=code;
  document.getElementById('keCapMsg').textContent='captured: '+code;
}

/* ---------- shortcuts ---------- */
let scPracticing=false, scQueue=[], scIdx=0, scHits=0;
function comboLabel(s){
  const m=[]; if(s.mods.cmd)m.push('⌘'); if(s.mods.ctrl)m.push('^'); if(s.mods.alt)m.push('⌥'); if(s.mods.shift)m.push('⇧');
  return m.join('+')+(m.length?'+':'')+s.key;
}
function renderShortcuts(){
  const g=document.getElementById('shortcutGrid'); g.innerHTML='';
  store.shortcuts.forEach((s,i)=>{
    const c=document.createElement('div'); c.className='sc-card';
    c.innerHTML=`<b>${escapeHtml(s.name)}</b><code>${escapeHtml(comboLabel(s))}</code><div class="meta">${escapeHtml(s.hint||'')}</div>`;
    const pb=document.createElement('button'); pb.textContent='Drill'; pb.onclick=()=>{startPractice([s]);};
    const db=document.createElement('button'); db.textContent='Delete'; db.onclick=()=>{store.shortcuts.splice(i,1);save();renderShortcuts();};
    c.appendChild(document.createElement('br')); c.appendChild(pb); c.appendChild(db);
    g.appendChild(c);
  });
}
document.getElementById('scForm').onsubmit=e=>{
  e.preventDefault();
  const key=document.getElementById('scKey').value.trim(); if(!key) return;
  store.shortcuts.push({name:document.getElementById('scName').value.trim()||'Untitled',
    mods:{cmd:document.getElementById('scCmd').checked?1:0,ctrl:document.getElementById('scCtrl').checked?1:0,alt:document.getElementById('scAlt').checked?1:0,shift:document.getElementById('scShift').checked?1:0},
    key, hint:document.getElementById('scHint').value.trim()});
  save(); renderShortcuts(); e.target.reset();
};
document.getElementById('btnPracticeShortcuts').onclick=()=>startPractice(store.shortcuts);
document.getElementById('btnStopPractice').onclick=stopPractice;
function startPractice(list){
  if(!list.length) return alert('Add a shortcut first.');
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x.dataset.tab==='shortcuts'));
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id==='tab-shortcuts'));
  scPracticing=true; scQueue=[...list].sort(()=>Math.random()-.5); scIdx=0; scHits=0;
  document.getElementById('scPractice').classList.remove('hidden');
  document.getElementById('btnStopPractice').classList.remove('hidden');
  nextPrompt();
}
function stopPractice(){
  scPracticing=false;
  document.getElementById('scPractice').classList.add('hidden');
  document.getElementById('btnStopPractice').classList.add('hidden');
  document.getElementById('scScore').textContent='';
}
function nextPrompt(){
  const s=scQueue[scIdx];
  document.getElementById('scPrompt').textContent=`${s.name} → ${comboLabel(s)}`;
  document.getElementById('scFeedback').textContent=`${scHits}/${scQueue.length} · press the combo now (${s.hint||'no hint'})`;
  document.getElementById('scScore').textContent=`${scIdx+1}/${scQueue.length}`;
}
function handleShortcutKey(e){
  const s=scQueue[scIdx]; if(!s) return stopPractice();
  const got={cmd:e.metaKey?1:0,ctrl:e.ctrlKey?1:0,alt:e.altKey?1:0,shift:e.shiftKey?1:0};
  const want={cmd:s.mods.cmd?1:0,ctrl:s.mods.ctrl?1:0,alt:s.mods.alt?1:0,shift:s.mods.shift?1:0};
  const baseOk = e.key.toLowerCase()===s.key.toLowerCase() || e.code===s.key || (s.key===' '&&e.key===' ');
  const modsOk = JSON.stringify(got)===JSON.stringify(want);
  const fb=document.getElementById('scFeedback');
  if(modsOk&&baseOk){
    scHits++; fb.textContent=`✅ ${s.name} — nice!`; fb.style.color='var(--good)';
    scIdx++;
    if(scIdx>=scQueue.length){ fb.textContent=`🏁 Done: ${scHits}/${scQueue.length} correct. Run it again!`; setTimeout(stopPractice,1800); return; }
    setTimeout(nextPrompt,450);
  } else if(e.key!=='Shift'&&e.key!=='Control'&&e.key!=='Alt'&&e.key!=='Meta'){
    const pressed=[]; if(e.metaKey)pressed.push('⌘'); if(e.ctrlKey)pressed.push('^'); if(e.altKey)pressed.push('⌥'); if(e.shiftKey)pressed.push('⇧'); pressed.push(e.key);
    fb.textContent=`❌ You pressed ${pressed.join('+')} — want ${comboLabel(s)}. Try again.`;
    fb.style.color='var(--bad)';
  }
}

/* ---------- import / export / reset ---------- */
document.getElementById('btnExport').onclick=()=>{
  const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='corne-trainer-backup.json'; a.click();
};
document.getElementById('btnImport').onclick=()=>document.getElementById('fileImport').click();
document.getElementById('fileImport').onchange=e=>{
  const f=e.target.files[0]; if(!f) return;
  if (typeof importBackupFile === 'function') importBackupFile(f); // vil-import.js: .vil + backup JSON
  else { const r=new FileReader(); r.onload=()=>{ try{ const s=JSON.parse(r.result); if(!s.layers) throw 0; store=s; save(); boot(); alert('Imported ✓'); }catch{ alert('Bad file'); } }; r.readAsText(f); }
  e.target.value='';
};
document.getElementById('btnReset').onclick=()=>{
  if(!confirm('Reset layout + shortcuts to defaults?')) return;
  store={layers:defaultLayers(),layerNames:['Base','Lower · nums','Raise · nav','Adjust'],shortcuts:defaultShortcuts(),codes:{...DEFAULT_CODE},variant:store.variant,customDef:store.customDef};
  save(); boot();
};

/* ---------- boot ---------- */
function boot(){
  renderLayerTabs();
  document.getElementById('layerName').value=store.layerNames[0];
  syncBoardUI();
  renderBoard(document.getElementById('editKeyboard'),editLayer,{editable:true});
  renderBoard(document.getElementById('liveKeyboard'),activeLayer);
  renderShortcuts(); newText(); updateStats();
}
boot();
