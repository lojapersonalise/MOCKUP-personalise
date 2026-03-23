// ══════════════════════════════════════════
//   APP.JS — Mockup 3D Caneca Tripla (Procedural)
// ══════════════════════════════════════════

import * as THREE from 'three';

// ── 1. RENDERER ──────────────────────────
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(800, 500); // Ajustado para o novo tamanho do HTML
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── 2. CENA + CÂMERA ─────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f0f0f0');

const camera = new THREE.PerspectiveCamera(35, 800 / 500, 0.1, 100);
camera.position.set(0, 0.5, 9.5); // Câmera recuada para focar nas 3 canecas

// ── 3. ILUMINAÇÃO ────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(4, 6, 5);
sun.castShadow = true;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xffffff, 0.8);
fill.position.set(-4, 2, 3);
scene.add(fill);

// ── 4. MATERIAIS E TEXTURAS ──────────────
let currentColor = '#ffffff';

const ART_W = 1024;
const ART_H  = 1024;

const artCanvas = document.createElement('canvas');
artCanvas.width  = ART_W;
artCanvas.height = ART_H;
const artCtx = artCanvas.getContext('2d');

const artTex = new THREE.CanvasTexture(artCanvas);
artTex.colorSpace = THREE.SRGBColorSpace;
// Centraliza o meio da imagem na frente da caneca
artTex.offset.x = 0.5;
artTex.wrapS = THREE.RepeatWrapping;

const art = { image: null, offsetX: 0, offsetY: 0, scale: 0.5, rotation: 0, opacity: 1.0 };

// Material da Estampa (Corpo Externo)
const printMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.2,
  metalness: 0.0,
  map: artTex
});

// Material da Cerâmica (Interior, Fundo e Alça)
const colorMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(currentColor),
  roughness: 0.15,
  metalness: 0.0,
});

// ── 5. GERAÇÃO PROCEDURAL DA CANECA ──────
const mugGroup = new THREE.Group();
scene.add(mugGroup);

function createProceduralMug() {
  const baseMug = new THREE.Group();
  const h = 2.3;    // Altura baseada na sua proporção
  const r = 1.0;    // Raio
  const wall = 0.08; // Espessura da cerâmica

  // 1. Corpo Externo (Recebe a textura da arte)
  const geoOutside = new THREE.CylinderGeometry(r, r, h, 64, 1, true);
  const meshOutside = new THREE.Mesh(geoOutside, printMaterial);
  meshOutside.castShadow = true;
  baseMug.add(meshOutside);

  // 2. Corpo Interno (Recebe a cor da caneca)
  const geoInside = new THREE.CylinderGeometry(r - wall, r - wall, h, 64, 1, false);
  const meshInside = new THREE.Mesh(geoInside, colorMaterial);
  baseMug.add(meshInside);

  // 3. Borda superior (Anel de acabamento)
  const geoRim = new THREE.RingGeometry(r - wall, r, 64);
  const meshRim = new THREE.Mesh(geoRim, colorMaterial);
  meshRim.rotation.x = -Math.PI / 2;
  meshRim.position.y = h / 2;
  baseMug.add(meshRim);

  // 4. Fundo inferior
  const geoBottom = new THREE.CircleGeometry(r, 64);
  const meshBottom = new THREE.Mesh(geoBottom, colorMaterial);
  meshBottom.rotation.x = Math.PI / 2;
  meshBottom.position.y = -h / 2;
  baseMug.add(meshBottom);

  // 5. Alça
  const geoHandle = new THREE.TorusGeometry(0.65, 0.18, 16, 32);
  const meshHandle = new THREE.Mesh(geoHandle, colorMaterial);
  meshHandle.position.set(r, 0, 0); // Posiciona a alça no eixo X direito
  meshHandle.scale.set(0.7, 1.2, 1); // Alonga a alça criando o formato de "D"
  meshHandle.castShadow = true;
  baseMug.add(meshHandle);

  return baseMug;
}

// ── 6. INSTANCIAMENTO (As 3 Canecas) ─────
const masterMug = createProceduralMug();

// Caneca da Esquerda (Mostra a alça e o início da estampa)
const mugLeft = masterMug.clone();
mugLeft.position.x = -2.8;
mugLeft.rotation.y = -2.0; // aprox -115 graus

// Caneca Central (Mostra a frente da estampa)
const mugCenter = masterMug.clone();
mugCenter.position.x = 0;
mugCenter.rotation.y = 0;

// Caneca da Direita (Mostra o final da estampa)
const mugRight = masterMug.clone();
mugRight.position.x = 2.8;
mugRight.rotation.y = 2.0; // aprox 115 graus

mugGroup.add(mugLeft, mugCenter, mugRight);
redrawArt(); // Aplica a tela branca inicial


