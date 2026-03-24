// ══════════════════════════════════════════
//   APP.JS — Simulador Multi-Produtos (Caneca & Agenda) - BLINDADO
// ══════════════════════════════════════════

import * as THREE from 'three';

window.addEventListener('error', function(e) {
  const hint = document.querySelector('.canvas-hint');
  if (hint) { hint.style.background = '#ef4444'; hint.style.color = '#ffffff'; hint.textContent = 'ERRO JS: ' + e.message; }
});

// ── 1. RENDERER ──
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; 

// ── 2. CENA + CÂMERA + LUZES ──
const scene = new THREE.Scene();
scene.background = new THREE.Color('#6b2b8e');
const camera = new THREE.PerspectiveCamera(35, 800 / 500, 0.1, 100);
camera.position.set(0, 0.8, 10.0);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(3, 4, 6); keyLight.castShadow = true;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
fillLight.position.set(-6, 3, 2); scene.add(fillLight);
const rimLight = new THREE.PointLight(0xffffff, 2.5, 20);
rimLight.position.set(0, 5, -5); scene.add(rimLight);

const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.18 }));
shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.y = -0.6; shadowPlane.receiveShadow = true;
scene.add(shadowPlane);


// ── 3. ESTADO DA APLICAÇÃO (GERENTE DE PALCO) ──
let activeProduct = 'mug'; 
let activePart = 'front';  
let currentMugColor = '#ffffff';

const defaultState = () => ({ image: null, offsetX: 0, offsetY: 0, scale: 1.0, rotation: 0, opacity: 1.0 });

const state = {
  mug: defaultState(),
  planner: { front: defaultState(), back: defaultState(), spine: defaultState(), edges: defaultState() }
};

function getActiveState() {
  return activeProduct === 'mug' ? state.mug : state.planner[activePart];
}

// ── 4. GERENCIADOR DE TELAS E TEXTURAS (CANVASES) ──
function createArtCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  return { canvas: c, ctx, tex, w, h };
}

const canvases = {
  mug: createArtCanvas(2618, 1000),
  planner: {
    front: createArtCanvas(1499, 2180), 
    back:  createArtCanvas(1499, 2180),
    spine: createArtCanvas(180,  2180),
    edges: createArtCanvas(1440, 2120) 
  }
};
canvases.mug.tex.repeat.x = -1; 
canvases.mug.tex.wrapS = THREE.RepeatWrapping;

// ── 5. MATERIAIS ──
const premiumProps = { roughness: 0.02, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.02 }; 
const paperProps = { roughness: 0.9, metalness: 0.0, clearcoat: 0.0 }; 

const mugPrintMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: canvases.mug.tex, side: THREE.FrontSide, ...premiumProps });
const mugColorMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(currentMugColor), side: THREE.FrontSide, ...premiumProps });
const mugInsideMat= new THREE.MeshPhysicalMaterial({ color: new THREE.Color(currentMugColor), side: THREE.BackSide, ...premiumProps });

const plannerMats = {
  front: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: canvases.planner.front.tex, ...premiumProps }),
  back:  new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: canvases.planner.back.tex, ...premiumProps }),
  spine: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: canvases.planner.spine.tex, ...premiumProps }),
  edges: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: canvases.planner.edges.tex, ...paperProps }),
  insideCover: new THREE.MeshPhysicalMaterial({ color: 0xeeeeee, ...paperProps }), 
  elastic: new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.8 })     
};


// ── 6. CONSTRUÇÃO DA CANECA ──
const mugGroup = new THREE.Group(); mugGroup.position.y = 0.6; scene.add(mugGroup);
function createMug() {
  const g = new THREE.Group();
  const h = 2.4, r = 1.0, wall = 0.08;
  
  // CORREÇÃO APLICADA: Rotação indevida removida. Costura volta a ficar escondida na alça.
  const out = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, true), mugPrintMat); 
  out.castShadow = true; 
  g.add(out);
  
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r-wall, r-wall, h, 64, 1, true), mugInsideMat));
  
  const rim = new THREE.Mesh(new THREE.RingGeometry(r-wall, r, 64), mugColorMat); 
  rim.rotation.x = -Math.PI/2; rim.position.y = h/2; g.add(rim);
  
  const bot = new THREE.Mesh(new THREE.CircleGeometry(r, 64), mugColorMat); 
  bot.rotation.x = -Math.PI/2; bot.position.y = -h/2 + wall; g.add(bot);
  
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.16, 32, 64), mugColorMat); 
  handle.position.set(0, 0, r); handle.rotation.y = Math.PI/2; handle.scale.set(0.7, 1.2, 1); handle.castShadow = true; g.add(handle);
  
  return g;
}
const m1 = createMug(); m1.position.x = -2.8; m1.rotation.y = -Math.PI / 2 - 0.35;
const m2 = createMug(); m2.rotation.y = Math.PI;
const m3 = createMug(); m3.position.x = 2.8; m3.rotation.y = Math.PI / 2 + 0.35;
mugGroup.add(m1, m2, m3);


