// ══════════════════════════════════════════
//   APP.JS — Mockup 3D Caneca v8
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

// ── 6. ALÇA (lateral direita) ─────────────
const hR  = 0.22;
const hX  = G.rTop + 0.01;
const hCX = hX + 0.18;

const handleCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(hX,        hR * 0.85,  0),
  new THREE.Vector3(hCX,       hR,         0),
  new THREE.Vector3(hCX + 0.10, 0,         0),
  new THREE.Vector3(hCX,      -hR,         0),
  new THREE.Vector3(hX,       -hR * 0.85,  0),
]);

mugGroup.add(new THREE.Mesh(
  new THREE.TubeGeometry(handleCurve, 60, 0.045, 16, false),
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

  // Espelha horizontalmente no canvas para compensar a inversão do UV do Three.js
  artCtx.scale(-scaleX, scaleY);

  artCtx.drawImage(art.image, -iw / 2, -ih / 2);
  artCtx.restore();
  artTex.needsUpdate = true;
}

// ── 9. CILINDRO DA ESTAMPA ───────────────
// Altura exatamente igual ao corpo da caneca, sem ultrapassar
const STAMP_H = G.h - 0.01; // apenas 0.01 menor para não vazar

const stampGeo = new THREE.CylinderGeometry(
  G.rTop + 0.002,
  G.rBot + 0.002,
  STAMP_H,          // ✅ mesma altura do corpo
  G.seg,
  1,
  true,
  0,
  Math.PI * 2
);

// Sem inversão de UV — a imagem já é espelhada no canvas 2D
const stampMesh = new THREE.Mesh(stampGeo, new THREE.MeshStandardMaterial({
  map:         artTex,
  transparent: true,
  roughness:   0.2,
  metalness:   0.0,
  depthWrite:  false,
  polygonOffset:       true,
  polygonOffsetFactor: -1,
}));

// Centraliza verticalmente junto ao corpo
stampMesh.position.y = 0;
mugGroup.add(stampMesh);

// ── 10. ROTAÇÃO DA CANECA ────────────────
const rot = { x: 0.15, y: -0.5, smoothX: 0.15, smoothY: -0.5 };
let mouse