// ── 7. REDESENHAR ARTE ───────────────────
function redrawArt() {
  artCtx.clearRect(0, 0, ART_W, ART_H);

  // Fundo SEMPRE branco para manter as cores corretas
  artCtx.fillStyle = '#ffffff';
  artCtx.fillRect(0, 0, ART_W, ART_H);

  if (art.image) {
    const iw = art.image.naturalWidth  || art.image.width;
    const ih = art.image.naturalHeight || art.image.height;

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

  // Atualiza a cor global da cerâmica
  colorMaterial.color.set(currentColor);
  colorMaterial.needsUpdate = true;
}

// ── 8. ROTAÇÃO (mouse/touch) ─────────────
const rot = { x: 0.15, y: -0.2, smoothX: 0.15, smoothY: -0.2 };
let mouseDown = false, lastX = 0, lastY = 0;
let targetZoom = 9.5;

canvas.addEventListener('mousedown', e => { mouseDown = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  rot.y += (e.clientX - lastX) * 0.011;
  rot.x += (e.clientY - lastY) * 0.011;
  rot.x  = Math.max(-0.7, Math.min(0.7, rot.x));
  lastX  = e.clientX; lastY = e.clientY;
});

canvas.addEventListener('touchstart', e => {
  mouseDown = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', () => mouseDown = false);
window.addEventListener('touchmove', e => {
  if (!mouseDown) return;
  rot.y += (e.touches[0].clientX - lastX) * 0.011;
  rot.x += (e.touches[0].clientY - lastY) * 0.011;
  rot.x  = Math.max(-0.7, Math.min(0.7, rot.x));
  lastX  = e.touches[0].clientX; lastY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  targetZoom = Math.min(15, Math.max(5.0, targetZoom + e.deltaY * 0.01));
}, { passive: false });


// ── 9. SLIDERS ───────────────────────────
document.getElementById('offsetX').addEventListener('input', function () { art.offsetX = parseFloat(this.value); document.getElementById('valOffsetX').textContent = parseFloat(this.value).toFixed(2); redrawArt(); });
document.getElementById('offsetY').addEventListener('input', function () { art.offsetY = parseFloat(this.value); document.getElementById('valOffsetY').textContent = parseFloat(this.value).toFixed(2); redrawArt(); });
document.getElementById('artScale').addEventListener('input', function () { art.scale = parseFloat(this.value) / 100; document.getElementById('valScale').textContent = this.value + '%'; redrawArt(); });
document.getElementById('artRotation').addEventListener('input', function () { art.rotation = parseFloat(this.value); document.getElementById('valRotation').textContent = this.value + '°'; redrawArt(); });
document.getElementById('artOpacity').addEventListener('input', function () { art.opacity = parseFloat(this.value) / 100; document.getElementById('valOpacity').textContent = this.value + '%'; redrawArt(); });

// ── 10. UPLOAD DE ARTE ────────────────────
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
      redrawArt();
      showToast('✅ Arte carregada!');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// ── 11. COR DA CANECA ────────────────────
document.getElementById('mugColors').addEventListener('click', function (e) {
  const dot = e.target.closest('[data-color]');
  if (!dot) return;
  this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  currentColor = dot.dataset.color;
  redrawArt();
  showToast('🎨 Cor alterada!');
});

// ── 12. COR DO FUNDO ─────────────────────
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

// ── 13. EXPORTAR ─────────────────────────
document.getElementById('btnExport').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'mockup-caneca.png';
  a.click();
  showToast('💾 Imagem salva!');
});

// ── 14. RESET ────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
  art.image = null; art.offsetX = 0; art.offsetY = 0; art.scale = 0.5; art.rotation = 0; art.opacity = 1; currentColor = '#ffffff';
  ['offsetX','offsetY'].forEach(id => document.getElementById(id).value = 0);
  document.getElementById('artScale').value = 100; document.getElementById('artRotation').value = 0; document.getElementById('artOpacity').value = 100;
  document.getElementById('valOffsetX').textContent = '0'; document.getElementById('valOffsetY').textContent = '0';
  document.getElementById('valScale').textContent = '100%'; document.getElementById('valRotation').textContent = '0°'; document.getElementById('valOpacity').textContent = '100%';
  const thumb = document.getElementById('artThumb'); thumb.src = ''; thumb.style.display = 'none'; document.getElementById('artPlaceholder').style.display = 'block'; document.getElementById('fileInput').value = '';
  rot.x = 0.15; rot.y = -0.2; targetZoom = 9.5;
  scene.background = new THREE.Color('#f0f0f0');
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  redrawArt();
  showToast('🔄 Resetado!');
});

// ── 15. TOAST ────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── 16. LOOP ─────────────────────────────
(function animate() {
  requestAnimationFrame(animate);
  rot.smoothX += (rot.x - rot.smoothX) * 0.08;
  rot.smoothY += (rot.y - rot.smoothY) * 0.08;
  mugGroup.rotation.x = rot.smoothX;
  mugGroup.rotation.y = rot.smoothY;
  camera.position.z += (targetZoom - camera.position.z) * 0.08;
  renderer.render(scene, camera);
})();
