(function () {
  var navToggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  var reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var finePointerQuery = window.matchMedia ? window.matchMedia('(pointer: fine)') : null;
  var prefersReducedMotion = !!(reduceMotionQuery && reduceMotionQuery.matches);
  var hasFinePointer = !!(finePointerQuery && finePointerQuery.matches);

  function injectAmbientLayer() {
    if (!document.body || document.querySelector('.ambient-layer')) {
      return;
    }

    var ambient = document.createElement('div');
    ambient.className = 'ambient-layer';
    ambient.setAttribute('aria-hidden', 'true');
    ambient.innerHTML =
      '<div class="ambient-blob ambient-blob-primary"></div>' +
      '<div class="ambient-blob ambient-blob-secondary"></div>' +
      '<div class="ambient-blob ambient-blob-tertiary"></div>' +
      '<div class="ambient-blob ambient-blob-bottom"></div>' +
      '<div class="ambient-grid"></div>' +
      '<div class="ambient-noise"></div>';

    document.body.insertBefore(ambient, document.body.firstChild);
  }

  injectAmbientLayer();

  if (navToggle && nav) {
    var navList = nav.querySelector('ul');
    if (navList && !navList.querySelector('.mobile-nav-cta')) {
      var ctaItem = document.createElement('li');
      ctaItem.className = 'mobile-nav-cta';
      ctaItem.innerHTML = '<a class="btn btn-primary" href="tel:+16048003900">Call Now</a>';
      navList.appendChild(ctaItem);
    }

    function syncNavState(isOpen) {
      nav.setAttribute('data-open', String(isOpen));
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('data-open', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      navToggle.textContent = isOpen ? 'X' : 'Menu';
    }

    syncNavState(false);

    navToggle.addEventListener('click', function () {
      var isOpen = nav.getAttribute('data-open') === 'true';
      syncNavState(!isOpen);
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        syncNavState(false);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        syncNavState(false);
      }
    });

    document.addEventListener('click', function (event) {
      var clickedInsideNav = nav.contains(event.target);
      var clickedToggle = navToggle.contains(event.target);
      if (!clickedInsideNav && !clickedToggle && nav.getAttribute('data-open') === 'true') {
        syncNavState(false);
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 768) {
        syncNavState(false);
      }
    });
  }

  var revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  revealItems.forEach(function (item, index) {
    var delay = (index % 8) * 80;
    item.style.setProperty('--reveal-delay', String(delay) + 'ms');
  });

  if ('IntersectionObserver' in window && revealItems.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  var parallaxItems = prefersReducedMotion ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var heroSections = prefersReducedMotion ? [] : Array.prototype.slice.call(document.querySelectorAll('.hero'));
  var scrollTicking = false;

  function applyScrollEffects() {
    var root = document.documentElement;
    var scrollableHeight = root.scrollHeight - window.innerHeight;
    var progress = scrollableHeight > 0 ? clamp(window.scrollY / scrollableHeight, 0, 1) : 0;
    root.style.setProperty('--scroll-progress', progress.toFixed(4));

    if (!prefersReducedMotion && heroSections.length) {
      heroSections.forEach(function (hero) {
        var rect = hero.getBoundingClientRect();
        var range = Math.max(rect.height, window.innerHeight * 0.9);
        var heroProgress = clamp((-rect.top) / (range * 0.5), 0, 1);
        hero.style.setProperty('--hero-progress', heroProgress.toFixed(4));
      });
    }

    if (!parallaxItems.length) {
      return;
    }

    var viewportHalf = window.innerHeight / 2;
    parallaxItems.forEach(function (item) {
      var rect = item.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > window.innerHeight + 80) {
        return;
      }

      var speed = parseFloat(item.getAttribute('data-parallax-speed') || '0.1');
      if (isNaN(speed)) {
        speed = 0.1;
      }

      var itemCenter = rect.top + rect.height / 2;
      var distanceFromCenter = viewportHalf - itemCenter;
      var shift = clamp(distanceFromCenter * speed, -28, 28);
      item.style.setProperty('--parallax-y', shift.toFixed(2) + 'px');
    });
  }

  function queueScrollEffects() {
    if (scrollTicking) {
      return;
    }

    scrollTicking = true;
    window.requestAnimationFrame(function () {
      applyScrollEffects();
      scrollTicking = false;
    });
  }

  window.addEventListener('scroll', queueScrollEffects, { passive: true });
  window.addEventListener('resize', queueScrollEffects);
  queueScrollEffects();

  if (!prefersReducedMotion && hasFinePointer) {
    var spotlightItems = Array.prototype.slice.call(
      document.querySelectorAll('.glass, .quick-link, .btn-secondary, .site-nav a, .nav-toggle')
    );

    spotlightItems.forEach(function (item) {
      item.classList.add('spotlight-ready');

      item.addEventListener('pointerenter', function (event) {
        var rect = item.getBoundingClientRect();
        item.style.setProperty('--spotlight-x', (event.clientX - rect.left).toFixed(2) + 'px');
        item.style.setProperty('--spotlight-y', (event.clientY - rect.top).toFixed(2) + 'px');
        item.style.setProperty('--spotlight-opacity', '1');
      });

      item.addEventListener('pointermove', function (event) {
        var rect = item.getBoundingClientRect();
        item.style.setProperty('--spotlight-x', (event.clientX - rect.left).toFixed(2) + 'px');
        item.style.setProperty('--spotlight-y', (event.clientY - rect.top).toFixed(2) + 'px');
      });

      item.addEventListener('pointerleave', function () {
        item.style.setProperty('--spotlight-opacity', '0');
      });
    });
  }

  var yearEl = document.querySelector('[data-year]');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
