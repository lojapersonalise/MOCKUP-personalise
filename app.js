// ══════════════════════════════════════════
//   APP.JS — Mockup 3D Caneca Tripla (Versão Final Otimizada)
// ══════════════════════════════════════════

import * as THREE from 'three';

window.addEventListener('error', function(e) {
  const hint = document.querySelector('.canvas-hint');
  if (hint) {
    hint.style.background = '#ef4444';
    hint.style.color = '#ffffff';
    hint.textContent = 'ERRO JS: ' + e.message;
  }
  console.error(e);
});

// ── 0. AJUSTE DO HTML VIA JS ──
const scaleSlider = document.getElementById('artScale');
if (scaleSlider) scaleSlider.max = 300;

// ── 1. RENDERER ──
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  alpha: true
});
renderer.setSize(800, 500);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Exposição corrigida para 1.0 (cores vivas e reais)
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; 
if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── 2. CENA + CÂMERA ──
const scene = new THREE.Scene();
scene.background = new THREE.Color('#6b2b8e');

const camera = new THREE.PerspectiveCamera(35, 800 / 500, 0.1, 100);
camera.position.set(0, 0.8, 10.0);

// ── 3. ILUMINAÇÃO ──
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

// Luz principal ajustada para criar reflexo de estúdio na cerâmica
const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(3, 4, 6); 
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
fillLight.position.set(-6, 3, 2);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffffff, 2.5, 20);
rimLight.position.set(0, 5, -5);
scene.add(rimLight);

// ── 4. CHÃO INVISÍVEL PARA SOMBRAS ──
const shadowPlaneGeo = new THREE.PlaneGeometry(100, 100);
const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.18 });
const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.6;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// ── 5. MATERIAIS E TEXTURAS ──
let currentColor = '#ffffff';

const ART_W = 2618;
const ART_H = 1000;

const artCanvas = document.createElement('canvas');
artCanvas.width = ART_W;
artCanvas.height = ART_H;
const artCtx = artCanvas.getContext('2d');

const artTex = new THREE.CanvasTexture(artCanvas);
if (THREE.SRGBColorSpace) artTex.colorSpace = THREE.SRGBColorSpace;

artTex.repeat.x = -1;
artTex.wrapS = THREE.RepeatWrapping;
artTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

const art = { image: null, offsetX: 0, offsetY: 0, scale: 1.0, rotation: 0, opacity: 1.0 };

// Propriedades atualizadas para efeito real de cerâmica/porcelana polida
const physicalProps = {
  roughness: 0.02,         
  metalness: 0.0,          
  clearcoat: 1.0,          
  clearcoatRoughness: 0.02, 
};

const printMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  map: artTex,
  side: THREE.FrontSide,
  ...physicalProps
});

const colorMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(currentColor),
  side: THREE.FrontSide,
  ...physicalProps
});

const colorMaterialInside = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(currentColor),
  side: THREE.BackSide,
  ...physicalProps
});

// ── 6. GERAÇÃO PROCEDURAL DA CANECA ──
const mugGroup = new THREE.Group();
mugGroup.position.y = 0.6;
scene.add(mugGroup);

function createProceduralMug() {
  const baseMug = new THREE.Group();
  const h = 2.4;
  const r = 1.0;
  const wall = 0.08;

  const geoOutside = new THREE.CylinderGeometry(r, r, h, 64, 1, true);
  const meshOutside = new THREE.Mesh(geoOutside, printMaterial);
  meshOutside.castShadow = true;
  baseMug.add(meshOutside);

  const geoInside = new THREE.CylinderGeometry(r - wall, r - wall, h, 64, 1, true);
  const meshInside = new THREE.Mesh(geoInside, colorMaterialInside);
  baseMug.add(meshInside);

  const geoRim = new THREE.RingGeometry(r - wall, r, 64);
  const meshRim = new THREE.Mesh(geoRim, colorMaterial);
  meshRim.rotation.x = -Math.PI / 2;
  meshRim.position.y = h / 2;
  meshRim.castShadow = true;
  baseMug.add(meshRim);

  const geoBottomIn = new THREE.CircleGeometry(r - wall, 64);
  const meshBottomIn = new THREE.Mesh(geoBottomIn, colorMaterial); // Corrigido para não ficar transparente
  meshBottomIn.rotation.x = -Math.PI / 2;
  meshBottomIn.position.y = -(h / 2) + wall;
  baseMug.add(meshBottomIn);

  const geoBottomOut = new THREE.CircleGeometry(r, 64);
  const meshBottomOut = new THREE.Mesh(geoBottomOut, colorMaterial);
  meshBottomOut.rotation.x = Math.PI / 2;
  meshBottomOut.position.y = -h / 2;
  meshBottomOut.castShadow = true;
  baseMug.add(meshBottomOut);

  const geoHandle = new THREE.TorusGeometry(0.65, 0.16, 32, 64);
  const meshHandle = new THREE.Mesh(geoHandle, colorMaterial);
  meshHandle.position.set(0, 0, r);
  meshHandle.rotation.y = Math.PI / 2;
  meshHandle.scale.set(0.7, 1.2, 1);
  meshHandle.castShadow = true;
  baseMug.add(meshHandle);

  return baseMug;
}

