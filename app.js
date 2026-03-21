// ══════════════════════════════════════════
//   APP.JS — Mockup 3D de Caneca v2
// ══════════════════════════════════════════

// ──────────────────────────────────────────
// 1. ESTADO GLOBAL
// ──────────────────────────────────────────
const state = {
  mugColor: '#ffffff',
  bgColor:  '#ffffff',
  art: {
    image:   null,
    opacity: 1,
  },
  camera: {
    rotX: 0.2,
    rotY: 0,
    zoom: 4,
  },
  mouse: {
    down:  false,
    lastX: 0,
    lastY: 0,
  },
  // rotação suavizada
  smooth: { x: 0.2, y: 0 },
};

// ──────────────────────────────────────────
// 2. SETUP THREE.JS
// ──────────────────────────────────────────
const canvas = document.getElementById('canvas3d');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(600, 500);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputColorSpace  = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#ffffff');

const camera = new THREE.PerspectiveCamera(40, 600 / 500, 0.1, 100);
camera.position.set(0, 0, 4);

// ──────────────────────────────────────────
// 3. ILUMINAÇÃO
// ──────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
dirLight.position.set(4, 6, 4);
dirLight.castShadow = true;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-4, 2, -2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
rimLight.position.set(0, -3, -4);
scene.add(rimLight);

// ──────────────────────────────────────────
// 4. TEXTURA DA ARTE — proporção 20×9 cm
//    Usamos canvas 2D com aspect ratio 20:9
// ──────────────────────────────────────────
const ART_W = 1024;
const ART_H = Math.round(1024 * (9 / 20)); // ≈ 461px  → mantém 20:9

const artCanvas = document.createElement('canvas');
artCanvas.width  = ART_W;
artCanvas.height = ART_H;
const artCtx = artCanvas.getContext('2d');

const artTexture = new THREE.CanvasTexture(artCanvas);
artTexture.colorSpace = THREE.SRGBColorSpace;

function drawArtCanvas() {
  artCtx.clearRect(0, 0, ART_W, ART_H);
  if (!state.art.image) return;

  artCtx.globalAlpha = state.art.opacity;
  // preenche todo o canvas da arte (sem distorção — objeto-fit: contain)
  const iw = state.art.image.width;
  const ih = state.art.image.height;
  const scale = Math.min(ART_W / iw, ART_H / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (ART_W - dw) / 2;
  const dy = (ART_H - dh) / 2;
  artCtx.drawImage(state.art.image, dx, dy, dw, dh);
  artCtx.globalAlpha = 1;

  artTexture.needsUpdate = true;
}

// ──────────────────────────────────────────
// 5. CANECA — geometria procedural corrigida
//    Proporções reais: ~8cm diâmetro, ~9.5cm alt
//    Unidades Three.js: 1 unit ≈ altura da caneca
// ──────────────────────────────────────────
const mugGroup = new THREE.Group();
scene.add(mugGroup);

// Parâmetros visuais da caneca
const MUG = {
  rTop:    0.50,   // raio do topo
  rBot:    0.44,   // raio da base (caneca afunila levemente)
  height:  1.0,    // altura do cilindro
  thick:   0.04,   // espessura da parede (borda interna)
  segments: 128,
};

// Material base — será reutilizado em todas as peças
const mugMaterial = new THREE.MeshStandardMaterial({
  color:     new THREE.Color(state.mugColor),
  roughness: 0.25,
  metalness: 0.05,
});

// — Corpo externo
const bodyGeo = new THREE.CylinderGeometry(
  MUG.rTop, MUG.rBot, MUG.height, MUG.segments, 1, true
);
const bodyMesh = new THREE.Mesh(bodyGeo, mugMaterial);
bodyMesh.castShadow = true;
mugGroup.add(bodyMesh);

// — Fundo
const botGeo  = new THREE.CircleGeometry(MUG.rBot, MUG.segments);
const botMesh = new THREE.Mesh(botGeo, mugMaterial);
botMesh.rotation.x = -Math.PI / 2;
botMesh.position.y = -MUG.height / 2;
botMesh.receiveShadow = true;
mugGroup.add(botMesh);

// — Borda superior (torus fino)
const rimGeo  = new THREE.TorusGeometry(MUG.rTop, MUG.thick, 16, MUG.segments);
const rimMesh = new THREE.Mesh(rimGeo, mugMaterial);
rimMesh.position.y = MUG.height / 2;
mugGroup.add(rimMesh);

// — Interior visível (cilindro interno invertido)
const innerGeo  = new THREE.CylinderGeometry(
  MUG.rTop - MUG.thick * 2,
  MUG.rTop - MUG.thick * 2,
  MUG.thick * 3,
  MUG.segments,
  1,
  true
);
const innerMesh = new THREE.Mesh(innerGeo, mugMaterial);
innerMesh.position.y = MUG.height / 2 - MUG.thick;
mugGroup.add(innerMesh);

// — Alça (CatmullRom no lado direito, altura média)
const handleCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(MUG.rTop,        0.28,  0),   // ponto superior (cola no corpo)
  new THREE.Vector3(MUG.rTop + 0.18, 0.28,  0),   // saída superior
  new THREE.Vector3(MUG.rTop + 0.36, 0.10,  0),   // curva direita superior
  new THREE.Vector3(MUG.rTop + 0.40, 0.0,   0),   // ponto mais externo
  new THREE.Vector3(MUG.rTop + 0.36,-0.10,  0),   // curva direita inferior
  new THREE.Vector3(MUG.rTop + 0.18,-0.28,  0),   // saída inferior
  new THREE.Vector3(MUG.rTop,       -0.28,  0),   // ponto inferior (cola no corpo)
]);

