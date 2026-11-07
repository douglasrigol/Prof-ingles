(function () {
  'use strict';

  /* ==========================================================
     Configuração — troque pelo número real (DDI + DDD + número)
     ========================================================== */
  const WHATSAPP_NUMBER = '5500000000000';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav__link');
  const progressBar = document.getElementById('scrollProgress');

  /* Página carregada → dispara a entrada do hero */
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));

  /* Ano no rodapé */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Links de WhatsApp com mensagem pré-preenchida */
  document.querySelectorAll('[data-whatsapp]').forEach((link) => {
    const text = encodeURIComponent(link.dataset.whatsapp || '');
    link.href = `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${text}` : ''}`;
    link.target = '_blank';
    link.rel = 'noopener';
  });

  /* ==========================================================
     Header: estado "scrolled", esconde ao descer, barra de progresso
     ========================================================== */
  let lastY = window.scrollY;

  function updateHeader() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle('header--scrolled', y > 40);

    const menuOpen = nav.classList.contains('open');
    if (!menuOpen && y > 600 && y > lastY + 4) {
      header.classList.add('header--hidden');
    } else if (y < lastY - 4 || y < 600) {
      header.classList.remove('header--hidden');
    }
    lastY = y;

    if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  }

  /* ==========================================================
     Menu mobile
     ========================================================== */
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuToggle.classList.toggle('active', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
    if (open) header.classList.remove('header--hidden');
  }

  menuToggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* ==========================================================
     Link ativo da navegação
     ========================================================== */
  const navMap = new Map();
  navLinks.forEach((link) => navMap.set(link.getAttribute('href').slice(1), link));

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) => l.classList.remove('is-active'));
        const link = navMap.get(entry.target.id);
        if (link) link.classList.add('is-active');
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  document.querySelectorAll('main section[id]').forEach((s) => navObserver.observe(s));

  /* ==========================================================
     Reveal on scroll com stagger automático entre irmãos
     ========================================================== */
  const revealElements = document.querySelectorAll('.reveal');

  revealElements.forEach((el) => {
    const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
    const index = siblings.indexOf(el);
    const base = el.closest('.hero') ? 0.35 : 0;
    el.style.setProperty('--delay', `${(base + Math.min(index * 0.08, 0.5)).toFixed(2)}s`);
  });

  const isCarouselMode = () => window.innerWidth <= 1024;

  const revealTargets = new Map();

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target;
        // No carrossel, os cards fora da tela aparecem junto com o primeiro
        if (target.classList.contains('testimonial-card') && isCarouselMode()) {
          target.parentElement.querySelectorAll('.testimonial-card').forEach((c) => {
            c.classList.add('visible');
            revealObserver.unobserve(c);
          });
          return;
        }
        (revealTargets.get(target) || [target]).forEach((el) => el.classList.add('visible'));
        revealObserver.unobserve(target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  if (reduceMotion) {
    revealElements.forEach((el) => el.classList.add('visible'));
  } else {
    revealElements.forEach((el) => {
      // Elementos com clip-path total não disparam o observer: observa o pai
      const target = el.classList.contains('reveal--clip') ? el.parentElement : el;
      if (target !== el) {
        if (!revealTargets.has(target)) revealTargets.set(target, []);
        revealTargets.get(target).push(el);
      }
      revealObserver.observe(target);
    });
  }

  /* ==========================================================
     Contadores (8+, 100%, 200+)
     ========================================================== */
  function countUp(el) {
    const target = Number(el.dataset.count);
    if (reduceMotion || !target) return;
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    el.textContent = '0';
    requestAnimationFrame(tick);
  }

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = el.closest('.hero') ? 700 : 300;
        setTimeout(() => countUp(el), delay);
        countObserver.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll('[data-count]').forEach((el) => countObserver.observe(el));

  /* ==========================================================
     Parallax de scroll (data-parallax="fator")
     ========================================================== */
  const parallaxEls = reduceMotion ? [] : Array.from(document.querySelectorAll('[data-parallax]'));

  function updateParallax() {
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const host = el.parentElement;
      const rect = host.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      const factor = parseFloat(el.dataset.parallax) || 0;
      // No hero o deslocamento parte do zero (topo da página); nos demais, do centro da tela
      const offset = el.closest('.hero')
        ? window.scrollY * factor
        : (rect.top + rect.height / 2 - vh / 2) * -factor;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  }

  /* ==========================================================
     Linha do tempo da metodologia preenchendo com o scroll
     ========================================================== */
  const timeline = document.getElementById('timeline');
  const steps = timeline ? Array.from(timeline.querySelectorAll('.step-card')) : [];

  function updateTimeline() {
    if (!timeline) return;
    const vh = window.innerHeight;
    const trigger = vh * 0.6;
    const rect = timeline.getBoundingClientRect();
    const progress = clamp((trigger - rect.top) / rect.height, 0, 1);
    timeline.style.setProperty('--progress', progress.toFixed(3));

    let current = -1;
    steps.forEach((step, i) => {
      const num = step.querySelector('.step-card__number').getBoundingClientRect();
      const active = num.top + num.height / 2 < trigger;
      step.classList.toggle('is-active', active);
      if (active) current = i;
    });
    steps.forEach((step, i) => step.classList.toggle('is-current', i === current));
  }

  /* Loop único de scroll (rAF) */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateParallax();
      updateTimeline();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ==========================================================
     Interações de cursor (somente mouse / trackpad)
     ========================================================== */
  if (finePointer && !reduceMotion) {
    /* Profundidade: elementos com data-depth seguem o mouse */
    document.querySelectorAll('.hero, #premiumVisual, .sobre__visual').forEach((scope) => {
      const layers = scope.querySelectorAll('[data-depth]');
      if (!layers.length) return;
      scope.addEventListener('pointermove', (e) => {
        const r = scope.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach((layer) => {
          const d = parseFloat(layer.dataset.depth) || 10;
          layer.style.setProperty('--mx', `${(x * d).toFixed(1)}px`);
          layer.style.setProperty('--my', `${(y * d).toFixed(1)}px`);
        });
      });
      scope.addEventListener('pointerleave', () => {
        layers.forEach((layer) => {
          layer.style.setProperty('--mx', '0px');
          layer.style.setProperty('--my', '0px');
        });
      });
    });

    /* Spotlight nos cards */
    document.querySelectorAll('[data-spotlight]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--x', `${e.clientX - r.left}px`);
        card.style.setProperty('--y', `${e.clientY - r.top}px`);
      });
    });

    /* Botões magnéticos */
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ==========================================================
     Faixa de destaques em loop infinito
     ========================================================== */
  const trustTrack = document.getElementById('trustTrack');
  if (trustTrack && !reduceMotion) {
    const group = trustTrack.querySelector('.trust-bar__group');
    const originals = Array.from(group.children);
    // Repete os itens até o grupo cobrir a largura da tela
    let guard = 0;
    while (group.scrollWidth < window.innerWidth * 1.1 && guard < 6) {
      originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        group.appendChild(clone);
      });
      guard++;
    }
    const twin = group.cloneNode(true);
    twin.setAttribute('aria-hidden', 'true');
    trustTrack.appendChild(twin);
    trustTrack.classList.add('is-marquee');
  }

  /* ==========================================================
     Depoimentos — carrossel com arraste no mobile/tablet
     ========================================================== */
  const track = document.getElementById('testimonialsTrack');
  const cards = track ? Array.from(track.querySelectorAll('.testimonial-card')) : [];
  const prevBtn = document.getElementById('prevTestimonial');
  const nextBtn = document.getElementById('nextTestimonial');
  const dotsContainer = document.getElementById('testimonialDots');
  let currentSlide = 0;
  let autoSlide = null;
  let userInteracted = false;

  function slideStep() {
    if (cards.length < 2) return track.clientWidth;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  }

  function goToSlide(index) {
    const total = cards.length;
    currentSlide = (index + total) % total;
    track.scrollTo({ left: slideStep() * currentSlide, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function syncDots() {
    const step = slideStep();
    const maxScroll = track.scrollWidth - track.clientWidth;
    let index = Math.round(track.scrollLeft / step);
    if (track.scrollLeft >= maxScroll - 4) index = cards.length - 1;
    currentSlide = clamp(index, 0, cards.length - 1);
    dotsContainer.querySelectorAll('.testimonials__dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
      dot.setAttribute('aria-current', i === currentSlide ? 'true' : 'false');
    });
  }

  function stopAuto() {
    userInteracted = true;
    clearInterval(autoSlide);
  }

  if (track && cards.length && dotsContainer) {
    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'testimonials__dot';
      dot.setAttribute('aria-label', `Depoimento ${i + 1}`);
      dot.addEventListener('click', () => { stopAuto(); goToSlide(i); });
      dotsContainer.appendChild(dot);
    });

    prevBtn.addEventListener('click', () => { stopAuto(); goToSlide(currentSlide - 1); });
    nextBtn.addEventListener('click', () => { stopAuto(); goToSlide(currentSlide + 1); });
    track.addEventListener('pointerdown', stopAuto, { passive: true });
    track.addEventListener('touchstart', stopAuto, { passive: true });
    track.addEventListener('scroll', () => requestAnimationFrame(syncDots), { passive: true });
    syncDots();

    // Avança sozinho só enquanto a seção está visível e ninguém mexeu
    if (!reduceMotion) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          clearInterval(autoSlide);
          if (entry.isIntersecting && isCarouselMode() && !userInteracted) {
            autoSlide = setInterval(() => goToSlide(currentSlide + 1), 6000);
          }
        });
      }, { threshold: 0.5 }).observe(track);
    }
  }

  /* ==========================================================
     FAQ — abre/fecha com animação e um de cada vez
     ========================================================== */
  const faqItems = Array.from(document.querySelectorAll('.faq__item'));
  const faqEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function openFaq(item) {
    const answer = item.querySelector('.faq__answer');
    item.open = true;
    item.classList.add('is-open');
    if (reduceMotion) return;
    answer.animate(
      [{ height: '0px', opacity: 0 }, { height: `${answer.scrollHeight}px`, opacity: 1 }],
      { duration: 450, easing: faqEasing }
    );
  }

  function closeFaq(item) {
    const answer = item.querySelector('.faq__answer');
    item.classList.remove('is-open');
    if (reduceMotion) { item.open = false; return; }
    const anim = answer.animate(
      [{ height: `${answer.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }],
      { duration: 350, easing: faqEasing }
    );
    anim.onfinish = () => { if (!item.classList.contains('is-open')) item.open = false; };
  }

  faqItems.forEach((item) => {
    item.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      if (item.classList.contains('is-open')) {
        closeFaq(item);
      } else {
        faqItems.forEach((other) => { if (other !== item && other.classList.contains('is-open')) closeFaq(other); });
        openFaq(item);
      }
    });
  });
})();