// ── 7. CONSTRUÇÃO DA AGENDA ──
const plannerGroup = new THREE.Group(); plannerGroup.position.y = 0.6; plannerGroup.visible = false; scene.add(plannerGroup);
function createPlanner() {
  const g = new THREE.Group();
  const w = 1.50, h = 2.18, coverD = 0.02; 
  const pW = 1.44, pH = 2.12, pD = 0.32;   
  const sW = 0.18;                         
  const solid = plannerMats.insideCover;

  const paper = new THREE.Mesh(new THREE.BoxGeometry(pW, pH, pD), [plannerMats.edges, solid, plannerMats.edges, plannerMats.edges, solid, solid]);
  paper.position.set(0, 0, 0); g.add(paper);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(sW, h, pD + coverD*2), [solid, plannerMats.spine, solid, solid, solid, solid]);
  spine.position.set(-pW/2 - sW/2, 0, 0); spine.castShadow = true; g.add(spine);

  const front = new THREE.Mesh(new THREE.BoxGeometry(w, h, coverD), [solid, solid, solid, solid, plannerMats.front, solid]);
  front.position.set((w - pW)/2, 0, pD/2 + coverD/2); front.castShadow = true; g.add(front);

  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, coverD), [solid, solid, solid, solid, solid, plannerMats.back]);
  back.position.set((w - pW)/2, 0, -(pD/2 + coverD/2)); back.castShadow = true; g.add(back);

  const elastic = new THREE.Mesh(new THREE.BoxGeometry(0.08, h + 0.02, pD + coverD*2 + 0.02), plannerMats.elastic);
  elastic.position.set(w/2 - 0.2, 0, 0); elastic.castShadow = true; g.add(elastic);

  return g;
}

const pMaster = createPlanner();
const p1 = pMaster.clone(); p1.position.x = -2.0; p1.rotation.y = 0.4; 
const p2 = pMaster.clone(); p2.position.x = 2.0; p2.rotation.y = Math.PI - 0.4; 
plannerGroup.add(p1, p2);


// ── 8. LÓGICA DE DESENHO DA ARTE ──
function drawCanvas() {
  const s = getActiveState();
  const c = activeProduct === 'mug' ? canvases.mug : canvases.planner[activePart];
  
  c.ctx.clearRect(0, 0, c.w, c.h);
  c.ctx.fillStyle = '#ffffff'; 
  c.ctx.fillRect(0, 0, c.w, c.h);

  if (s.image) {
    const iw = s.image.naturalWidth || s.image.width;
    const ih = s.image.naturalHeight || s.image.height;
    const fitScale = (c.h / ih) * s.scale; 
    
    const cx = activeProduct === 'mug' ? (c.w / 2 - s.offsetX * c.w * 0.3) : (c.w / 2 + s.offsetX * c.w * 0.3);
    const cy = c.h / 2 + s.offsetY * c.h * 0.3;

    c.ctx.save();
    c.ctx.globalAlpha = s.opacity;
    
    if (activeProduct === 'mug') {
      c.ctx.translate(cx, cy);
      c.ctx.scale(-1, 1);
      c.ctx.rotate((s.rotation * Math.PI) / 180);
      c.ctx.drawImage(s.image, -iw / 2 * fitScale, -ih / 2 * fitScale, iw * fitScale, ih * fitScale);
    } else {
      c.ctx.translate(cx, cy);
      c.ctx.rotate((s.rotation * Math.PI) / 180);
      c.ctx.drawImage(s.image, -iw / 2 * fitScale, -ih / 2 * fitScale, iw * fitScale, ih * fitScale);
    }
    c.ctx.restore();
  }
  
  c.tex.needsUpdate = true;
  mugColorMat.color.set(currentMugColor);
  mugInsideMat.color.set(currentMugColor);
}

['mug', 'front', 'back', 'spine', 'edges'].forEach(part => {
  if(part !== 'mug') activePart = part;
  activeProduct = part === 'mug' ? 'mug' : 'planner';
  drawCanvas();
});
activeProduct = 'mug'; activePart = 'front'; 


// ── 9. ATUALIZADOR DE UI SEGURO ──
function updateUI() {
  const s = getActiveState();
  
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; }
  const setText = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; }

  setVal('offsetX', s.offsetX);
  setVal('offsetY', s.offsetY);
  setVal('artScale', s.scale * 100);
  setVal('artRotation', s.rotation);
  setVal('artOpacity', s.opacity * 100);

  setText('valOffsetX', s.offsetX.toFixed(2));
  setText('valOffsetY', s.offsetY.toFixed(2));
  setText('valScale', Math.round(s.scale * 100) + '%');
  setText('valRotation', s.rotation + '°');
  setText('valOpacity', Math.round(s.opacity * 100) + '%');

  const thumb = document.getElementById('artThumb'), ph = document.getElementById('artPlaceholder');
  if (s.image && thumb && ph) { thumb.src = s.image.src; thumb.style.display = 'block'; ph.style.display = 'none'; } 
  else if (thumb && ph) { thumb.src = ''; thumb.style.display = 'none'; ph.style.display = 'block'; }
}

const addEvt = (id, event, fn) => { const el = document.getElementById(id); if(el) el.addEventListener(event, fn); }

