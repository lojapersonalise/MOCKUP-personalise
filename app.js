// ══════════════════════════════════════════
//   APP.JS — Mockup 3D de Caneca
//   Three.js r160
// ══════════════════════════════════════════

// ──────────────────────────────────────────
// 1. ESTADO GLOBAL
// ──────────────────────────────────────────
const state = {
  mugColor: '#ffffff',
  bgColor: '#ffffff',
  art: {
    image: null,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
  },
  mouse: {
    down: false,
    lastX: 0,
    lastY: 0,
  },
  rotation: {
    x: 0.2,
    y: 0,
  },
};

// ──────────────────────────────────────────
// 2. SETUP THREE.JS
// ──────────────────────────────────────────
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(600, 500);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#ffffff');

const camera = new THREE.PerspectiveCamera(45, 600 / 500, 0.1, 100);
camera.position.set(0, 0.5, 4);

// ──────────────────────────────────────────
// 3. ILUMINAÇÃO
// ──────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(3, 5, 3);
dirLight.castShadow = true;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(-3, 2, -2);
scene.add(fillLight);

// ──────────────────────────────────────────
// 4. TEXTURA DA ARTE (canvas 2D)
// ──────────────────────────────────────────
const artCanvas = document.createElement('canvas');
artCanvas.width = 1024;
artCanvas.height = 1024;
const artCtx = artCanvas.getContext('2d');

const artTexture = new THREE.CanvasTexture(artCanvas);

function drawArtCanvas() {
  artCtx.clearRect(0, 0, 1024, 1024);

  if (!state.art.image) return;

  artCtx.save();

  // centro do canvas
  const cx = 512;
  const cy = 512;

  // tamanho base da arte (proporção da imagem)
  const imgW = state.art.image.width;
  const imgH = state.art.image.height;
  const aspect = imgW / imgH;

  const baseSize = 400 * state.art.scale;
  const drawW = aspect >= 1 ? baseSize : baseSize * aspect;
  const drawH = aspect >= 1 ? baseSize / aspect : baseSize;

  // offset em pixels (range -1..1 → -400..400)
  const px = cx + state.art.offsetX * 400;
  const py = cy - state.art.offsetY * 400;

  // aplicar opacidade
  artCtx.globalAlpha = state.art.opacity;

  // translação + rotação
  artCtx.translate(px, py);
  artCtx.rotate((state.art.rotation * Math.PI) / 180);

  artCtx.drawImage(
    state.art.image,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH
  );

  artCtx.restore();

  artTexture.needsUpdate = true;
}

// ──────────────────────────────────────────
// 5. CONSTRUÇÃO DA CANECA (geometria procedural)
// ──────────────────────────────────────────
const mugGroup = new THREE.Group();
scene.add(mugGroup);

// — Corpo da caneca
const bodyGeometry = new THREE.CylinderGeometry(
  0.85,   // raio topo
  0.75,   // raio base
  1.8,    // altura
  64,     // segmentos radiais
  1,      // segmentos altura
  true    // open ended (sem tampas)
);

const bodyMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(state.mugColor),
  roughness: 0.3,
  metalness: 0.05,
});

const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
bodyMesh.castShadow = true;
mugGroup.add(bodyMesh);

// — Fundo da caneca
const bottomGeometry = new THREE.CircleGeometry(0.75, 64);
const bottomMesh = new THREE.Mesh(bottomGeometry, bodyMaterial);
bottomMesh.rotation.x = -Math.PI / 2;
bottomMesh.position.y = -0.9;
mugGroup.add(bottomMesh);

// — Tampa (borda superior interna)
const rimGeometry = new THREE.TorusGeometry(0.85, 0.045, 16, 64);
const rimMesh = new THREE.Mesh(rimGeometry, bodyMaterial);
rimMesh.position.y = 0.9;
mugGroup.add(rimMesh);

// — Alça da caneca
const handleCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.85,  0.5, 0),
  new THREE.Vector3(1.5,   0.4, 0),
  new THREE.Vector3(1.65,  0.0, 0),
  new THREE.Vector3(1.5,  -0.4, 0),
  new THREE.Vector3(0.85, -0.5, 0),
]);

