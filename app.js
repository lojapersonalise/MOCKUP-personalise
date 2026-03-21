// ══════════════════════════════════════════
//   APP.JS — Mockup 3D Caneca v10 (GLB)
// ══════════════════════════════════════════

// ── 1. RENDERER ──────────────────────────
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(600, 500);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── 2. CENA + CÂMERA ─────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f0f0f0');

const camera = new THREE.PerspectiveCamera(38, 600 / 500, 0.1, 100);
camera.position.set(0, 0.5, 4.5);

// ── 3. ILUMINAÇÃO ────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const sun = new THREE.DirectionalLight(0xffffff, 2.0);
sun.position.set(4, 6, 5);
sun.castShadow = true;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xffffff, 1.0);
fill.position.set(-4, 2, 3);
scene.add(fill);

const back = new THREE.DirectionalLight(0xffffff, 0.5);
back.position.set(0, -2, -4);
scene.add(back);

// ── 4. VARIÁVEIS GLOBAIS ─────────────────
let mugMesh   = null;   // malha principal da caneca (recebe cor)
let mugGroup  = new THREE.Group();
scene.add(mugGroup);

// Material da estampa
const ART_W = 2048;
const ART_H  = 512;

const artCanvas = document.createElement('canvas');
artCanvas.width  = ART_W;
artCanvas.height = ART_H;
const artCtx = artCanvas.getContext('2d');

const artTex = new THREE.CanvasTexture(artCanvas);
artTex.colorSpace = THREE.SRGBColorSpace;
artTex.wrapS = THREE.RepeatWrapping;
artTex.wrapT = THREE.ClampToEdgeWrapping;

const art = {
  image:    null,
  offsetX:  0,
  offsetY:  0,
  scale:    1.0,
  rotation: 0,
  opacity:  1.0,
};

// ── 5. CARREGAR GLB ──────────────────────
const loader = new THREE.GLTFLoader();

loader.load(
  'caneca.glb',   // ⚠️ coloque o arquivo caneca.glb na raiz do projeto
  function (gltf) {
    const model = gltf.scene;

    // Centraliza e escala o modelo automaticamente
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale  = 2.0 / maxDim; // normaliza para tamanho ~2 unidades

    model.position.sub(center.multiplyScalar(scale));
    model.scale.setScalar(scale);

    // Percorre todas as malhas do modelo
    model.traverse(child => {
      if (!child.isMesh) return;

      child.castShadow    = true;
      child.receiveShadow = true;

      const name = child.name.toLowerCase();

      // Tenta identificar qual parte é o corpo da caneca
      // (ajuste os nomes conforme o seu GLB — veja no console)
      console.log('Mesh encontrada:', child.name);

      // Se for a parte que recebe a estampa (corpo principal)
      if (name.includes('body') || name.includes('corpo') ||
          name.includes('mug')  || name.includes('caneca') ||
          name.includes('cylinder') || name === '') {

        mugMesh = child;

        // Aplica material com a textura da arte
        child.material = new THREE.MeshStandardMaterial({
          color:       0xffffff,
          map:         artTex,
          roughness:   0.15,
          metalness:   0.0,
        });

      } else {
        // Outras partes (alça, base) recebem material padrão
        child.material = new THREE.MeshStandardMaterial({
          color:     0xffffff,
          roughness: 0.2,
          metalness: 0.0,
        });
      }
    });

    mugGroup.add(model);
    showToast('✅ Caneca 3D carregada!');
  },

  // Progresso
  function (xhr) {
    const pct = Math.round((xhr.loaded / xhr.total) * 100);
    console.log(`Carregando GLB: ${pct}%`);
  },

  // Erro
  function (err) {
    console.error('Erro ao carregar GLB:', err);
    showToast('❌ Erro ao carregar caneca.glb');
  }
);

// ── 6. REDESENHAR ARTE ───────────────────
function redrawArt() {
  artCtx.clearRect(0, 0, ART_W, ART_H);
  if (!art.image) { artTex.needsUpdate = true; return; }

  const iw = art.image.naturalWidth  || art.image.width;
  const ih = art.image.naturalHeight || art.image.height;

  const scaleX = (ART_W / iw) * art.scale;
  const scaleY = (ART_H / ih) * art.scale;

  const cx = ART_W / 2 + art.offsetX * ART_W * 0.3;
  const cy = ART_H / 2 + art.offsetY * ART_H * 0.3;

  artCtx.save();
  artCtx.globalAlpha = art.opacity;
  artCtx.translate(cx, cy);
  artCtx.rotate((art.rotation * Math.PI) / 180);
  artCtx.scale(-scaleX, scaleY);
  artCtx.drawImage(art.image, -iw / 2, -ih / 2);
  artCtx.restore();

  artTex.needsUpdate = true;
}

// ── 7. ROTAÇÃO (mouse/touch) ─────────────
const rot = { x: 0.15, y: -0.5, smoothX: 0.15, smoothY: -0.5 };
let mouseDown = false, lastX = 0, lastY = 0;
let targetZoom = 4.5;