const handleGeo  = new THREE.TubeGeometry(handleCurve, 40, 0.055, 12, false);
const handleMesh = new THREE.Mesh(handleGeo, mugMaterial);
mugGroup.add(handleMesh);

// — Plano de sombra
const shadowGeo  = new THREE.PlaneGeometry(8, 8);
const shadowMat  = new THREE.ShadowMaterial({ opacity: 0.18 });
const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
shadowMesh.rotation.x = -Math.PI / 2;
shadowMesh.position.y = -MUG.height / 2 - 0.001;
shadowMesh.receiveShadow = true;
scene.add(shadowMesh);

// ──────────────────────────────────────────
// 6. ESTAMPA — aplicada na frente da caneca
//    Arco de 180° centralizado na frente (Z+)
//    Textura esticada no arc proporcional a 20×9
// ──────────────────────────────────────────

// Altura da estampa ≈ 75% da altura da caneca
const STAMP_H   = MUG.height * 0.80;
// Arc de 160° (deixa margem nas laterais)
const STAMP_ARC = Math.PI * 0.88;

const stampGeo = new THREE.CylinderGeometry(
  MUG.rTop  + 0.002,   // pouquíssimo à frente
  MUG.rBot  + 0.002,
  STAMP_H,
  MUG.segments,
  1,
  true,
  -STAMP_ARC / 2,      // centralizado na frente
  STAMP_ARC
);

// Ajusta UVs para a proporção 20:9 não distorcer
// Por padrão o CylinderGeometry estica U de 0→1 no arco inteiro
// e V de 0→1 na altura — já está correto pois nossa textura tem 20:9

const stampMat = new THREE.MeshStandardMaterial({
  map:         artTexture,
  transparent: true,
  roughness:   0.25,
  metalness:   0.0,
  depthWrite:  false,
});

const stampMesh = new THREE.Mesh(stampGeo, stampMat);
mugGroup.add(stampMesh);

// ──────────────────────────────────────────
// 7. ATUALIZAR COR DA CANECA (todas as peças)
// ──────────────────────────────────────────
function setMugColor(hex) {
  state.mugColor = hex;
  mugMaterial.color.set(hex);
  mugMaterial.needsUpdate = true;
}

// ──────────────────────────────────────────
// 8. INTERAÇÃO — arrastar rotacionar
// ──────────────────────────────────────────
canvas.addEventListener('mousedown', (e) => {
  state.mouse.down  = true;
  state.mouse.lastX = e.clientX;
  state.mouse.lastY = e.clientY;
});
window.addEventListener('mouseup',   () => { state.mouse.down = false; });
window.addEventListener('mousemove', (e) => {
  if (!state.mouse.down) return;
  const dx = e.clientX - state.mouse.lastX;
  const dy = e.clientY - state.mouse.lastY;
  state.camera.rotY += dx * 0.012;
  state.camera.rotX += dy * 0.012;
  state.camera.rotX  = Math.max(-0.75, Math.min(0.75, state.camera.rotX));
  state.mouse.lastX  = e.clientX;
  state.mouse.lastY  = e.clientY;
});

// touch
canvas.addEventListener('touchstart', (e) => {
  state.mouse.down  = true;
  state.mouse.lastX = e.touches[0].clientX;
  state.mouse.lastY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend',   () => { state.mouse.down = false; });
window.addEventListener('touchmove',  (e) => {
  if (!state.mouse.down) return;
  const dx = e.touches[0].clientX - state.mouse.lastX;
  const dy = e.touches[0].clientY - state.mouse.lastY;
  state.camera.rotY += dx * 0.012;
  state.camera.rotX += dy * 0.012;
  state.camera.rotX  = Math.max(-0.75, Math.min(0.75, state.camera.rotX));
  state.mouse.lastX  = e.touches[0].clientX;
  state.mouse.lastY  = e.touches[0].clientY;
}, { passive: true });

// scroll zoom
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  state.camera.zoom = Math.min(7, Math.max(2, state.camera.zoom + e.deltaY * 0.005));
}, { passive: false });

