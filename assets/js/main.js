/* Momentum HVAC Services — site script (shared by all pages, loaded with `defer`) */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Office status (Regina has no DST: always America/Regina) ---------- */
  function reginaNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Regina', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[o.weekday], mins: (+o.hour) * 60 + (+o.minute) };
    } catch (e) {
      var n = new Date(), r = new Date(n.getTime() + n.getTimezoneOffset() * 60000 - 6 * 3600000);
      return { day: r.getDay(), mins: r.getHours() * 60 + r.getMinutes() };
    }
  }
  function status() {
    var t = reginaNow(), open = t.day > 0 && t.day < 6 && t.mins >= 480 && t.mins < 990; // Mon–Fri 8:00–16:30
    var t1 = $('#statusText'), t2 = $('#statusText2'), d1 = $('#statusDot');
    if (t1) t1.textContent = open ? 'Office open now' : 'Office closed: on-call tech available';
    if (t2) t2.textContent = open ? 'Office open · Dispatch active' : 'After hours · On-call active';
    if (d1) d1.classList.toggle('off', !open);
  }
  status(); setInterval(status, 60000);
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Hero slideshow ----------
     Markup hooks (all optional except .hs-slide):
       [data-hs]           container (gets .playing / .paused)
       .hs-slide           one per photo (first one eager, rest use data-srcset/data-src)
       [data-hs-copy] > *  one text block per slide, shown in sync
       .hs-seg / .hs-tab   progress buttons (an <i> inside fills as the slide plays)
       #hsPause            pause/play button
       [data-hs-prev] [data-hs-next] [data-hs-count]
       [data-hs-hold]      hovering these pauses (defaults to the whole container)
     Timing is driven by the progress-bar animation, so every kind of pause
     (button, hover, offscreen, background tab) freezes the clock for free. */
  (function () {
  var hs = $('[data-hs]');
  if (!hs) return;
    var slides = $$('.hs-slide', hs), copies = $$('[data-hs-copy] > *', hs), segs = $$('.hs-seg, .hs-tab', hs);
    var pauseBtn = $('#hsPause'), count = $('[data-hs-count]', hs);
    var HS_MS = +(hs.getAttribute('data-hs-ms') || 7000), cur = 0, why = {};
    hs.style.setProperty('--hs-ms', HS_MS + 'ms');
    var setPaused = function (k, v) { why[k] = v; hs.classList.toggle('paused', Object.keys(why).some(function (x) { return why[x]; })); };
    var hide = function (el, off) { if (!el) return; if (off) { el.setAttribute('aria-hidden', 'true'); el.setAttribute('inert', ''); } else { el.removeAttribute('aria-hidden'); el.removeAttribute('inert'); } };
    copies.forEach(function (c, k) { hide(c, k !== 0); });
    // Photos load one step ahead: slide 2 after page load, then each next slide as the previous one shows.
    var hydrate = function (k) {
      var sl = slides[(k + slides.length) % slides.length];
      $$('[data-srcset]', sl).forEach(function (e) { e.srcset = e.getAttribute('data-srcset'); e.removeAttribute('data-srcset'); });
      var im = $('img[data-src]', sl); if (im) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); }
    };
    if (document.readyState === 'complete') setTimeout(function () { hydrate(1); }, 300);
    else addEventListener('load', function () { setTimeout(function () { hydrate(1); }, 300); });

    var go = function (i) {
      i = (i + slides.length) % slides.length;
      if (i === cur) return;
      slides.forEach(function (s) { s.classList.remove('prev'); });
      hydrate(i); hydrate(i + 1);
      var old = slides[cur], nxt = slides[i];
      old.classList.remove('active'); old.classList.add('prev'); old.setAttribute('aria-hidden', 'true');
      nxt.classList.add('active'); nxt.removeAttribute('aria-hidden');
      var img = $('img', nxt); img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      setTimeout(function () { if (!old.classList.contains('active')) old.classList.remove('prev'); }, 1450);
      copies.forEach(function (c, k) { c.classList.toggle('active', k === i); hide(c, k !== i); });
      segs.forEach(function (s, k) {
        s.classList.remove('on'); s.classList.toggle('done', k < i);
        if (k === i) s.setAttribute('aria-current', 'true'); else s.removeAttribute('aria-current');
      });
      if (segs[i]) { void segs[i].offsetWidth; segs[i].classList.add('on'); }
      if (count) count.textContent = (i < 9 ? '0' : '') + (i + 1);
      cur = i;
    };
    var advance = function () {
      var nextImg = $('img', slides[(cur + 1) % slides.length]);
      if (nextImg.complete && nextImg.naturalWidth) go(cur + 1);
      else nextImg.addEventListener('load', function () { go(cur + 1); }, { once: true });
    };
    segs.forEach(function (s, k) {
      var bar = $('i', s);
      if (bar) bar.addEventListener('animationend', function () { if (s.classList.contains('on')) advance(); });
      s.addEventListener('click', function () { go(k); });
    });
    $$('[data-hs-prev]', hs).forEach(function (b) { b.addEventListener('click', function () { go(cur - 1); }); });
    $$('[data-hs-next]', hs).forEach(function (b) { b.addEventListener('click', function () { go(cur + 1); }); });
    hs.addEventListener('keydown', function (e) {
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === 'ArrowRight') go(cur + 1);
      if (e.key === 'ArrowLeft') go(cur - 1);
    });
    var tx = null;
    hs.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    hs.addEventListener('touchend', function (e) {
      if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });

    // Reduced motion: no autoplay; tabs/arrows still switch photos by hand.
    if (pauseBtn) {
      if (reduceMotion) pauseBtn.hidden = true;
      pauseBtn.setAttribute('aria-pressed', 'false');
      pauseBtn.addEventListener('click', function () {
        var p = pauseBtn.getAttribute('aria-pressed') !== 'true';
        pauseBtn.setAttribute('aria-pressed', String(p));
        pauseBtn.setAttribute('aria-label', p ? 'Play slideshow' : 'Pause slideshow');
        setPaused('user', p);
      });
    }
    if (!reduceMotion) hs.classList.add('playing');
    var holds = $$('[data-hs-hold]', hs); if (!holds.length) holds = [hs];
    holds.forEach(function (h) {
      h.addEventListener('mouseenter', function () { setPaused('hover', true); });
      h.addEventListener('mouseleave', function () { setPaused('hover', false); });
    });
    hs.addEventListener('focusin', function () { setPaused('focus', true); });
    hs.addEventListener('focusout', function () { setPaused('focus', false); });
    document.addEventListener('visibilitychange', function () { setPaused('tab', document.hidden); });
    if (hasIO) new IntersectionObserver(function (e) { setPaused('off', !e[0].isIntersecting); }, { threshold: 0.2 }).observe(hs);
  })();

  /* ---------- Live Regina temperature (Open-Meteo, no API key) ----------
     Falls back to the −34°C design temperature already in the HTML if the request fails. */
  var wxTemp = $('#wxTemp');
  if (wxTemp && window.fetch) {
    var WX_URL = 'https://api.open-meteo.com/v1/forecast?latitude=50.4452&longitude=-104.6189&current=temperature_2m,apparent_temperature&timezone=America%2FRegina';
    var fmt = function (n) { n = Math.round(n); return (n < 0 ? '−' + Math.abs(n) : n) + '°C'; };
    var paint = function (c) {
      wxTemp.textContent = fmt(c.temperature_2m);
      $('#wxLabel').innerHTML = '<span class="live" aria-hidden="true"></span>Regina right now';
      $('#wxFeels').textContent = 'Feels like ' + fmt(c.apparent_temperature);
    };
    var loadWx = function () {
      try { // reuse a reading from the last 10 minutes
        var s = JSON.parse(sessionStorage.getItem('wx') || 'null');
        if (s && Date.now() - s.t < 600000) { paint(s.c); return; }
      } catch (e) {}
      fetch(WX_URL).then(function (r) { if (!r.ok) throw r; return r.json(); }).then(function (d) {
        if (!d.current || typeof d.current.temperature_2m !== 'number') return;
        paint(d.current);
        try { sessionStorage.setItem('wx', JSON.stringify({ t: Date.now(), c: d.current })); } catch (e) {}
      }).catch(function () { /* keep design-temp fallback */ });
    };
    loadWx(); setInterval(loadWx, 900000);
  }

  /* ---------- Header ---------- */
  var nav = $('#nav'), burger = $('#burger'), mcall = $('.mcall');
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', y > 10);
      if (mcall) mcall.classList.toggle('show', y > 320);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeMenu() { if (!nav) return; nav.classList.remove('open'); burger && burger.setAttribute('aria-expanded', 'false'); }
  if (burger) {
    burger.addEventListener('click', function () {
      var o = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(o));
      burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu');
    });
    $$('.nav-links a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Scroll reveals ---------- */
  var revealEls = $$('.rv, .rv-img, .stats, .radar');
  if (hasIO && !reduceMotion) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-countwrap')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Count-up numbers ---------- */
  function countUp(wrap) {
    $$('[data-count]', wrap).forEach(function (el, i) {
      var end = +el.getAttribute('data-count'), start = +(el.getAttribute('data-from') || 0);
      var dur = 1400, t0 = null, node = el.firstChild;
      setTimeout(function () {
        function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
          node.nodeValue = Math.round(start + (end - start) * e);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }, i * 110);
    });
  }

  /* ---------- Pause infinite loops while offscreen ---------- */
  if (hasIO) {
    var loopIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('offscreen', !e.isIntersecting); });
    });
    $$('[data-loop]').forEach(function (el) { loopIO.observe(el); });
  }

  /* ---------- Services tabs (home) ---------- */
  var svc = $('.svc');
  if (svc) {
    var tabs = $$('[role=tab]', svc), panels = $$('[role=tabpanel]', svc);
    var cur = 0, timer = null, stopped = reduceMotion, visible = false;
    var MS = 6000;
    svc.style.setProperty('--svc-ms', MS + 'ms');
    function show(i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === cur;
        t.parentNode.classList.toggle('active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle('active', on);
        panels[k].setAttribute('aria-hidden', String(!on));
        if (!on) panels[k].setAttribute('inert', ''); else panels[k].removeAttribute('inert');
      });
      if (focus) tabs[cur].focus();
      // warm up the next image so autoplay never shows a blank panel
      var next = panels[(cur + 1) % panels.length].querySelector('img');
      if (next && next.loading === 'lazy') next.loading = 'eager';
      restartProgress();
    }
    function restartProgress() {
      var b = tabs[cur]; svc.classList.remove('auto'); void b.offsetWidth;
      if (!stopped && visible) svc.classList.add('auto');
    }
    function play() {
      clearInterval(timer);
      if (stopped || !visible) return;
      svc.classList.add('auto');
      timer = setInterval(function () { if (!svc.classList.contains('paused')) show(cur + 1); }, MS);
    }
    function stop() { stopped = true; clearInterval(timer); svc.classList.remove('auto'); }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { stop(); show(k); });
      t.addEventListener('mouseenter', function () { if (matchMedia('(hover:hover)').matches) { stop(); show(k); } });
      t.addEventListener('keydown', function (e) {
        var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); stop(); show(cur + d, true); }
        if (e.key === 'Home') { e.preventDefault(); stop(); show(0, true); }
        if (e.key === 'End') { e.preventDefault(); stop(); show(tabs.length - 1, true); }
      });
    });
    svc.addEventListener('focusin', function () { svc.classList.add('paused'); });
    svc.addEventListener('focusout', function () { svc.classList.remove('paused'); });
    $('.svc-stage', svc).addEventListener('mouseenter', function () { svc.classList.add('paused'); });
    $('.svc-stage', svc).addEventListener('mouseleave', function () { svc.classList.remove('paused'); });
    document.addEventListener('visibilitychange', function () { svc.classList.toggle('paused', document.hidden); });
    show(0);
    if (hasIO) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? (play(), restartProgress()) : clearInterval(timer); }, { threshold: 0.35 }).observe(svc);
    }
  }

  /* ---------- Prefill form (CTA data attributes / ?service= from service pages) ---------- */
  var form = $('#form');
  function setType(v) { var r = form && form.querySelector('input[name=ptype][value="' + v + '"]'); if (r) r.checked = true; }
  function setService(v) { var s = form && form.elements.service; if (s && [].some.call(s.options, function (o) { return o.value === v; })) s.value = v; }
  $$('[data-type]').forEach(function (a) { a.addEventListener('click', function () { setType(a.getAttribute('data-type')); }); });
  $$('[data-service]').forEach(function (a) { a.addEventListener('click', function () { setService(a.getAttribute('data-service')); }); });
  try {
    var qs = new URLSearchParams(location.search);
    if (qs.get('service')) setService(qs.get('service'));
    if (qs.get('type')) setType(qs.get('type'));
  } catch (e) {}

  /* ---------- Form validation + submit ---------- */
  if (form) {
    var rules = {
      name: function (v) { return v.trim().length > 1; },
      phone: function (v) { return v.replace(/\D/g, '').length >= 10; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      service: function (v) { return !!v; },
      message: function (v) { return v.trim().length >= 10; }
    };
    var ok = $('#success'), bad = $('#error'), btn = form.querySelector('button[type=submit]');
    function check(el, shake) {
      var good = rules[el.name](el.value), f = el.closest('.field');
      f.classList.toggle('invalid', !good);
      el.setAttribute('aria-invalid', String(!good));
      if (!good && shake && !reduceMotion) { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
      return good;
    }
    Object.keys(rules).forEach(function (n) {
      var el = form.elements[n];
      el.addEventListener('blur', function () { if (el.value) check(el); });
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('invalid')) check(el); });
      el.addEventListener('change', function () { if (el.closest('.field').classList.contains('invalid')) check(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      Object.keys(rules).forEach(function (n) { var el = form.elements[n]; if (!check(el, true) && !first) first = el; });
      if (first) { first.focus(); return; }
      ok.classList.remove('show'); bad.classList.remove('show');
      btn.disabled = true; btn.classList.add('loading');
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (r) { if (!r.ok) throw new Error(r.status); ok.classList.add('show'); form.reset(); })
        .catch(function () { bad.classList.add('show'); btn.disabled = false; })
        .then(function () { btn.classList.remove('loading'); (ok.classList.contains('show') ? ok : bad).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); });
    });
  }

  /* ---------- Map: load Google Maps only when asked ---------- */
  var mapBtn = $('#loadMap');
  if (mapBtn) mapBtn.addEventListener('click', function () {
    var box = mapBtn.closest('.map'), f = document.createElement('iframe');
    f.title = 'Map to Momentum HVAC, 1411 1st Ave, Regina';
    f.src = 'https://maps.google.com/maps?q=1411%201st%20Ave%2C%20Regina%2C%20SK%20S4R%208H2&z=14&output=embed';
    f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    box.appendChild(f);
    $('.map-facade', box).remove();
  });

  /* ---------- Team filter ---------- */
  var chips = $$('.chip');
  if (chips.length) {
    var techs = $$('.tech'), groups = $$('.tgroup');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-f');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        groups.forEach(function (g) { var isApp = g.getAttribute('data-g') === 'app'; g.classList.toggle('hidden', f !== 'all' && (f === 'app' ? !isApp : isApp)); });
        techs.forEach(function (t) { var ts = t.getAttribute('data-t').split(' '); t.classList.toggle('dim', f !== 'all' && f !== 'app' && ts.indexOf(f) < 0); });
      });
    });
  }
})();
