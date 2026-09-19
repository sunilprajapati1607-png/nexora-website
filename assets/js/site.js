/* Nexora site scripts — no dependencies */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Theme ---------- */
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('nexora-theme', t); } catch (e) {}
  }
  var themeBtn = $('#themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Mobile nav ---------- */
  var body = document.body;
  function openNav(open) {
    body.classList.toggle('nav-open', open);
    var t = $('#navToggle'); if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  var navToggle = $('#navToggle'), navClose = $('#navClose');
  if (navToggle) navToggle.addEventListener('click', function () { openNav(!body.classList.contains('nav-open')); });
  if (navClose) navClose.addEventListener('click', function () { openNav(false); });

  /* ---------- Dropdowns ---------- */
  $$('.nav .has-dd').forEach(function (li) {
    var btn = $('.navbtn', li);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      // desktop: hover already opened it, so a click keeps it open; mobile: toggle
      var isOpen = li.classList.contains('open') && window.innerWidth <= 1100;
      $$('.nav .has-dd.open').forEach(function (o) { o.classList.remove('open'); $('.navbtn', o).setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });
    // desktop hover — a short close delay so the cursor can travel from the
    // button down into the menu without the menu vanishing under it
    var closeTimer = null;
    function openIt() { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } li.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    function closeSoon() {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(function () { li.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); closeTimer = null; }, 260);
    }
    li.addEventListener('mouseenter', function () { if (window.innerWidth > 1100) openIt(); });
    li.addEventListener('mouseleave', function () { if (window.innerWidth > 1100) closeSoon(); });
    li.addEventListener('focusin', function () { if (window.innerWidth > 1100) openIt(); });
    li.addEventListener('focusout', function (e) { if (window.innerWidth > 1100 && !li.contains(e.relatedTarget)) closeSoon(); });
  });
  document.addEventListener('click', function () {
    $$('.nav .has-dd.open').forEach(function (o) { o.classList.remove('open'); $('.navbtn', o).setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { openNav(false); closeDemo(); closeLightbox(); $$('.nav .has-dd.open').forEach(function (o) { o.classList.remove('open'); }); }
  });

  /* ---------- Active nav ---------- */
  (function () {
    var p = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
    if (p.length > 1) p = p.replace(/\/$/, '');
    $$('.nav a[data-nav]').forEach(function (a) {
      var v = a.getAttribute('data-nav');
      if (v === p) a.classList.add('active');
    });
    $$('.nav li[data-nav]').forEach(function (li) {
      if (p.indexOf(li.getAttribute('data-nav')) === 0) li.classList.add('active');
    });
  })();

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.01, rootMargin: '0px 0px -4% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
    // safety net: anything still hidden after load becomes visible
    setTimeout(function () { $$('.reveal:not(.in)').forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('in'); }); }, 1200);
  } else { body.classList.add('js-off'); }

  /* ---------- Forms: always empty, fresh example placeholders ---------- */
  var EX = {
    name: ['Ramesh Patel', 'Priya Shah', 'Amit Desai', 'Kiran Mehta', 'Suresh Agarwal', 'Neha Joshi', 'Vikram Jain', 'Hardik Modi'],
    company: ['Northpoint Polymers', 'Blue River Packaging', 'Crestline Flexipack', 'Harbour Mills Packaging', 'Greenfield Sacks Co.', 'Meridian Polyfab', 'Stonebridge Woven Sacks', 'Fairwind Packaging'],
    phone: ['+91 90000 00001', '+91 90000 00002', '+91 90000 00003', '+91 90000 00004', '+91 90000 00005'],
    email: ['purchase@example.com', 'director@example.in', 'accounts@example.com', 'info@example.in'],
    message: [
      'We run 24 circular looms and want to forecast RM cost per order.',
      'Looking for an ERP that covers order to dispatch for our PP woven sack unit.',
      'Need roll-wise fabric traceability and stock reporting.',
      'Want a demo on our own BOPP block-bottom bag spec.',
      'Need attendance and piece-rate payroll for around 150 workers.'
    ]
  };
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function freshForm(form) {
    if (!form) return;
    form.reset();
    $$('input, textarea', form).forEach(function (el) {
      if (el.type === 'hidden') return;
      el.value = '';
      el.setAttribute('autocomplete', 'off');
      var k = el.getAttribute('data-ph');
      if (k && EX[k]) el.placeholder = 'e.g. ' + pick(EX[k]);
    });
    $$('select', form).forEach(function (s) { s.selectedIndex = 0; });
    var st = $('.form-status', form); if (st) { st.className = 'form-status'; st.textContent = ''; }
  }
  $$('form.nx-form').forEach(function (f) {
    freshForm(f);
    f.setAttribute('autocomplete', 'off');
    f.addEventListener('submit', function (e) { e.preventDefault(); });
    $$('[data-send]', f).forEach(function (b) {
      b.addEventListener('click', function () { sendForm(f, b.getAttribute('data-send')); });
    });
  });
  // some browsers restore values on back/forward cache — clear again
  window.addEventListener('pageshow', function () { $$('form.nx-form').forEach(freshForm); });

  var FORMSPREE = 'https://formspree.io/f/xzebyndo';
  /* The enquiry also goes straight into Nexora's own console, where it can be
     answered, followed up and counted. Formspree stays as it was: it is the
     copy that reaches a human inbox even if the service happens to be asleep. */
  var NEXORA_API = 'https://nexora-api-55jv.onrender.com/enquiry';
  function collect(form) {
    var d = {};
    $$('input, select, textarea', form).forEach(function (el) { if (el.name) d[el.name] = (el.value || '').trim(); });
    return d;
  }
  function notify(d, channel) {
    try {
      fetch(FORMSPREE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: d.name, company: d.company, phone: d.phone, email: d.email || '', interest: d.interest || '', message: d.message || '',
          channel_chosen: channel, source_page: location.href,
          _subject: 'Nexora enquiry — ' + (d.company || d.name)
        })
      }).catch(function () {});
    } catch (e) {}
    /* Fire and forget, exactly like the one above: the visitor is never kept
       waiting on it, and a service that is asleep or unreachable changes
       nothing about what they see. */
    try {
      fetch(NEXORA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.name, company: d.company, phone: d.phone, email: d.email || '',
          interest: d.interest || '', message: d.message || '',
          channel_chosen: channel, source_page: location.href,
          _gotcha: d._gotcha || ''
        })
      }).catch(function () {});
    } catch (e) {}
  }
  function sendForm(form, channel) {
    var st = $('.form-status', form);
    if (!form.checkValidity()) {
      form.reportValidity();
      if (st) { st.className = 'form-status err'; st.textContent = 'Please fill your name, company and mobile number.'; }
      return;
    }
    var d = collect(form);
    if (d._gotcha) return; // honeypot
    var phoneDigits = d.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) { if (st) { st.className = 'form-status err'; st.textContent = 'Please enter a valid mobile number with at least 10 digits.'; } return; }
    notify(d, channel);
    var lines = ['Name: ' + d.name, 'Company: ' + d.company, 'Mobile: ' + d.phone];
    if (d.email) lines.push('Email: ' + d.email);
    if (d.interest) lines.push('Interested in: ' + d.interest);
    if (d.message) lines.push('Message: ' + d.message);
    lines.push('Page: ' + location.href);
    if (channel === 'whatsapp') {
      var text = '*New Nexora enquiry (nexoraofficial.org)*\n\n' + lines.join('\n');
      window.open('https://wa.me/917567161607?text=' + encodeURIComponent(text), '_blank', 'noopener');
    } else {
      var subject = 'Nexora enquiry — ' + d.company;
      var bodyTxt = lines.join('\n') + '\n\nPlease arrange a walkthrough for our plant.';
      location.href = 'mailto:info@nexoraofficial.org?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyTxt);
    }
    var okMsg = 'Thanks ' + d.name.split(' ')[0] + ' — your request is on its way. We reply within one business day.';
    if (st) { st.className = 'form-status ok'; st.textContent = okMsg; }
    setTimeout(function () {
      freshForm(form);
      if (form.id === 'demoForm') { closeDemo(); return; }
      // contact page: keep the confirmation readable for a while after the fields clear
      if (st) { st.className = 'form-status ok'; st.textContent = okMsg; setTimeout(function () { st.className = 'form-status'; st.textContent = ''; }, 12000); }
    }, 1600);
  }

  /* ---------- Demo modal ---------- */
  var demoModal = $('#demoModal');
  function openDemo(interest) {
    if (!demoModal) return;
    var f = $('#demoForm'); freshForm(f);
    if (interest) { var sel = $('#dm_interest'); if (sel) { for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].value === interest) { sel.selectedIndex = i; break; } } } }
    demoModal.classList.add('open'); demoModal.setAttribute('aria-hidden', 'false');
    openNav(false);
    setTimeout(function () { var n = $('#dm_name'); if (n) n.focus(); }, 60);
  }
  function closeDemo() { if (!demoModal) return; demoModal.classList.remove('open'); demoModal.setAttribute('aria-hidden', 'true'); }
  $$('[data-open-demo]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openDemo(b.getAttribute('data-interest')); }); });
  $$('[data-close-demo]').forEach(function (b) { b.addEventListener('click', closeDemo); });
  if (demoModal) demoModal.addEventListener('click', function (e) { if (e.target === demoModal) closeDemo(); });
  if (location.hash === '#demo') openDemo();

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lightboxImg');
  function closeLightbox() { if (lb) { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); } }
  if (lb) {
    lb.addEventListener('click', closeLightbox);
    $$('[data-zoom]').forEach(function (fig) {
      fig.addEventListener('click', function () {
        var img = fig.tagName === 'IMG' ? fig : $('img', fig);
        if (!img) return;
        lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt || '';
        lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      });
    });
  }

  function num(id, d) { var el = $('#' + id); if (!el) return d || 0; var v = parseFloat(el.value); return isNaN(v) ? (d || 0) : v; }
  function txt(id, v) { var el = $('#' + id); if (el) el.textContent = v; }

  /* ---------- Order RM & cost forecast (illustrative) ---------- */
  function fmtInr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function fmtKg(n) { return n.toFixed(1) + ' kg'; }
  function runForecast() {
    if (!$('#f_qty')) return;
    var qty = num('f_qty'), bagG = num('f_bag'), waste = num('f_waste'), mbPct = num('f_mb'), ppRate = num('f_pp'), mbRate = num('f_mbrate'), convRate = num('f_conv');
    var netKg = qty * bagG / 1000;
    var grossKg = netKg * (1 + waste / 100);
    var mbKg = grossKg * mbPct / 100;
    var ppKg = grossKg - mbKg;
    var matCost = ppKg * ppRate + mbKg * mbRate;
    var convCost = grossKg * convRate;
    var total = matCost + convCost;
    txt('f_net', fmtKg(netKg));
    txt('f_gross', fmtKg(grossKg));
    txt('f_grossbig', grossKg.toFixed(1));
    txt('f_ppkg', fmtKg(ppKg));
    txt('f_mbkg', fmtKg(mbKg));
    txt('f_mat', fmtInr(matCost));
    txt('f_convc', fmtInr(convCost));
    txt('f_total', fmtInr(total));
    txt('f_perbag', '₹' + (qty ? total / qty : 0).toFixed(3));
    txt('f_wastekg', fmtKg(grossKg - netKg));
  }
  $$('#f_qty, #f_bag, #f_waste, #f_mb, #f_pp, #f_mbrate, #f_conv').forEach(function (el) {
    el.addEventListener('input', function () { if (el.id === 'f_bag') el.dataset.touched = '1'; runForecast(); });
  });
  window.nxForecast = runForecast;
  runForecast();

  /* ---------- Header shadow ---------- */
  var hdr = $('#siteHeader');
  window.addEventListener('scroll', function () { if (hdr) hdr.style.boxShadow = window.scrollY > 8 ? '0 6px 24px -12px rgba(15,23,42,.25)' : 'none'; }, { passive: true });
})();
