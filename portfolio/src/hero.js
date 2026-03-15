/* ============================================
   hero.js — Three.js Neural Network Nodes +
   Hero Entry Animations
   ============================================ */

import * as THREE from 'three';
import gsap from 'gsap';

/* ------------------------------------------------
   Breakpoint config helper
   ------------------------------------------------ */
function getBreakpointConfig() {
    const w = window.innerWidth;
    if (w < 768)  return { nodeCount: 50,  nodeSize: 0.12, connectionDist: 3.0, mouseEnabled: false, pixelRatio: 1 };
    if (w <= 1024) return { nodeCount: 80,  nodeSize: 0.10, connectionDist: 3.8, mouseEnabled: true,  pixelRatio: Math.min(window.devicePixelRatio, 2) };
    return                 { nodeCount: 120, nodeSize: 0.10, connectionDist: 4.2, mouseEnabled: true,  pixelRatio: Math.min(window.devicePixelRatio, 2) };
}

export function initHero(isTouch) {
    initHeroAnimations();
    initNeuralNetwork();
}

/* ------------------------------------------------
   Neural Network Dots & Lines (Three.js)
   ------------------------------------------------ */
function initNeuralNetwork() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    // Hide the mobile SVG fallback — Three.js runs on all sizes now
    const mobileBg = document.getElementById('hero-mobile-bg');
    if (mobileBg) mobileBg.style.display = 'none';

    /* --- Scene, Camera, Renderer --- */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* ========== SHARED STATE ========== */
    let config = getBreakpointConfig();
    const MAX_DRIFT = 2.0;
    const SPRING = 0.01;
    const maxLines = 600;

    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x1A4A3A });
    let nodeGeo = new THREE.SphereGeometry(config.nodeSize, 12, 12);

    let nodes = [];
    let homePositions = [];
    let velocities = [];
    let activeNodeCount = 0;
    let connectionDist = config.connectionDist;

    /* --- Line geometry (reused across rebuilds) --- */
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

    /* ========== BUILD / REBUILD NODES ========== */
    function buildNodes() {
        // Remove old nodes from scene
        for (const m of nodes) scene.remove(m);

        config = getBreakpointConfig();
        connectionDist = config.connectionDist;

        // Rebuild geometry for the current node size
        nodeGeo.dispose();
        nodeGeo = new THREE.SphereGeometry(config.nodeSize, 12, 12);

        nodes = [];
        homePositions = [];
        velocities = [];
        activeNodeCount = config.nodeCount;

        const aspect = window.innerWidth / window.innerHeight;
        const spreadX = aspect * 8;
        const spreadY = 8;

        for (let i = 0; i < activeNodeCount; i++) {
            const x = (Math.random() - 0.5) * 2 * spreadX;
            const y = (Math.random() - 0.5) * 2 * spreadY;
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

        // Update renderer pixel ratio per breakpoint
        renderer.setPixelRatio(config.pixelRatio);
    }

    // Initial build
    buildNodes();

    /* ========== MOUSE TRACKING ========== */
    const mouse = { x: 99999, y: 99999 };
    const smoothMouse = { x: 99999, y: 99999 };
    let mouseActive = false;

    window.addEventListener('mousemove', (e) => {
        if (!config.mouseEnabled) return;
        mouseActive = true;
        const fovRad = THREE.MathUtils.degToRad(75 / 2);
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

        const useMouseInteraction = config.mouseEnabled && mouseActive;

        // Smooth mouse
        if (useMouseInteraction) {
            smoothMouse.x += (mouse.x - smoothMouse.x) * 0.05;
            smoothMouse.y += (mouse.y - smoothMouse.y) * 0.05;
        } else {
            smoothMouse.x += (99999 - smoothMouse.x) * 0.05;
            smoothMouse.y += (99999 - smoothMouse.y) * 0.05;
        }

        /* --- Update nodes --- */
        for (let i = 0; i < activeNodeCount; i++) {
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
            if (useMouseInteraction) {
                const mx = node.position.x - smoothMouse.x;
                const my = node.position.y - smoothMouse.y;
                const mDist = Math.sqrt(mx * mx + my * my);

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

        for (let i = 0; i < activeNodeCount; i++) {
            if (lineIdx >= maxLines) break;
            const a = nodes[i].position;

            for (let j = i + 1; j < activeNodeCount; j++) {
                if (lineIdx >= maxLines) break;
                const b = nodes[j].position;

                const ddx = a.x - b.x;
                const ddy = a.y - b.y;
                const ddz = a.z - b.z;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);

                if (dist < connectionDist) {
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

        // Zero out remaining line vertices to avoid stale lines
        for (let i = lineIdx * 6; i < maxLines * 6; i++) lPos[i] = 0;

        lineGeo.setDrawRange(0, lineIdx * 2);
        lineGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    /* --- Debounced resize handler (100ms) --- */
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Update camera & renderer
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            // Rebuild nodes for the new breakpoint & aspect ratio
            buildNodes();
        }, 100);
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
