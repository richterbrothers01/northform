/* ==========================================================================
   NorthForm — interactions
   GSAP 3 + ScrollTrigger. Quiet, refined, 60fps.
   ========================================================================== */

(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(pointer: fine)').matches && !reduced;

    if (!window.gsap || !window.ScrollTrigger) {
        return; /* no GSAP — page renders fully visible */
    }

    gsap.registerPlugin(ScrollTrigger);

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ----------------------------------------------------------------------
       Word splitting for masked text reveals
       ---------------------------------------------------------------------- */
    function splitWords(el) {
        if (reduced) { return false; }

        var frag = document.createDocumentFragment();

        function appendWords(text, target) {
            var words = text.split(/\s+/).filter(Boolean);
            words.forEach(function (word, i) {
                var w = document.createElement('span');
                w.className = 'w';
                var inner = document.createElement('span');
                inner.className = 'w-in';
                inner.textContent = word;
                w.appendChild(inner);
                target.appendChild(w);
                if (i < words.length - 1) { target.appendChild(document.createTextNode(' ')); }
            });
        }

        Array.prototype.forEach.call(el.childNodes, function (node) {
            if (node.nodeType === Node.TEXT_NODE) {
                appendWords(node.textContent, frag);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.nodeName === 'BR') {
                    frag.appendChild(document.createElement('br'));
                } else {
                    var clone = node.cloneNode(false);
                    Array.prototype.forEach.call(node.childNodes, function (child) {
                        if (child.nodeType === Node.TEXT_NODE) {
                            appendWords(child.textContent, clone);
                        } else {
                            clone.appendChild(child.cloneNode(true));
                        }
                    });
                    frag.appendChild(clone);
                }
            }
        });

        el.replaceChildren(frag);
        return true;
    }

    /* Scroll-triggered masked title reveal */
    function revealTitle(el) {
        if (!splitWords(el)) { return; }
        var words = $$('.w-in', el);
        if (!words.length) { return; }
        gsap.from(words, {
            yPercent: 115,
            duration: 1.1,
            ease: 'power4.out',
            stagger: 0.03,
            scrollTrigger: { trigger: el, start: 'top 82%', once: true }
        });
    }

    /* Generic quiet reveal */
    function reveal(el) {
        if (reduced) { return; }
        var dir = el.getAttribute('data-reveal') || 'up';
        var vars = {
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        };
        if (dir === 'up') { vars.y = 26; }
        if (dir === 'left') { vars.x = -28; }
        gsap.from(el, vars);
    }

    /* Staggered batch reveal */
    function revealBatch(group) {
        if (reduced) { return; }
        var kids = Array.prototype.slice.call(group.children);
        if (!kids.length) { return; }
        gsap.from(kids, {
            y: 28,
            opacity: 0,
            duration: 0.9,
            stagger: 0.09,
            ease: 'power3.out',
            scrollTrigger: { trigger: group, start: 'top 82%', once: true }
        });
    }

    /* ----------------------------------------------------------------------
       Navigation
       ---------------------------------------------------------------------- */
    var nav = $('#nav');

    function onScroll() {
        nav.classList.toggle('is-scrolled', window.scrollY > 12);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var toggle = $('#navToggle');
    var navLinks = $('#navLinks');

    function setMenu(open) {
        nav.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('menu-open', open);

        if (open && !reduced) {
            gsap.fromTo($$('.nav__link', navLinks), {
                y: 26,
                opacity: 0
            }, {
                y: 0,
                opacity: 1,
                duration: 0.55,
                stagger: 0.07,
                ease: 'power3.out',
                delay: 0.12,
                overwrite: 'auto'
            });
        }
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            setMenu(!nav.classList.contains('is-open'));
        });
    }

    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) {
            setMenu(false);
        }
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && nav.classList.contains('is-open')) {
            setMenu(false);
        }
    });

    /* Smooth anchor navigation */
    $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var id = a.getAttribute('href');
            if (id.length > 1) {
                var target = $(id);
                if (target) {
                    e.preventDefault();
                    var menuWasOpen = nav.classList.contains('is-open');
                    setMenu(false);
                    var go = function () {
                        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
                    };
                    /* let the menu release overflow:hidden before scrolling */
                    if (menuWasOpen) {
                        setTimeout(go, 120);
                    } else {
                        go();
                    }
                }
            }
        });
    });

    /* ----------------------------------------------------------------------
       Hero — page-load sequence
       ---------------------------------------------------------------------- */
    function heroIntro() {
        var title = $('.hero__title');
        if (title) { splitWords(title); }

        if (reduced) { return; }

        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('.hero__eyebrow', { y: 16, opacity: 0, duration: 0.8 }, 0.1)
          .from('.hero__title .w-in', {
                yPercent: 118,
                duration: 1.15,
                stagger: 0.032,
                ease: 'power4.out'
            }, 0.22)
          .from('.hero__description', { y: 20, opacity: 0, duration: 0.9 }, '-=0.55')
          .from('.hero__actions .btn', {
                y: 16,
                opacity: 0,
                duration: 0.7,
                stagger: 0.1
            }, '-=0.65')
          .from('.hero__visual', { opacity: 0, scale: 0.96, duration: 1.4 }, 0.25);

        /* Signature mark: the doorway draws open */
        var logoPath = $('.hero__logo .logo-path');
        var maskPath = $('.hero__logo .mask-path');
        if (logoPath && maskPath) {
            var lp = logoPath.getTotalLength();
            var mp = maskPath.getTotalLength();
            gsap.set([logoPath, maskPath], { strokeDasharray: lp, strokeDashoffset: lp });
            tl.to(logoPath, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' }, 0.85)
              .to(maskPath, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' }, 0.85);
        }

        tl.from('.hero__accent-lines .hero__line', {
                scaleX: 0,
                duration: 1.1,
                stagger: 0.14,
                ease: 'power3.out'
            }, 0.6)
          .from('.hero__scroll', { opacity: 0, duration: 1.2 }, 1.5);

        /* Gentle levitation */
        if (finePointer) {
            gsap.to('.hero__logo-container', {
                y: -7,
                duration: 3.4,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut',
                delay: 2.4
            });
        }
    }
    heroIntro();

    /* Cursor parallax — the mark leans toward the pointer */
    if (finePointer) {
        var hero = $('#hero');
        var heroVisual = $('.hero__visual');
        if (hero && heroVisual) {
            var xTo = gsap.quickTo(heroVisual, 'x', { duration: 0.9, ease: 'power3.out' });
            var yTo = gsap.quickTo(heroVisual, 'y', { duration: 0.9, ease: 'power3.out' });
            hero.addEventListener('mousemove', function (e) {
                var r = hero.getBoundingClientRect();
                xTo((e.clientX - r.left - r.width / 2) * 0.02);
                yTo((e.clientY - r.top - r.height / 2) * 0.02);
            });
        }
    }

    /* Hero parallax on scroll */
    if (!reduced && $('#hero')) {
        gsap.to('.hero__visual', {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
        gsap.to('.hero__content', {
            yPercent: -6,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
    }

    /* ----------------------------------------------------------------------
       Scroll reveals
       ---------------------------------------------------------------------- */
    $$('[data-split]').forEach(revealTitle);
    $$('[data-reveal]').forEach(reveal);
    $$('[data-reveal-batch]').forEach(revealBatch);

    /* Project imagery — mask reveal + settle */
    if (!reduced) {
        $$('.project__image').forEach(function (img) {
            var inner = $('.project__placeholder', img);
            var trigger = { trigger: img, start: 'top 80%', once: true };

            gsap.fromTo(img, { clipPath: 'inset(0 0 100% 0)' }, {
                clipPath: 'inset(0 0 0% 0)',
                duration: 1.5,
                ease: 'power4.out',
                scrollTrigger: trigger
            });

            if (inner) {
                gsap.fromTo(inner, { scale: 1.12 }, {
                    scale: 1,
                    duration: 1.8,
                    ease: 'power3.out',
                    scrollTrigger: trigger,
                    onComplete: function () {
                        gsap.set(inner, { clearProps: 'transform' });
                    }
                });
            }
        });
    }

    /* ----------------------------------------------------------------------
       Why — blueprint geometry assembles on scroll
       ---------------------------------------------------------------------- */
    var geometry = $('#whyGeometry');
    if (geometry && !reduced) {
        var geoTrigger = { trigger: geometry, start: 'top 78%', end: 'bottom 42%', scrub: true };

        gsap.fromTo($$('.geometry__line', geometry), {
            scaleX: 0,
            scaleY: 0
        }, {
            scaleX: 1,
            scaleY: 1,
            stagger: 0.1,
            ease: 'none',
            scrollTrigger: geoTrigger
        });

        gsap.fromTo($$('.geometry__shape', geometry), {
            scale: 0.92,
            opacity: 0
        }, {
            scale: 1,
            opacity: 1,
            stagger: 0.12,
            ease: 'none',
            scrollTrigger: geoTrigger
        });
    }

    /* ----------------------------------------------------------------------
       Process — blueprint rail draws in
       ---------------------------------------------------------------------- */
    if (!reduced) {
        var steps = $('.process__steps');
        if (steps) {
            var stepTrigger = { trigger: steps, start: 'top 80%', once: true };
            gsap.from('.step__line', {
                scaleX: 0,
                duration: 1.1,
                stagger: 0.18,
                ease: 'power3.out',
                scrollTrigger: stepTrigger
            });
        }
    }

    /* ----------------------------------------------------------------------
       About — signature mark draws itself
       ---------------------------------------------------------------------- */
    if (!reduced) {
        var aboutPath = $('.about__logo .logo-path');
        if (aboutPath) {
            var alen = aboutPath.getTotalLength();
            gsap.set(aboutPath, { strokeDasharray: alen, strokeDashoffset: alen });
            gsap.to(aboutPath, {
                strokeDashoffset: 0,
                duration: 2,
                ease: 'power2.inOut',
                scrollTrigger: { trigger: '.about__visual', start: 'top 80%', once: true }
            });
        }
    }

    /* ----------------------------------------------------------------------
       CTA — large mark settles in
       ---------------------------------------------------------------------- */
    if (!reduced) {
        gsap.fromTo('.cta__logo-large', {
            scale: 0.9,
            y: 40
        }, {
            scale: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true }
        });
    }

    /* Re-measure after everything loads */
    window.addEventListener('load', function () {
        ScrollTrigger.refresh();
    });

    /* ----------------------------------------------------------------------
       Contact form — AJAX delivery, stays on page (no ugly redirect)
       ---------------------------------------------------------------------- */
    var contactForm = $('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var btn = $('#contactSubmit');
            var error = $('#formError');
            var success = $('#formSuccess');

            btn.disabled = true;
            btn.classList.add('is-loading');
            if (error) { error.classList.remove('is-visible'); }

            var data = new FormData(contactForm);

            fetch('https://formsubmit.co/ajax/richterbrothers01@gmail.com', {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json' }
            }).then(function (res) {
                return res.json();
            }).then(function (json) {
                if (json && String(json.success) === 'true') {
                    contactForm.classList.add('is-sent');
                    if (success) {
                        success.setAttribute('aria-hidden', 'false');
                        success.classList.add('is-visible');
                    }
                } else {
                    throw new Error((json && json.message) || 'Send failed');
                }
            }, function () {
                if (error) { error.classList.add('is-visible'); }
            }).then(function () {
                btn.disabled = false;
                btn.classList.remove('is-loading');
            });
        });
    }
})();
/* ==========================================================================
   NorthForm — additional features
   Dark mode, search, cookie consent, progress bar, FAQ, etc.
   ========================================================================== */
(function () {
    'use strict';

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ---------------------------------------------------------------------
       Dark mode toggle
       --------------------------------------------------------------------- */
    (function themeInit() {
        var stored = null;
        try { stored = localStorage.getItem('nf-theme'); } catch (e) {}
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = stored || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);

        var toggle = $('#themeToggle');
        if (toggle) {
            toggle.addEventListener('click', function () {
                var current = document.documentElement.getAttribute('data-theme');
                var next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                try { localStorage.setItem('nf-theme', next); } catch (e) {}
            });
        }
    })();

    /* ---------------------------------------------------------------------
       Scroll progress bar
       --------------------------------------------------------------------- */
    (function progressBar() {
        var bar = $('#progressBar');
        if (!bar) { return; }
        function update() {
            var h = document.documentElement;
            var scrollTop = h.scrollTop || document.body.scrollTop;
            var scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
            var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            bar.style.width = pct + '%';
        }
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    })();

    /* ---------------------------------------------------------------------
       Back to top
       --------------------------------------------------------------------- */
    (function backToTop() {
        var btn = $('#backToTop');
        if (!btn) { return; }
        function onScroll() {
            btn.classList.toggle('is-visible', window.scrollY > 560);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        });
    })();

    /* ---------------------------------------------------------------------
       Cookie consent banner
       --------------------------------------------------------------------- */
    (function cookieBanner() {
        var banner = $('#cookieBanner');
        if (!banner) { return; }
        var stored = null;
        try { stored = localStorage.getItem('nf-cookie-consent'); } catch (e) {}
        if (!stored) {
            setTimeout(function () { banner.classList.add('is-visible'); }, 900);
        }
        function decide(value) {
            banner.classList.remove('is-visible');
            try { localStorage.setItem('nf-cookie-consent', value); } catch (e) {}
        }
        var accept = $('#cookieAccept');
        var decline = $('#cookieDecline');
        if (accept) { accept.addEventListener('click', function () { decide('accepted'); }); }
        if (decline) { decline.addEventListener('click', function () { decide('declined'); }); }
    })();

    /* ---------------------------------------------------------------------
       Site search — searches headings/sections on the page
       --------------------------------------------------------------------- */
    (function siteSearch() {
        var toggle = $('#searchToggle');
        var overlay = $('#searchOverlay');
        if (!toggle || !overlay) { return; }
        var input = $('#searchInput', overlay);
        var results = $('#searchResults', overlay);
        var close = $('#searchClose', overlay);

        var index = $$('h1[id], h2[id], h3[id]').concat($$('[data-searchable]')).map(function (el) {
            var id = el.id || (el.closest('[id]') && el.closest('[id]').id) || '';
            return { label: el.textContent.trim(), id: id, section: (el.closest('section') || {}).id || '' };
        }).filter(function (r) { return r.label; });

        /* Fallback: index each section by its title */
        $$('section[id]').forEach(function (sec) {
            var title = $('.section-title, h1, h2', sec);
            if (title) {
                index.push({ label: title.textContent.trim(), id: sec.id, section: sec.id });
            }
        });

        function open() {
            overlay.classList.add('is-open');
            document.body.classList.add('menu-open');
            setTimeout(function () { input.focus(); }, 150);
        }
        function closeOverlay() {
            overlay.classList.remove('is-open');
            document.body.classList.remove('menu-open');
        }

        toggle.addEventListener('click', open);
        if (close) { close.addEventListener('click', closeOverlay); }
        window.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('is-open')) { closeOverlay(); }
        });

        function render(query) {
            results.innerHTML = '';
            if (!query) { return; }
            var q = query.toLowerCase();
            var matches = index.filter(function (r) { return r.label.toLowerCase().indexOf(q) !== -1; });
            if (!matches.length) {
                results.innerHTML = '<p class="search-overlay__empty">No results for &ldquo;' + query.replace(/</g, '') + '&rdquo;</p>';
                return;
            }
            matches.forEach(function (m) {
                var a = document.createElement('a');
                a.className = 'search-result';
                a.href = (m.section ? '#' + m.section : '#');
                a.innerHTML = '<span class="search-result__label">' + m.label + '</span><span class="search-result__meta">Jump to section</span>';
                a.addEventListener('click', function () { closeOverlay(); });
                results.appendChild(a);
            });
        }

        if (input) {
            input.addEventListener('input', function () { render(input.value.trim()); });
        }
    })();

    /* ---------------------------------------------------------------------
       Copy button (email address)
       --------------------------------------------------------------------- */
    (function copyButtons() {
        $$('.copy-btn').forEach(function (btn) {
            var label = $('.copy-btn__label', btn);
            var original = label ? label.textContent : 'Copy';
            btn.addEventListener('click', function () {
                var text = btn.getAttribute('data-copy') || '';
                var done = function () {
                    btn.classList.add('is-copied');
                    if (label) { label.textContent = 'Copied'; }
                    setTimeout(function () {
                        btn.classList.remove('is-copied');
                        if (label) { label.textContent = original; }
                    }, 1800);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done, done);
                } else {
                    done();
                }
            });
        });
    })();

    /* ---------------------------------------------------------------------
       FAQ accordion
       --------------------------------------------------------------------- */
    (function faqAccordion() {
        $$('.faq-item').forEach(function (item) {
            var q = $('.faq-item__question', item);
            var a = $('.faq-item__answer', item);
            if (!q || !a) { return; }
            q.addEventListener('click', function () {
                var isOpen = item.classList.contains('is-open');
                $$('.faq-item').forEach(function (other) {
                    other.classList.remove('is-open');
                    $('.faq-item__answer', other).style.maxHeight = null;
                    $('.faq-item__question', other).setAttribute('aria-expanded', 'false');
                });
                if (!isOpen) {
                    item.classList.add('is-open');
                    a.style.maxHeight = a.scrollHeight + 'px';
                    q.setAttribute('aria-expanded', 'true');
                }
            });
        });
    })();

    /* ---------------------------------------------------------------------
       Confirmation modal (used for cookie "decline" and generic confirms)
       --------------------------------------------------------------------- */
    (function modal() {
        var overlay = $('#confirmModal');
        if (!overlay) { return; }
        function close() { overlay.classList.remove('is-open'); }
        $$('[data-modal-close]', overlay).forEach(function (b) { b.addEventListener('click', close); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) { close(); } });
        window.__nfOpenModal = function () { overlay.classList.add('is-open'); };
    })();

    /* ---------------------------------------------------------------------
       UTM tracking — capture params, persist, and attach to form submits
       --------------------------------------------------------------------- */
    (function utmTracking() {
        var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        var params = new URLSearchParams(window.location.search);
        var stored = {};
        try { stored = JSON.parse(localStorage.getItem('nf-utm') || '{}'); } catch (e) {}

        var changed = false;
        keys.forEach(function (k) {
            if (params.has(k)) { stored[k] = params.get(k); changed = true; }
        });
        if (changed) {
            try { localStorage.setItem('nf-utm', JSON.stringify(stored)); } catch (e) {}
        }

        var form = $('#contactForm');
        if (form && Object.keys(stored).length) {
            keys.forEach(function (k) {
                if (stored[k]) {
                    var input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = k;
                    input.value = stored[k];
                    form.appendChild(input);
                }
            });
        }
    })();

    /* ---------------------------------------------------------------------
       Last updated date in footer
       --------------------------------------------------------------------- */
    (function lastUpdated() {
        var el = $('#lastUpdated');
        if (!el) { return; }
        el.textContent = 'Last updated ' + document.lastModified.split(',')[0] + (document.lastModified.split(',')[1] ? ',' + document.lastModified.split(',')[1].split(' ').slice(0, 3).join(' ') : '');
    })();
})();
