/* ============================================
   animations.js — GSAP ScrollTrigger
   Section headings, cards, skill pills,
   project cards, about section
   ============================================ */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
    // Wait for fonts and layout to settle
    setTimeout(() => {
        animateHeadings();
        animateCards();
        animateSkillRows();
        animateProjectCards();
        animateAboutSection();
    }, 100);
}

/* --- Section Headings: Word-by-word reveal --- */
function animateHeadings() {
    const headings = document.querySelectorAll('[data-animate="heading"]');

    headings.forEach(heading => {
        // Split text into words
        const text = heading.textContent.trim();
        heading.innerHTML = '';

        text.split(' ').forEach((word, i) => {
            const wordWrapper = document.createElement('span');
            wordWrapper.classList.add('word');

            const wordInner = document.createElement('span');
            wordInner.classList.add('word-inner');
            wordInner.textContent = word;

            wordWrapper.appendChild(wordInner);
            heading.appendChild(wordWrapper);

            // Add space between words
            if (i < text.split(' ').length - 1) {
                heading.appendChild(document.createTextNode(' '));
            }
        });

        const wordInners = heading.querySelectorAll('.word-inner');

        gsap.to(wordInners, {
            y: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: heading,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
        });
    });
}

/* --- Generic Cards: fade up + stagger --- */
function animateCards() {
    const cards = document.querySelectorAll('[data-animate="card"]');

    cards.forEach(card => {
        gsap.from(card, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                toggleActions: 'play none none none',
            },
        });
    });
}

/* --- Skill Rows: staggered fade up --- */
function animateSkillRows() {
    const rows = document.querySelectorAll('[data-animate="skill-row"]');
    if (!rows.length) return;

    gsap.from(rows, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '#skills-rows',
            start: 'top 85%',
            toggleActions: 'play none none none',
        },
    });
}

/* --- Project Cards: card 1 from left, card 2 from right --- */
function animateProjectCards() {
    const leftCards = document.querySelectorAll('[data-animate="card-left"]');
    const rightCards = document.querySelectorAll('[data-animate="card-right"]');

    leftCards.forEach(card => {
        gsap.from(card, {
            x: -60,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
        });
    });

    rightCards.forEach(card => {
        gsap.from(card, {
            x: 60,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
        });
    });
}

/* --- About section elements --- */
function animateAboutSection() {
    gsap.from('.about-quote', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '.about-quote',
            start: 'top 85%',
            toggleActions: 'play none none none',
        },
    });

    gsap.from('.about-bio', {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '.about-bio',
            start: 'top 88%',
            toggleActions: 'play none none none',
        },
    });

    gsap.from('.about-currently', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.about-currently',
            start: 'top 88%',
            toggleActions: 'play none none none',
        },
    });
}
