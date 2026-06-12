/**
 * 3D Model Background Loader
 * Loads the FAMT (Finolex Academy) .glb model as a fixed interactive background
 * Camera positioned to match Blender front view
 * Fixed in center — no scroll movement
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

(function () {
  const container = document.getElementById('model-3d-bg');
  const loadingEl = document.getElementById('model-loading');

  if (!container) return;

  // ===== SCENE SETUP =====
  const scene = new THREE.Scene();

  // Add a subtle fog for depth and to blend model edges with dark background
  scene.fog = new THREE.FogExp2(0x080b11, 0.006);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );

  const isMobile = window.innerWidth <= 768;

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !isMobile,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !isMobile;
  if (!isMobile) {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  container.appendChild(renderer.domElement);

  // ===== LIGHTING (matching Blender sun setup) =====

  // Ambient — soft overall illumination
  const ambientLight = new THREE.AmbientLight(0x446688, 0.5);
  scene.add(ambientLight);

  // ☀️ SUNLIGHT — strong directional to match Blender's sun
  const sunLight = new THREE.DirectionalLight(0xffeedd, 2.5);
  sunLight.position.set(80, 100, 80);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.camera.left = -100;
  sunLight.shadow.camera.right = 100;
  sunLight.shadow.camera.top = 100;
  sunLight.shadow.camera.bottom = -100;
  scene.add(sunLight);

  // Fill light — softer from the left side (cyan tint for cyberpunk feel)
  const fillLight = new THREE.DirectionalLight(0x88bbdd, 0.6);
  fillLight.position.set(-60, 40, 60);
  scene.add(fillLight);

  // Rim/back light — subtle edge highlighting
  const rimLight = new THREE.DirectionalLight(0x00d9ff, 0.3);
  rimLight.position.set(0, 30, -60);
  scene.add(rimLight);

  // Hemisphere — sky/ground color gradient for natural feel
  const hemiLight = new THREE.HemisphereLight(0x88aacc, 0x222233, 0.6);
  scene.add(hemiLight);

  // ===== MOUSE TRACKING =====
  let mouseX = 0;
  let mouseY = 0;
  let smoothMouseX = 0;
  let smoothMouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
    }
  }, { passive: true });

  // ===== LOAD MODEL =====
  let modelGroup = null;
  let baseRotation = new THREE.Euler();
  let basePosition = new THREE.Vector3();
  const loader = new GLTFLoader();

  loader.load(
    'assets/models/famt.glb',
    (gltf) => {
      const model = gltf.scene;
      modelGroup = new THREE.Group();

      // Get bounding box
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center model at origin
      model.position.sub(center);

      // Scale to fill viewport
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 120 / maxDim;
      model.scale.setScalar(scale);

      // ===== HIDE INTERNAL OBJECTS BY NAME =====
      // These are interior parts (staircase, lift, internal cubes) visible through gaps
      const hiddenParts = [
        'staircase', 'Staircase',
        'Cube.140', 'Cube.142', 'Cube.144',
        'Cube140', 'Cube142', 'Cube144',
        'Empty', 'Empty.001',
      ];

      // Log all object names so you can identify any others to hide
      console.log('=== ALL MODEL OBJECTS ===');
      model.traverse((child) => {
        if (child.name) {
          console.log(`  [${child.type}] "${child.name}"`);
        }
      });
      console.log('========================');

      model.traverse((child) => {
        // Hide objects by name (case-insensitive partial match)
        if (child.name) {
          const nameLC = child.name.toLowerCase();
          for (const hideName of hiddenParts) {
            if (nameLC === hideName.toLowerCase() || nameLC.includes(hideName.toLowerCase())) {
              child.visible = false;
              console.log(`Hidden: "${child.name}"`);
              return;
            }
          }
        }

        if (child.isMesh && child.material) {
          const mat = child.material;

          // --- Hide pink/magenta ground plane (missing material in Blender = magenta) ---
          if (mat.color) {
            const r = mat.color.r;
            const g = mat.color.g;
            const b = mat.color.b;

            if (r > 0.7 && g < 0.3 && b > 0.5) {
              child.visible = false;
              console.log(`Hidden (magenta): "${child.name}"`);
              return;
            }

            // Add subtle emissive for visibility on dark background
            mat.emissive = new THREE.Color(r * 0.04, g * 0.04, b * 0.04);
          }

          // --- BACKFACE CULLING: hide invisible/back portions ---
          mat.side = THREE.FrontSide;

          // Ensure solid
          mat.transparent = false;
          mat.opacity = 1;
          mat.depthWrite = true;
          mat.depthTest = true;

          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      modelGroup.add(model);
      scene.add(modelGroup);

      // Position model in center of viewport
      basePosition.set(0, 18, 0);
      modelGroup.position.copy(basePosition);

      // ===== CAMERA — perfectly front-facing along the X-axis =====
      // Positioned straight in front (Z = 0) and slightly elevated (Y = 10)
      // On mobile, bring camera closer so model is visible
      const camDist = isMobile ? 110 : 150;
      camera.position.set(camDist, 10, 0);
      camera.lookAt(0, 0, 0);

      // Store base rotation
      baseRotation.copy(modelGroup.rotation);

      // Hide loading indicator
      if (loadingEl) {
        loadingEl.style.opacity = '0';
        setTimeout(() => { loadingEl.style.display = 'none'; }, 600);
      }

      console.log('FAMT model loaded. Size:', size, 'Scale:', scale);
    },
    (xhr) => {
      if (loadingEl && xhr.total) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        const textEl = loadingEl.querySelector('.model-loading-text');
        if (textEl) textEl.textContent = `LOADING 3D MODEL... ${percent}%`;
      }
    },
    (error) => {
      console.warn('3D Model could not be loaded:', error);
      if (loadingEl) {
        const textEl = loadingEl.querySelector('.model-loading-text');
        if (textEl) textEl.textContent = 'MODEL UNAVAILABLE';
        setTimeout(() => {
          loadingEl.style.opacity = '0';
          setTimeout(() => { loadingEl.style.display = 'none'; }, 600);
        }, 2000);
      }
    }
  );

  // ===== RESIZE =====
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ===== ANIMATE =====
  function animate() {
    requestAnimationFrame(animate);

    smoothMouseX += (mouseX - smoothMouseX) * 0.03;
    smoothMouseY += (mouseY - smoothMouseY) * 0.03;

    if (modelGroup) {
      // With camera looking along the X-axis:
      // - Mouse X (left/right) rotates around Y (vertical axis)
      // - Mouse Y (up/down) rotates around Z (horizontal axis relative to camera) to avoid rolling
      modelGroup.rotation.y = baseRotation.y + smoothMouseX * 0.05;
      modelGroup.rotation.z = baseRotation.z - smoothMouseY * 0.03;

      // Subtle positional drift
      modelGroup.position.x = basePosition.x + smoothMouseX * 2;
      modelGroup.position.y = basePosition.y + (-smoothMouseY * 1.5);
    }

    renderer.render(scene, camera);
  }

  animate();
})();
