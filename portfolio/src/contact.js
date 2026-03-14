/* ============================================
   contact.js — Magnetic buttons + copy email
   ============================================ */

export function initContact() {
    initCopyEmail();
    initMagneticButtons();
}

/* --- Copy Email to Clipboard --- */
function initCopyEmail() {
    const emailEl = document.getElementById('contact-email');
    const toast = document.getElementById('toast');

    if (!emailEl || !toast) return;

    emailEl.addEventListener('click', async () => {
        const email = emailEl.textContent.trim();

        try {
            await navigator.clipboard.writeText(email);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = email;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        // Show toast
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 2000);
    });
}

/* --- Magnetic Buttons --- */
function initMagneticButtons() {
    // Only on non-touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    const magneticBtns = document.querySelectorAll('[data-magnetic]');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = (e.clientX - centerX) * 0.25;
            const deltaY = (e.clientY - centerY) * 0.25;

            // Clamp offset
            const maxOffset = 10;
            const clampedX = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
            const clampedY = Math.max(-maxOffset, Math.min(maxOffset, deltaY));

            btn.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
            btn.style.transition = 'transform 0.2s ease';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
            btn.style.transition = 'transform 0.3s ease';
        });
    });
}
