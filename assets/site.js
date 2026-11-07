/**
 * ANPAQ — Script Principal do Site
 * Suporte a menu mobile, dropdowns, animações ao rolar, micro-interações e dados.
 */

(function () {
  'use strict';

  let globalRevealObserver = null;

  // ─── 1. NAVBAR SCROLL EFFECT & SUAVE ───
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let ticking = false;
    const checkScroll = () => {
      if (window.scrollY > 24) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(checkScroll);
        ticking = true;
      }
    }, { passive: true });

    // Checagem inicial desacoplada
    window.requestAnimationFrame(checkScroll);
  }

  // ─── 2. MENU MOBILE ───
  function initMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const drawerClose = document.getElementById('drawer-close');

    if (!navToggle || !mobileDrawer) return;

    const openMenu = () => {
      mobileDrawer.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (drawerClose) drawerClose.focus();
    };

    const closeMenu = () => {
      mobileDrawer.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      navToggle.focus();
    };

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileDrawer.classList.contains('open');
      if (isOpen) closeMenu();
      else openMenu();
    });

    if (drawerClose) {
      drawerClose.addEventListener('click', closeMenu);
    }

    // Fechar ao teclar Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
        closeMenu();
      }
    });

    // Submenu mobile accordion (ex: Associados)
    const mobileDropdownToggles = mobileDrawer.querySelectorAll('.mobile-dropdown-toggle');
    mobileDropdownToggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const submenu = btn.nextElementSibling;
        if (submenu && submenu.classList.contains('mobile-submenu')) {
          const isOpen = submenu.classList.contains('open');
          submenu.classList.toggle('open', !isOpen);
          btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
        }
      });
    });

    // Fechar gaveta ao clicar em links simples
    const drawerLinks = mobileDrawer.querySelectorAll('a:not(.mobile-dropdown-toggle)');
    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });
  }

  // ─── 3. SCROLL REVEAL ANIMATIONS (DESIGN SYSTEM) ───
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      // Fallback para navegadores legados
      document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-scale, .reveal-fade').forEach(el => {
        el.classList.add('active', 'revealed');
      });
      return;
    }

    globalRevealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active', 'revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: '0px 0px 40px 0px'
    });

    refreshReveals();
  }

  function refreshReveals() {
    if (!globalRevealObserver) return;
    const elements = document.querySelectorAll('.reveal:not(.active), .reveal-up:not(.revealed), .reveal-left:not(.revealed), .reveal-scale:not(.revealed), .reveal-fade:not(.revealed)');
    elements.forEach(el => globalRevealObserver.observe(el));
  }

  // ─── 4. SMOOTH SCROLL PARA ANCHORS LOCAIS ───
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]:not([href="#"]):not([href="#!"])').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const hash = this.getAttribute('href');
        try {
          const target = document.querySelector(hash);
          if (target) {
            e.preventDefault();
            const header = document.querySelector('.site-header');
            const headerHeight = header ? header.offsetHeight : 76;
            const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            if (history.pushState) {
              history.pushState(null, null, hash);
            }
          }
        } catch (_) {}
      });
    });
  }

  // ─── 5. UTILITÁRIO FETCH SHEET COM FALLBACK LOCAL ───
  /**
   * Carrega os dados de uma aba pública (Produtores, Fornecedores, Revista, Anuario, Agenda, Noticias).
   * Usa ANPAQ_CONFIG.sheetsEndpoint e faz fallback automático para /data/<aba>.json.
   * Filtra registros com publicar === 'SIM'.
   * 
   * @param {string} aba - Nome da aba da planilha (ex: 'Produtores', 'Revista')
   * @returns {Promise<Array<Object>>}
   */
  async function fetchSheet(aba) {
    if (!aba) return [];

    const config = window.ANPAQ_CONFIG || {};
    const endpoint = config.sheetsEndpoint;
    let data = null;

    // Tentativa 1: Endpoint remoto do Apps Script (se configurado)
    if (endpoint && endpoint.trim().length > 0) {
      try {
        const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}aba=${encodeURIComponent(aba)}`;
        const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn(`[ANPAQ] Falha na consulta remota da aba ${aba}. Recorrendo ao fallback local.`, err);
      }
    }

    // Tentativa 2: Fallback para /data/<aba>.json (ou caminho relativo)
    if (!data) {
      try {
        const basePath = window.location.pathname.includes('/site/')
          ? window.location.pathname.substring(0, window.location.pathname.indexOf('/site/') + 6)
          : '/';
        const localUrl = `${basePath.replace(/\/+$/, '')}/data/${aba.toLowerCase()}.json`;

        let localRes = await fetch(localUrl);
        if (!localRes.ok) {
          localRes = await fetch(`../data/${aba.toLowerCase()}.json`);
        }
        if (!localRes.ok) {
          localRes = await fetch(`./data/${aba.toLowerCase()}.json`);
        }

        if (localRes.ok) {
          data = await localRes.json();
        }
      } catch (localErr) {
        console.warn(`[ANPAQ] Fallback local para ${aba} não encontrado.`, localErr);
      }
    }

    let list = Array.isArray(data) ? data : (data && Array.isArray(data.itens) ? data.itens : []);

    // Filtra apenas registros autorizados (publicar = SIM ou sem campo publicar explícito)
    return list.filter(item => {
      if (item && typeof item.publicar !== 'undefined') {
        return String(item.publicar).trim().toUpperCase() === 'SIM';
      }
      return true;
    });
  }

  // ─── 6. INICIALIZAÇÃO GERAL ───
  function initAll() {
    initMobileMenu();
    initHeaderScroll();
    initSmoothAnchors();

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => initScrollReveal(), { timeout: 1200 });
    } else {
      setTimeout(initScrollReveal, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Exporta para escopo global
  window.ANPAQ = {
    fetchSheet: fetchSheet,
    refreshReveals: refreshReveals
  };

})();
