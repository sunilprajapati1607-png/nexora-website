/* Nexora — Easy Cost: the trade's quick estimate, on the GRAM
   ======================================================================
   Two sums the woven bag trade already does on the back of an envelope,
   written out so a buyer can do them in ten seconds:

     PP woven
       fabric  = width × gram × (length + stitching) ÷ 39.37 + thread
       lam     = width × 0.5  × (length + stitching) ÷ 39.37
       cost    = fabric×rate/1000 + lam×lamRate/1000 + print + fixed + jumbo

     BOPP laminated, both sides
       plain   = width × gram ÷ 39.37 × (length + stitching) + thread
       coating = width × 0.70 ÷ 39.37 × (length + stitching)
       film    = width×25.4 × cut×25.4 × density × micron × sides ÷ 1e6 + trim
       price   = fabric + coating + film + liner + stitching + making + profit

   THE GRAM, NOT THE GSM. The trade's "gram" (2.5 – 4.5) is not g/m². It is
   the shop-floor figure the whole formula is built on, and nothing here
   converts it — a visitor who says "three and a half gram" gets the answer
   to the question they asked.

   EVERY RATE ON THIS PAGE IS A SAMPLE. They are round, illustrative
   numbers so that nobody mistakes them for a rate card, they are all
   editable in the open on the page, and the page says so twice. A real
   cost comes from a plant's own dated prices, its own waste and its own
   route — which is what the Nexora desktop engine is for, and it is a
   different piece of arithmetic altogether. */
