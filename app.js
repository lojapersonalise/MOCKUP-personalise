// ══════════════════════════════════════════
//   APP.JS — VERSÃO MASTER FINAL (Responsiva + Alinhada)
// ══════════════════════════════════════════

import * as THREE from 'three';

// ── 0. DIAGNÓSTICO ──
window.addEventListener('error', function(e) {
  const hint = document.querySelector('.canvas-hint');
  if (hint) {
    hint.style.background = '#ef4444';
    hint.style.color = '#ffffff';
    hint.textContent = 'ERRO: ' + e.message;
  }
});

// ── 1. RENDERER ──
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.toneMapping = THREE.ACESFilmicToneMapping; 
renderer.toneMappingExposure = 1.35; 

// ── 2. CENA + CÂMERA ──
const scene = new THREE.Scene();
scene.background = new THREE.Color('#6b2b8e'); 

const camera = new THREE.PerspectiveCamera(35, 800 / 500, 0.1, 100);
camera.position.set(0, 0.8, 10.0);

// ── 3. ILUMINAÇÃO ──
scene.add(new THREE.AmbientLight(0xffffff, 1.2)); 
const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(5, 8, 4);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
fillLight.position.set(-6, 3, 2);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffffff, 2.5, 20);
rimLight.position.set(0, 5, -5);
scene.add(rimLight);

// ── 4. CHÃO PARA SOMBRAS ──
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.ShadowMaterial({ opacity: 0.18 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.6; 
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// ── 5. MATERIAIS ──
let currentColor = '#ffffff';
const ART_W = 2618; 
const ART_H = 1000; 
const artCanvas = document.createElement('canvas');
artCanvas.width = ART_W; artCanvas.height = ART_H;
const artCtx = artCanvas.getContext('2d');

const artTex = new THREE.CanvasTexture(artCanvas);
artTex.repeat.x = -1; 
artTex.wrapS = THREE.RepeatWrapping;
artTex.anisotropy = 16;

const art = { image: null, offsetX: 0, offsetY: 0, scale: 1.0, rotation: 0, opacity: 1.0 };
const physicalProps = { roughness: 0.12, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.08 };

const printMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: artTex, ...physicalProps });
const colorMaterial = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(currentColor), ...physicalProps });
const colorMaterialInside = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(currentColor), side: THREE.BackSide, ...physicalProps });

// ── 6. CONSTRUÇÃO DA CANECA ──
const mugGroup = new THREE.Group();
mugGroup.position.y = 0.6;
scene.add(mugGroup);

function createMug() {
  const group = new THREE.Group();
  const h = 2.4; const r = 1.0; const wall = 0.08;

  const geoOutside = new THREE.CylinderGeometry(r, r, h, 64, 1, true);
  // Alinha a costura com a alça
  geoOutside.rotateY(-Math.PI / 2); 
  const body = new THREE.Mesh(geoOutside, printMaterial);
  body.castShadow = true;
  group.add(body);

  const inside = new THREE.Mesh(new THREE.CylinderGeometry(r - wall, r - wall, h, 64, 1, true), colorMaterialInside);
  group.add(inside);

  const rim = new THREE.Mesh(new THREE.RingGeometry(r - wall, r, 64), colorMaterial);
  rim.rotation.x = -Math.PI / 2; rim.position.y = h / 2;
  group.add(rim);

  const bottom = new THREE.Mesh(new THREE.CircleGeometry(r, 64), colorMaterial);
  bottom.rotation.x = Math.PI / 2; bottom.position.y = -h / 2;
  group.add(bottom);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.16, 32, 64), colorMaterial);
  handle.position.set(r, 0, 0); 
  handle.scale.set(0.7, 1.2, 1);
  handle.castShadow = true;
  group.add(handle);

  return group;
}

// ── 7. INSTÂNCIAS ──
const m1 = createMug(); m1.position.x = -2.8; m1.rotation.y = 0.4;
const mCenter = createMug(); mCenter.rotation.y = -Math.PI / 2;
const m3 = createMug(); m3.position.x = 2.8; m3.rotation.y = -Math.PI - 0.4;
mugGroup.add(m1, mCenter, m3);

// ── 8. REDESENHAR ARTE ──
function redrawArt() {
  artCtx.clearRect(0, 0, ART_W, ART_H);
  artCtx.fillStyle = '#ffffff';
  artCtx.fillRect(0, 0, ART_W, ART_H);
  if (art.image) {
    const iw = art.image.width, ih = art.image.height;
    const fitScale = (ART_H / ih) * art.scale;
    const cx = ART_W / 2 - art.offsetX * ART_W * 0.3;
    const cy = ART_H / 2 + art.offsetY * ART_H * 0.3;
    artCtx.save();
    artCtx.translate(ART_W, 0); artCtx.scale(-1, 1);
    artCtx.globalAlpha = art.opacity;
    artCtx.translate(cx, cy); artCtx.rotate((art.rotation * Math.PI) / 180);
    artCtx.drawImage(art.image, -iw / 2 * fitScale, -ih / 2 * fitScale, iw * fitScale, ih * fitScale);
    artCtx.restore();
  }
  artTex.needsUpdate = true;
  colorMaterial.color.set(currentColor);
  colorMaterialInside.color.set(currentColor);
}
redrawArt();

// ── 9. INTERAÇÃO ──
const rot = { x: 0.15, y: -0.2, smoothX: 0.15, smoothY: -0.2 };
let mouseDown = false, lastX = 0, lastY = 0, targetZoom = 10.0;

canvas.addEventListener('mousedown', e => { mouseDown = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  rot.y += (e.clientX - lastX) * 0.01; rot.x += (e.clientY - lastY) * 0.01;
  rot.x = Math.max(-0.4, Math.min(0.5, rot.x));
  lastX = e.clientX; lastY = e.clientY;
});

// ── 10. UPLOAD ──
document.getElementById('fileInput').addEventListener('change', function() {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => { art.image = img; redrawArt(); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(this.files[0]);
});

// ── 11. AJUSTES ──
document.getElementById('artScale').addEventListener('input', function() {
  art.scale = this.value / 100; redrawArt();
});
document.getElementById('offsetX').addEventListener('input', function() {
  art.offsetX = this.value; redrawArt();
});

// ── 12. ANIMAÇÃO (CORREÇÃO DO LOOP) ──
function animate() {
  requestAnimationFrame(animate);
  rot.smoothX += (rot.x - rot.smoothX) * 0.08;
  rot.smoothY += (rot.y - rot.smoothY) * 0.08;
  mugGroup.rotation.x = rot.smoothX;
  mugGroup.rotation.y = rot.smoothY;
  camera.position.z += (targetZoom - camera.position.z) * 0.08;
  renderer.render(scene, camera);
}
animate();

// ── 13. RESPONSIVIDADE (O SENSOR QUE FALTAVA) ──
window.addEventListener('resize', () => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
});
window.dispatchEvent(new Event('resize'));
