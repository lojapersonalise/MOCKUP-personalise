// ══════════════════════════════════════════
//   APP.JS — Sistema Multi-Produtos 3D
// ══════════════════════════════════════════

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'; // <-- IMPORTAÇÃO NOVA!

window.addEventListener('error', function(e) {
  console.error('ERRO JS: ' + e.message);
});

// ── 1. RENDERER E CENA ──
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setSize(800, 500);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; 
if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#6b2b8e');
const camera = new THREE.PerspectiveCamera(35, 800 / 500, 0.1, 100);
camera.position.set(0, 0.8, 10.0);

// ── 2. LUZES E CHÃO ──
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(3, 4, 6); keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024; keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
fillLight.position.set(-6, 3, 2); scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffffff, 2.5, 20);
rimLight.position.set(0, 5, -5); scene.add(rimLight);

const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.18 }));
shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.y = -0.6; shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// ── 3. MATERIAIS E CANVAS DUPLOS ──
let currentColor = '#ffffff';
let currentProductType = 'caneca';

const physicalProps = { roughness: 0.02, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.02 };

let currentArtW = 2618;
let currentArtH = 1000;

const artCanvas = document.createElement('canvas');
const artCtx = artCanvas.getContext('2d');
let artTex = new THREE.CanvasTexture(artCanvas);

const artCanvas2 = document.createElement('canvas');
const artCtx2 = artCanvas2.getContext('2d');
let artTex2 = new THREE.CanvasTexture(artCanvas2);

const printMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: artTex, side: THREE.FrontSide, ...physicalProps });
const printMaterial2 = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: artTex2, side: THREE.FrontSide, ...physicalProps });
const colorMaterial = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(currentColor), side: THREE.FrontSide, ...physicalProps });
const colorMaterialInside = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(currentColor), side: THREE.BackSide, ...physicalProps });

const art = { image: null, offsetX: 0, offsetY: 0, scale: 1.0, rotation: 0, opacity: 1.0 };
const art2 = { image: null, offsetX: 0, offsetY: 0, scale: 1.0, rotation: 0, opacity: 1.0 };

const productGroup = new THREE.Group();
productGroup.position.y = 0.6;
scene.add(productGroup);

