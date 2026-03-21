// ══════════════════════════════════════════
//   APP.JS — Mockup 3D Caneca v5
//   Compatível com index.html atual
// ══════════════════════════════════════════

// ── 1. RENDERER ──────────────────────────
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
scene.background = new THREE.Color('#ffffff');

const camera = new THREE.PerspectiveCamera(38, 600 / 500, 0.1, 100);
camera.position.set(0, 0.2, 4.5);

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

// ── 4. MATERIAL DA CANECA ────────────────
const mugMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.2,
  metalness: 0.0,
});

// ── 5. GEOMETRIA DA CANECA ───────────────
const G = {
  rTop: 0.42,
  rBot: 0.36,
  h:    1.00,
  seg:  120,
  wall: 0.026,
};

const mugGroup = new THREE.Group();
scene.add(mugGroup);

// Corpo
mugGroup.add(new THREE.Mesh(
  new THREE.CylinderGeometry(G.rTop, G.rBot, G.h, G.seg, 1, true),
  mugMat
));

// Base
const base = new THREE.Mesh(
  new THREE.CircleGeometry(G.rBot, G.seg),
  mugMat
);
base.rotation.x = -Math.PI / 2;
base.position.y = -G.h / 2;
mugGroup.add(base);

// Borda superior
const rim = new THREE.Mesh(
  new THREE.TorusGeometry(G.rTop, G.wall, 16, G.seg),
  mugMat
);
rim.position.y = G.h / 2;
mugGroup.add(rim);

// Interior da boca
const inner = new THREE.Mesh(
  new THREE.CircleGeometry(G.rTop - G.wall * 2, G.seg),
  mugMat
);
inner.rotation.x = -Math.PI / 2;
inner.position.y = G.h / 2 - 0.001;
mugGroup.add(inner);

// ── 6. ALÇA ──────────────────────────────
// Cola na lateral direita (X+), meia altura
const hY = 0.24; // distância vertical do centro
const hX = G.rTop; // raio do topo

const handlePts = [
  new THREE.Vector3(hX,          hY,    0),
  new THREE.Vector3(hX + 0.08,  hY,    0),
  new THREE.Vector3(hX + 0.30,  hY * 0.5, 0),
  new THREE.Vector3(hX + 0.38,  0,     0),
  new THREE.Vector3(hX + 0.30, -hY * 0.5, 0),
  new THREE.Vector3(hX + 0.08, -hY,   0),
  new THREE.Vector3(hX,         -hY,   0),
];

mugGroup.add(new THREE.Mesh(
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(handlePts),
    60, 0.050, 16, false
  ),
  mugMat
));

// ── 7. CHÃO (sombra) ─────────────────────
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ opacity: 0.10 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -G.h / 2 - 0.001;
floor.receiveShadow = true;
scene.add(floor);

// ── 8. TEXTURA DA ARTE ───────────────────
const ART_W = 2048;
const ART_H = 512;

const artCanvas = document.createElement('canvas');
artCanvas.width  = ART_W;
artCanvas.height = ART_H;
const artCtx = artCanvas.getContext('2d');

const artTex = new THREE.CanvasTexture(artCanvas);
artTex.colorSpace = THREE.SRGBColorSpace;
artTex.wrapS = THREE.RepeatWrapping;
artTex.wrapT = THREE.ClampToEdgeWrapping;

// Estado da arte
const art = {
  image:   null,
  offsetX: 0,      // -1 a +1
  offsetY: 0,      // -1 a +1
  scale:   1.0,    // 0.1 a 2.0
  rotation: 0,     // graus
  opacity: 1.0,
};

function redrawArt() {
  artCtx.clearRect(0, 0, ART_W, ART_H);
  if (!art.image) { artTex.needsUpdate = true; return; }

  artCtx.save();
  artCtx.globalAlpha = art.opacity;

  // Centro do canvas
  const cx = ART_W / 2;
  const cy = ART_H / 2;

  // Dimensões base da arte (preenche o canvas inteiro)
  const iw = art.image.naturalWidth  || art.image.width;
  const ih = art.image.naturalHeight || art.image.height;

  // Escala para cobrir o canvas + scale do slider
  const scaleX = (ART_W / iw) * art.scale;
  const scaleY = (ART_H / ih) * art.scale;

  // Offset em pixels
  const ox = art.offsetX * ART_W * 0.3;
  const oy = art.offsetY * ART_H * 0.3;

  artCtx.translate(cx + ox, cy + oy);
  artCtx.rotate((art.rotation * Math.PI) / 180);
  artCtx.scale(scaleX, scaleY);
  artCtx.drawImage(art.image, -iw / 2, -ih / 2);

  artCtx.restore();
  artTex.needsUpdate = true;
}

