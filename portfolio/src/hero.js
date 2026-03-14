/* ============================================
   hero.js — Three.js Particle Constellation +
   Hero Entry Animations
   ============================================ */

import * as THREE from 'three';
import gsap from 'gsap';

export function initHero(isTouch) {
    initHeroAnimations();

    const isMobile = window.innerWidth < 768;

    // Mobile: disable Three.js, show CSS gradient fallback
    if (isMobile) {
        const canvas = document.getElementById('hero-canvas');
        if (canvas) canvas.style.display = 'none';
        const mobileBg = document.getElementById('hero-mobile-bg');
        if (mobileBg) {
            mobileBg.style.display = 'block';
            // Use CSS radial gradient fallback
            mobileBg.style.background =
                'radial-gradient(ellipse at 50% 40%, rgba(26,74,58,0.06) 0%, transparent 60%)';
            mobileBg.style.position = 'absolute';
            mobileBg.style.inset = '0';
        }
        initMobileParticles();
        return;
    }

    // Desktop: always show particle constellation
    initParticleConstellation();
}

/* ------------------------------------------------
   Mobile: Reduced Particle Field (no lines, no mouse)
   ------------------------------------------------ */
function initMobileParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    // Try lightweight canvas — bail to static gradient if laggy
    const scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    camera.position.z = 12;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(1);
        renderer.setClearColor(0x000000, 0);
    } catch (_) {
        return; // WebGL not available — CSS gradient already showing
    }

    canvas.style.display = 'block';
    canvas.style.opacity = '0'; // GSAP will fade this in

    const MOBILE_COUNT = 60;
    const positions = new Float32Array(MOBILE_COUNT * 3);
    const velocities = [];

    for (let i = 0; i < MOBILE_COUNT; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * aspect * 20;
        positions[i3 + 1] = (Math.random() - 0.5) * 20;
        positions[i3 + 2] = -(Math.random() * 5);
        velocities.push({
            vx: (Math.random() - 0.5) * 0.006,
            vy: (Math.random() - 0.5) * 0.006,
        });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
        size: 3,
        color: 0x1A4A3A,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.8,
    });

    scene.add(new THREE.Points(geo, mat));

    // Perf check
    let frameCount = 0;
    let startTime = performance.now();
    let dead = false;

    function animate() {
        if (dead) return;
        requestAnimationFrame(animate);

        // Perf gate: if first 60 frames take > 2s, bail
        frameCount++;
        if (frameCount === 60) {
            const elapsed = performance.now() - startTime;
            if (elapsed > 2000) {
                dead = true;
                canvas.style.display = 'none';
                return;
            }
        }

        const pos = geo.attributes.position.array;
        for (let i = 0; i < MOBILE_COUNT; i++) {
            const i3 = i * 3;
            pos[i3] += velocities[i].vx;
            pos[i3 + 1] += velocities[i].vy;
        }
        geo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

/* ------------------------------------------------
   Particle Constellation (Three.js)
   ------------------------------------------------ */
function initParticleConstellation() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    /* --- Scene, Camera, Renderer --- */
    const scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* --- Fog for depth fade --- */
    scene.fog = new THREE.FogExp2(0xF7F3ED, 0.022);

    /* ========== PRIMARY PARTICLES ========== */
    const PARTICLE_COUNT = 180;
    const CONNECTION_DIST = 2.8;
    const MAX_DRIFT = 1.5;
    const SPRING = 0.012;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const homePositions = [];
    const velocities = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const x = (Math.random() - 0.5) * aspect * 20;
        const y = (Math.random() - 0.5) * 20;
        const z = -(Math.random() * 5);

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;

        homePositions.push({ x, y, z });
        velocities.push({
            vx: (Math.random() - 0.5) * 0.006,
            vy: (Math.random() - 0.5) * 0.006,
        });
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
        size: 3,
        color: 0x1A4A3A,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.9,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    /* ========== LINE CONNECTIONS ========== */
    // Worst case line count: PARTICLE_COUNT*(PARTICLE_COUNT-1)/2
    // Pre-allocate with enough room
    const maxLines = 1200; // practical upper bound
    const linePositions = new Float32Array(maxLines * 6); // 2 verts * 3 coords
    const lineColors = new Float32Array(maxLines * 6); // r,g,b per vertex

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    lineGeo.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.25,
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Line base color (normalized): #1A4A3A → (0.102, 0.290, 0.227)
    const lineR = 0.102;
    const lineG = 0.290;
    const lineB = 0.227;

    /* ========== BACKGROUND DEPTH PARTICLES ========== */
    const BG_COUNT = 60;
    const bgPositions = new Float32Array(BG_COUNT * 3);
    const bgVelocities = [];

    for (let i = 0; i < BG_COUNT; i++) {
        const i3 = i * 3;
        bgPositions[i3] = (Math.random() - 0.5) * aspect * 20;
        bgPositions[i3 + 1] = (Math.random() - 0.5) * 20;
        bgPositions[i3 + 2] = -3;
        bgVelocities.push({
            vx: (Math.random() - 0.5) * 0.003,
            vy: (Math.random() - 0.5) * 0.003,
        });
    }

    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));

    const bgMat = new THREE.PointsMaterial({
        size: 5,
        color: 0x7A9E8E,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.5,
    });

    scene.add(new THREE.Points(bgGeo, bgMat));

    /* ========== MOUSE TRACKING ========== */
    const mouse = { x: 99999, y: 99999 }; // off-screen initially
    const smoothMouse = { x: 99999, y: 99999 };
    let mouseActive = false;

    window.addEventListener('mousemove', (e) => {
        mouseActive = true;
        // Convert to scene-space (approximate in perspective)
        const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
        const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
        // Map to world coords at z=0 for the camera at z=12
        const fovRadians = THREE.MathUtils.degToRad(30); // half-fov
        const worldHalfH = Math.tan(fovRadians) * 12;
        const worldHalfW = worldHalfH * (window.innerWidth / window.innerHeight);
        mouse.x = ndcX * worldHalfW;
        mouse.y = ndcY * worldHalfH;
    });

    window.addEventListener('mouseleave', () => {
        mouseActive = false;
        mouse.x = 99999;
        mouse.y = 99999;
    });

    /* ========== ANIMATION LOOP ========== */
    function animate() {
        requestAnimationFrame(animate);

        const pos = particleGeo.attributes.position.array;

        // Smooth mouse
        if (mouseActive) {
            smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
            smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;
        } else {
            smoothMouse.x += (99999 - smoothMouse.x) * 0.08;
            smoothMouse.y += (99999 - smoothMouse.y) * 0.08;
        }

        /* --- Update primary particles --- */
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const home = homePositions[i];
            const vel = velocities[i];

            // Current pos
            let px = pos[i3];
            let py = pos[i3 + 1];

            // Idle drift
            px += vel.vx;
            py += vel.vy;

            // Spring back to home
            const dx = px - home.x;
            const dy = py - home.y;
            const driftDist = Math.sqrt(dx * dx + dy * dy);
            if (driftDist > MAX_DRIFT) {
                px -= dx * SPRING;
                py -= dy * SPRING;
            }

            // Mouse interaction
            if (mouseActive) {
                const mx = smoothMouse.x - px;
                const my = smoothMouse.y - py;
                const mDist = Math.sqrt(mx * mx + my * my);

                if (mDist < 3.5 && mDist > 0.001) {
                    if (mDist < 1.2) {
                        // Repulsion
                        const force = 0.09 * (1 - mDist / 1.2);
                        px -= (mx / mDist) * force;
                        py -= (my / mDist) * force;
                    } else {
                        // Attraction
                        const force = 0.06 * (1 - mDist / 3.5);
                        px += (mx / mDist) * force;
                        py += (my / mDist) * force;
                    }
                }
            }

            pos[i3] = px;
            pos[i3 + 1] = py;
        }

        particleGeo.attributes.position.needsUpdate = true;

        /* --- Update line connections --- */
        let lineIdx = 0;
        const lPos = lineGeo.attributes.position.array;
        const lCol = lineGeo.attributes.color.array;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            if (lineIdx >= maxLines) break;
            const i3 = i * 3;
            const ax = pos[i3];
            const ay = pos[i3 + 1];
            const az = pos[i3 + 2];

            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                if (lineIdx >= maxLines) break;
                const j3 = j * 3;
                const bx = pos[j3];
                const by = pos[j3 + 1];
                const bz = pos[j3 + 2];

                const ddx = ax - bx;
                const ddy = ay - by;
                const ddz = az - bz;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);

                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST);
                    const idx6 = lineIdx * 6;

                    // Vertex A
                    lPos[idx6] = ax;
                    lPos[idx6 + 1] = ay;
                    lPos[idx6 + 2] = az;
                    // Vertex B
                    lPos[idx6 + 3] = bx;
                    lPos[idx6 + 4] = by;
                    lPos[idx6 + 5] = bz;

                    // Color with alpha baked into brightness
                    lCol[idx6] = lineR * alpha;
                    lCol[idx6 + 1] = lineG * alpha;
                    lCol[idx6 + 2] = lineB * alpha;
                    lCol[idx6 + 3] = lineR * alpha;
                    lCol[idx6 + 4] = lineG * alpha;
                    lCol[idx6 + 5] = lineB * alpha;

                    lineIdx++;
                }
            }
        }

        lineGeo.setDrawRange(0, lineIdx * 2);
        lineGeo.attributes.position.needsUpdate = true;
        lineGeo.attributes.color.needsUpdate = true;

        /* --- Update background particles (just drift) --- */
        const bgPos = bgGeo.attributes.position.array;
        for (let i = 0; i < BG_COUNT; i++) {
            const i3 = i * 3;
            bgPos[i3] += bgVelocities[i].vx;
            bgPos[i3 + 1] += bgVelocities[i].vy;
        }
        bgGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    /* --- Resize handler --- */
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

