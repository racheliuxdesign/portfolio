/* ============================================
   Racheli Klots — Portfolio
   JavaScript — Core interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Navigation scroll effect ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ---------- Mobile menu toggle ---------- */
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('nav__links--open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
    // Close on link click
    links.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('nav__links--open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll reveal (fade-in) ---------- */
  const faders = document.querySelectorAll('.fade-in');
  if (faders.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Clear stagger delay after entrance animation so it won't affect hover
          entry.target.addEventListener('transitionend', function clearDelay() {
            entry.target.style.transitionDelay = '0s';
            entry.target.removeEventListener('transitionend', clearDelay);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    faders.forEach(el => observer.observe(el));
  }

  /* ---------- Active nav link ---------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });

  /* ---------- Sticky case-study header ---------- */
  const caseHeader = document.querySelector('.case-study__header');
  const caseTitle  = document.querySelector('.case-study__title');
  const caseBack   = document.querySelector('.case-study__back');

  if (caseHeader && caseTitle && caseBack) {
    // Build the sticky bar
    const stickyBar = document.createElement('div');
    stickyBar.className = 'sticky-title-bar';
    stickyBar.innerHTML = `
      <div class="container sticky-title-bar__inner">
        <a href="${caseBack.getAttribute('href')}" class="sticky-title-bar__back">← Back to Projects</a>
        <span class="sticky-title-bar__title">${caseTitle.textContent}</span>
      </div>
    `;
    document.body.appendChild(stickyBar);

    const observer = new IntersectionObserver(([entry]) => {
      stickyBar.classList.toggle('sticky-title-bar--visible', !entry.isIntersecting);
    }, { threshold: 0, rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--nav-height').trim() || '64px'} 0px 0px 0px` });

    observer.observe(caseHeader);
  }

  /* ---------- Parallax on project card images ---------- */
  const parallaxTargets = document.querySelectorAll('.project-card__image');
  if (parallaxTargets.length) {
    let ticking = false;

    const updateParallax = () => {
      const viewportHeight = window.innerHeight;

      parallaxTargets.forEach(card => {
        const rect = card.getBoundingClientRect();
        // Only process cards that are in or near the viewport
        if (rect.bottom < -100 || rect.top > viewportHeight + 100) return;

        // Progress: 0 when card enters bottom, 1 when it exits top
        const progress = 1 - (rect.bottom / (viewportHeight + rect.height));
        // Shift range: -10px to +10px (subtle)
        const shift = (progress - 0.5) * 20;

        const inner = card.querySelector('.project-card__placeholder, img');
        if (inner) {
          inner.style.transform = `translateY(${shift}px)`;
        }
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });

    // Run once on load
    updateParallax();
  }

  /* ---------- Lightbox ---------- */
  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  if (lightbox && lightboxImg) {
    let isZoomed = false;

    // --- Open lightbox ---
    document.querySelectorAll('.case-study__img-thumb').forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxImg.style.transformOrigin = '50% 50%';
        isZoomed = false;
        lightbox.classList.remove('is-zoomed');
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });
    });

    // --- Toggle zoom on image click ---
    lightboxImg.addEventListener('click', e => {
      e.stopPropagation();

      if (!isZoomed) {
        // Calculate click position relative to the image as a %
        const rect = lightboxImg.getBoundingClientRect();
        const xPct = ((e.clientX - rect.left) / rect.width  * 100).toFixed(2);
        const yPct = ((e.clientY - rect.top)  / rect.height * 100).toFixed(2);
        lightboxImg.style.transformOrigin = `${xPct}% ${yPct}%`;
        isZoomed = true;
        lightbox.classList.add('is-zoomed');
      } else {
        // Zoom out — restore origin to centre after transition
        isZoomed = false;
        lightbox.classList.remove('is-zoomed');
        lightboxImg.addEventListener('transitionend', () => {
          if (!isZoomed) lightboxImg.style.transformOrigin = '50% 50%';
        }, { once: true });
      }
    });

    // --- Mouse-pan while zoomed ---
    lightbox.addEventListener('mousemove', e => {
      if (!isZoomed) return;
      const rect = lightboxImg.getBoundingClientRect();

      // Map cursor position over the whole viewport to a pan origin on the image
      const xPct = (e.clientX / window.innerWidth  * 100).toFixed(2);
      const yPct = (e.clientY / window.innerHeight * 100).toFixed(2);
      lightboxImg.style.transformOrigin = `${xPct}% ${yPct}%`;
    });

    // --- Close ---
    const closeLightbox = () => {
      isZoomed = false;
      lightbox.classList.remove('is-open', 'is-zoomed');
      lightboxImg.style.transformOrigin = '50% 50%';
      document.body.style.overflow = '';
    };

    // Click backdrop (not the image) closes
    lightbox.addEventListener('click', closeLightbox);
    if (lightboxClose) lightboxClose.addEventListener('click', e => {
      e.stopPropagation();
      closeLightbox();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---------- Copy to clipboard (contact page) ---------- */
  document.querySelectorAll('.contact-card__copy').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      const text = btn.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('contact-card__copy--copied');
        setTimeout(() => btn.classList.remove('contact-card__copy--copied'), 1500);
      });
    });
  });

});

