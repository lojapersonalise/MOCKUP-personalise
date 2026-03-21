// ══════════════════════════════════════════
//   APP.JS — Mockup 3D de Caneca v3
// ══════════════════════════════════════════

// ──────────────────────────────────────────
// 1. ESTADO GLOBAL
// ──────────────────────────────────────────
const state = {
  mugColor: '#ffffff',
  bgColor:  '#f0f2f5',
  art: { image: null, opacity: 1 },
  camera: { rotX: 0.15, rotY: -0.4, zoom: 3.8 },
  mouse:  { down: false, lastX: 0, lastY: 0 },
  smooth: { x: 0.15, y: -0.4 },
};

// ──────────────────────────────────────────
// 2. RENDERER
// ──────────────────────────────────────────
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(600, 500);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputColorSpace  = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(state.bgColor);

const camera = new THREE.PerspectiveCamera(38, 600 / 500, 0.1, 100);
camera.position.set(0, 0.1, state.camera.zoom);

// ──────────────────────────────────────────
// 3. ILUMINAÇÃO
// ──────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(3, 5, 4);
dirLight.castShadow = true;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-4, 1, -3);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
backLight.position.set(0, -2, -4);
scene.add(backLight);

// ──────────────────────────────────────────
// 4. TEXTURA DA ARTE — canvas 2D 360°
//    A arte da caneca tem 20cm × 9cm
//    Mapeamos em textura que envolve 360°
// ──────────────────────────────────────────
const ART_W = 2048;
const ART_H = 1024;

const artCanvas = document.createElement('canvas');
artCanvas.width  = ART_W;
artCanvas.height = ART_H;
const artCtx = artCanvas.getContext('2d');

const artTexture = new THREE.CanvasTexture(artCanvas);
artTexture.colorSpace = THREE.SRGBColorSpace;
// Repetição horizontal para cobrir 360°
artTexture.wrapS = THREE.RepeatWrapping;
artTexture.repeat.set(1, 1);

function drawArtCanvas() {
  artCtx.clearRect(0, 0, ART_W, ART_H);
  if (!state.art.image) return;

  artCtx.globalAlpha = state.art.opacity;

  const iw = state.art.image.naturalWidth  || state.art.image.width;
  const ih = state.art.image.naturalHeight || state.art.image.height;

  // Preenche o canvas inteiro com a arte (stretch para cobrir 360°)
  // Isso simula o papel que envolve toda a caneca
  artCtx.drawImage(state.art.image, 0, 0, ART_W, ART_H);

  artCtx.globalAlpha = 1;
  artTexture.needsUpdate = true;
}

// ──────────────────────────────────────────
// 5. MATERIAL COMPARTILHADO DA CANECA
// ──────────────────────────────────────────
const mugMaterial = new THREE.MeshStandardMaterial({
  color:     new THREE.Color('#ffffff'),
  roughness: 0.20,
  metalness: 0.05,
});

// ──────────────────────────────────────────
// 6. GEOMETRIA DA CANECA
//    Proporções reais: diâmetro ~8cm, altura ~9.5cm
//    → aspect ratio ≈ 0.85 de largura para 1.0 de altura
// ──────────────────────────────────────────
const mugGroup = new THREE.Group();
scene.add(mugGroup);

const SEG  = 128;   // segmentos radiais (qualidade)
const R_TOP = 0.48; // raio topo
const R_BOT = 0.42; // raio base (afunila levemente)
const H     = 1.10; // altura
const WALL  = 0.03; // espessura da parede

// — Corpo externo (cilindro aberto)
const bodyGeo  = new THREE.CylinderGeometry(R_TOP, R_BOT, H, SEG, 1, true);
const bodyMesh = new THREE.Mesh(bodyGeo, mugMaterial);
bodyMesh.castShadow = true;
mugGroup.add(bodyMesh);

// — Fundo
const botGeo  = new THREE.CircleGeometry(R_BOT, SEG);
const botMesh = new THREE.Mesh(botGeo, mugMaterial);
botMesh.rotation.x = -Math.PI / 2;
botMesh.position.y = -H / 2;
botMesh.receiveShadow = true;
mugGroup.add(botMesh);

// — Borda superior (torus)
const rimGeo  = new THREE.TorusGeometry(R_TOP, WALL * 1.2, 16, SEG);
const rimMesh = new THREE.Mesh(rimGeo, mugMaterial);
rimMesh.position.y = H / 2;
mugGroup.add(rimMesh);

// — Interior da boca (anel plano visível de cima)
const innerRingGeo = new THREE.RingGeometry(R_TOP - WALL * 3, R_TOP, SEG);
const innerRingMesh = new THREE.Mesh(innerRingGeo, mugMaterial);
innerRingMesh.rotation.x = -Math.PI / 2;
innerRingMesh.position.y = H / 2 - 0.001;
mugGroup.add(innerRingMesh);