const handleGeometry = new THREE.TubeGeometry(handleCurve, 30, 0.09, 12, false);
const handleMesh = new THREE.Mesh(handleGeometry, bodyMaterial);
mugGroup.add(handleMesh);

// — Plano de sombra no chão
const shadowGeometry = new THREE.PlaneGeometry(6, 6);
const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.15 });
const shadowPlane = new THREE.Mesh(shadowGeometry, shadowMaterial);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.92;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// ──────────────────────────────────────────
// 6. MATERIAL COM ARTE (frente da caneca)
// ──────────────────────────────────────────

// Cria geometria separada só para a zona da arte
// Usamos um cilindro com metade dos segmentos voltados para frente
const artGeometry = new THREE.CylinderGeometry(
  0.852,  // ligeiramente à frente do corpo
  0.752,
  1.6,
  64,
  1,
  true,
  -Math.PI / 2,   // início do arco (frente)
  Math.PI         // metade do cilindro (180°)
);

const artMaterial = new THREE.MeshStandardMaterial({
  map: artTexture,
  transparent: true,
  roughness: 0.3,
  metalness: 0.0,
  depthWrite: false,
});

const artMesh = new THREE.Mesh(artGeometry, artMaterial);
mugGroup.add(artMesh);

// ──────────────────────────────────────────
// 7. ROTAÇÃO INICIAL
// ──────────────────────────────────────────
mugGroup.rotation.x = state.rotation.x;
mugGroup.rotation.y = state.rotation.y;

// ──────────────────────────────────────────
// 8. ZOOM COM SCROLL
// ──────────────────────────────────────────
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.position.z = Math.min(7, Math.max(2, camera.position.z + e.deltaY * 0.005));
}, { passive: false });

// ──────────────────────────────────────────
// 9. ARRASTAR PARA ROTACIONAR
// ──────────────────────────────────────────
canvas.addEventListener('mousedown', (e) => {
  state.mouse.down = true;
  state.mouse.lastX = e.clientX;
  state.mouse.lastY = e.clientY;
});

window.addEventListener('mouseup', () => {
  state.mouse.down = false;
});

window.addEventListener('mousemove', (e) => {
  if (!state.mouse.down) return;
  const dx = e.clientX - state.mouse.lastX;
  const dy = e.clientY - state.mouse.lastY;
  state.rotation.y += dx * 0.01;
  state.rotation.x += dy * 0.01;
  state.rotation.x = Math.max(-0.8, Math.min(0.8, state.rotation.x));
  state.mouse.lastX = e.clientX;
  state.mouse.lastY = e.clientY;
});

// touch (mobile)
canvas.addEventListener('touchstart', (e) => {
  state.mouse.down = true;
  state.mouse.lastX = e.touches[0].clientX;
  state.mouse.lastY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', () => {
  state.mouse.down = false;
});

window.addEventListener('touchmove', (e) => {
  if (!state.mouse.down) return;
  const dx = e.touches[0].clientX - state.mouse.lastX;
  const dy = e.touches[0].clientY - state.mouse.lastY;
  state.rotation.y += dx * 0.01;
  state.rotation.x += dy * 0.01;
  state.rotation.x = Math.max(-0.8, Math.min(0.8, state.rotation.x));
  state.mouse.lastX = e.touches[0].clientX;
  state.mouse.lastY = e.touches[0].clientY;
}, { passive: true });

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

      // preview sidebar
      const thumb = document.getElementById('artThumb');
      thumb.src = ev.target.result;
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
// 11. SLIDERS DE AJUSTE DA ARTE
// ──────────────────────────────────────────
function bindSlider(id, labelId, callback, format) {
  const slider = document.getElementById(id);
  const label = document.getElementById(labelId);
  slider.addEventListener('input', () => {
    const val = parseFloat(slider.value);
    label.textContent = format(val);
    callback(val);
    drawArtCanvas();
  });
}