addEvt('offsetX', 'input', function() { getActiveState().offsetX = parseFloat(this.value); updateUI(); drawCanvas(); });
addEvt('offsetY', 'input', function() { getActiveState().offsetY = parseFloat(this.value); updateUI(); drawCanvas(); });
addEvt('artScale', 'input', function() { getActiveState().scale = parseFloat(this.value) / 100; updateUI(); drawCanvas(); });
addEvt('artRotation', 'input', function() { getActiveState().rotation = parseFloat(this.value); updateUI(); drawCanvas(); });
addEvt('artOpacity', 'input', function() { getActiveState().opacity = parseFloat(this.value) / 100; updateUI(); drawCanvas(); });

addEvt('fileInput', 'change', function() {
  if (!this.files[0]) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => { getActiveState().image = img; getActiveState().scale = 1.0; updateUI(); drawCanvas(); showToast('✅ Arte aplicada!'); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(this.files[0]);
});

document.querySelectorAll('.product-tab').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.product-tab').forEach(b => { b.style.color = '#6b7280'; b.style.borderBottom = '2px solid transparent'; b.style.background = 'transparent'; b.style.fontWeight = '600'; });
    this.style.color = '#2563eb'; this.style.borderBottom = '2px solid #2563eb'; this.style.background = '#fff'; this.style.fontWeight = '700';
    
    activeProduct = this.dataset.product;
    if (activeProduct === 'mug') {
      mugGroup.visible = true; plannerGroup.visible = false;
      const mColors = document.getElementById('sectionMugColors'); if(mColors) mColors.style.display = 'block';
      const pParts = document.getElementById('sectionPlannerParts'); if(pParts) pParts.style.display = 'none';
    } else {
      mugGroup.visible = false; plannerGroup.visible = true;
      const mColors = document.getElementById('sectionMugColors'); if(mColors) mColors.style.display = 'none';
      const pParts = document.getElementById('sectionPlannerParts'); if(pParts) pParts.style.display = 'block';
    }
    updateUI();
  });
});

document.querySelectorAll('.part-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.part-btn').forEach(b => { b.style.background = '#fff'; b.style.color = '#374151'; b.style.borderColor = '#e0e0e0'; });
    this.style.background = '#2563eb'; this.style.color = '#fff'; this.style.borderColor = '#2563eb';
    activePart = this.dataset.part;
    updateUI();
  });
});

const mugColorsContainer = document.getElementById('mugColors');
if (mugColorsContainer) {
  mugColorsContainer.addEventListener('click', function (e) {
    if (e.target.tagName === 'INPUT') return;
    const dot = e.target.closest('[data-color]');
    if (!dot) {
      const label = e.target.closest('label.color-dot');
      if (label) { this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active')); label.classList.add('active'); }
      return;
    }
    this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    currentMugColor = dot.dataset.color; drawCanvas(); showToast('🎨 Cor alterada!');
  });
}
addEvt('customMugColor', 'input', function() { currentMugColor = this.value; drawCanvas(); });


// ── 10. ROTINA BASE (Rotação, Exportar) ──
const rot = { x: 0.15, y: -0.2, smoothX: 0.15, smoothY: -0.2 };
let mouseDown = false, lastX = 0, lastY = 0, targetZoom = 10.0;

canvas.addEventListener('mousedown', e => { mouseDown = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => { if (!mouseDown) return; rot.y += (e.clientX - lastX) * 0.01; rot.x += (e.clientY - lastY) * 0.01; rot.x = Math.max(-0.4, Math.min(0.5, rot.x)); lastX = e.clientX; lastY = e.clientY; });

canvas.addEventListener('touchstart', e => { e.preventDefault(); mouseDown = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, { passive: false });
window.addEventListener('touchend', () => mouseDown = false);
canvas.addEventListener('touchmove', e => { if (!mouseDown) return; e.preventDefault(); rot.y += (e.touches[0].clientX - lastX) * 0.011; rot.x += (e.touches[0].clientY - lastY) * 0.011; rot.x = Math.max(-0.4, Math.min(0.5, rot.x)); lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, { passive: false });

canvas.addEventListener('wheel', e => { e.preventDefault(); targetZoom = Math.min(15, Math.max(6.0, targetZoom + e.deltaY * 0.01)); }, { passive: false });

addEvt('btnExport', 'click', () => { renderer.render(scene, camera); const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'mockup-loja.png'; a.click(); showToast('💾 Imagem salva!'); });

let toastTimer; function showToast(msg) { let t = document.getElementById('toast'); if(!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2500); }

function animate() {
  requestAnimationFrame(animate);
  rot.smoothX += (rot.x - rot.smoothX) * 0.08; rot.smoothY += (rot.y - rot.smoothY) * 0.08;
  mugGroup.rotation.x = rot.smoothX; mugGroup.rotation.y = rot.smoothY;
  plannerGroup.rotation.x = rot.smoothX; plannerGroup.rotation.y = rot.smoothY;
  camera.position.z += (targetZoom - camera.position.z) * 0.08;
  renderer.render(scene, camera);
} animate();

window.addEventListener('resize', () => {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
}); window.dispatchEvent(new Event('resize'));
