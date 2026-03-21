// ══════════════════════════════════════════
//   APP.JS — Mockup 3D Caneca v4
// ══════════════════════════════════════════

// ──────────────────────────────────────────
// 1. RENDERER + CENA + CÂMERA
// ──────────────────────────────────────────
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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f0f2f5');

const camera = new THREE.PerspectiveCamera(38, 600 / 500, 0.1, 100);
camera.position.set(0, 0.1, 4.2);

// ──────────────────────────────────────────
// 2. ILUMINAÇÃO — forte para caneca branca
// ──────────────────────────────────────────
// Luz ambiente forte para branco
const ambient = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambient);

// Luz principal
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 6, 5);
sun.castShadow = true;
scene.add(sun);

// Fill lateral
const fill = new THREE.DirectionalLight(0xffffff, 0.8);
fill.position.set(-4, 2, 2);
scene.add(fill);

// Rim atrás
const rim = new THREE.DirectionalLight(0xffffff, 0.4);
rim.position.set(0, -1, -5);
scene.add(rim);

// ──────────────────────────────────────────
// 3. MATERIAL DA CANECA
//    Começa branco, cor muda pelo picker
// ──────────────────────────────────────────
const mugMat = new THREE.MeshStandardMaterial({
  color:     0xffffff,
  roughness: 0.15,
  metalness: 0.0,
  envMapIntensity: 0.5,
});

function setMugColor(hex) {
  mugMat.color.set(hex);
  mugMat.needsUpdate = true;
}

// ──────────────────────────────────────────
// 4. CANECA — medidas realistas
//    Altura 9.5cm, Ø 8.2cm topo, Ø 7.2cm base
//    Escala: 1 unit = 10cm
// ──────────────────────────────────────────
const MUG = {
  rTop:  0.41,   // 8.2cm / 2 / 10
  rBot:  0.36,   // 7.2cm / 2 / 10
  h:     0.95,   // 9.5cm / 10
  seg:   128,
  wall:  0.025,
};

const group = new THREE.Group();
scene.add(group);

// Corpo (aberto nas tampas)
group.add(new THREE.Mesh(
  new THREE.CylinderGeometry(MUG.rTop, MUG.rBot, MUG.h, MUG.seg, 1, true),
  mugMat
));

// Base
group.add(Object.assign(
  new THREE.Mesh(new THREE.CircleGeometry(MUG.rBot, MUG.seg), mugMat),
  { rotation: new THREE.Euler(-Math.PI / 2, 0, 0), position: new THREE.Vector3(0, -MUG.h / 2, 0) }
));

// Borda (torus)
group.add(Object.assign(
  new THREE.Mesh(new THREE.TorusGeometry(MUG.rTop, MUG.wall, 20, MUG.seg), mugMat),
  { position: new THREE.Vector3(0, MUG.h / 2, 0) }
));

// ──────────────────────────────────────────
// 5. ALÇA — lateral direita, meia altura
//    A alça DEVE ficar no lado direito (X+)
//    e conectar em dois pontos do cilindro
// ──────────────────────────────────────────

// Calcula o ponto exato na superfície do cilindro
// O cilindro está em X=0, Z=0. A alça fica em Z=0, X positivo
// No meio da altura: Y=0. Cola em Y=+hH e Y=-hH (hH = handle height)
const hH = 0.22; // distância do centro onde a alça toca o corpo

// A alça está no plano XY, Z=0
// Mas a alça deve aparecer no LADO da caneca — então Z=0, X = rTop
// Após rotação inicial da caneca (rotY=-0.4), a alça ficará visível à direita
const pts = [
  new THREE.Vector3(MUG.rTop,        hH,    0),
  new THREE.Vector3(MUG.rTop + 0.10, hH,    0),
  new THREE.Vector3(MUG.rTop + 0.28, hH * 0.6, 0),
  new THREE.Vector3(MUG.rTop + 0.38, 0,     0),
  new THREE.Vector3(MUG.rTop + 0.28, -hH * 0.6, 0),
  new THREE.Vector3(MUG.rTop + 0.10, -hH,   0),
  new THREE.Vector3(MUG.rTop,        -hH,   0),
];

const handleMesh = new THREE.Mesh(
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.048, 16, false),
  mugMat
);
group.add(handleMesh);

// ──────────────────────────────────────────
// 6. SOMBRA NO CHÃO
// ──────────────────────────────────────────
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ opacity: 0.12 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -MUG.h / 2 - 0.001;
floor.receiveShadow = true;
scene.add(floor);

