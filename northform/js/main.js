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
                    setMenu(false);
                    if (reduced) {
                        target.scrollIntoView();
                    } else {
                        target.scrollIntoView({ behavior: 'smooth' });
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
})();