// ── 4. DICIONÁRIO DE PRODUTOS ──
const products = {
  caneca: {
    width: 2618, height: 1000,
    layout: 'standard', spacing: 2.8, rotations: [-Math.PI / 2 - 0.35, Math.PI, Math.PI / 2 + 0.35],
    create: function() {
      const g = new THREE.Group();
      const h = 2.4, r = 1.0, wall = 0.08;
      const mOut = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, true), printMaterial); mOut.castShadow = true; g.add(mOut);
      const mIn = new THREE.Mesh(new THREE.CylinderGeometry(r - wall, r - wall, h, 64, 1, true), colorMaterialInside); g.add(mIn);
      const mRim = new THREE.Mesh(new THREE.RingGeometry(r - wall, r, 64), colorMaterial); mRim.rotation.x = -Math.PI/2; mRim.position.y = h/2; mRim.castShadow = true; g.add(mRim);
      const mBotIn = new THREE.Mesh(new THREE.CircleGeometry(r - wall, 64), colorMaterial); mBotIn.rotation.x = -Math.PI/2; mBotIn.position.y = -(h/2) + wall; g.add(mBotIn);
      const mBotOut = new THREE.Mesh(new THREE.CircleGeometry(r, 64), colorMaterial); mBotOut.rotation.x = Math.PI/2; mBotOut.position.y = -h/2; mBotOut.castShadow = true; g.add(mBotOut);
      const mHandle = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.16, 32, 64), colorMaterial); mHandle.position.set(0, 0, r); mHandle.rotation.y = Math.PI/2; mHandle.scale.set(0.7, 1.2, 1); mHandle.castShadow = true; g.add(mHandle);
      return g;
    }
  },
  
  agenda: {
    width: 1240, height: 1754, layout: 'double_agenda',
    createFront: function() {
      const g = new THREE.Group();
      const w = 2.0, h = 2.828, d = 0.15; const bottom = -1.2; const yOff = bottom + h/2;
      const pageMat = new THREE.MeshPhysicalMaterial({ color: 0xf5f5f5, roughness: 1.0, clearcoat: 0 });
      const materials = [ pageMat, colorMaterial, pageMat, pageMat, printMaterial, colorMaterial ];
      const mCover = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materials);
      mCover.position.y = yOff; mCover.castShadow = true; g.add(mCover);
      const wireMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.05, roughness: 0.8 });
      for(let i=0; i<16; i++) {
        const ringY = (bottom + 0.2) + i * (h - 0.4) / 15;
        const torusGeo = new THREE.TorusGeometry(0.10, 0.016, 16, 32);
        const ring1 = new THREE.Mesh(torusGeo, wireMat); ring1.position.set(-w/2, ringY, 0); ring1.rotation.x = Math.PI/2; ring1.castShadow = true; g.add(ring1);
        const ring2 = new THREE.Mesh(torusGeo, wireMat); ring2.position.set(-w/2, ringY + 0.04, 0); ring2.rotation.x = Math.PI/2; ring2.castShadow = true; g.add(ring2);
      }
      return g;
    },
    createBack: function() {
      const g = new THREE.Group();
      const w = 2.0, h = 2.828, d = 0.15; const bottom = -1.2; const yOff = bottom + h/2;
      const pageMat = new THREE.MeshPhysicalMaterial({ color: 0xf5f5f5, roughness: 1.0, clearcoat: 0 });
      const materials = [ colorMaterial, pageMat, pageMat, pageMat, printMaterial2, colorMaterial ];
      const mCover = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materials);
      mCover.position.y = yOff; mCover.castShadow = true; g.add(mCover);
      const wireMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.05, roughness: 0.8 });
      for(let i=0; i<16; i++) {
        const ringY = (bottom + 0.2) + i * (h - 0.4) / 15;
        const torusGeo = new THREE.TorusGeometry(0.10, 0.016, 16, 32);
        const ring1 = new THREE.Mesh(torusGeo, wireMat); ring1.position.set(w/2, ringY, 0); ring1.rotation.x = Math.PI/2; ring1.castShadow = true; g.add(ring1);
        const ring2 = new THREE.Mesh(torusGeo, wireMat); ring2.position.set(w/2, ringY + 0.04, 0); ring2.rotation.x = Math.PI/2; ring2.castShadow = true; g.add(ring2);
      }
      return g;
    }
  },

  necessaire: {
    width: 1754, height: 2480,
    layout: 'standard', spacing: 3.4, 
    rotations: [-0.45, 0.15, 3.4], // Mostra Lado, Frente, Costas
    
    // Transformamos a função em Promise/Async para carregar o modelo 3D antes de exibir
    create: async function() {
      const g = new THREE.Group();
      
      return new Promise((resolve) => {
        const loader = new OBJLoader();
        loader.load(
          // URL do seu arquivo cru no GitHub
          'https://raw.githubusercontent.com/lojapersonalise/MOCKUP-personalise/main/necessaire.obj',
          function (object) {
            
            // 1. Auto-Centralização (corrige se o modelo não estiver no eixo zero do Blender)
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.set(-center.x, -center.y, -center.z);

            // 2. Auto-Escala (calcula o tamanho para encaixar perfeitamente na nossa tela)
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3.5 / maxDim; // 3.5 é a medida visual parecida com as canecas/agendas
            
            const wrapper = new THREE.Group();
            wrapper.add(object);
            wrapper.scale.set(scale, scale, scale);
            wrapper.position.y = -0.6; // Ajusta a altura na cena

            // 3. Aplicação dos Materiais nos pedaços certos
            object.traverse(function (child) {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                const name = child.name.toLowerCase();
                
                if (name.includes('body')) {
                  // O Corpo recebe a arte (printMaterial)
                  child.material = printMaterial;
                } else if (name.includes('zipper')) {
                  // O Zíper recebe um cinza/metálico claro
                  child.material = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.4, metalness: 0.5 });
                } else if (name.includes('handle')) {
                  // As alças recebem uma cor sólida
                  child.material = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
                } else {
                  // Qualquer outro pedaço usa a cor base do produto
                  child.material = colorMaterial;
                }
              }
            });

            g.add(wrapper);
            resolve(g); // Terminou!
          },
          undefined, // Progresso
          function (error) {
            console.error('Ops, erro ao carregar a necessaire:', error);
            resolve(g);
          }
        );
      });
    }
  },

  squeeze: {
    width: 2200, height: 1200,
    layout: 'standard', spacing: 2.8, rotations: [-Math.PI / 2 - 0.35, Math.PI, Math.PI / 2 + 0.35],
    create: function() {
      const g = new THREE.Group();
      const h = 3.2, r = 0.75; const yOff = 0.4; 
      const mBody = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, false), printMaterial); 
      mBody.position.y = yOff; mBody.castShadow = true; g.add(mBody);
      const mNeck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 0.3, 64, 1, false), colorMaterial); 
      mNeck.position.y = h/2 + 0.15 + yOff; mNeck.castShadow = true; g.add(mNeck);
      const capMat = new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.6, clearcoat: 0.1 });
      const mLidBase = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.87, r * 0.87, 0.4, 64), capMat); 
      mLidBase.position.y = h/2 + 0.5 + yOff; mLidBase.castShadow = true; g.add(mLidBase);
      const mSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 32), capMat);
      mSpout.position.set(0, h/2 + 0.8 + yOff, 0.35); mSpout.castShadow = true; g.add(mSpout);
      const mSpoutCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32), capMat);
      mSpoutCap.position.set(0, h/2 + 0.93 + yOff, 0.35); g.add(mSpoutCap);
      const mLoop = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 16, 32), capMat); 
      mLoop.position.set(0, h/2 + 0.65 + yOff, -0.45); 
      mLoop.rotation.x = Math.PI / 2 - 0.2; mLoop.scale.set(1, 1.2, 1); mLoop.castShadow = true; g.add(mLoop);
      return g;
    }
  }
};

