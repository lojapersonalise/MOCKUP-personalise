// ══════════════════════════════════════════
//   APP.JS — Sistema Multi-Produtos 3D
// ══════════════════════════════════════════

import * as THREE from 'three';

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

// ── 3. MATERIAIS BASE ──
let currentColor = '#ffffff';
const physicalProps = { roughness: 0.02, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.02 };

let currentArtW = 2618;
let currentArtH = 1000;
const artCanvas = document.createElement('canvas');
const artCtx = artCanvas.getContext('2d');
let artTex = new THREE.CanvasTexture(artCanvas);

const printMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: artTex, side: THREE.FrontSide, ...physicalProps });
const colorMaterial = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(currentColor), side: THREE.FrontSide, ...physicalProps });
const colorMaterialInside = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(currentColor), side: THREE.BackSide, ...physicalProps });

const art = { image: null, offsetX: 0, offsetY: 0, scale: 1.0, rotation: 0, opacity: 1.0 };

const productGroup = new THREE.Group();
productGroup.position.y = 0.6;
scene.add(productGroup);

// ── 4. DICIONÁRIO DE PRODUTOS INTELIGENTES ──
const products = {
  caneca: {
    width: 2618, height: 1000,
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
  longdrink: {
    width: 1200, height: 2200,
    create: function() {
      const g = new THREE.Group();
      const h = 2.8, rTop = 0.85, rBot = 0.55, wall = 0.04;
      const yOff = 0.2; // Deslocamento para não atravessar o chão

      const mOut = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 64, 1, true), printMaterial); mOut.position.y = yOff; mOut.castShadow = true; g.add(mOut);
      const mIn = new THREE.Mesh(new THREE.CylinderGeometry(rTop - wall, rBot - wall, h, 64, 1, true), colorMaterialInside); mIn.position.y = yOff; g.add(mIn);
      const mRim = new THREE.Mesh(new THREE.RingGeometry(rTop - wall, rTop, 64), colorMaterial); mRim.rotation.x = -Math.PI/2; mRim.position.y = h/2 + yOff; mRim.castShadow = true; g.add(mRim);
      const mBotIn = new THREE.Mesh(new THREE.CircleGeometry(rBot - wall, 64), colorMaterial); mBotIn.rotation.x = -Math.PI/2; mBotIn.position.y = -(h/2) + wall + yOff; g.add(mBotIn);
      const mBotOut = new THREE.Mesh(new THREE.CircleGeometry(rBot, 64), colorMaterial); mBotOut.rotation.x = Math.PI/2; mBotOut.position.y = -h/2 + yOff; mBotOut.castShadow = true; g.add(mBotOut);

      return g;
    }
  },
  squeeze: {
    width: 2200, height: 1200,
    create: function() {
      const g = new THREE.Group();
      // Proporções mais fiéis à garrafa da foto (mais alta e estreita)
      const h = 3.2, r = 0.75; 
      const yOff = 0.4; // Deslocamento para alinhar com o chão da caneca
      
      // Corpo onde vai a arte
      const mBody = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, false), printMaterial); 
      mBody.position.y = yOff;
      mBody.castShadow = true; 
      g.add(mBody);
      
      // Pescoço da garrafa (Pega a cor escolhida - a curvinha de metal no topo)
      const mNeck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 0.3, 64, 1, false), colorMaterial); 
      mNeck.position.y = h/2 + 0.15 + yOff; 
      mNeck.castShadow = true; 
      g.add(mNeck);

      // --- CONSTRUÇÃO DA TAMPA FLIP (PLÁSTICO PRETO) ---
      const capMat = new THREE.MeshPhysicalMaterial({
        color: 0x111111, // Preto escuro
        roughness: 0.6,  // Fosco como plástico
        clearcoat: 0.1
      });

      // 1. Base principal da tampa
      const mLidBase = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.87, r * 0.87, 0.4, 64), capMat); 
      mLidBase.position.y = h/2 + 0.5 + yOff; 
      mLidBase.castShadow = true; 
      g.add(mLidBase);

      // 2. Bico do Flip (Na frente)
      const mSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 32), capMat);
      mSpout.position.set(0, h/2 + 0.8 + yOff, 0.35); // Eixo Z positivo = Frente
      mSpout.castShadow = true;
      g.add(mSpout);

      // 3. Mini tampinha em cima do bico (fechada)
      const mSpoutCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32), capMat);
      mSpoutCap.position.set(0, h/2 + 0.93 + yOff, 0.35);
      g.add(mSpoutCap);

      // 4. Alça traseira (Aquele arco para pendurar)
      const mLoop = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 16, 32), capMat); 
      mLoop.position.set(0, h/2 + 0.65 + yOff, -0.45); // Eixo Z negativo = Trás
      mLoop.rotation.x = Math.PI / 2 - 0.2; // Deita o anel e inclina um pouco
      mLoop.scale.set(1, 1.2, 1); // Estica para ficar ovalado
      mLoop.castShadow = true; 
      g.add(mLoop);

      return g;
    }
  }
};

