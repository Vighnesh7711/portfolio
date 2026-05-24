/**
 * Enhanced Cyberpunk Portfolio Animations
 * - Interactive Matrix particles background
 * - Scroll reveal animations
 * - Navbar active tracking & blur effects
 * - Dynamic cursor hover scale & glow positioning
 */

document.addEventListener('DOMContentLoaded', function () {

  // ===== MATRIX PARTICLES =====
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class TechParticle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.35 + 0.05;
        this.opacitySpeed = 0.001 + Math.random() * 0.002;
        this.colorChance = Math.random();
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        this.opacity += this.opacitySpeed;
        if (this.opacity > 0.4 || this.opacity < 0.05) {
          this.opacitySpeed = -this.opacitySpeed;
        }

        // Loop boundaries
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        if (this.colorChance > 0.75) {
          // Yellow accent
          ctx.fillStyle = `rgba(250, 204, 21, ${this.opacity})`;
        } else {
          // Cyan accent
          ctx.fillStyle = `rgba(0, 217, 255, ${this.opacity})`;
        }
        ctx.fill();
      }
    }

    const maxParticles = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 18000), 70);
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new TechParticle());
    }

    function renderConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 140) {
            const alpha = (1 - (distance / 140)) * 0.06;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      renderConnections();
      animationId = requestAnimationFrame(loop);
    }

    loop();
  }

  // ===== SCROLL REVEALS =====
  const reveals = document.querySelectorAll('.reveal');

  function triggerReveal() {
    const triggerBottom = (window.innerHeight / 10) * 8.5;
    reveals.forEach(el => {
      const elTop = el.getBoundingClientRect().top;
      if (elTop < triggerBottom) {
        el.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', triggerReveal, { passive: true });
  triggerReveal(); // Initial trigger

  // ===== NAVBAR CONTROL =====
  const navbar = document.getElementById('mainNav');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // ===== CURSOR GLOW =====
  const cursorGlow = document.getElementById('cursorGlow');
  if (cursorGlow && window.innerWidth > 768) {
    let currentX = 0, currentY = 0;
    let targetX = 0, targetY = 0;

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    function updateCursor() {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      cursorGlow.style.left = currentX + 'px';
      cursorGlow.style.top = currentY + 'px';
      requestAnimationFrame(updateCursor);
    }
    updateCursor();
  }

  // ===== ACTIVE NAV TRACKING =====
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  function updateActiveLink() {
    const scrollPosition = window.scrollY + 150;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPosition >= top && scrollPosition < top + height) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === '#' + id) {
            link.parentElement.classList.add('active');
          } else {
            link.parentElement.classList.remove('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink(); // Run on load

  // ===== AUTO-CLOSE COLLAPSE ON MOBILE NAV CLICK =====
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const navCollapse = document.getElementById('navcol-1');
      if (navCollapse && navCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) {
          bsCollapse.hide();
        }
      }
    });
  });

  // ===== THREE.JS 3D HUD ROTATOR BACKGROUND =====
  const threeContainer = document.getElementById('three-hero-canvas');
  if (threeContainer && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(60, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
    camera.position.z = 24;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeContainer.appendChild(renderer.domElement);

    // Torus Knot Particle Constellation Geometry
    const geometry = new THREE.TorusKnotGeometry(8, 2.5, 120, 12);
    
    // Shader-like points material
    const material = new THREE.PointsMaterial({
      color: 0x00d9ff,
      size: 0.12,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const torusKnot = new THREE.Points(geometry, material);
    scene.add(torusKnot);

    // Add secondary subtle yellow ring to match the accent palette
    const ringGeo = new THREE.RingGeometry(11, 11.2, 32);
    const ringMat = new THREE.LineBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.LineLoop(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Mouse interactive drift (Parallax)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    document.addEventListener('mousemove', (event) => {
      targetX = (event.clientX - window.innerWidth / 2) * 0.005;
      targetY = (event.clientY - window.innerHeight / 2) * 0.005;
    });

    // Resize handler
    window.addEventListener('resize', () => {
      const width = threeContainer.clientWidth;
      const height = threeContainer.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    });

    // Animation Loop
    function animate() {
      requestAnimationFrame(animate);

      // Rotate models
      torusKnot.rotation.x += 0.002;
      torusKnot.rotation.y += 0.004;

      ring.rotation.z -= 0.001;

      // Smooth mouse drift
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      torusKnot.position.x = mouseX * 2;
      torusKnot.position.y = -mouseY * 2;
      ring.position.x = mouseX * 1;
      ring.position.y = -mouseY * 1;

      renderer.render(scene, camera);
    }

    animate();
  }

});