// ── 7. INSTANCIAMENTO ──
const masterMug = createProceduralMug();

const mugLeft = masterMug.clone();
mugLeft.position.x = -2.8;
mugLeft.rotation.y = -Math.PI / 2 - 0.35;

const mugCenter = masterMug.clone();
mugCenter.position.x = 0;
mugCenter.rotation.y = Math.PI;

const mugRight = masterMug.clone();
mugRight.position.x = 2.8;
mugRight.rotation.y = Math.PI / 2 + 0.35;

mugGroup.add(mugLeft, mugCenter, mugRight);

redrawArt();

// ── 8. REDESENHAR ARTE ──
function redrawArt() {
  artCtx.clearRect(0, 0, ART_W, ART_H);
  
  artCtx.fillStyle = '#ffffff';
  artCtx.fillRect(0, 0, ART_W, ART_H);

  if (art.image) {
    const iw = art.image.naturalWidth || art.image.width;
    const ih = art.image.naturalHeight || art.image.height;
    
    const fitScale = (ART_H / ih) * art.scale;
    const cx = ART_W / 2 - art.offsetX * ART_W * 0.3;
    const cy = ART_H / 2 + art.offsetY * ART_H * 0.3;

    artCtx.save();
    artCtx.globalAlpha = art.opacity;
    
    // Move para o centro da imagem
    artCtx.translate(cx, cy);
    
    // Inverte a imagem no eixo X para corrigir o texto espelhado no 3D
    artCtx.scale(-1, 1);
    
    artCtx.rotate((art.rotation * Math.PI) / 180);
    artCtx.drawImage(art.image, -iw / 2 * fitScale, -ih / 2 * fitScale, iw * fitScale, ih * fitScale);
    artCtx.restore();
  }

  artTex.needsUpdate = true;
  
  colorMaterial.color.set(currentColor);
  colorMaterialInside.color.set(currentColor);
}

// ── 9. CONTROLES DA CÂMERA ──
const rot = { x: 0.15, y: -0.2, smoothX: 0.15, smoothY: -0.2 };
let mouseDown = false, lastX = 0, lastY = 0;
let targetZoom = 10.0;

canvas.addEventListener('mousedown', e => { mouseDown = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  rot.y += (e.clientX - lastX) * 0.011;
  rot.x += (e.clientY - lastY) * 0.011;
  rot.x = Math.max(-0.4, Math.min(0.5, rot.x));
  lastX = e.clientX; lastY = e.clientY;
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  mouseDown = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
}, { passive: false });
window.addEventListener('touchend', () => mouseDown = false);
canvas.addEventListener('touchmove', e => {
  if (!mouseDown) return;
  e.preventDefault();
  rot.y += (e.touches[0].clientX - lastX) * 0.011;
  rot.x += (e.touches[0].clientY - lastY) * 0.011;
  rot.x = Math.max(-0.4, Math.min(0.5, rot.x));
  lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  targetZoom = Math.min(15, Math.max(6.0, targetZoom + e.deltaY * 0.01));
}, { passive: false });

// ── 10. EVENTOS DOS SLIDERS (COM PROTEÇÃO CONTRA ERROS) ──
const offsetXEl = document.getElementById('offsetX');
if (offsetXEl) offsetXEl.addEventListener('input', function () { art.offsetX = parseFloat(this.value); const v = document.getElementById('valOffsetX'); if(v) v.textContent = parseFloat(this.value).toFixed(2); redrawArt(); });

const offsetYEl = document.getElementById('offsetY');
if (offsetYEl) offsetYEl.addEventListener('input', function () { art.offsetY = parseFloat(this.value); const v = document.getElementById('valOffsetY'); if(v) v.textContent = parseFloat(this.value).toFixed(2); redrawArt(); });