// ── 5. CARREGADOR DE PRODUTO DINÂMICO ──
function loadProduct(type) {
  const config = products[type];
  currentArtW = config.width;
  currentArtH = config.height;
  artCanvas.width = currentArtW;
  artCanvas.height = currentArtH;
  
  // Atualiza Memória da Textura
  artTex.dispose();
  artTex = new THREE.CanvasTexture(artCanvas);
  if (THREE.SRGBColorSpace) artTex.colorSpace = THREE.SRGBColorSpace;
  artTex.repeat.x = -1; artTex.wrapS = THREE.RepeatWrapping; artTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  printMaterial.map = artTex;
  
  // Limpa malhas antigas da tela para não pesar o PC
  while(productGroup.children.length > 0){ 
    const child = productGroup.children[0];
    child.traverse(c => { if(c.isMesh) c.geometry.dispose(); });
    productGroup.remove(child); 
  }
  
  const master = config.create();
  
  const pLeft = master.clone(); pLeft.position.x = -2.8; pLeft.rotation.y = -Math.PI / 2 - 0.35;
  const pCenter = master.clone(); pCenter.position.x = 0; pCenter.rotation.y = Math.PI;
  const pRight = master.clone(); pRight.position.x = 2.8; pRight.rotation.y = Math.PI / 2 + 0.35;

  productGroup.add(pLeft, pCenter, pRight);
  
  // Centraliza a arte novamente ao trocar de produto
  art.scale = 1.0; art.offsetX = 0; art.offsetY = 0;
  const sEl = document.getElementById('artScale'); if(sEl) sEl.value = 100;
  const vEl = document.getElementById('valScale'); if(vEl) vEl.textContent = '100%';
  const oX = document.getElementById('offsetX'); if(oX) oX.value = 0;
  
  redrawArt();
}

// ── 6. LÓGICA DE REDESENHO DE ARTE ──
function redrawArt() {
  artCtx.clearRect(0, 0, currentArtW, currentArtH);
  artCtx.fillStyle = '#ffffff';
  artCtx.fillRect(0, 0, currentArtW, currentArtH);

  if (art.image) {
    const iw = art.image.naturalWidth || art.image.width;
    const ih = art.image.naturalHeight || art.image.height;
    
    const fitScale = (currentArtH / ih) * art.scale;
    const cx = currentArtW / 2 - art.offsetX * currentArtW * 0.3;
    const cy = currentArtH / 2 + art.offsetY * currentArtH * 0.3;

    artCtx.save();
    artCtx.globalAlpha = art.opacity;
    artCtx.translate(cx, cy);
    artCtx.scale(-1, 1); // Corrige inversão de texto no 3D
    artCtx.rotate((art.rotation * Math.PI) / 180);
    artCtx.drawImage(art.image, -iw / 2 * fitScale, -ih / 2 * fitScale, iw * fitScale, ih * fitScale);
    artCtx.restore();
  }

  artTex.needsUpdate = true;
  colorMaterial.color.set(currentColor);
  colorMaterialInside.color.set(currentColor);
}

// ── 7. CONTROLES MOUSE/TOUCH ──
const rot = { x: 0.15, y: -0.2, smoothX: 0.15, smoothY: -0.2 };
let mouseDown = false, lastX = 0, lastY = 0;
let targetZoom = 10.0;

canvas.addEventListener('mousedown', e => { mouseDown = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  rot.y += (e.clientX - lastX) * 0.011; rot.x += (e.clientY - lastY) * 0.011;
  rot.x = Math.max(-0.4, Math.min(0.5, rot.x));
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('touchstart', e => { e.preventDefault(); mouseDown = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, { passive: false });
window.addEventListener('touchend', () => mouseDown = false);
canvas.addEventListener('touchmove', e => {
  if (!mouseDown) return; e.preventDefault();
  rot.y += (e.touches[0].clientX - lastX) * 0.011; rot.x += (e.touches[0].clientY - lastY) * 0.011;
  rot.x = Math.max(-0.4, Math.min(0.5, rot.x));
  lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
}, { passive: false });
canvas.addEventListener('wheel', e => { e.preventDefault(); targetZoom = Math.min(15, Math.max(6.0, targetZoom + e.deltaY * 0.01)); }, { passive: false });

// ── 8. EVENTOS DA INTERFACE (UI) ──
document.getElementById('productSelector')?.addEventListener('click', e => {
  if (e.target.classList.contains('prod-btn')) {
    document.querySelectorAll('.prod-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    loadProduct(e.target.dataset.product);
    showToast('📦 Produto alterado!');
  }
});

document.getElementById('offsetX')?.addEventListener('input', function() { art.offsetX = parseFloat(this.value); document.getElementById('valOffsetX').textContent = parseFloat(this.value).toFixed(2); redrawArt(); });
document.getElementById('artScale')?.addEventListener('input', function() { art.scale = parseFloat(this.value) / 100; document.getElementById('valScale').textContent = this.value + '%'; redrawArt(); });

document.getElementById('fileInput')?.addEventListener('change', function () {
  const file = this.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => { art.image = img; art.scale = 1.0; document.getElementById('artScale').value = 100; document.getElementById('valScale').textContent = '100%'; redrawArt(); showToast('✅ Arte carregada!'); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
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

// Inicia com a Caneca
loadProduct('caneca');

// ── 9. LOOP DE ANIMAÇÃO ──
(function animate() {
  requestAnimationFrame(animate);
  rot.smoothX += (rot.x - rot.smoothX) * 0.08; rot.smoothY += (rot.y - rot.smoothY) * 0.08;
  productGroup.rotation.x = rot.smoothX; productGroup.rotation.y = rot.smoothY;
  camera.position.z += (targetZoom - camera.position.z) * 0.08;
  renderer.render(scene, camera);
})();