// ── 5. CARREGADOR DE PRODUTO DINÂMICO (AGORA ASSÍNCRONO) ──
async function loadProduct(type) {
  currentProductType = type;
  const config = products[type];
  currentArtW = config.width;
  currentArtH = config.height;
  
  if (type === 'necessaire') {
    physicalProps.roughness = 0.95; physicalProps.clearcoat = 0.0; // Tecido fosco
    printMaterial.side = THREE.DoubleSide; // Garante que a malha não suma por dentro
  } else if (type === 'agenda') {
    physicalProps.roughness = 0.4; physicalProps.clearcoat = 0.1; 
    printMaterial.side = THREE.FrontSide;
  } else {
    physicalProps.roughness = 0.02; physicalProps.clearcoat = 1.0; 
    printMaterial.side = THREE.FrontSide;
  }
  
  [printMaterial, printMaterial2, colorMaterial, colorMaterialInside].forEach(mat => {
    mat.roughness = physicalProps.roughness; mat.clearcoat = physicalProps.clearcoat;
  });
  
  artTex.dispose(); artTex2.dispose();
  
  artCanvas.width = currentArtW; artCanvas.height = currentArtH;
  artCanvas2.width = currentArtW; artCanvas2.height = currentArtH;
  
  artTex = new THREE.CanvasTexture(artCanvas);
  artTex2 = new THREE.CanvasTexture(artCanvas2);
  
  if (THREE.SRGBColorSpace) { artTex.colorSpace = THREE.SRGBColorSpace; artTex2.colorSpace = THREE.SRGBColorSpace; }
  
  const noFlip = (type === 'agenda' || type === 'necessaire');
  artTex.repeat.x = noFlip ? 1 : -1; artTex2.repeat.x = noFlip ? 1 : -1;
  artTex.wrapS = THREE.RepeatWrapping; artTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  artTex2.wrapS = THREE.RepeatWrapping; artTex2.anisotropy = renderer.capabilities.getMaxAnisotropy();
  
  printMaterial.map = artTex; printMaterial2.map = artTex2;
  
  if (type === 'agenda') {
    document.getElementById('sectionUpload2').style.display = 'block';
    document.getElementById('titleUpload1').textContent = 'Capa (Esquerda)';
  } else if (type === 'necessaire') {
    document.getElementById('sectionUpload2').style.display = 'none';
    document.getElementById('titleUpload1').textContent = 'Arte Completa (A4)';
  } else {
    document.getElementById('sectionUpload2').style.display = 'none';
    document.getElementById('titleUpload1').textContent = 'Arte Principal';
  }

  while(productGroup.children.length > 0){ 
    const child = productGroup.children[0];
    child.traverse(c => { if(c.isMesh) c.geometry.dispose(); });
    productGroup.remove(child); 
  }
  
  // Como loadProduct agora é async, usamos 'await' para aguardar os objetos serem gerados ou baixados
  if (config.layout === 'double_agenda') {
    const pLeft = await config.createFront(); pLeft.position.x = -1.15; pLeft.rotation.y = 0.12; 
    const pRight = await config.createBack(); pRight.position.x = 1.15; pRight.rotation.y = -0.12; 
    productGroup.add(pLeft, pRight);
  } else {
    const master = await config.create();
    const space = config.spacing; const rots = config.rotations;
    const pLeft = master.clone(); pLeft.position.x = -space; pLeft.rotation.y = rots[0];
    const pCenter = master.clone(); pCenter.position.x = 0; pCenter.rotation.y = rots[1];
    const pRight = master.clone(); pRight.position.x = space; pRight.rotation.y = rots[2];
    productGroup.add(pLeft, pCenter, pRight);
  }
  
  art.scale = 1.0; art.offsetX = 0; art.offsetY = 0; art2.scale = 1.0; art2.offsetX = 0; art2.offsetY = 0;
  const sEl = document.getElementById('artScale'); if(sEl) sEl.value = 100;
  const vEl = document.getElementById('valScale'); if(vEl) vEl.textContent = '100%';
  const oX = document.getElementById('offsetX'); if(oX) oX.value = 0;
  
  redrawArt();
}