canvas.addEventListener('mousedown', e => {
  mouseDown = true; lastX = e.clientX; lastY = e.clientY;
});
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  rot.y += (e.clientX - lastX) * 0.011;
  rot.x += (e.clientY - lastY) * 0.011;
  rot.x  = Math.max(-0.7, Math.min(0.7, rot.x));
  lastX  = e.clientX; lastY = e.clientY;
});

canvas.addEventListener('touchstart', e => {
  mouseDown = true;
  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', () => mouseDown = false);
window.addEventListener('touchmove', e => {
  if (!mouseDown) return;
  rot.y += (e.touches[0].clientX - lastX) * 0.011;
  rot.x += (e.touches[0].clientY - lastY) * 0.011;
  rot.x  = Math.max(-0.7, Math.min(0.7, rot.x));
  lastX  = e.touches[0].clientX;
  lastY  = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  targetZoom = Math.min(7, Math.max(2.5, targetZoom + e.deltaY * 0.005));
}, { passive: false });

// ── 8. SLIDERS ───────────────────────────
document.getElementById('offsetX').addEventListener('input', function () {
  art.offsetX = parseFloat(this.value);
  document.getElementById('valOffsetX').textContent = parseFloat(this.value).toFixed(2);
  redrawArt();
});
document.getElementById('offsetY').addEventListener('input', function () {
  art.offsetY = parseFloat(this.value);
  document.getElementById('valOffsetY').textContent = parseFloat(this.value).toFixed(2);
  redrawArt();
});
document.getElementById('artScale').addEventListener('input', function () {
  art.scale = parseFloat(this.value) / 100;
  document.getElementById('valScale').textContent = this.value + '%';
  redrawArt();
});
document.getElementById('artRotation').addEventListener('input', function () {
  art.rotation = parseFloat(this.value);
  document.getElementById('valRotation').textContent = this.value + '°';
  redrawArt();
});
document.getElementById('artOpacity').addEventListener('input', function () {
  art.opacity = parseFloat(this.value) / 100;
  document.getElementById('valOpacity').textContent = this.value + '%';
  redrawArt();
});

// ── 9. UPLOAD DE ARTE ────────────────────
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

// ── 10. COR DA CANECA ────────────────────
document.getElementById('mugColors').addEventListener('click', function (e) {
  const dot = e.target.closest('[data-color]');
  if (!dot) return;
  this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');

  // Aplica cor em todas as malhas do grupo
  mugGroup.traverse(child => {
    if (!child.isMesh) return;
    const name = child.name.toLowerCase();
    // Não muda base/interior
    if (name.includes('base') || name.includes('bottom') ||
        name.includes('inner') || name.includes('interior')) return;
    child.material.color.set(dot.dataset.color);
    child.material.needsUpdate = true;
  });

  showToast('🎨 Cor alterada!');
});

// ── 11. COR DO FUNDO ─────────────────────
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

// ── 12. EXPORTAR ─────────────────────────
document.getElementById('btnExport').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'mockup-caneca.png';
  a.click();
  showToast('💾 Imagem salva!');
});

// ── 13. RESET ────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
  art.image = null; art.offsetX = 0; art.offsetY = 0;
  art.scale = 1; art.rotation = 0; art.opacity = 1;

  ['offsetX','offsetY'].forEach(id => document.getElementById(id).value = 0);
  document.getElementById('artScale').value    = 100;
  document.getElementById('artRotation').value = 0;
  document.getElementById('artOpacity').value  = 100;

  document.getElementById('valOffsetX').textContent  = '0';
  document.getElementById('valOffsetY').textContent  = '0';
  document.getElementById('valScale').textContent    = '100%';
  document.getElementById('valRotation').textContent = '0°';
  document.getElementById('valOpacity').textContent  = '100%';

  const thumb = document.getElementById('artThumb');
  thumb.src = ''; thumb.style.display = 'none';
  document.getElementById('artPlaceholder').style.display = 'block';
  document.getElementById('fileInput').value = '';

  rot.x = 0.15; rot.y = -0.5; targetZoom = 4.5;

  mugGroup.traverse(child => {
    if (!child.isMesh) return;
    child.material.color.set('#ffffff');
    child.material.needsUpdate = true;
  });

  scene.background = new THREE.Color('#f0f0f0');
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  redrawArt();
  showToast('🔄 Resetado!');
});

// ── 14. TOAST ────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── 15. LOOP ─────────────────────────────
(function animate() {
  requestAnimationFrame(animate);
  rot.smoothX += (rot.x - rot.smoothX) * 0.08;
  rot.smoothY += (rot.y - rot.smoothY) * 0.08;
  mugGroup.rotation.x = rot.smoothX;
  mugGroup.rotation.y = rot.smoothY;
  camera.position.z += (targetZoom - camera.position.z) * 0.08;
  renderer.render(scene, camera);
})();