// — Alça (lado direito, meia altura)
//   Pontos da curva no eixo X positivo, Z=0
//   Cola no corpo em Y=+0.25 e Y=-0.25
const handleCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(R_TOP,        0.25,   0.0),   // topo alça (cola no corpo)
  new THREE.Vector3(R_TOP + 0.12, 0.25,   0.0),   // saída horizontal topo
  new THREE.Vector3(R_TOP + 0.32, 0.12,   0.0),   // curva superior
  new THREE.Vector3(R_TOP + 0.40, 0.0,    0.0),   // ponto mais externo
  new THREE.Vector3(R_TOP + 0.32,-0.12,   0.0),   // curva inferior
  new THREE.Vector3(R_TOP + 0.12,-0.25,   0.0),   // saída horizontal base
  new THREE.Vector3(R_TOP,       -0.25,   0.0),   // base alça (cola no corpo)
]);

const handleGeo  = new THREE.TubeGeometry(handleCurve, 50, 0.052, 14, false);
const handleMesh = new THREE.Mesh(handleGeo, mugMaterial);
mugGroup.add(handleMesh);

// — Sombra no chão
const shadowMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 8),
  new THREE.ShadowMaterial({ opacity: 0.15 })
);
shadowMesh.rotation.x = -Math.PI / 2;
shadowMesh.position.y = -H / 2 - 0.001;
shadowMesh.receiveShadow = true;
scene.add(shadowMesh);

// ──────────────────────────────────────────
// 7. ESTAMPA — 360° em toda a volta
//    Cilindro separado com map da arte
//    PhiStart=0, PhiLength=2π (volta completa)
// ──────────────────────────────────────────
const stampH   = H * 0.82;   // cobre ~82% da altura (deixa margem borda/base)

// Cilindro de estampa com 360° e UVs corretos
const stampGeo = new THREE.CylinderGeometry(
  R_TOP + 0.001,   // raio topo (colado no corpo)
  R_BOT + 0.001,   // raio base
  stampH,
  SEG,
  1,
  true,
  0,               // phiStart = 0
  Math.PI * 2      // phiLength = 360°
);

// Corrige UVs para a arte não ficar de cabeça pra baixo
// e cobrir de 0..1 em U (horizontal = 360°) e 0..1 em V (vertical)
const uvAttr = stampGeo.attributes.uv;
for (let i = 0; i < uvAttr.count; i++) {
  uvAttr.setY(i, 1 - uvAttr.getY(i)); // inverte V
}
uvAttr.needsUpdate = true;

const stampMat = new THREE.MeshStandardMaterial({
  map:         artTexture,
  transparent: true,
  roughness:   0.20,
  metalness:   0.0,
  depthWrite:  false,
});

const stampMesh = new THREE.Mesh(stampGeo, stampMat);
mugGroup.add(stampMesh);

// ──────────────────────────────────────────
// 8. COR DA CANECA — atualiza material
// ──────────────────────────────────────────
function setMugColor(hex) {
  state.mugColor = hex;
  mugMaterial.color.set(hex);
  mugMaterial.needsUpdate = true;
}

// ──────────────────────────────────────────
// 9. MOUSE / TOUCH — rotacionar + zoom
// ──────────────────────────────────────────
canvas.addEventListener('mousedown', (e) => {
  state.mouse.down  = true;
  state.mouse.lastX = e.clientX;
  state.mouse.lastY = e.clientY;
});
window.addEventListener('mouseup',   () => { state.mouse.down = false; });
window.addEventListener('mousemove', (e) => {
  if (!state.mouse.down) return;
  state.camera.rotY += (e.clientX - state.mouse.lastX) * 0.012;
  state.camera.rotX += (e.clientY - state.mouse.lastY) * 0.012;
  state.camera.rotX  = Math.max(-0.7, Math.min(0.7, state.camera.rotX));
  state.mouse.lastX  = e.clientX;
  state.mouse.lastY  = e.clientY;
});