// ──────────────────────────────────────────
// 9. SLIDERS — controlam POSIÇÃO/ZOOM da câmera
//    (renomeamos os labels no HTML via JS)
// ──────────────────────────────────────────
const sliderConfig = [
  {
    sliderId: 'offsetX',
    labelId:  'valOffsetX',
    labelTxt: 'Rotação Horizontal',
    format:   (v) => (v > 0 ? '+' : '') + parseFloat(v).toFixed(2),
    onInput:  (v) => { state.camera.rotY = parseFloat(v) * Math.PI; },
  },
  {
    sliderId: 'offsetY',
    labelId:  'valOffsetY',
    labelTxt: 'Rotação Vertical',
    format:   (v) => (v > 0 ? '+' : '') + parseFloat(v).toFixed(2),
    onInput:  (v) => {
      state.camera.rotX = Math.max(-0.75, Math.min(0.75, parseFloat(v) * 0.75));
    },
  },
  {
    sliderId: 'artScale',
    labelId:  'valScale',
    labelTxt: 'Zoom',
    format:   (v) => v + '%',
    onInput:  (v) => {
      // 10% → zoom 7  |  100% → zoom 4  |  200% → zoom 2
      state.camera.zoom = 7 - (parseFloat(v) / 200) * 5;
    },
  },
  {
    sliderId: 'artRotation',
    labelId:  'valRotation',
    labelTxt: 'Altura da Câmera',
    format:   (v) => v + '°',
    onInput:  (v) => {
      camera.position.y = ((parseFloat(v) - 180) / 180) * 1.5;
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

// Atualiza labels e vincula eventos
sliderConfig.forEach(({ sliderId, labelId, labelTxt, format, onInput }) => {
  // atualiza o texto do label estático no HTML
  const labelEl = document.querySelector(`[for="${sliderId}"], #${labelId}`)?.closest('.control-label')?.querySelector('span:first-child');
  if (labelEl) labelEl.textContent = labelTxt;

  // também atualiza via atributo data (fallback visual)
  const labelSpans = document.getElementById(sliderId)
    ?.closest('.control-row')
    ?.querySelectorAll('.control-label span');
  if (labelSpans && labelSpans[0]) labelSpans[0].textContent = labelTxt;

  const slider   = document.getElementById(sliderId);
  const valueEl  = document.getElementById(labelId);
  slider.addEventListener('input', () => {
    valueEl.textContent = format(slider.value);
    onInput(slider.value);
  });
});

// ──────────────────────────────────────────
// 10. UPLOAD DE ARTE
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
      thumb.src          = ev.target.result;
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
// 11. COR DA CANECA
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
// 12. COR DO FUNDO
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
// 13. EXPORTAR PNG
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
// 14. RESET
// ──────────────────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
  state.art    = { image: null, opacity: 1 };
  state.camera = { rotX: 0.2, rotY: 0, zoom: 4 };
  state.mugColor = '#ffffff';
  state.bgColor  = '#ffffff';

  ['offsetX','offsetY','artScale','artRotation','artOpacity'].forEach(id => {
    const el = document.getElementById(id);
    el.value = el.defaultValue;
  });

  document.getElementById('valOffsetX').textContent  = '0.00';
  document.getElementById('valOffsetY').textContent  = '0.00';
  document.getElementById('valScale').textContent    = '100%';
  document.getElementById('valRotation').textContent = '0°';
  document.getElementById('valOpacity').textContent  = '100%';

  const thumb = document.getElementById('artThumb');
  thumb.src = '';
  thumb.style.display = 'none';
  document.getElementById('artPlaceholder').style.display = 'block';
  document.getElementById('fileInput').value = '';

  setMugColor('#ffffff');
  scene.background = new THREE.Color('#ffffff');
  camera.position.y = 0;

  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  document.querySelector('#mugColors .color-dot[data-color="#ffffff"]').classList.add('active');
  document.querySelector('#bgColors  .color-dot[data-bg="#ffffff"]').classList.add('active');

  drawArtCanvas();
  showToast('🔄 Resetado!');
});

// ──────────────────────────────────────────
// 15. TOAST
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
// 16. LOOP DE ANIMAÇÃO
// ──────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  // lerp suave na rotação da caneca
  state.smooth.x += (state.camera.rotX - state.smooth.x) * 0.1;
  state.smooth.y += (state.camera.rotY - state.smooth.y) * 0.1;

  mugGroup.rotation.x = state.smooth.x;
  mugGroup.rotation.y = state.smooth.y;

  // lerp suave no zoom
  camera.position.z += (state.camera.zoom - camera.position.z) * 0.1;

  renderer.render(scene, camera);
}

animate();
