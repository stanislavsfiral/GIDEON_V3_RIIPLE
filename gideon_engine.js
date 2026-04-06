// ============================================================================
// GIDEON ENGINE v55.8 — Сфиральная воксельная адресация
// ============================================================================

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 15); 

// Делаем камеру доступной для кнопки сброса
window.camera = camera;

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.rotateSpeed = 1.2;
controls.zoomSpeed = 1.2;

// Делаем controls доступными для кнопки сброса
window.controls = controls;

const video = document.getElementById('video-preview');
const vCanvas = document.createElement('canvas');
const vCtx = vCanvas.getContext('2d', { willReadFrequently: true });
vCanvas.width = 320; 
vCanvas.height = 180;

let particleSystem, originalCoords = []; 
let b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };

const fpsDom = document.getElementById('fps-val');
const latDom = document.getElementById('lat-val');
let frameCount = 0, lastFpsUpdate = 0, lastLatUpdate = 0;

let vibrationStrength = 0.75;

// ----------------------------------------------------------------------------
// ЗАГРУЗКА ГЕОМЕТРИИ
// ----------------------------------------------------------------------------
fetch('face_coords.txt')
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
    })
    .then(data => {
        const lines = data.trim().split('\n');
        const positions = new Float32Array(lines.length * 3);
        const colors = new Float32Array(lines.length * 3);
        
        lines.forEach((line, i) => {
            let [x, y, z] = line.split(',').map(Number);
            y = -y;
            positions[i*3] = x;
            positions[i*3+1] = y;
            positions[i*3+2] = z;
            originalCoords.push(x, y, z);
            
            if (x < b.minX) b.minX = x;
            if (x > b.maxX) b.maxX = x;
            if (y < b.minY) b.minY = y;
            if (y > b.maxY) b.maxY = y;
        });
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({ 
            size: 0.045,
            vertexColors: true,
            transparent: false
        }));
        scene.add(particleSystem);
        
        // Отправляем количество точек в интерфейс
        if (window.updatePointsDisplay) {
            window.updatePointsDisplay(lines.length);
        }
        
        console.log(`✅ Геометрия загружена: ${lines.length} точек`);
        console.log(`   BBox X: ${b.minX.toFixed(2)} … ${b.maxX.toFixed(2)}`);
        console.log(`   BBox Y: ${b.minY.toFixed(2)} … ${b.maxY.toFixed(2)}`);
    })
    .catch(err => {
        console.error('❌ Ошибка загрузки face_coords.txt:', err);
        if (window.showLoadingError) {
            window.showLoadingError();
        }
        const statusSpan = document.getElementById('status');
        if (statusSpan) statusSpan.innerText = "ОШИБКА: нет геометрии";
    });

// ----------------------------------------------------------------------------
// АНИМАЦИОННЫЙ ЦИКЛ
// ----------------------------------------------------------------------------
function animate(now) {
    requestAnimationFrame(animate);
    controls.update();
    
    if (typeof window !== 'undefined' && window.vibrationStrength !== undefined) {
        vibrationStrength = window.vibrationStrength;
    }
    
    frameCount++;
    if (now - lastFpsUpdate > 1000) {
        fpsDom.innerText = frameCount;
        frameCount = 0;
        lastFpsUpdate = now;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA && particleSystem) {
        const startTime = performance.now();
        
        vCtx.drawImage(video, 0, 0, 320, 180);
        const imageData = vCtx.getImageData(0, 0, 320, 180);
        const data = imageData.data;
        
        const positions = particleSystem.geometry.attributes.position.array;
        const colors = particleSystem.geometry.attributes.color.array;
        
        const diffX = b.maxX - b.minX;
        const diffY = b.maxY - b.minY;
        
        const pointCount = positions.length / 3;
        for (let i = 0; i < pointCount; i++) {
            const ox = originalCoords[i*3];
            const oy = originalCoords[i*3+1];
            
            const u = (ox - b.minX) / diffX;
            const vCoord = (oy - b.minY) / diffY;
            
            let vIdx = Math.floor((1 - vCoord) * 179);
            let uIdx = Math.floor(u * 319);
            vIdx = Math.min(179, Math.max(0, vIdx));
            uIdx = Math.min(319, Math.max(0, uIdx));
            
            const pIdx = (vIdx * 320 + uIdx) * 4;
            
            const r = data[pIdx];
            const g = data[pIdx+1];
            const bVal = data[pIdx+2];
            const brightness = (r + g + bVal) / 765;
            
            colors[i*3] = r / 255;
            colors[i*3+1] = g / 255;
            colors[i*3+2] = bVal / 255;
            
            positions[i*3+2] = originalCoords[i*3+2] + (brightness * vibrationStrength);
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
        particleSystem.geometry.attributes.color.needsUpdate = true;
        
        const duration = performance.now() - startTime;
        if (now - lastLatUpdate > 500) {
            latDom.innerText = duration.toFixed(2);
            lastLatUpdate = now;
        }
    }

    renderer.render(scene, camera);
}

animate(0);

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}