/* ------ Hero Entry Animations (GSAP) ------ */
function initHeroAnimations() {
    const tl = gsap.timeline({ delay: 0.2 });

    // Split hero name into characters
    const firstLine = document.getElementById('hero-first');
    const lastLine = document.getElementById('hero-last');

    function splitChars(el) {
        const text = el.textContent;
        el.textContent = '';
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.classList.add('char');
            span.textContent = char;
            el.appendChild(span);
        });
        return el.querySelectorAll('.char');
    }

    const firstChars = splitChars(firstLine);
    const lastChars = splitChars(lastLine);

    // a. Page bg
    tl.set(document.body, { opacity: 1 });

    // b. "Vanshika" chars
    tl.to(firstChars, {
        y: 0,
        opacity: 1,
        stagger: 0.04,
        duration: 0.6,
        ease: 'power3.out',
    }, 0.1);

    // c. "Srinivas" chars
    tl.to(lastChars, {
        y: 0,
        opacity: 1,
        stagger: 0.04,
        duration: 0.6,
        ease: 'power3.out',
    }, 0.35);

    // d. Subtitle typewriter
    const subtitleEl = document.getElementById('hero-subtitle');
    const subtitleText = 'AI Engineer · MSc AI/ML · Christ University';
    subtitleEl.textContent = '';

    tl.call(() => {
        let i = 0;
        subtitleEl.textContent = '';
        const cursorSpan = document.createElement('span');
        cursorSpan.classList.add('typewriter-cursor');
        subtitleEl.appendChild(cursorSpan);

        const typeInterval = setInterval(() => {
            if (i < subtitleText.length) {
                subtitleEl.insertBefore(
                    document.createTextNode(subtitleText[i]),
                    cursorSpan
                );
                i++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    cursorSpan.remove();
                }, 2000);
            }
        }, 35);
    }, [], '+=0.1');

    // e. Tagline fade up
    tl.to('#hero-tagline', {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
    }, '+=0.6');

    // f. CTAs fade in
    tl.to('#hero-ctas', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
    }, '-=0.3');

    // g. Canvas fade in
    tl.to('#hero-canvas', {
        opacity: 1,
        duration: 1,
        ease: 'power1.inOut',
    }, '-=0.8');
}