const scaleEl = document.getElementById('artScale');
if (scaleEl) scaleEl.addEventListener('input', function () { art.scale = parseFloat(this.value) / 100; const v = document.getElementById('valScale'); if(v) v.textContent = this.value + '%'; redrawArt(); });

const rotEl = document.getElementById('artRotation');
if (rotEl) rotEl.addEventListener('input', function () { art.rotation = parseFloat(this.value); const v = document.getElementById('valRotation'); if(v) v.textContent = this.value + '°'; redrawArt(); });

const opEl = document.getElementById('artOpacity');
if (opEl) opEl.addEventListener('input', function () { art.opacity = parseFloat(this.value) / 100; const v = document.getElementById('valOpacity'); if(v) v.textContent = this.value + '%'; redrawArt(); });

// ── 11. UPLOAD DE ARTE ──
const fileInput = document.getElementById('fileInput');
if (fileInput) {
  fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        art.image = img;
        const thumb = document.getElementById('artThumb');
        if (thumb) { thumb.src = ev.target.result; thumb.style.display = 'block'; }
        const placeholder = document.getElementById('artPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
        
        art.scale = 1.0;
        const sEl = document.getElementById('artScale');
        if (sEl) sEl.value = 100;
        const vEl = document.getElementById('valScale');
        if (vEl) vEl.textContent = '100%';
        
        redrawArt();
        showToast('✅ Arte carregada!');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── 12. COR DA CANECA E FUNDO ──
const mugColorsContainer = document.getElementById('mugColors');
if (mugColorsContainer) {
  mugColorsContainer.addEventListener('click', function (e) {
    const dot = e.target.closest('[data-color]');
    if (!dot) return;
    this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    currentColor = dot.dataset.color;
    redrawArt();
    showToast('🎨 Cor alterada!');
  });
}

const bgColorsContainer = document.getElementById('bgColors');
if (bgColorsContainer) {
  bgColorsContainer.addEventListener('click', function (e) {
    const dot = e.target.closest('[data-bg]');
    if (!dot) return;
    this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    scene.background = new THREE.Color(dot.dataset.bg);
  });
}

const bgColorPicker = document.getElementById('bgColorPicker');
if (bgColorPicker) {
  bgColorPicker.addEventListener('input', function () {
    scene.background = new THREE.Color(this.value);
    const bgColors = document.getElementById('bgColors');
    if (bgColors) bgColors.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  });
}

// ── 13. EXPORTAR E RESET ──
const btnExport = document.getElementById('btnExport');
if (btnExport) {
  btnExport.addEventListener('click', () => {
    renderer.render(scene, camera);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'mockup-caneca.png';
    a.click();
    showToast('💾 Imagem salva!');
  });
}

const btnReset = document.getElementById('btnReset');
if (btnReset) {
  btnReset.addEventListener('click', () => {
    art.image = null; art.offsetX = 0; art.offsetY = 0; art.scale = 1.0; art.rotation = 0; art.opacity = 1; currentColor = '#ffffff';
    
    ['offsetX','offsetY'].forEach(id => { const el = document.getElementById(id); if(el) el.value = 0; });
    ['artScale', 'artOpacity'].forEach(id => { const el = document.getElementById(id); if(el) el.value = 100; });
    const rotEl = document.getElementById('artRotation'); if(rotEl) rotEl.value = 0;
    
    ['valOffsetX', 'valOffsetY'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '0'; });
    ['valScale', 'valOpacity'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '100%'; });
    const valRotEl = document.getElementById('valRotation'); if(valRotEl) valRotEl.textContent = '0°';
    
    const thumb = document.getElementById('artThumb'); if(thumb) { thumb.src = ''; thumb.style.display = 'none'; }
    const placeholder = document.getElementById('artPlaceholder'); if(placeholder) placeholder.style.display = 'block'; 
    const fInput = document.getElementById('fileInput'); if(fInput) fInput.value = '';
    
    rot.x = 0.15; rot.y = -0.2; targetZoom = 10.0;
    
    scene.background = new THREE.Color('#6b2b8e');
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    
    redrawArt();
    showToast('🔄 Resetado!');
  });
}

// ── 14. TOAST E LOOP DE ANIMAÇÃO ──
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

(function animate() {
  requestAnimationFrame(animate);
  rot.smoothX += (rot.x - rot.smoothX) * 0.08;
  rot.smoothY += (rot.y - rot.smoothY) * 0.08;
  mugGroup.rotation.x = rot.smoothX;
  mugGroup.rotation.y = rot.smoothY;
  camera.position.z += (targetZoom - camera.position.z) * 0.08;
  renderer.render(scene, camera);
})();