// ── 9. CILINDRO DA ESTAMPA ───────────────
const stampGeo = new THREE.CylinderGeometry(
  G.rTop + 0.002,
  G.rBot + 0.002,
  G.h * 0.90,   // 90% da altura
  G.seg,
  1,
  true,
  0,
  Math.PI * 2   // 360° completo
);

// Corrige UVs (inverte V para arte não ficar de cabeça pra baixo)
const uvArr = stampGeo.attributes.uv.array;
for (let i = 1; i < uvArr.length; i += 2) {
  uvArr[i] = 1 - uvArr[i];
}
stampGeo.attributes.uv.needsUpdate = true;

const stampMesh = new THREE.Mesh(stampGeo, new THREE.MeshStandardMaterial({
  map:         artTex,
  transparent: true,
  roughness:   0.2,
  metalness:   0.0,
  depthWrite:  false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
}));
mugGroup.add(stampMesh);

// ── 10. ROTAÇÃO DA CANECA (mouse/touch) ──
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
  rot.x = Math.max(-0.7, Math.min(0.7, rot.x));
  lastX = e.clientX; lastY = e.clientY;
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
  rot.x = Math.max(-0.7, Math.min(0.7, rot.x));
  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  targetZoom = Math.min(7, Math.max(2.5, targetZoom + e.deltaY * 0.005));
}, { passive: false });

// ── 11. SLIDERS ──────────────────────────
// IDs do HTML: offsetX, offsetY, artScale, artRotation, artOpacity
// Values:      valOffsetX, valOffsetY, valScale, valRotation, valOpacity

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

// ── 12. UPLOAD ───────────────────────────
document.getElementById('fileInput').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      art.image = img;

      // Mostra thumbnail
      const thumb = document.getElementById('artThumb');
      thumb.src = ev.target.result;
      thumb.style.display = 'block';
      document.getElementById('artPlaceholder').style.display = 'none';

      redrawArt();
      showToast('✅ Arte carregada com sucesso!');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// ── 13. COR DA CANECA ────────────────────
document.getElementById('mugColors').addEventListener('click', function (e) {
  const dot = e.target.closest('[data-color]');
  if (!dot) return;
  this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  mugMat.color.set(dot.dataset.color);
  mugMat.needsUpdate = true;
  showToast('🎨 Cor da caneca alterada!');
});

// ── 14. COR DO FUNDO ─────────────────────
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

// ── 15. EXPORTAR ─────────────────────────
document.getElementById('btnExport').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'mockup-caneca.png';
  a.click();
  showToast('💾 Imagem salva!');
});

// ── 16. RESET ────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
  // Reseta arte
  art.image = null; art.offsetX = 0; art.offsetY = 0;
  art.scale = 1; art.rotation = 0; art.opacity = 1;

  // Reseta sliders
  document.getElementById('offsetX').value    = 0;
  document.getElementById('offsetY').value    = 0;
  document.getElementById('artScale').value   = 100;
  document.getElementById('artRotation').value = 0;
  document.getElementById('artOpacity').value  = 100;

  // Reseta labels
  document.getElementById('valOffsetX').textContent  = '0';
  document.getElementById('valOffsetY').textContent  = '0';
  document.getElementById('valScale').textContent    = '100%';
  document.getElementById('valRotation').textContent = '0°';
  document.getElementById('valOpacity').textContent  = '100%';

  // Reseta thumbnail
  const thumb = document.getElementById('artThumb');
  thumb.src = ''; thumb.style.display = 'none';
  document.getElementById('artPlaceholder').style.display = 'block';
  document.getElementById('fileInput').value = '';

  // Reseta câmera e cores
  rot.x = 0.15; rot.y = -0.5; targetZoom = 4.5;
  mugMat.color.set('#ffffff'); mugMat.needsUpdate = true;
  scene.background = new THREE.Color('#ffffff');

  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  document.querySelector('#mugColors [data-color="#ffffff"]')?.classList.add('active');
  document.querySelector('#bgColors [data-bg="#ffffff"]')?.classList.add('active');

  redrawArt();
  showToast('🔄 Tudo resetado!');
});

// ── 17. TOAST ────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── 18. LOOP ─────────────────────────────
(function animate() {
  requestAnimationFrame(animate);

  rot.smoothX += (rot.x - rot.smoothX) * 0.08;
  rot.smoothY += (rot.y - rot.smoothY) * 0.08;

  mugGroup.rotation.x = rot.smoothX;
  mugGroup.rotation.y = rot.smoothY;

  camera.position.z += (targetZoom - camera.position.z) * 0.08;

  renderer.render(scene, camera);
})();
