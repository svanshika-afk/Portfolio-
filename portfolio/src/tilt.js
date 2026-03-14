/* ============================================
   tilt.js — VanillaTilt initialization
   Applies to project cards
   ============================================ */

import VanillaTilt from 'vanilla-tilt';

export function initTilt() {
    // Only apply on non-touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    const tiltElements = document.querySelectorAll('[data-tilt]');

    tiltElements.forEach(el => {
        VanillaTilt.init(el, {
            max: 6,
            speed: 400,
            perspective: 1200,
            scale: 1.01,
            glare: false,
            'mouse-event-element': null,
            gyroscope: false,
        });
    });
}