// ── 6. LÓGICA DE REDESENHO DE ARTE ──
function redrawArt() {
  artCtx.clearRect(0, 0, currentArtW, currentArtH); artCtx.fillStyle = '#ffffff'; artCtx.fillRect(0, 0, currentArtW, currentArtH);
  if (art.image) {
    const iw = art.image.naturalWidth || art.image.width; const ih = art.image.naturalHeight || art.image.height;
    const fitScale = (currentArtH / ih) * art.scale;
    const cx = currentArtW / 2 - art.offsetX * currentArtW * 0.3; const cy = currentArtH / 2 + art.offsetY * currentArtH * 0.3;

    artCtx.save(); artCtx.globalAlpha = art.opacity; artCtx.translate(cx, cy);
    if (currentProductType !== 'agenda' && currentProductType !== 'necessaire') artCtx.scale(-1, 1); 
    artCtx.rotate((art.rotation * Math.PI) / 180);
    artCtx.drawImage(art.image, -iw / 2 * fitScale, -ih / 2 * fitScale, iw * fitScale, ih * fitScale); artCtx.restore();
  }
  artTex.needsUpdate = true;

  artCtx2.clearRect(0, 0, currentArtW, currentArtH); artCtx2.fillStyle = '#ffffff'; artCtx2.fillRect(0, 0, currentArtW, currentArtH);
  if (art2.image) {
    const iw = art2.image.naturalWidth || art2.image.width; const ih = art2.image.naturalHeight || art2.image.height;
    const fitScale = (currentArtH / ih) * art2.scale;
    const cx = currentArtW / 2 - art2.offsetX * currentArtW * 0.3; const cy = currentArtH / 2 + art2.offsetY * currentArtH * 0.3;

    artCtx2.save(); artCtx2.globalAlpha = art2.opacity; artCtx2.translate(cx, cy);
    if (currentProductType !== 'agenda' && currentProductType !== 'necessaire') artCtx2.scale(-1, 1);
    artCtx2.rotate((art2.rotation * Math.PI) / 180);
    artCtx2.drawImage(art2.image, -iw / 2 * fitScale, -ih / 2 * fitScale, iw * fitScale, ih * fitScale); artCtx2.restore();
  }
  artTex2.needsUpdate = true;

  colorMaterial.color.set(currentColor); colorMaterialInside.color.set(currentColor);
}