canvas.addEventListener('touchstart', (e) => {
  state.mouse.down  = true;
  state.mouse.lastX = e.touches[0].clientX;
  state.mouse.lastY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend',   () => { state.mouse.down = false; });
window.addEventListener('touchmove',  (e) => {
  if (!state.mouse.down) return;
  state.camera.rotY += (e.touches[0].clientX - state.mouse.lastX) * 0.012;
  state.camera.rotX += (e.touches[0].clientY - state.mouse.lastY) * 0.012;
  state.camera.rotX  = Math.max(-0.7, Math.min(0.7, state.camera.rotX));
  state.mouse.lastX  = e.touches[0].clientX;
  state.mouse.lastY  = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  state.camera.zoom = Math.min(7, Math.max(1.8, state.camera.zoom + e.deltaY * 0.005));
}, { passive: false });

// ──────────────────────────────────────────
// 10. SLIDERS
// ──────────────────────────────────────────
const sliderConfig = [
  {
    sliderId: 'offsetX',
    labelId:  'valOffsetX',
    labelTxt: 'Rotação Horizontal',
    format:   (v) => (v >= 0 ? '+' : '') + parseFloat(v).toFixed(2),
    onInput:  (v) => { state.camera.rotY = parseFloat(v) * Math.PI; },
  },
  {
    sliderId: 'offsetY',
    labelId:  'valOffsetY',
    labelTxt: 'Rotação Vertical',
    format:   (v) => (v >= 0 ? '+' : '') + parseFloat(v).toFixed(2),
    onInput:  (v) => {
      state.camera.rotX = Math.max(-0.7, Math.min(0.7, parseFloat(v) * 0.7));
    },
  },
  {
    sliderId: 'artScale',
    labelId:  'valScale',
    labelTxt: 'Zoom',
    format:   (v) => v + '%',
    onInput:  (v) => {
      state.camera.zoom = 7 - (parseFloat(v) / 200) * 5.2;
    },
  },
  {
    sliderId: 'artRotation',
    labelId:  'valRotation',
    labelTxt: 'Altura da Câmera',
    format:   (v) => v + '°',
    onInput:  (v) => {
      camera.position.y = ((parseFloat(v) - 180) / 180) * 1.2;
    },
  },
  {
    sliderId: 'artOpacity',
    labelId:  'valOpacity',
    labelTxt: 'Opacidade da Arte',
    format:   (v) => v + '%',
    onInput:  (v) => {
      state.art.opacity = parseFloat(v) / 100;
      drawArtCanvas();
    },
  },
];

sliderConfig.forEach(({ sliderId, labelId, labelTxt, format, onInput }) => {
  const row      = document.getElementById(sliderId)?.closest('.control-row');
  const spans    = row?.querySelectorAll('.control-label span');
  if (spans?.[0]) spans[0].textContent = labelTxt;

  const slider  = document.getElementById(sliderId);
  const valueEl = document.getElementById(labelId);
  slider.addEventListener('input', () => {
    valueEl.textContent = format(slider.value);
    onInput(slider.value);
  });
});

// ──────────────────────────────────────────
// 11. UPLOAD DE ARTE
// ──────────────────────────────────────────
document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      state.art.image = img;
      const thumb = document.getElementById('artThumb');
      thumb.src           = ev.target.result;
      thumb.style.display = 'block';
      document.getElementById('artPlaceholder').style.display = 'none';
      drawArtCanvas();
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
  const dot = e.target.closest('.color-dot[data-color]');
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
  const dot = e.target.closest('.color-dot[data-bg]');
  if (!dot) return;
  document.querySelectorAll('#bgColors .color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  state.bgColor = dot.dataset.bg;
  scene.background = new THREE.Color(dot.dataset.bg);
});

document.getElementById('bgColorPicker').addEventListener('input', (e) => {
  state.bgColor = e.target.value;
  scene.background = new THREE.Color(e.target.value);
  document.querySelectorAll('#bgColors .color-dot').forEach(d => d.classList.remove('active'));
});

// ──────────────────────────────────────────
// 14. EXPORTAR PNG
// ──────────────────────────────────────────
document.getElementById('btnExport').addEventListener('click', () => {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.href     = canvas.toDataURL('image/png');
  link.download = 'mockup-caneca.png';
  link.click();
  showToast('💾 Imagem exportada!');
});

// ──────────────────────────────────────────
// 15. RESET
// ──────────────────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
  state.art    = { image: null, opacity: 1 };
  state.camera = { rotX: 0.15, rotY: -0.4, zoom: 3.8 };

  document.getElementById('offsetX').value     = 0;
  document.getElementById('offsetY').value     = 0;
  document.getElementById('artScale').value    = 100;
  document.getElementById('artRotation').value = 180;
  document.getElementById('artOpacity').value  = 100;

  document.getElementById('valOffsetX').textContent  = '+0.00';
  document.getElementById('valOffsetY').textContent  = '+0.00';
  document.getElementById('valScale').textContent    = '100%';
  document.getElementById('valRotation').textContent = '180°';
  document.getElementById('valOpacity').textContent  = '100%';

  const thumb = document.getElementById('artThumb');
  thumb.src = '';
  thumb.style.display = 'none';
  document.getElementById('artPlaceholder').style.display = 'block';
  document.getElementById('fileInput').value = '';

  camera.position.y = 0;
  setMugColor('#ffffff');
  scene.background = new THREE.Color('#f0f2f5');

  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  document.querySelector('#mugColors .color-dot[data-color="#ffffff"]').classList.add('active');
  document.querySelector('#bgColors  .color-dot[data-bg="#f0f2f5"]').classList.add('active');

  drawArtCanvas();
  showToast('🔄 Resetado!');
});

// ──────────────────────────────────────────
// 16. TOAST
// ──────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ──────────────────────────────────────────
// 17. LOOP DE ANIMAÇÃO
// ──────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  state.smooth.x += (state.camera.rotX - state.smooth.x) * 0.08;
  state.smooth.y += (state.camera.rotY - state.smooth.y) * 0.08;

  mugGroup.rotation.x = state.smooth.x;
  mugGroup.rotation.y = state.smooth.y;

  camera.position.z += (state.camera.zoom - camera.position.z) * 0.08;

  renderer.render(scene, camera);
}

animate();
