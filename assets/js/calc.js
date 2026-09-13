/* Nexora — woven bag weight & costing simulator (website edition)
   Indicative formulas only. The desktop app carries the locked, construction-specific engine. */
(function () {
  'use strict';
  var root = document.getElementById('nxCalc');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

  /* ---------- structures ---------- */
  var STRUCTURES = {
    'pp-plain':  { name: 'PP / HDPE woven sack — plain, stitched (open mouth)', gusset: false, lam: false, bopp: false, liner: false, bb: false, valve: false, stitched: true,
                   def: { W: 50, L: 90, G: 0, mesh: '10x10', den: 900, coat: 0, bopp: 0, liner: 0, fold: 4, print: 1, patch: 0 } },
    'pp-lam':    { name: 'Laminated woven sack — coated, stitched', gusset: false, lam: true, bopp: false, liner: false, bb: false, valve: false, stitched: true,
                   def: { W: 50, L: 90, G: 0, mesh: '10x10', den: 900, coat: 18, bopp: 0, liner: 0, fold: 4, print: 1, patch: 0 } },
    'pp-gusset': { name: 'Gusseted woven sack — plain or laminated', gusset: true, lam: true, bopp: false, liner: false, bb: false, valve: false, stitched: true,
                   def: { W: 45, L: 85, G: 10, mesh: '10x10', den: 900, coat: 0, bopp: 0, liner: 0, fold: 4, print: 1, patch: 0 } },
    'pp-liner':  { name: 'Woven sack with LDPE liner (moisture-proof)', gusset: false, lam: true, bopp: false, liner: true, bb: false, valve: false, stitched: true,
                   def: { W: 50, L: 90, G: 0, mesh: '10x10', den: 900, coat: 0, bopp: 0, liner: 40, fold: 4, print: 1, patch: 0 } },
    'bopp-om':   { name: 'BOPP laminated woven bag — open mouth, stitched', gusset: true, lam: true, bopp: true, liner: false, bb: false, valve: false, stitched: true,
                   def: { W: 40, L: 70, G: 0, mesh: '10x10', den: 800, coat: 18, bopp: 18, liner: 0, fold: 4, print: 2, patch: 0 } },
    'bopp-bb':   { name: 'BOPP block bottom bag — pasted / pinch bottom', gusset: true, lam: true, bopp: true, liner: false, bb: true, valve: false, stitched: false,
                   def: { W: 38, L: 60, G: 10, mesh: '10x10', den: 800, coat: 20, bopp: 20, liner: 0, fold: 0, print: 2, patch: 10 } },
    'bb-valve':  { name: 'Block bottom valve bag — cement / putty type', gusset: true, lam: true, bopp: false, liner: false, bb: true, valve: true, stitched: false,
                   def: { W: 50, L: 60, G: 10, mesh: '12x12', den: 1000, coat: 23, bopp: 0, liner: 0, fold: 0, print: 1, patch: 10 } },
    'leno':      { name: 'Leno / mesh bag (vegetables, onion)', gusset: false, lam: false, bopp: false, liner: false, bb: false, valve: false, stitched: true, leno: true,
                   def: { W: 45, L: 75, G: 0, mesh: '6x6', den: 900, coat: 0, bopp: 0, liner: 0, fold: 3, print: 0, patch: 0 } }
  };
  var MESH = ['6x6', '8x8', '9x9', '10x10', '11x11', '12x10', '12x12', '13x13', '14x14', 'custom'];
  var FILM_DENSITY = { bopp: 0.91, ldpe: 0.92 };   // g/cm³ → micron × density / 1000 × 10000 = gsm  ⇒ gsm = micron × density
  var INK_GSM_PER_SIDE = 1.2;
  var THREAD_G = 1.2;
  var PATCH_MARGIN_CM = 2;

  /* ---------- example RM prices (₹/kg) — clearly labelled as examples ---------- */
  var PRICES = { fabric: 105, coat: 110, bopp: 165, liner: 108, ink: 260, conv: 14 };

  /* ---------- helpers ---------- */
  function num(id, d) { var el = $('#' + id); if (!el) return d || 0; var v = parseFloat(el.value); return isNaN(v) ? (d || 0) : v; }
  function set(id, v) { var el = $('#' + id); if (el) el.value = v; }
  function txt(id, v) { var el = $('#' + id); if (el) el.textContent = v; }
  function show(id, on) { var el = $('#' + id); if (el) el.hidden = !on; }
  function inr(n) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }); }
  function inr0(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

  var unit = 'cm';
  function cm(v) { return unit === 'in' ? v * 2.54 : v; }

  /* ---------- build UI pieces ---------- */
  var sel = $('#s_structure');
  Object.keys(STRUCTURES).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = STRUCTURES[k].name; sel.appendChild(o); });
  var meshSel = $('#s_mesh');
  MESH.forEach(function (m) { var o = document.createElement('option'); o.value = m; o.textContent = m === 'custom' ? 'Custom (enter warp × weft)' : m.replace('x', ' × ') + ' mesh'; meshSel.appendChild(o); });

  function applyStructure(key, keepValues) {
    var s = STRUCTURES[key]; if (!s) return;
    if (!keepValues) {
      var d = s.def;
      set('s_w', unit === 'in' ? +(d.W / 2.54).toFixed(1) : d.W);
      set('s_l', unit === 'in' ? +(d.L / 2.54).toFixed(1) : d.L);
      set('s_g', unit === 'in' ? +(d.G / 2.54).toFixed(1) : d.G);
      meshSel.value = d.mesh; onMesh();
      set('s_den', d.den); set('s_coat', d.coat); set('s_bopp', d.bopp); set('s_liner', d.liner); set('s_fold', d.fold);
      $('#s_print').value = String(d.print); set('s_patch', d.patch);
      $('#s_gsm_custom').checked = false;
    }
    show('f_g', s.gusset);
    txt('lbl_g', s.bb ? 'Bottom / gusset width' : 'Gusset (each side)');
    show('f_coat', s.lam);
    show('f_bopp', s.bopp);
    show('f_liner', true);
    show('f_fold', s.stitched);
    show('f_patch', s.bb);
    show('f_valve', s.valve || s.bb);
    if ($('#s_valve')) $('#s_valve').checked = !!s.valve;
    txt('s_struct_hint', s.bb ? 'Tube + two pasted patches' + (s.valve ? ' + valve strip' : '') + '. Cut length = bag length + bottom width.' : (s.leno ? 'Leno weave: open mesh, low GSM, stitched.' : 'Tubular fabric, stitched top hem and bottom fold. Cut length = bag length + fold allowance.'));
    recalc();
  }

  function onMesh() {
    var v = meshSel.value;
    show('f_meshcustom', v === 'custom');
    if (v !== 'custom') { var p = v.split('x'); set('s_epi', p[0]); set('s_ppi', p[1]); }
  }

  /* ---------- the calculation ---------- */
  function recalc() {
    var key = sel.value, s = STRUCTURES[key]; if (!s) return;
    var W = cm(num('s_w')), L = cm(num('s_l')), G = s.gusset ? cm(num('s_g')) : 0;
    var epi = num('s_epi'), ppi = num('s_ppi'), den = num('s_den');
    var gsmFabricCalc = (den * epi + den * ppi) / 228.6;
    var custom = $('#s_gsm_custom').checked;
    var gsmFabric = custom ? num('s_gsm', gsmFabricCalc) : gsmFabricCalc;
    if (!custom) set('s_gsm', gsmFabricCalc.toFixed(1));
    $('#s_gsm').readOnly = !custom;
    var coat = s.lam ? num('s_coat') : 0;
    var boppMic = s.bopp ? num('s_bopp') : 0;
    var boppGsm = boppMic * FILM_DENSITY.bopp;
    var linerMic = num('s_liner');
    var linerGsm = linerMic * FILM_DENSITY.ldpe;
    var fold = s.stitched ? cm(num('s_fold')) : 0;
    var patchDepth = s.bb ? cm(num('s_patch')) : 0;
    var valve = (s.bb && $('#s_valve').checked);
    var printSides = parseInt($('#s_print').value, 10) || 0;
    var waste = num('s_waste', 3);
    var qty = Math.max(1, num('s_qty', 1000));

    var circumference = 2 * (W + G);                       // tubular fabric width, cm
    var cutLen = s.bb ? (L + G) : (L + fold);              // cm
    var bodyArea = circumference * cutLen / 10000;         // m²
    var bodyFabric = bodyArea * gsmFabric;
    var bodyCoat = bodyArea * coat;
    var bodyBopp = bodyArea * boppGsm;

    var patchArea = s.bb ? 2 * ((W + PATCH_MARGIN_CM) * (G + PATCH_MARGIN_CM + patchDepth - G)) / 10000 : 0; // two patches (top + bottom)
    if (s.bb) patchArea = 2 * ((W + PATCH_MARGIN_CM) * (patchDepth + PATCH_MARGIN_CM)) / 10000;
    var patchG = patchArea * (gsmFabric + coat);
    var valveArea = valve ? ((G + PATCH_MARGIN_CM) * 14) / 10000 : 0;   // one valve strip ~14 cm long
    var valveG = valveArea * (gsmFabric + coat);

    var linerArea = linerMic > 0 ? (2 * W * (L + 6)) / 10000 : 0;      // tubular liner, 6 cm extra length
    var linerG = linerArea * linerGsm;
    var faceArea = (W * L) / 10000;
    var inkG = printSides * faceArea * INK_GSM_PER_SIDE;
    var threadG = s.stitched ? THREAD_G : 0;

    var total = bodyFabric + bodyCoat + bodyBopp + patchG + valveG + linerG + inkG + threadG;
    var gsmLam = gsmFabric + coat + boppGsm;
    var gpmUL = gsmFabric * circumference / 100;
    var gpmLam = gsmLam * circumference / 100;

    // costing (example prices)
    var wf = 1 + waste / 100;
    var kg = function (g) { return g / 1000 * wf; };
    var pF = num('p_fabric', PRICES.fabric), pC = num('p_coat', PRICES.coat), pB = num('p_bopp', PRICES.bopp), pL = num('p_liner', PRICES.liner), pI = num('p_ink', PRICES.ink), pConv = num('p_conv', PRICES.conv);
    var matCost = kg(bodyFabric + patchG * (gsmFabric / (gsmFabric + coat || 1)) + valveG * (gsmFabric / (gsmFabric + coat || 1)) + threadG) * pF
                + kg(bodyCoat + (patchG + valveG) * (coat / (gsmFabric + coat || 1))) * pC
                + kg(bodyBopp) * pB + kg(linerG) * pL + kg(inkG) * pI;
    var convCost = kg(total) * pConv;
    var costBag = matCost + convCost;

    // outputs
    txt('o_total', total.toFixed(2));
    txt('o_per1000', (total * 1000 / 1000).toFixed(2) + ' kg');
    txt('o_gsm', gsmFabric.toFixed(1));
    txt('o_gsmlam', gsmLam.toFixed(1));
    txt('o_gpm', gpmUL.toFixed(1));
    txt('o_gpmlam', gpmLam.toFixed(1));
    txt('o_area', bodyArea.toFixed(4) + ' m²');
    txt('o_cut', cutLen.toFixed(1) + ' cm × ' + circumference.toFixed(1) + ' cm');
    txt('o_rm', (total / 1000 * wf * qty).toFixed(1) + ' kg');
    txt('o_qty', qty.toLocaleString('en-IN'));
    txt('o_cost', inr(costBag));
    txt('o_cost1000', inr0(costBag * 1000));
    txt('o_costqty', inr0(costBag * qty));
    txt('o_mat', inr(matCost));
    txt('o_conv', inr(convCost));
    txt('o_formula', 'GSM = (' + den + ' × ' + epi + ' + ' + den + ' × ' + ppi + ') / 228.6 = ' + gsmFabricCalc.toFixed(1) + (custom ? ' (custom GSM ' + gsmFabric.toFixed(1) + ' used)' : '') +
      (coat ? ' · coating +' + coat : '') + (boppGsm ? ' · BOPP ' + boppMic + ' µm = +' + boppGsm.toFixed(1) + ' gsm' : '') + ' · area ' + bodyArea.toFixed(4) + ' m² × ' + gsmLam.toFixed(1) + ' gsm');

    // locked component list (values blurred on purpose)
    var comps = [['Body fabric', bodyFabric], ['Coating / lamination', bodyCoat], ['BOPP film', bodyBopp], ['Top & bottom patches', patchG], ['Valve strip', valveG], ['LDPE liner', linerG], ['Printing ink', inkG], ['Stitching thread', threadG]].filter(function (c) { return c[1] > 0; });
    var ul = $('#o_components'); ul.innerHTML = '';
    comps.forEach(function (c) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + c[0] + '</span><b class="blur">' + c[1].toFixed(2) + ' g · ' + (100 * c[1] / total).toFixed(1) + '%</b>';
      ul.appendChild(li);
    });
    txt('o_compcount', comps.length);
    var sel2 = $('#s_structure');
    var sd = $('#o_structname'); if (sd) sd.textContent = STRUCTURES[key].name;
    var wsum = $('#o_wastekg'); if (wsum) wsum.textContent = ((total / 1000) * (waste / 100) * qty).toFixed(1) + ' kg';
  }

  /* ---------- wiring ---------- */
  sel.addEventListener('change', function () { applyStructure(sel.value, false); });
  meshSel.addEventListener('change', function () { onMesh(); recalc(); });
  $$('input, select').forEach(function (el) { if (el !== sel && el !== meshSel) el.addEventListener('input', recalc); });
  $('#s_gsm_custom').addEventListener('change', function () { if (!this.checked) recalc(); else { $('#s_gsm').readOnly = false; $('#s_gsm').focus(); recalc(); } });
  $$('[data-unit]').forEach(function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-unit'); if (u === unit) return;
      var f = u === 'in' ? 1 / 2.54 : 2.54;
      ['s_w', 's_l', 's_g', 's_fold', 's_patch'].forEach(function (id) { set(id, +(num(id) * f).toFixed(2)); });
      unit = u;
      $$('[data-unit]').forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('.unitlbl').forEach(function (x) { x.textContent = unit; });
      recalc();
    });
  });
  var resetBtn = $('#s_reset'); if (resetBtn) resetBtn.addEventListener('click', function () { Object.keys(PRICES).forEach(function (k) { set('p_' + k, PRICES[k]); }); set('s_waste', 3); set('s_qty', 10000); applyStructure(sel.value, false); });
  var priceBtn = $('#s_prices_toggle'); if (priceBtn) priceBtn.addEventListener('click', function () { var p = $('#s_prices'); p.hidden = !p.hidden; priceBtn.textContent = p.hidden ? 'Edit example RM prices' : 'Hide RM prices'; });
  Object.keys(PRICES).forEach(function (k) { set('p_' + k, PRICES[k]); });

  // preset from the page (data-preset) or URL (?structure=)
  var preset = root.getAttribute('data-preset') || '';
  try { var q = new URLSearchParams(location.search).get('structure'); if (q && STRUCTURES[q]) preset = q; } catch (e) {}
  sel.value = STRUCTURES[preset] ? preset : 'pp-plain';
  applyStructure(sel.value, false);
})();
