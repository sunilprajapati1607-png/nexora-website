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
    location: ['Ahmedabad, Gujarat', 'Vapi, Gujarat', 'Indore, Madhya Pradesh', 'Kanpur, Uttar Pradesh', 'Kolkata, West Bengal', 'Hyderabad, Telangana'],
    website: ['www.example.com', 'www.example.in'],
    productOther: ['Jumbo bags (FIBC)', 'Leno bags', 'Tarpaulin', 'Laminated fabric rolls', 'LDPE liners'],
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
      /* a tick's value is the product's name: it is unticked, never emptied */
      if (el.type === 'checkbox') { el.checked = false; return; }
      el.value = '';
      el.setAttribute('autocomplete', 'off');
      var k = el.getAttribute('data-ph');
      if (k && EX[k]) el.placeholder = 'e.g. ' + pick(EX[k]);
    });
    $$('select', form).forEach(function (s) { s.selectedIndex = 0; });
    $$('.tick', form).forEach(function (t) { t.classList.remove('on'); });
    showOther(form);
    clearErrors(form);
    busy(form, false);
    var st = $('.form-status', form); if (st) { st.className = 'form-status'; st.textContent = ''; }
  }

  /* 4.73.0 — "all information are mandatory": EVERY FIELD IS REQUIRED, the
     new three included (manufacturing location, website, product range) —
     except the e-mail (the owner, 2 Oct 2026: kept, not required; one typed
     must still be a plain address). What is missing is said on the field
     itself, in the site's red, and the first one is brought into view. The
     service checks the same (form: 2) and anything it calls missing is said
     the same way. */
  var NEED = {
    name: 'Please enter your name.',
    company: 'Please enter your company or plant name.',
    phone: 'Please enter your WhatsApp / mobile number.',
    location: 'Please enter your manufacturing location — city and state.',
    website: 'Please enter your company website.',
    products: 'Please tick at least one product in your range.',
    productOther: 'Please write your other products.',
    interest: 'Please choose what you are interested in.',
    message: 'Please write a short message.'
  };
  var ORDER = ['name', 'company', 'phone', 'email', 'location', 'website', 'products', 'productOther', 'interest', 'message'];
  /* the service's own rule for an address it keeps (register.js plainEmail) */
  var PLAIN_EMAIL = /^[A-Za-z0-9._+'-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/;

  function problems(form, d) {
    var out = [];
    ORDER.forEach(function (k) {
      if (!$('[name="' + k + '"]', form)) return;
      var msg = null;
      if (k === 'products') { if (!d.products.length) msg = NEED.products; }
      else if (k === 'productOther') { if (d.products.indexOf('Other') >= 0 && !d.productOther) msg = NEED.productOther; }
      else if (k === 'email') { if (d.email && (d.email.length > 160 || !PLAIN_EMAIL.test(d.email))) msg = 'Please enter a valid email address, like name@company.com — or leave it empty.'; }
      else if (!d[k]) msg = NEED[k];
      else if (k === 'phone' && d.phone.replace(/\D/g, '').length < 10) msg = 'Please enter a valid mobile number with at least 10 digits.';
      if (msg) out.push([k, msg]);
    });
    return out;
  }
  function boxOf(form, name) {
    var el = $('[name="' + name + '"]', form);
    return el ? el.closest('.field') : null;
  }
  function setError(form, name, msg) {
    var box = boxOf(form, name);
    if (!box) return false;
    box.hidden = false;
    box.classList.add('has-err');
    var m = $('.field-err', box);
    if (!m) {
      m = document.createElement('div');
      m.className = 'field-err';
      m.id = (form.id || 'nx') + '_' + name + '_err';
      box.appendChild(m);
    }
    m.textContent = msg;
    $$('input, select, textarea', box).forEach(function (el) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', m.id); });
    return true;
  }
  function clearError(box) {
    if (!box || !box.classList.contains('has-err')) return;
    box.classList.remove('has-err');
    var m = $('.field-err', box); if (m) m.parentNode.removeChild(m);
    $$('input, select, textarea', box).forEach(function (el) { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
    /* the last one put right: the red line by the buttons goes too */
    var form = box.closest('form'), st = form && $('.form-status.err', form);
    if (st && !$('.field.has-err', form)) { st.className = 'form-status'; st.textContent = ''; }
  }
  function clearErrors(form) { $$('.field.has-err', form).forEach(clearError); }
  function focusField(form, name) {
    var el = $('[name="' + name + '"]', form);
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    var box = el.closest('.field') || el;
    try { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { box.scrollIntoView(); }
  }
  /* "Other" ticked opens a box for what else the plant makes, and that box is then required */
  function showOther(form) {
    var tick = $('[data-other]', form), box = $('[data-other-box]', form);
    if (!tick || !box) return;
    box.hidden = !tick.checked;
    if (!tick.checked) clearError(box);
  }
  function busy(form, on) {
    if (on) form.setAttribute('data-busy', '1'); else form.removeAttribute('data-busy');
    $$('[data-send]', form).forEach(function (b) { b.disabled = !!on; });
  }
  function say(st, kind, text) { if (st) { st.className = 'form-status ' + kind; st.textContent = text; } }

  $$('form.nx-form').forEach(function (f) {
    freshForm(f);
    f.setAttribute('autocomplete', 'off');
    f.addEventListener('submit', function (e) { e.preventDefault(); });
    $$('[data-send]', f).forEach(function (b) {
      b.addEventListener('click', function () { sendForm(f, b.getAttribute('data-send')); });
    });
    /* a field's message goes as soon as it is filled in */
    f.addEventListener('input', function (e) { if (e.target.closest) clearError(e.target.closest('.field')); });
    f.addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'checkbox') {
        var lab = t.closest('.tick'); if (lab) lab.classList.toggle('on', t.checked);
        if (t.hasAttribute('data-other')) showOther(f);
      }
      if (t.closest) clearError(t.closest('.field'));
    });
  });
  // some browsers restore values on back/forward cache — clear again
  window.addEventListener('pageshow', function () { $$('form.nx-form').forEach(freshForm); });

  var FORMSPREE = 'https://formspree.io/f/xzebyndo';
  /* The enquiry also goes straight into Nexora's own console, where it can be
     answered, followed up and counted. Formspree stays as it was: it is the
     copy that reaches a human inbox even if the service happens to be asleep. */
  var NEXORA_API = 'https://nexora-api-55jv.onrender.com/enquiry';
  /* 4.73.0 — how long the visitor waits for the service's answer before
     WhatsApp or the mail app opens anyway. It only ever says "this field is
     missing" (400 MISSING); asleep, slow or unreachable, it changes nothing
     about what the visitor sees, as before. Kept under the five seconds a
     browser still counts the click as the visitor's (so the new window is
     not taken for a pop-up). */
  var WAIT_MS = 3000;
  function collect(form) {
    var d = { products: [] };
    $$('input, select, textarea', form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') { if (el.checked && el.name === 'products') d.products.push(el.value); return; }
      d[el.name] = (el.value || '').trim();
    });
    if (d.products.indexOf('Other') < 0) d.productOther = '';
    return d;
  }
  /* "BOPP bags, Tape, Other (Jumbo bags)" — for WhatsApp, the mail and the inbox copy */
  function productText(d) {
    return d.products.map(function (p) { return p === 'Other' && d.productOther ? 'Other (' + d.productOther + ')' : p; }).join(', ');
  }
  function notify(d, channel) {
    try {
      fetch(FORMSPREE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        keepalive: true,   /* 4.73.0 — still sent when this tab itself goes on to WhatsApp */
        body: JSON.stringify({
          name: d.name, company: d.company, phone: d.phone, email: d.email || '', interest: d.interest || '', message: d.message || '',
          location: d.location || '', website: d.website || '', products: productText(d),
          channel_chosen: channel, source_page: location.href,
          _subject: 'Nexora enquiry — ' + (d.company || d.name)
        })
      }).catch(function () {});
    } catch (e) {}
  }
  /* The service's copy, sent first. Resolves with its answer when that is a
     400 naming a field (form: 2 — {error:'MISSING', field, message}), and
     with null for anything else: stored, throttled, asleep, unreachable, or
     no answer within WAIT_MS. The request itself is never cut off — a slow
     service still gets the enquiry (keepalive: even if the page moves on). */
  function askService(d, channel) {
    return new Promise(function (resolve) {
      var settled = false, timer = null;
      function done(v) { if (settled) return; settled = true; clearTimeout(timer); resolve(v); }
      timer = setTimeout(function () { done(null); }, WAIT_MS);
      try {
        fetch(NEXORA_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            name: d.name, company: d.company, phone: d.phone, email: d.email || '',
            interest: d.interest || '', message: d.message || '',
            channel_chosen: channel, source_page: location.href,
            _gotcha: d._gotcha || '',
            form: 2,
            location: d.location || '', website: d.website || '',
            products: d.products, productOther: d.productOther || ''
          })
        }).then(function (r) {
          return r.status === 400 ? r.json().catch(function () { return null; }) : null;
        }).then(function (j) {
          done(j && j.field && j.message ? j : null);
        }, function () { done(null); });
      } catch (e) { done(null); }
    });
  }
  function sendForm(form, channel) {
    if (form.getAttribute('data-busy')) return;
    var st = $('.form-status', form);
    var d = collect(form);
    clearErrors(form);
    var bad = problems(form, d);
    if (bad.length) {
      bad.forEach(function (p) { setError(form, p[0], p[1]); });
      say(st, 'err', bad.length === 1 ? bad[0][1] : 'Please fill the fields marked in red — every field with a * is required.');
      focusField(form, bad[0][0]);
      return;
    }
    if (d._gotcha) return; // honeypot
    busy(form, true);
    say(st, 'wait', 'Sending…');
    askService(d, channel).then(function (ans) {
      busy(form, false);
      if (ans) {
        var field = ans.field === 'product_other' ? 'productOther' : String(ans.field);
        /* the service's words on the first; any others it lists in the page's own words */
        (Array.isArray(ans.fields) ? ans.fields : []).forEach(function (f) { if (f !== field && NEED[f]) setError(form, f, NEED[f]); });
        say(st, 'err', String(ans.message));
        if (setError(form, field, String(ans.message))) focusField(form, field);
        return;
      }
      deliver(form, d, channel);
    });
  }
  function deliver(form, d, channel) {
    var st = $('.form-status', form);
    notify(d, channel);
    var lines = ['Name: ' + d.name, 'Company: ' + d.company, 'Mobile: ' + d.phone];
    if (d.email) lines.push('Email: ' + d.email);
    if (d.location) lines.push('Manufacturing location: ' + d.location);
    if (d.website) lines.push('Website: ' + d.website);
    if (d.products.length) lines.push('Product range: ' + productText(d));
    if (d.interest) lines.push('Interested in: ' + d.interest);
    if (d.message) lines.push('Message: ' + d.message);
    lines.push('Page: ' + location.href);
    if (channel === 'whatsapp') {
      var text = '*New Nexora enquiry (nexoraofficial.org)*\n\n' + lines.join('\n');
      var wa = 'https://wa.me/919213415996?text=' + encodeURIComponent(text);
      /* opened after the service's answer: if the browser still takes it for
         a pop-up and refuses, this tab goes to WhatsApp instead */
      var w = null;
      try { w = window.open(wa, '_blank'); } catch (e) { w = null; }
      if (w) { try { w.opener = null; } catch (e) {} } else location.href = wa;
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
    /* light / dark on a feature screenshot — the toggle must not open the lightbox */
    function setMode(fig, mode) {
      fig.classList.toggle('dark', mode === 'dark');
      $$('.shot-toggle button', fig).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mode') === mode); });
    }
    $$('.shot-toggle button').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); setMode(b.closest('.shot-dual'), b.getAttribute('data-mode')); });
    });
    $$('[data-theme-all]').forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.getAttribute('data-theme-all');
        $$('[data-theme-all]').forEach(function (x) { x.classList.toggle('on', x === b); });
        $$('.shot-dual').forEach(function (fig) { setMode(fig, mode); });
      });
    });
    $$('[data-zoom]').forEach(function (fig) {
      fig.addEventListener('click', function () {
        var img = fig.tagName === 'IMG' ? fig : (fig.classList.contains('dark') ? $('img.mode-dark', fig) : ($('img', fig).filter(function (i) { return i.offsetParent !== null; })[0] || $('img', fig)));
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
