/* Nexora — LDPE / PE liner weight calculator
   Follows the Nexora desktop engine's liner stage:
       liner cut length = liner length + bottom seal
       gauge            = micron × 4
       weight (g)       = (gauge ÷ 3300) × (width in inches) × (cut length in inches)
   The width is the lay-flat width, so the two layers of the tube are already
   inside the constant. A gusset adds to the lay-flat width. */
(function () {
  'use strict';
  var root = document.getElementById('nxLiner');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

  var K = { GAUGE_PER_MICRON: 4, DIVISOR: 3300, PE_DENSITY: 0.92 };
  var UNITS = { mm: 1, cm: 10, in: 25.4 };
  var unit = 'cm';
  function toMM(v) { return v * UNITS[unit]; }
  function fromMM(v) { return v / UNITS[unit]; }
  function dp() { return unit === 'mm' ? 0 : unit === 'cm' ? 1 : 2; }

  function num(id, d) { var el = $('#' + id); if (!el) return d || 0; var v = parseFloat(el.value); return isNaN(v) ? (d || 0) : v; }
  function set(id, v) { var el = $('#' + id); if (el) el.value = v; }
  function txt(id, v) { var el = $('#' + id); if (el) el.textContent = v; }
  function val(id) { var el = $('#' + id); return el ? el.value : ''; }
  function show(id, on) { var el = $('#' + id); if (el) el.hidden = !on; }

  function recalc() {
    var W = toMM(num('l_w'));          // lay-flat width
    var G = toMM(num('l_gusset'));     // gusset, added to the lay-flat width
    var L = toMM(num('l_l'));          // finished length
    var seal = toMM(num('l_seal'));    // bottom seal allowance
    var thickMode = val('l_thickmode');
    var micron = thickMode === 'gauge' ? num('l_gauge') / K.GAUGE_PER_MICRON : num('l_micron');
    var gauge = micron * K.GAUGE_PER_MICRON;
    var qty = Math.max(1, num('l_qty', 1000));
    var waste = num('l_waste', 3);
    var rate = num('l_rate', 108);

    // keep the two thickness boxes in step
    if (thickMode === 'gauge') set('l_micron', +micron.toFixed(1)); else set('l_gauge', +gauge.toFixed(0));

    var layFlat = W + G;
    var cutLen = L + seal;
    var oneG = (gauge / K.DIVISOR) * (layFlat / 25.4) * (cutLen / 25.4);

    // cross-check by area and density: two layers of film
    var areaM2 = (layFlat / 1000) * (cutLen / 1000) * 2;
    var byDensity = areaM2 * micron * K.PE_DENSITY;

    var wf = 1 + waste / 100;
    var kgOrder = oneG / 1000 * wf * qty;

    txt('l_out', oneG.toFixed(2));
    txt('l_gaugeout', gauge.toFixed(0) + ' gauge · ' + micron.toFixed(1) + ' micron');
    txt('l_cut', (layFlat / 10).toFixed(1) + ' cm lay-flat × ' + (cutLen / 10).toFixed(1) + ' cm cut length');
    txt('l_per1000', (oneG).toFixed(2) + ' kg');
    txt('l_kg', kgOrder.toFixed(1) + ' kg');
    txt('l_qtyout', qty.toLocaleString('en-IN'));
    txt('l_cost', '₹' + (kgOrder * rate).toLocaleString('en-IN', { maximumFractionDigits: 0 }));
    txt('l_perbag', '₹' + (oneG / 1000 * wf * rate).toFixed(3));
    txt('l_density', byDensity.toFixed(2) + ' g');
    txt('l_formula', 'gauge = ' + micron.toFixed(1) + ' × 4 = ' + gauge.toFixed(0) +
      ' · weight = (' + gauge.toFixed(0) + ' ÷ 3300) × (' + (layFlat / 25.4).toFixed(2) + ' in) × (' + (cutLen / 25.4).toFixed(2) + ' in) = ' + oneG.toFixed(2) + ' g');
  }

  $$('input, select').forEach(function (el) { el.addEventListener('input', recalc); el.addEventListener('change', recalc); });
  var tm = $('#l_thickmode');
  if (tm) tm.addEventListener('change', function () {
    show('f_micron', tm.value !== 'gauge');
    show('f_gauge', tm.value === 'gauge');
    recalc();
  });
  $$('[data-lunit]').forEach(function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-lunit'); if (u === unit || !UNITS[u]) return;
      var mm = {};
      ['l_w', 'l_gusset', 'l_l', 'l_seal'].forEach(function (id) { mm[id] = toMM(num(id)); });
      unit = u;
      Object.keys(mm).forEach(function (id) { set(id, +fromMM(mm[id]).toFixed(dp())); });
      $$('[data-lunit]').forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('.lunitlbl').forEach(function (x) { x.textContent = unit; });
      recalc();
    });
  });
  show('f_gauge', false);
  recalc();
})();
