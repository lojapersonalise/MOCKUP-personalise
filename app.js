// 1. Configuração Básica do Three.js
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Câmera
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 0, 10);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// Controles (OrbitControls)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 3;
controls.maxDistance = 15;

// Iluminação Realista
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 5, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xe0eaff, 0.3);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

// Variáveis Globais de Estado
let currentModel = null;
let currentProduct = 'caneca';
let currentTexture = null;
let currentTexture2 = null; // Para costas
let horizontalOffset = 0;
let textureScale = 1;

// Materiais Base
const colorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.1,
    clearcoat: 0.1,
});

const printMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
    alphaTest: 0.05
});

// Material para as costas (Almofada, Necessaire, etc)
const printMaterial2 = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
    alphaTest: 0.05
});

// Material do zíper/costura
const zipperMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0.2
});


// 2. Definição dos Produtos
const products = {
    caneca: {
        width: 2000, height: 850,
        layout: 'panoramic',
        create: async function() {
            const g = new THREE.Group();
            
            // Corpo da caneca
            const geo = new THREE.CylinderGeometry(1.5, 1.5, 3.2, 64, 1, false);
            const mesh = new THREE.Mesh(geo, [colorMaterial, printMaterial, colorMaterial]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            g.add(mesh);
            
            // Interior da caneca
            const geoIn = new THREE.CylinderGeometry(1.4, 1.4, 3.2, 64, 1, true);
            const matIn = colorMaterial.clone();
            matIn.side = THREE.BackSide;
            const meshIn = new THREE.Mesh(geoIn, matIn);
            g.add(meshIn);
            
            // Fundo interno
            const geoBotIn = new THREE.CircleGeometry(1.4, 64);
            const meshBotIn = new THREE.Mesh(geoBotIn, colorMaterial);
            meshBotIn.rotation.x = -Math.PI / 2;
            meshBotIn.position.y = -1.59;
            g.add(meshBotIn);

            // Alça
            const handleGeo = new THREE.TorusGeometry(0.9, 0.25, 16, 32);
            const handle = new THREE.Mesh(handleGeo, colorMaterial);
            handle.position.set(1.5, 0, 0);
            handle.castShadow = true;
            g.add(handle);
            
            return g;
        }
    },
    agenda: {
        width: 1500, height: 2100,
        layout: 'single',
        create: async function() {
            const g = new THREE.Group();
            
            // Capa
            const geo = new THREE.BoxGeometry(2.8, 4, 0.1);
            const materials = [colorMaterial, colorMaterial, colorMaterial, colorMaterial, printMaterial, colorMaterial];
            const cover = new THREE.Mesh(geo, materials);
            cover.castShadow = true;
            cover.receiveShadow = true;
            g.add(cover);
            
            // Páginas
            const pagesGeo = new THREE.BoxGeometry(2.7, 3.9, 0.4);
            const pagesMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
            const pages = new THREE.Mesh(pagesGeo, pagesMat);
            pages.position.set(0.05, 0, -0.25);
            g.add(pages);
            
            // Wire-o (Espiral)
            const wireMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
            for(let i=0; i<15; i++) {
                const ringGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 16);
                const ring = new THREE.Mesh(ringGeo, wireMat);
                ring.rotation.x = Math.PI / 2;
                ring.position.set(-1.4, 1.6 - (i * 0.23), -0.15);
                g.add(ring);
            }
            
            return g;
        }
    },
    squeeze: {
        width: 2000, height: 1000,
        layout: 'panoramic',
        create: async function() {
            const g = new THREE.Group();
            
            // Corpo de alumínio
            const geo = new THREE.CylinderGeometry(1.2, 1.2, 4.5, 64);
            const mesh = new THREE.Mesh(geo, [printMaterial, colorMaterial, colorMaterial]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.y = -0.5;
            g.add(mesh);
            
            // Pescoço
            const neckGeo = new THREE.CylinderGeometry(0.5, 1.2, 1, 32);
            const neck = new THREE.Mesh(neckGeo, colorMaterial);
            neck.position.y = 2.25;
            g.add(neck);
            
            // Tampa
            const capGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 32);
            const capMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.y = 3.15;
            g.add(cap);
            
            // Mosquetão (argola)
            const ringGeo = new THREE.TorusGeometry(0.3, 0.05, 16, 32);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(0.8, 3.15, 0);
            g.add(ring);
            
            return g;
        }
    },
    necessaire: {
        width: 2000, height: 1200, 
        layout: 'single', 
        create: async function() {
          const g = new THREE.Group();
          return new Promise((resolve) => {
            const loader = new OBJLoader();
            
            loader.load(
              'necessaire.obj', 
              function (object) {
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.set(-center.x, -center.y, -center.z);
    
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 4 / maxDim; 
                
                const wrapper = new THREE.Group();
                wrapper.add(object);
                wrapper.scale.set(scale, scale, scale);
                wrapper.position.y = -0.5; 
    
                object.traverse(function (child) {
                  if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    const nome = child.name.toLowerCase();
                    
                    if (nome.includes('costa') || nome.includes('back')) {
                      child.material = printMaterial2; 
                    } else if (nome.includes('zipper') || nome.includes('zíper') || nome.includes('costura')) {
                      child.material = zipperMaterial; 
                    } else {
                      child.material = printMaterial; 
                    }
                  }
                });
    
                g.add(wrapper);
                resolve(g);
              },
              undefined, 
              function (error) {
                console.error('Ops, erro ao carregar a necessaire:', error);
                resolve(g); 
              }
            );
          });
        }
    },
    mousepad: {
        width: 2000, height: 1500,
        layout: 'single',
        create: async function() {
            const g = new THREE.Group();
            
            // Base emborrachada
            const baseGeo = new THREE.BoxGeometry(5, 0.1, 4);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = -0.05;
            base.castShadow = true;
            base.receiveShadow = true;
            g.add(base);
            
            // Superfície impressa
            const topGeo = new THREE.PlaneGeometry(5, 4);
            const topMat = printMaterial;
            const top = new THREE.Mesh(topGeo, topMat);
            top.rotation.x = -Math.PI / 2;
            top.position.y = 0.001; // Levemente acima da base
            g.add(top);
            
            // Inicia a câmera olhando de cima para o mousepad
            camera.position.set(0, 7, 3);
            camera.lookAt(0, 0, 0);
            
            return g;
        }
    },
    // SISTEMA DA ALMOFADA (Usando arquivo .OBJ com correção de espelho nas costas)
    almofada: {
        width: 2000, height: 2000, 
        layout: 'single', 
        create: async function() {
          const g = new THREE.Group();
          return new Promise((resolve) => {
            const loader = new OBJLoader();
            
            // Lê o arquivo que está na mesma pasta do GitHub
            loader.load(
              'almofada.obj',
              function (object) {
                // 1. Centraliza o modelo 3D perfeitamente no eixo
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.set(-center.x, -center.y, -center.z);
    
                // 2. Calcula o tamanho automático para não ficar gigante nem minúscula
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3.6 / maxDim; 
                
                const wrapper = new THREE.Group();
                wrapper.add(object);
                wrapper.scale.set(scale, scale, scale);
                wrapper.position.y = -0.5; // Ajuste da altura em relação ao chão
    
                // 3. Aplica os materiais (Textura)
                object.traverse(function (child) {
                  if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    const nome = child.name.toLowerCase();
                    
                    // Aplica a arte das costas se o arquivo tiver "costas" ou "back"
                    if (nome.includes('costa') || nome.includes('back')) {
                      child.material = printMaterial2; // Arte das costas
                      
                      // 👇 MÁGICA: Desvira a imagem espelhada invertendo o mapa 3D (UV)
                      const uv = child.geometry.attributes.uv;
                      if (uv) {
                        for (let i = 0; i < uv.count; i++) {
                          uv.setX(i, 1 - uv.getX(i)); // Inverte a coordenada X (efeito espelho)
                        }
                        uv.needsUpdate = true;
                      }
                    } 
                    // Se o arquivo tiver uma costura/zíper separada
                    else if (nome.includes('costura') || nome.includes('seam') || nome.includes('zipper')) {
                      child.material = zipperMaterial; // Segue a cor escolhida na paleta
                    } 
                    // Todo o resto recebe a arte da frente
                    else {
                      child.material = printMaterial; // Arte da frente
                    }
                  }
                });
    
                g.add(wrapper);
                resolve(g);
              },
              undefined, 
              function (error) {
                console.error('Ops, erro ao carregar a almofada:', error);
                resolve(g); // Evita travar a tela se der erro
              }
            );
          });
        }
    }
};

