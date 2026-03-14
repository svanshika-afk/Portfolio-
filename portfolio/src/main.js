/* ============================================
   main.js — Entry Point
   Lenis smooth scroll, scroll progress,
   navbar behavior, module imports
   ============================================ */

import './style.css';
import Lenis from '@studio-freight/lenis';
import { initCursor } from './cursor.js';
import { initHero } from './hero.js';
import { initAnimations } from './animations.js';
import { initTilt } from './tilt.js';
import { initContact } from './contact.js';

/* --- Detect touch device --- */
const isTouchDevice = () => {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

/* --- Lenis Smooth Scroll --- */
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

/* --- Scroll Progress Bar --- */
const scrollProgress = document.getElementById('scroll-progress');

function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });

/* --- Navbar Behavior --- */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
const heroSection = document.getElementById('hero');
let lastScrollY = 0;
let navHidden = false;

function updateNavbar() {
    const scrollY = window.scrollY;
    const heroBottom = heroSection.offsetHeight;

    // Transparent → cream on scroll
    if (scrollY > 80) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Hide on scroll down, show on scroll up
    if (scrollY > lastScrollY && scrollY > 100) {
        if (!navHidden) {
            navbar.classList.add('hidden');
            navHidden = true;
        }
    } else {
        if (navHidden) {
            navbar.classList.remove('hidden');
            navHidden = false;
        }
    }

    lastScrollY = scrollY;
}

window.addEventListener('scroll', updateNavbar, { passive: true });

// Hamburger toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
});

// Close mobile menu on link click
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
    });
});

/* --- Active Nav Link on Scroll --- */
const sections = document.querySelectorAll('.section');
const navLinkEls = document.querySelectorAll('.nav-link');

function updateActiveLink() {
    const scrollY = window.scrollY + window.innerHeight / 3;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollY >= top && scrollY < top + height) {
            navLinkEls.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-section') === id) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });

/* --- Smooth scroll to anchor --- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            lenis.scrollTo(target, { offset: -72 });
        }
    });
});

/* --- Initialize Modules --- */
document.addEventListener('DOMContentLoaded', () => {
    if (!isTouchDevice()) {
        initCursor();
    } else {
        // Hide custom cursor elements on touch
        document.getElementById('cursor-dot').style.display = 'none';
        document.getElementById('cursor-ring').style.display = 'none';
    }

    initHero(isTouchDevice());
    initAnimations();
    initTilt();
    initContact();
});