// ──────────────────────────────────────────
// 7. TEXTURA DA ARTE (canvas 2D)
//    2048×512 → proporção 4:1 ≈ envolve 360°
//    Arte original 20cm×9cm é esticada para
//    cobrir a volta inteira (como na sublimação)
// ──────────────────────────────────────────
const ART_W = 2048;
const ART_H =  512;

const artCanvas = document.createElement('canvas');
artCanvas.width  = ART_W;
artCanvas.height = ART_H;
const artCtx = artCanvas.getContext('2d');

const artTex = new THREE.CanvasTexture(artCanvas);
artTex.colorSpace = THREE.SRGBColorSpace;

let artImage   = null;
let artOpacity = 1.0;

function redrawArt() {
  artCtx.clearRect(0, 0, ART_W, ART_H);
  if (!artImage) return;

  artCtx.globalAlpha = artOpacity;
  artCtx.drawImage(artImage, 0, 0, ART_W, ART_H);
  artCtx.globalAlpha = 1;

  artTex.needsUpdate = true;
}

// ──────────────────────────────────────────
// 8. MALHA DA ESTAMPA — 360° completo
//    Cilindro ligeiramente à frente do corpo
//    phiStart=0, phiLength=2π
// ──────────────────────────────────────────
const STAMP_H = MUG.h * 0.88;  // quase toda a altura

const stampGeo = new THREE.CylinderGeometry(
  MUG.rTop + 0.0015,
  MUG.rBot + 0.0015,
  STAMP_H,
  MUG.seg,
  1,
  true,
  0,
  Math.PI * 2
);

// Inverte UV vertical (Three.js coloca V=0 embaixo, queremos arte certa)
const uvArr = stampGeo.attributes.uv.array;
for (let i = 1; i < uvArr.length; i += 2) {
  uvArr[i] = 1 - uvArr[i];
}
stampGeo.attributes.uv.needsUpdate = true;

const stampMat = new THREE.MeshStandardMaterial({
  map:         artTex,
  transparent: true,
  roughness:   0.15,
  metalness:   0.0,
  depthWrite:  false,
  polygonOffset:      true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits:  -1,
});

const stampMesh = new THREE.Mesh(stampGeo, stampMat);
group.add(stampMesh);

// ──────────────────────────────────────────
// 9. ESTADO DA CÂMERA / INTERAÇÃO
// ──────────────────────────────────────────
const cam = {
  rotX:  0.15,
  rotY: -0.5,   // começa mostrando a frente com alça visível à direita
  zoom:  4.2,
  smoothX: 0.15,
  smoothY: -0.5,
};

// Mouse
canvas.addEventListener('mousedown', (e) => {
  cam._down  = true;
  cam._lx    = e.clientX;
  cam._ly    = e.clientY;
});
window.addEventListener('mouseup',   () => cam._down = false);
window.addEventListener('mousemove', (e) => {
  if (!cam._down) return;
  cam.rotY += (e.clientX - cam._lx) * 0.011;
  cam.rotX += (e.clientY - cam._ly) * 0.011;
  cam.rotX  = Math.max(-0.7, Math.min(0.7, cam.rotX));
  cam._lx   = e.clientX;
  cam._ly   = e.clientY;
});

// Touch
canvas.addEventListener('touchstart', (e) => {
  cam._down = true;
  cam._lx   = e.touches[0].clientX;
  cam._ly   = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', () => cam._down = false);
window.addEventListener('touchmove', (e) => {
  if (!cam._down) return;
  cam.rotY += (e.touches[0].clientX - cam._lx) * 0.011;
  cam.rotX += (e.touches[0].clientY - cam._ly) * 0.011;
  cam.rotX  = Math.max(-0.7, Math.min(0.7, cam.rotX));
  cam._lx   = e.touches[0].clientX;
  cam._ly   = e.touches[0].clientY;
}, { passive: true });

// Scroll zoom
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  cam.zoom = Math.min(7, Math.max(2, cam.zoom + e.deltaY * 0.005));
}, { passive: false });

// ──────────────────────────────────────────
// 10. SLIDERS
// ──────────────────────────────────────────
function bindSlider(id, valId, label, fmt, fn) {
  // Atualiza o texto do label no HTML
  const row   = document.getElementById(id)?.closest('.control-row');
  const spans = row?.querySelectorAll('.control-label span');
  if (spans?.[0]) spans[0].textContent = label;

  document.getElementById(id).addEventListener('input', function () {
    document.getElementById(valId).textContent = fmt(this.value);
    fn(parseFloat(this.value));
  });
}

