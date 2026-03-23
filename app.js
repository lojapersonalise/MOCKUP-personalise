// ══════════════════════════════════════════
//   APP.JS — Mockup 3D Caneca Tripla (Cores Fiéis e Proporção Real)
// ══════════════════════════════════════════

// ── 0. DIAGNÓSTICO VISUAL ────────────────
window.addEventListener('error', function(e) {
  const hint = document.querySelector('.canvas-hint');
  if (hint) {
    hint.style.background = '#ef4444';
    hint.style.color = '#ffffff';
    hint.textContent = 'ERRO JS: ' + e.message;
  }
  console.error(e);
});

import * as THREE from 'three';

// ── 1. RENDERER (Configuração de Cores Fiéis) ──
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  alpha: true
});
renderer.setSize(800, 500); 
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Sombras ativadas
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

// Removido o ACESFilmic para não "acinzentar" o branco. 
// Usamos cores lineares padrão para e-commerce.
renderer.toneMapping = THREE.NoToneMapping; 
if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── 2. CENA + CÂMERA ─────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color('#6b2b8e'); 

const camera = new THREE.PerspectiveCamera(35, 800 / 500, 0.1, 100);
camera.position.set(0, 0.8, 10.0);

// ── 3. ILUMINAÇÃO (Recalibrada para branco puro) ─────
// Luz ambiente clara
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// Luz principal frontal (projeta a sombra)
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(5, 8, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

// Luz de preenchimento suave
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-6, 3, 2);
scene.add(fillLight);

// Luz de recorte (realça o verniz/brilho da cerâmica)
const rimLight = new THREE.PointLight(0xffffff, 0.6, 20);
rimLight.position.set(0, 5, -5);
scene.add(rimLight);

// ── 4. CHÃO INVISÍVEL PARA SOMBRAS ───────
const shadowPlaneGeo = new THREE.PlaneGeometry(100, 100);
const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.15 }); 
const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -1.2; 
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// ── 5. MATERIAIS E TEXTURAS (A PROPORÇÃO CORRETA) ──
let currentColor = '#ffffff';

// MUDANÇA CRUCIAL: Resolução Retangular simulando uma estampa real (aprox 21x9cm)
const ART_W = 2048;
const ART_H = 853; 

const artCanvas = document.createElement('canvas');
artCanvas.width = ART_W;
artCanvas.height = ART_H;
const artCtx = artCanvas.getContext('2d');

const artTex = new THREE.CanvasTexture(artCanvas);
if (THREE.SRGBColorSpace) artTex.colorSpace = THREE.SRGBColorSpace;
artTex.offset.x = 0.5; // Centraliza a arte na frente da caneca
artTex.wrapS = THREE.RepeatWrapping;
artTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

const art = { image: null, offsetX: 0, offsetY: 0, scale: 0.8, rotation: 0, opacity: 1.0 };

// Propriedades físicas da Cerâmica Vitrificada
const physicalProps = {
  roughness: 0.15,         
  metalness: 0.0,          
  clearcoat: 1.0,          // Mantém o reflexo premium
  clearcoatRoughness: 0.1, 
};

// Material da Estampa (Corpo Externo)
const printMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, // Branco 100% puro
  map: artTex,
  side: THREE.FrontSide,
  ...physicalProps
});

// Material da Cerâmica (Alça, bordas, fundo)
const colorMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(currentColor),
  side: THREE.FrontSide,
  ...physicalProps
});

// Material do Interior (BackSide)
const colorMaterialInside = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(currentColor),
  side: THREE.BackSide,
  ...physicalProps
});

// ── 6. GERAÇÃO PROCEDURAL DA CANECA ──────
const mugGroup = new THREE.Group();
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
  const meshBottomIn = new THREE.Mesh(geoBottomIn, colorMaterialInside);
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
  meshHandle.position.set(r, 0, 0);
  meshHandle.scale.set(0.7, 1.2, 1);
  meshHandle.castShadow = true;
  baseMug.add(meshHandle);

  return baseMug;
}

// ── 7. INSTANCIAMENTO (As 3 Canecas) ─────
const masterMug = createProceduralMug();

const mugLeft = masterMug.clone();
mugLeft.position.x = -2.8;
mugLeft.rotation.y = -1.8; 

const mugCenter = masterMug.clone();
mugCenter.position.x = 0;
mugCenter.rotation.y = 0;

const mugRight = masterMug.clone();
mugRight.position.x = 2.8;
mugRight.rotation.y = 1.8; 

mugGroup.add(mugLeft, mugCenter, mugRight);

redrawArt();