// 3. Funções de Controle

// Carregar Produto
async function loadProduct(productId) {
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    currentProduct = productId;
    const productData = products[productId];
    
    // Reset da câmera para o padrão 
    camera.position.set(0, 0, 10);
    controls.target.set(0, 0, 0);
    
    // Atualiza botões visuais (Protegido contra erros)
    document.querySelectorAll('.btn-product').forEach(btn => btn.classList.remove('active'));
    try {
        const btnAtivo = document.querySelector(`[onclick*="${productId}"]`);
        if (btnAtivo) btnAtivo.classList.add('active');
    } catch(e) {}
    
    // CORREÇÃO: Mostra/esconde botão de carregar Costas de forma segura
    try {
        const inputCostas = document.getElementById('upload-costas');
        if (inputCostas) {
            // Tenta esconder a div que envolve o botão
            const containerCostas = inputCostas.parentElement.parentElement || inputCostas.parentElement;
            
            if (productId === 'almofada' || productId === 'necessaire') {
                containerCostas.style.display = 'block';
            } else {
                containerCostas.style.display = 'none';
                currentTexture2 = null; // Limpa textura das costas ao mudar de produto
            }
        }
    } catch(e) {
        console.log("Aviso: Botão de costas não encontrado na interface.");
    }

    // Cria o novo modelo
    currentModel = await productData.create();
    scene.add(currentModel);
    
    // Reaplica texturas e cores se existirem
    updateTexture();
}
// Atualizar Textura (Mapeamento)
function updateTexture() {
    if (!currentTexture && !currentTexture2) return;
    
    const productData = products[currentProduct];
    
    // Aplica na Frente
    if (currentTexture) {
        currentTexture.center.set(0.5, 0.5);
        currentTexture.repeat.set(1 / textureScale, 1 / textureScale);
        currentTexture.offset.set(horizontalOffset, 0);
        
        if (productData.layout === 'panoramic') {
            currentTexture.wrapS = THREE.RepeatWrapping;
        } else {
            currentTexture.wrapS = THREE.ClampToEdgeWrapping;
        }
        
        printMaterial.map = currentTexture;
        printMaterial.needsUpdate = true;
    }

    // Aplica nas Costas (se existir)
    if (currentTexture2) {
        currentTexture2.center.set(0.5, 0.5);
        currentTexture2.repeat.set(1 / textureScale, 1 / textureScale);
        currentTexture2.offset.set(horizontalOffset, 0);
        currentTexture2.wrapS = THREE.ClampToEdgeWrapping;
        
        printMaterial2.map = currentTexture2;
        printMaterial2.needsUpdate = true;
    } else {
        // Se não tiver arte nas costas, limpa o material para não bugar
        printMaterial2.map = null;
        printMaterial2.needsUpdate = true;
    }
}