// ── 7. CONTROLES MOUSE/TOUCH ──
const rot = { x: 0.15, y: -0.2, smoothX: 0.15, smoothY: -0.2 };
let mouseDown = false, lastX = 0, lastY = 0, targetZoom = 10.0;

canvas.addEventListener('mousedown', e => { mouseDown = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  rot.y += (e.clientX - lastX) * 0.011; rot.x += (e.clientY - lastY) * 0.011;
  rot.x = Math.max(-0.4, Math.min(0.5, rot.x)); lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('touchstart', e => { e.preventDefault(); mouseDown = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, { passive: false });
window.addEventListener('touchend', () => mouseDown = false);
canvas.addEventListener('touchmove', e => {
  if (!mouseDown) return; e.preventDefault();
  rot.y += (e.touches[0].clientX - lastX) * 0.011; rot.x += (e.touches[0].clientY - lastY) * 0.011;
  rot.x = Math.max(-0.4, Math.min(0.5, rot.x)); lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
}, { passive: false });
canvas.addEventListener('wheel', e => { e.preventDefault(); targetZoom = Math.min(15, Math.max(6.0, targetZoom + e.deltaY * 0.01)); }, { passive: false });

// ── 8. EVENTOS DA INTERFACE (UI) ──
document.getElementById('productSelector')?.addEventListener('click', e => {
  if (e.target.classList.contains('prod-btn')) {
    document.querySelectorAll('.prod-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active'); loadProduct(e.target.dataset.product); showToast('📦 Produto alterado!');
  }
});

document.getElementById('offsetX')?.addEventListener('input', function() { art.offsetX = parseFloat(this.value); art2.offsetX = parseFloat(this.value); document.getElementById('valOffsetX').textContent = parseFloat(this.value).toFixed(2); redrawArt(); });
document.getElementById('artScale')?.addEventListener('input', function() { art.scale = parseFloat(this.value) / 100; art2.scale = parseFloat(this.value) / 100; document.getElementById('valScale').textContent = this.value + '%'; redrawArt(); });

document.getElementById('fileInput')?.addEventListener('change', function () {
  const file = this.files[0]; if (!file) return; const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => { art.image = img; art.scale = 1.0; art2.scale = 1.0; document.getElementById('artScale').value = 100; document.getElementById('valScale').textContent = '100%'; redrawArt(); showToast('✅ Arte carregada!'); };
    img.src = ev.target.result;
  }; reader.readAsDataURL(file);
});

document.getElementById('fileInput2')?.addEventListener('change', function () {
  const file = this.files[0]; if (!file) return; const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => { art2.image = img; redrawArt(); showToast('✅ Contra-Capa carregada!'); };
    img.src = ev.target.result;
  }; reader.readAsDataURL(file);
});

document.getElementById('productColors')?.addEventListener('click', function (e) {
  if (e.target.tagName === 'INPUT') return;
  const dot = e.target.closest('[data-color]');
  if (!dot) {
    const label = e.target.closest('label.color-dot');
    if (label) { this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active')); label.classList.add('active'); }
    return;
  }
  this.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active'); currentColor = dot.dataset.color; redrawArt();
});

document.getElementById('customColor')?.addEventListener('input', function () {
  const parent = this.closest('.color-dot');
  if (parent) { document.querySelectorAll('#productColors .color-dot').forEach(d => d.classList.remove('active')); parent.classList.add('active'); }
  currentColor = this.value; redrawArt();
});

document.getElementById('btnExport')?.addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'mockup-personalise.png'; a.click(); showToast('💾 Imagem salva!');
});

let toastTimer;
function showToast(msg) {
  let t = document.getElementById('toast');
  if(!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

loadProduct('caneca');

// ── 9. LOOP DE ANIMAÇÃO ──
(function animate() {
  requestAnimationFrame(animate);
  rot.smoothX += (rot.x - rot.smoothX) * 0.08; rot.smoothY += (rot.y - rot.smoothY) * 0.08;
  productGroup.rotation.x = rot.smoothX; productGroup.rotation.y = rot.smoothY;
  camera.position.z += (targetZoom - camera.position.z) * 0.08;
  renderer.render(scene, camera);
})();
