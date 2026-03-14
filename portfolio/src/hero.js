/* ============================================
   hero.js — Three.js Neural Network Nodes +
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
            mobileBg.style.background =
                'radial-gradient(ellipse at 50% 40%, rgba(26,74,58,0.06) 0%, transparent 60%)';
            mobileBg.style.position = 'absolute';
            mobileBg.style.inset = '0';
        }
        return;
    }

    // Desktop: show neural network animation
    initNeuralNetwork();
}

/* ------------------------------------------------
   Neural Network Dots & Lines (Three.js)
   ------------------------------------------------ */
function initNeuralNetwork() {
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

    /* ========== NODES ========== */
    const NODE_COUNT = 120;
    const CONNECTION_DIST = 4.2;
    const MAX_DRIFT = 2.0;
    const SPRING = 0.01;

    const nodeGeo = new THREE.SphereGeometry(0.10, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x1A4A3A });

    const nodes = [];
    const homePositions = [];
    const velocities = [];

    for (let i = 0; i < NODE_COUNT; i++) {
        const x = (Math.random() - 0.5) * aspect * 16;
        const y = (Math.random() - 0.5) * 16;
        const z = -(Math.random() * 3);

        const mesh = new THREE.Mesh(nodeGeo, nodeMat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        nodes.push(mesh);

        homePositions.push({ x, y, z });
        velocities.push({
            vx: (Math.random() - 0.5) * 0.008,
            vy: (Math.random() - 0.5) * 0.008,
        });
    }

    /* ========== LINE CONNECTIONS ========== */
    const maxLines = 600;
    const linePositions = new Float32Array(maxLines * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
        color: 0x1A4A3A,
        transparent: true,
        opacity: 0.22,
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    /* ========== MOUSE TRACKING ========== */
    const mouse = { x: 99999, y: 99999 };
    const smoothMouse = { x: 99999, y: 99999 };
    let mouseActive = false;

    window.addEventListener('mousemove', (e) => {
        mouseActive = true;
        // Convert pixel position to world coords at z=0
        const fovRad = THREE.MathUtils.degToRad(30); // half of 60°
        const worldHalfH = Math.tan(fovRad) * 12;
        const worldHalfW = worldHalfH * (window.innerWidth / window.innerHeight);
        const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
        const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
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

        // Smooth mouse
        if (mouseActive) {
            smoothMouse.x += (mouse.x - smoothMouse.x) * 0.05;
            smoothMouse.y += (mouse.y - smoothMouse.y) * 0.05;
        } else {
            smoothMouse.x += (99999 - smoothMouse.x) * 0.05;
            smoothMouse.y += (99999 - smoothMouse.y) * 0.05;
        }

        /* --- Update nodes --- */
        for (let i = 0; i < NODE_COUNT; i++) {
            const node = nodes[i];
            const home = homePositions[i];
            const vel = velocities[i];

            // Idle drift
            node.position.x += vel.vx;
            node.position.y += vel.vy;

            // Spring back to home
            const dx = node.position.x - home.x;
            const dy = node.position.y - home.y;
            const driftDist = Math.sqrt(dx * dx + dy * dy);
            if (driftDist > MAX_DRIFT) {
                node.position.x -= dx * SPRING;
                node.position.y -= dy * SPRING;
            }

            // Mouse repulsion
            if (mouseActive) {
                const mx = node.position.x - smoothMouse.x;
                const my = node.position.y - smoothMouse.y;
                const mDist = Math.sqrt(mx * mx + my * my);

                // ~120px converted to world units ≈ 2.5 at this camera setup
                if (mDist < 2.5 && mDist > 0.001) {
                    const force = 0.06 * (1 - mDist / 2.5);
                    node.position.x += (mx / mDist) * force;
                    node.position.y += (my / mDist) * force;
                }
            }
        }

        /* --- Update line connections --- */
        let lineIdx = 0;
        const lPos = lineGeo.attributes.position.array;

        for (let i = 0; i < NODE_COUNT; i++) {
            if (lineIdx >= maxLines) break;
            const a = nodes[i].position;

            for (let j = i + 1; j < NODE_COUNT; j++) {
                if (lineIdx >= maxLines) break;
                const b = nodes[j].position;

                const ddx = a.x - b.x;
                const ddy = a.y - b.y;
                const ddz = a.z - b.z;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);

                if (dist < CONNECTION_DIST) {
                    const idx6 = lineIdx * 6;
                    lPos[idx6] = a.x;
                    lPos[idx6 + 1] = a.y;
                    lPos[idx6 + 2] = a.z;
                    lPos[idx6 + 3] = b.x;
                    lPos[idx6 + 4] = b.y;
                    lPos[idx6 + 5] = b.z;
                    lineIdx++;
                }
            }
        }

        lineGeo.setDrawRange(0, lineIdx * 2);
        lineGeo.attributes.position.needsUpdate = true;

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