(function () {
  'use strict';
  var root = document.getElementById('nxEasy');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

  var IN_PER_M = 39.37;
  var MM_PER_IN = 25.4;

  /* ---- SAMPLE rates. Round on purpose. ---------------------------- */
  var R = {
    pp: {
      quality: { janta: 120, silver: 130, gold: 140, natural: 180 },
      lamination: { none: 0, natural: 200, milky: 130 },
      printing: { none: 0, one_side: 0.8, two_side: 1.1 },
      gramAdj: { '2.5': 0, '3': -1, '3.5': -1, '4': -2, '4.5': -2 },
      width19: 1,
      maxiAdd: 10, maxiFrom: 36,
      lamGram: 0.5, thread: 1, stitch: 1,
      fixed: 1.5, jumboAdd: 3, jumboFrom: 36,
      strength: {
        silver: { '2.5': 35, '3': 42, '3.5': 48, '4': 52, '4.5': 55 },
        gold: { '2.5': 45, '3': 55, '3.5': 60, '4': 70, '4.5': 80 }
      },
      strengthMax: 82
    },
    bopp: {
      base: 140,
      gramAdj: { '2.5': 0, '3': -1, '3.5': -1, '4': -2, '4.5': -2 },
      widthAdj: { '15': 7, '17': 4, '19': 1 },
      coatingGram: 0.7, coatingRate: 190,
      micron: 12, density: 0.91, trim: 0.2, thread: 1, stitch: 1,
      film: { glossy: 500, matt: 550 }, sides: 2,
      liner: { none: 0, natural: 170, semi: 140, milky: 120 },
      linerStitch: { with: 0.8, without: 0.4 },
      gussetAdd: 4,
      making: 0.4, profit: 1.2,
      strengthByGram: { '2.5': 45, '3': 55, '3.5': 60, '4': 70, '4.5': 80 },
      strengthMax: 82
    }
  };

  function num(id, d) { var e = $('#' + id); if (!e) return d || 0; var v = parseFloat(e.value); return isNaN(v) ? (d || 0) : v; }
  function val(id) { var e = $('#' + id); return e ? e.value : ''; }
  function txt(id, v) { var e = $('#' + id); if (e) e.textContent = v; }
  function html(id, v) { var e = $('#' + id); if (e) e.innerHTML = v; }
  function rs(v, d) {
    var n = Number(v) || 0;
    return '₹' + n.toFixed(d === undefined ? 2 : d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function g(v) { return (Number(v) || 0).toFixed(2); }
  /* A gram typed "3" and a table keyed "3.0" must still meet. */
  function keyed(t, k) {
    if (!t) return 0;
    var n = Number(k);
    var forms = [String(k), String(n), n.toFixed(1)];
    for (var i = 0; i < forms.length; i++) if (t[forms[i]] !== undefined) return t[forms[i]];
    return 0;
  }
  /* A rate box on the page wins over the sample beside it. */
  function rate(id, fallback) {
    var e = $('#' + id);
    if (!e || String(e.value).trim() === '') return fallback;
    var v = parseFloat(e.value);
    return isNaN(v) ? fallback : v;
  }

  function band(pct) {
    if (pct >= 0.78) return { label: 'Extra heavy duty', note: 'Cement, fertiliser, export, 40 kg' };
    if (pct >= 0.55) return { label: 'Heavy duty', note: 'Rice, grain, animal feed, 25 kg' };
    if (pct >= 0.35) return { label: 'Medium duty', note: 'Grains, seeds, dry goods' };
    return { label: 'Light duty', note: 'Light items, short distance' };
  }
  function showStrength(outId, value, max) {
    if (!value) { html(outId, '<span class="o-sub">Not rated at this gram</span>'); return; }
    var pct = max > 0 ? value / max : 0;
    var b = band(pct);
    html(outId,
      '<div class="es-meter"><i style="width:' + Math.round(pct * 100) + '%"></i></div>' +
      '<div class="o-sub"><b>' + value + '</b> / ' + max + ' · <b>' + b.label + '</b> · ' + b.note + '</div>');
  }

  /* ================= PP woven ====================================== */
  function drawPP() {
    var K = R.pp;
    var width = num('pp_width'), length = num('pp_length'), gram = val('pp_gram');
    var cut = length + K.stitch;
    var ok = width > 0 && length > 0 && Number(gram) > 0;

    var qualityRate = rate('r_q_' + val('pp_quality'), K.quality[val('pp_quality')]);
    var lamRate = rate('r_lam_' + val('pp_lam'), K.lamination[val('pp_lam')]);
    var printRate = rate('r_print_' + val('pp_print'), K.printing[val('pp_print')]);
    var fixed = rate('r_fixed', K.fixed);
    var jumboAdd = rate('r_jumbo', K.jumboAdd);

    var gramAdj = keyed(K.gramAdj, gram);
    var widthAdj = Number(width) === 19 ? K.width19 : 0;
    var maxi = width >= K.maxiFrom ? K.maxiAdd : 0;
    var fabricRate = qualityRate + gramAdj + widthAdj + maxi;

    var fabricWt = ok ? ((width * Number(gram) * cut) / IN_PER_M) + K.thread : 0;
    var lamWt = (ok && lamRate > 0) ? (width * K.lamGram * cut) / IN_PER_M : 0;
    var jumbo = width >= K.jumboFrom ? jumboAdd : 0;

    var fabricCost = (fabricWt * fabricRate) / 1000;
    var lamCost = (lamWt * lamRate) / 1000;
    var cost = ok ? fabricCost + lamCost + printRate + fixed + jumbo : 0;

    txt('pp_weight', ok ? g(fabricWt + lamWt) : '0');
    txt('pp_cost', ok ? rs(cost) : '₹0.00');
    txt('pp_fabricwt', g(fabricWt) + ' g');
    txt('pp_lamwt', lamWt ? g(lamWt) + ' g' : '—');
    txt('pp_rate', fabricRate.toFixed(2) + ' / kg');
    txt('pp_cut', ok ? width + '″ × ' + cut + '″ cut' : '—');
    html('pp_rows',
      row('Fabric', g(fabricWt) + ' g', fabricRate.toFixed(2) + ' /kg', rs(fabricCost)) +
      row('Lamination', lamWt ? g(lamWt) + ' g' : '—', lamRate ? lamRate.toFixed(2) + ' /kg' : '—', rs(lamCost)) +
      row('Printing', '—', printRate ? printRate.toFixed(2) + ' /bag' : '—', rs(printRate)) +
      row('Fixed', '—', fixed.toFixed(2) + ' /bag', rs(fixed)) +
      (jumbo ? row('Jumbo size', '—', jumbo.toFixed(2) + ' /bag', rs(jumbo)) : ''));
    html('pp_why',
      'quality ' + qualityRate +
      (gramAdj ? ' · gram ' + gram + ' ' + gramAdj : '') +
      (widthAdj ? ' · width 19″ +' + widthAdj : '') +
      (maxi ? ' · maxi roll +' + maxi : '') +
      ' = <b>' + fabricRate.toFixed(2) + '</b> / kg');

    var q = val('pp_quality');
    if (q === 'janta') html('pp_strength', '<div class="o-sub">Economy grade — not rated for load bearing</div>');
    else if (q === 'natural') html('pp_strength', '<div class="es-meter"><i style="width:100%"></i></div><div class="o-sub"><b>Beyond rating</b> · 100% virgin PP</div>');
    else showStrength('pp_strength', keyed(K.strength[q] || {}, gram), K.strengthMax);
  }

  /* ================= BOPP laminated ================================ */
  function drawBopp() {
    var K = R.bopp;
    var width = num('bp_width'), length = num('bp_length'), gram = val('bp_gram');
    var cut = length + K.stitch;
    var ok = width > 0 && length > 0 && Number(gram) > 0;

    var linerType = val('bp_liner');
    var hasLiner = linerType !== 'none';
    var linerWt = hasLiner ? num('bp_linergram') : 0;
    var linerRate = rate('r_liner_' + linerType, K.liner[linerType]);
    var stitchCharge = hasLiner ? rate('r_stitch_' + val('bp_stitch'), K.linerStitch[val('bp_stitch')]) : 0;

    var base = rate('r_base', K.base);
    var micron = rate('r_micron', K.micron);
    var coatingRate = rate('r_coating', K.coatingRate);
    var filmRate = rate('r_film_' + val('bp_finish'), K.film[val('bp_finish')]);
    var making = rate('r_making', K.making);
    var profit = rate('r_profit', K.profit);

    var gussetAdj = val('bp_gusset') === 'side' ? K.gussetAdd : 0;
    var fabricRate = base + keyed(K.gramAdj, gram) + keyed(K.widthAdj, width) + gussetAdj;

    var plainWt = ok ? ((width * Number(gram) / IN_PER_M) * cut) + K.thread : 0;
    var coatWt = ok ? (width * K.coatingGram / IN_PER_M) * cut : 0;
    var filmWt = ok
      ? ((width * MM_PER_IN * cut * MM_PER_IN * K.density * micron * K.sides) / 1000000) + K.trim : 0;

    /* The thread is in the WEIGHT and out of the fabric charge: a gram of
       stitching yarn is not a gram of woven PP. */
    var fabricCost = (fabricRate / 1000) * (plainWt - (ok ? K.thread : 0));
    var coatCost = (coatingRate / 1000) * coatWt;
    var filmCost = (filmRate / 1000) * filmWt;
    var linerCost = (linerRate / 1000) * linerWt;
    var cost = ok ? fabricCost + coatCost + filmCost + linerCost + stitchCharge + making : 0;
    var price = ok ? cost + profit : 0;

    txt('bp_weight', ok ? g(plainWt + coatWt + filmWt + linerWt) : '0');
    txt('bp_price', ok ? rs(price) : '₹0.00');
    txt('bp_cut', ok ? width + '″ × ' + cut + '″ cut' : '—');
    txt('bp_rate', fabricRate.toFixed(2) + ' / kg');
    html('bp_rows',
      row('Woven fabric', g(plainWt) + ' g', fabricRate.toFixed(2) + ' /kg', rs(fabricCost)) +
      row('Coating', g(coatWt) + ' g', coatingRate.toFixed(2) + ' /kg', rs(coatCost)) +
      row('BOPP film, both sides', g(filmWt) + ' g', filmRate.toFixed(2) + ' /kg', rs(filmCost)) +
      row('Liner', linerWt ? g(linerWt) + ' g' : '—', linerRate ? linerRate.toFixed(2) + ' /kg' : '—', rs(linerCost)) +
      (hasLiner ? row('Liner stitching', '—', stitchCharge.toFixed(2) + ' /bag', rs(stitchCharge)) : '') +
      row('Making', '—', making.toFixed(2) + ' /bag', rs(making)) +
      '<div class="es-row es-sum"><span>Cost before profit</span><b></b><b></b><b>' + rs(cost) + '</b></div>' +
      row('Profit', '—', profit.toFixed(2) + ' /bag', rs(profit)));
    html('bp_why',
      'base ' + base +
      (keyed(K.gramAdj, gram) ? ' · gram ' + gram + ' ' + keyed(K.gramAdj, gram) : '') +
      (keyed(K.widthAdj, width) ? ' · width ' + width + '″ +' + keyed(K.widthAdj, width) : '') +
      (gussetAdj ? ' · side gusset +' + gussetAdj : '') +
      ' = <b>' + fabricRate.toFixed(2) + '</b> / kg · film ' + micron + ' micron × ' + K.sides + ' sides');

    showStrength('bp_strength', keyed(K.strengthByGram, gram), K.strengthMax);
    var lg = $('#f_bp_linergram');
    if (lg) lg.hidden = !hasLiner;
    var ls = $('#f_bp_stitch');
    if (ls) ls.hidden = !hasLiner;
  }

  function row(what, grams, rt, cost) {
    return '<div class="es-row"><span>' + what + '</span><b>' + grams + '</b><b>' + rt + '</b><b>' + cost + '</b></div>';
  }

  function draw() { drawPP(); drawBopp(); }

  /* ---- tabs -------------------------------------------------------- */
  $$('[data-es-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-es-tab');
      $$('[data-es-tab]').forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('[data-es-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-es-panel') !== id; });
    });
  });

  /* ---- the rates drawer -------------------------------------------- */
  var toggle = $('#es-rates-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    var d = $('#es-rates');
    d.hidden = !d.hidden;
    toggle.textContent = d.hidden ? 'Show the sample rates' : 'Hide the sample rates';
  });
  var reset = $('#es-rates-reset');
  if (reset) reset.addEventListener('click', function () {
    $$('#es-rates input').forEach(function (i) { i.value = i.getAttribute('data-sample') || ''; });
    draw();
  });

  root.addEventListener('input', draw);
  root.addEventListener('change', draw);
  draw();
})();