// Lidar com Upload de Imagem (Frente)
document.getElementById('upload-imagem').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Cria um canvas para garantir o tamanho correto da textura
            const canvas = document.createElement('canvas');
            const productData = products[currentProduct];
            canvas.width = productData.width;
            canvas.height = productData.height;
            const ctx = canvas.getContext('2d');
            
            // Fundo transparente
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Calcula o melhor encaixe (cover)
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            
            // Cria textura a partir do canvas
            currentTexture = new THREE.CanvasTexture(canvas);
            currentTexture.colorSpace = THREE.SRGBColorSpace;
            updateTexture();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// Lidar com Upload de Imagem (Costas)
document.getElementById('upload-costas').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const productData = products[currentProduct];
            canvas.width = productData.width;
            canvas.height = productData.height;
            const ctx = canvas.getContext('2d');
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            
            currentTexture2 = new THREE.CanvasTexture(canvas);
            currentTexture2.colorSpace = THREE.SRGBColorSpace;
            updateTexture();
            
            // Gira a câmera suavemente para mostrar as costas automaticamente
            camera.position.set(0, 0, -10);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// Controles Deslizantes (Sliders)
document.getElementById('horizontal').addEventListener('input', function(e) {
    horizontalOffset = parseFloat(e.target.value);
    updateTexture();
});

document.getElementById('tamanho').addEventListener('input', function(e) {
    textureScale = parseFloat(e.target.value) / 100;
    updateTexture();
});

// Mudar Cores
function changeColor(hexColor) {
    colorMaterial.color.setHex(hexColor);
    zipperMaterial.color.setHex(hexColor); // Aplica a cor também no zíper/costura
}

// 4. Loop de Animação
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Redimensionamento da Janela
window.addEventListener('resize', function() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// Iniciar a aplicação
loadProduct('caneca');
animate();