// ── 8. REDESENHAR ARTE ───────────────────
function redrawArt() {
  artCtx.clearRect(0, 0, ART_W, ART_H);
  
  // Fundo do canvas 2D 100% branco
  artCtx.fillStyle = '#ffffff';
  artCtx.fillRect(0, 0, ART_W, ART_H);

  if (art.image) {
    const iw = art.image.naturalWidth || art.image.width;
    const ih = art.image.naturalHeight || art.image.height;
    
    // Calcula a escala para preencher mantendo a proporção
    const fitScale = Math.min(ART_W / iw, ART_H / ih) * art.scale;
    const cx = ART_W / 2 + art.offsetX * ART_W * 0.3;
    const cy = ART_H / 2 + art.offsetY * ART_H * 0.3;

    artCtx.save();
    artCtx.globalAlpha = art.opacity;
    artCtx.translate(cx, cy);
    artCtx.rotate((art.rotation * Math.PI) / 180);
    artCtx.drawImage(art.image, -iw / 2 * fitScale, -ih / 2 * fitScale, iw * fitScale, ih * fitScale);
    artCtx.restore();
  }

  artTex.needsUpdate = true;
  
  colorMaterial.color.set(currentColor);
  colorMaterialInside.color.set(currentColor);
  colorMaterial.needsUpdate = true;
  colorMaterialInside.needsUpdate = true;
}

// ── 9. CONTROLES DA CÂMERA ───────────────
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
  mouseDown = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', () => mouseDown = false);
window.addEventListener('touchmove', e => {
  if (!mouseDown) return;
  rot.y += (e.touches[0].clientX - lastX) * 0.011;
  rot.x += (e.touches[0].clientY - lastY) * 0.011;
  rot.x = Math.max(-0.4, Math.min(0.5, rot.x));
  lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  targetZoom = Math.min(15, Math.max(6.0, targetZoom + e.deltaY * 0.01));
}, { passive: false });

// ── 10. EVENTOS DOS SLIDERS ───────────────
document.getElementById('offsetX').addEventListener('input', function () { art.offsetX = parseFloat(this.value); document.getElementById('valOffsetX').textContent = parseFloat(this.value).toFixed(2); redrawArt(); });
document.getElementById('offsetY').addEventListener('input', function () { art.offsetY = parseFloat(this.value); document.getElementById('valOffsetY').textContent = parseFloat(this.value).toFixed(2); redrawArt(); });
// Ajuste na sensibilidade do slider de tamanho (escala inicial = 0.8)
document.getElementById('artScale').addEventListener('input', function () { art.scale = parseFloat(this.value) / 100; document.getElementById('valScale').textContent = this.value + '%'; redrawArt(); });
document.getElementById('artRotation').addEventListener('input', function () { art.rotation = parseFloat(this.value); document.getElementById('valRotation').textContent = this.value + '°'; redrawArt(); });
document.getElementById('artOpacity').addEventListener('input', function () { art.opacity = parseFloat(this.value) / 100; document.getElementById('valOpacity').textContent = this.value + '%'; redrawArt(); });

// ── 11. UPLOAD DE ARTE ────────────────────
document.getElementById('fileInput').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      art.image = img;
      const thumb = document.getElementById('artThumb');
      thumb.src = ev.target.result;
      thumb.style.display = 'block';
      document.getElementById('artPlaceholder').style.display = 'none';
      
      // Reseta a escala para 100% ao carregar nova imagem
      art.scale = 1.0;
      document.getElementById('artScale').value = 100;
      document.getElementById('valScale').textContent = '100%';
      
      redrawArt();
      showToast('✅ Arte carregada!');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// ── 12. COR DA CANECA E FUNDO ────────────
document.getElementById('mugColors').addEventListener('click', function (e) {
  const dot = e.target.closest('[data-color]');
  if (!dot) return;
  this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  currentColor = dot.dataset.color;
  redrawArt();
  showToast('🎨 Cor alterada!');
});

document.getElementById('bgColors').addEventListener('click', function (e) {
  const dot = e.target.closest('[data-bg]');
  if (!dot) return;
  this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  scene.background = new THREE.Color(dot.dataset.bg);
});

document.getElementById('bgColorPicker').addEventListener('input', function () {
  scene.background = new THREE.Color(this.value);
  document.querySelectorAll('#bgColors .color-dot').forEach(d => d.classList.remove('active'));
});

// ── 13. EXPORTAR E RESET ─────────────────
document.getElementById('btnExport').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'mockup-caneca.png';
  a.click();
  showToast('💾 Imagem salva!');
});

document.getElementById('btnReset').addEventListener('click', () => {
  art.image = null; art.offsetX = 0; art.offsetY = 0; art.scale = 0.8; art.rotation = 0; art.opacity = 1; currentColor = '#ffffff';
  ['offsetX','offsetY'].forEach(id => document.getElementById(id).value = 0);
  document.getElementById('artScale').value = 80; document.getElementById('artRotation').value = 0; document.getElementById('artOpacity').value = 100;
  document.getElementById('valOffsetX').textContent = '0'; document.getElementById('valOffsetY').textContent = '0';
  document.getElementById('valScale').textContent = '80%'; document.getElementById('valRotation').textContent = '0°'; document.getElementById('valOpacity').textContent = '100%';
  const thumb = document.getElementById('artThumb'); thumb.src = ''; thumb.style.display = 'none'; document.getElementById('artPlaceholder').style.display = 'block'; document.getElementById('fileInput').value = '';
  rot.x = 0.15; rot.y = -0.2; targetZoom = 10.0;
  
  scene.background = new THREE.Color('#6b2b8e');
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  
  redrawArt();
  showToast('🔄 Resetado!');
});

// ── 14. TOAST E LOOP DE ANIMAÇÃO ─────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
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