bindSlider('offsetX',     'valOffsetX',  (v) => { state.art.offsetX   =  v; },          (v) => v.toFixed(2));
bindSlider('offsetY',     'valOffsetY',  (v) => { state.art.offsetY   =  v; },          (v) => v.toFixed(2));
bindSlider('artScale',    'valScale',    (v) => { state.art.scale     =  v / 100; },    (v) => v + '%');
bindSlider('artRotation', 'valRotation', (v) => { state.art.rotation  =  v; },          (v) => v + '°');
bindSlider('artOpacity',  'valOpacity',  (v) => { state.art.opacity   =  v / 100; },    (v) => v + '%');

// ──────────────────────────────────────────
// 12. COR DA CANECA
// ──────────────────────────────────────────
document.getElementById('mugColors').addEventListener('click', (e) => {
  const dot = e.target.closest('.color-dot');
  if (!dot) return;

  document.querySelectorAll('#mugColors .color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');

  const color = dot.dataset.color;
  state.mugColor = color;

  bodyMaterial.color.set(color);
  bodyMaterial.needsUpdate = true;

  showToast('🎨 Cor da caneca alterada');
});

// ──────────────────────────────────────────
// 13. COR DO FUNDO
// ──────────────────────────────────────────
document.getElementById('bgColors').addEventListener('click', (e) => {
  const dot = e.target.closest('.color-dot[data-bg]');
  if (!dot) return;

  document.querySelectorAll('#bgColors .color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');

  const bg = dot.dataset.bg;
  state.bgColor = bg;
  scene.background = new THREE.Color(bg);
});

document.getElementById('bgColorPicker').addEventListener('input', (e) => {
  const bg = e.target.value;
  state.bgColor = bg;
  scene.background = new THREE.Color(bg);

  document.querySelectorAll('#bgColors .color-dot').forEach(d => d.classList.remove('active'));
});

// ──────────────────────────────────────────
// 14. EXPORTAR PNG
// ──────────────────────────────────────────
document.getElementById('btnExport').addEventListener('click', () => {
  renderer.render(scene, camera);
  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'mockup-caneca.png';
  link.click();
  showToast('💾 Imagem exportada!');
});

// ──────────────────────────────────────────
// 15. RESET
// ──────────────────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
  // estado
  state.art = { image: null, offsetX: 0, offsetY: 0, scale: 1, rotation: 0, opacity: 1 };
  state.rotation = { x: 0.2, y: 0 };
  state.mugColor = '#ffffff';
  state.bgColor = '#ffffff';

  // sliders
  document.getElementById('offsetX').value     = 0;
  document.getElementById('offsetY').value     = 0;
  document.getElementById('artScale').value    = 100;
  document.getElementById('artRotation').value = 0;
  document.getElementById('artOpacity').value  = 100;

  document.getElementById('valOffsetX').textContent  = '0';
  document.getElementById('valOffsetY').textContent  = '0';
  document.getElementById('valScale').textContent    = '100%';
  document.getElementById('valRotation').textContent = '0°';
  document.getElementById('valOpacity').textContent  = '100%';

  // preview arte
  const thumb = document.getElementById('artThumb');
  thumb.src = '';
  thumb.style.display = 'none';
  document.getElementById('artPlaceholder').style.display = 'block';
  document.getElementById('fileInput').value = '';

  // material
  bodyMaterial.color.set('#ffffff');

  // cena
  scene.background = new THREE.Color('#ffffff');

  // cores ativas
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  document.querySelector('#mugColors .color-dot[data-color="#ffffff"]').classList.add('active');
  document.querySelector('#bgColors  .color-dot[data-bg="#ffffff"]').classList.add('active');

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
// 17. LOOP DE RENDERIZAÇÃO
// ──────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  // aplicar rotação suavemente
  mugGroup.rotation.x += (state.rotation.x - mugGroup.rotation.x) * 0.1;
  mugGroup.rotation.y += (state.rotation.y - mugGroup.rotation.y) * 0.1;

  renderer.render(scene, camera);
}

animate();