bindSlider('offsetX', 'valOffsetX', 'Rotação Horizontal',
  v => (v >= 0 ? '+' : '') + parseFloat(v).toFixed(2),
  v => { cam.rotY = v * Math.PI; }
);

bindSlider('offsetY', 'valOffsetY', 'Rotação Vertical',
  v => (v >= 0 ? '+' : '') + parseFloat(v).toFixed(2),
  v => { cam.rotX = Math.max(-0.7, Math.min(0.7, v * 0.7)); }
);

bindSlider('artScale', 'valScale', 'Zoom',
  v => v + '%',
  v => { cam.zoom = 7 - (v / 200) * 5; }
);

bindSlider('artRotation', 'valRotation', 'Altura da Câmera',
  v => v + '°',
  v => { camera.position.y = ((v - 180) / 180) * 1.0; }
);

bindSlider('artOpacity', 'valOpacity', 'Opacidade da Arte',
  v => v + '%',
  v => { artOpacity = v / 100; redrawArt(); }
);

// ──────────────────────────────────────────
// 11. UPLOAD
// ──────────────────────────────────────────
document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      artImage = img;
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

// ──────────────────────────────────────────
// 12. COR DA CANECA
// ──────────────────────────────────────────
document.getElementById('mugColors').addEventListener('click', (e) => {
  const dot = e.target.closest('[data-color]');
  if (!dot) return;
  document.querySelectorAll('#mugColors .color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  setMugColor(dot.dataset.color);
  showToast('🎨 Cor alterada!');
});

// ──────────────────────────────────────────
// 13. COR DO FUNDO
// ──────────────────────────────────────────
document.getElementById('bgColors').addEventListener('click', (e) => {
  const dot = e.target.closest('[data-bg]');
  if (!dot) return;
  document.querySelectorAll('#bgColors .color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  scene.background = new THREE.Color(dot.dataset.bg);
});

document.getElementById('bgColorPicker').addEventListener('input', (e) => {
  scene.background = new THREE.Color(e.target.value);
  document.querySelectorAll('#bgColors .color-dot').forEach(d => d.classList.remove('active'));
});

// ──────────────────────────────────────────
// 14. EXPORTAR
// ──────────────────────────────────────────
document.getElementById('btnExport').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'mockup-caneca.png';
  a.click();
  showToast('💾 Exportado!');
});

// ──────────────────────────────────────────
// 15. RESET
// ──────────────────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
  artImage   = null;
  artOpacity = 1;
  cam.rotX = 0.15; cam.rotY = -0.5; cam.zoom = 4.2;
  camera.position.y = 0;

  ['offsetX','offsetY','artScale','artRotation','artOpacity'].forEach(id => {
    const el = document.getElementById(id);
    el.value = el.defaultValue;
  });
  document.getElementById('valOffsetX').textContent  = '+0.00';
  document.getElementById('valOffsetY').textContent  = '+0.00';
  document.getElementById('valScale').textContent    = '100%';
  document.getElementById('valRotation').textContent = '180°';
  document.getElementById('valOpacity').textContent  = '100%';

  const thumb = document.getElementById('artThumb');
  thumb.src = ''; thumb.style.display = 'none';
  document.getElementById('artPlaceholder').style.display = 'block';
  document.getElementById('fileInput').value = '';

  setMugColor('#ffffff');
  scene.background = new THREE.Color('#f0f2f5');

  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  document.querySelector('#mugColors [data-color="#ffffff"]')?.classList.add('active');

  redrawArt();
  showToast('🔄 Resetado!');
});

// ──────────────────────────────────────────
// 16. TOAST
// ──────────────────────────────────────────
let _tt = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 2500);
}

// ──────────────────────────────────────────
// 17. LOOP
// ──────────────────────────────────────────
(function animate() {
  requestAnimationFrame(animate);

  cam.smoothX += (cam.rotX - cam.smoothX) * 0.08;
  cam.smoothY += (cam.rotY - cam.smoothY) * 0.08;
  group.rotation.x = cam.smoothX;
  group.rotation.y = cam.smoothY;

  camera.position.z += (cam.zoom - camera.position.z) * 0.08;

  renderer.render(scene, camera);
})();
