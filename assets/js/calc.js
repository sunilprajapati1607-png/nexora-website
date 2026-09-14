/* Nexora — woven bag weight & costing simulator (website edition)
   -----------------------------------------------------------------
   The geometry, allowances and layer build-up follow the Nexora desktop
   engine (the constants in K below are that engine's seed values). The
   desktop app remains the accurate one: 29 constructions, per-construction
   field sets, your own Constants Master and a versioned RM price master.
   This page is a quotation sanity-check, not a production costing.

   Layers, the way the constructions are named:
     1 Layer  fabric only
     2 Layer  fabric + coating
     3 Layer  fabric + coating + BOPP film
     4 Layer  fabric + coating + BOPP film + metallised film
   The lamination fields follow that count, so a 1 Layer bag is never asked
   for a coating and a 2 Layer bag is never asked for a film.

   The liner is not part of this calculator — a liner is a separate article
   with its own width, length and seal, and has its own page: /liner-calculator */
(function () {
  'use strict';
  var root = document.getElementById('nxCalc');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

  /* ---- constants (Nexora Constants Master seed values) ---- */
  var K = {
    SINGLE_FOLD: 40, DOUBLE_FOLD: 65,          // mm
    SINGLE_HAM: 25, DOUBLE_HAM: 50,            // mm
    OP_OPEN: 15, OP_FLEXO: 25, OP_BOPP: 30,    // patch overlap, mm
    VALVE_OVERLAP: 15,                         // mm
    PATCH_ALLOW: 5,                            // mm
    COAT_WIDTH_ALLOW: 10,                      // mm added to body width for coating/film
    BOPP_FACTOR: 0.92, MET_FACTOR: 0.92,       // micron -> gsm
    INK_GSM: 1.5, ADHESIVE_GSM: 2.5,           // g/m2
    YARN_PER_MM: 0.002,                        // g per mm of stitching
    YARN_TOP_FACTOR: 1.5,
    DNR_STEP: 10
  };

  /* ---- structures: the real Nexora construction families ---- */
  var STRUCTURES = {
    '1l-stitch': {
      name: '1 Layer STITCH BAG — plain PP / HDPE woven sack', layers: 1,
      hint: 'Fabric only, no coating and no film. Cut length = length + bottom fold + top hem (hamming).',
      stitched: true, bb: false,
      def: { W: 50, L: 90, mesh: 10, den: 900, coat: 0, bopp: 0, met: 0, fold: 'single', ham: 'single', patch: 0, valve: 0, exv: 0, print: 0 }
    },
    '2l-stitch': {
      name: '2 Layer STITCH BAG — laminated (coated) woven sack', layers: 2,
      hint: 'Fabric + extrusion coating, stitched. Coating is spread over body width + 10 mm allowance.',
      stitched: true, bb: false,
      def: { W: 50, L: 90, mesh: 10, den: 900, coat: 18, bopp: 0, met: 0, fold: 'single', ham: 'single', patch: 0, valve: 0, exv: 0, print: 1 }
    },
    '3l-bopp-stitch': {
      name: '3 Layer BOPP STITCH BAG — BOPP laminated, open mouth stitched', layers: 3,
      hint: 'Fabric + coating + BOPP film, stitched top and bottom. Ink is added to the film layer.',
      stitched: true, bb: false,
      def: { W: 40, L: 70, mesh: 10, den: 800, coat: 18, bopp: 18, met: 0, fold: 'single', ham: 'single', patch: 0, valve: 0, exv: 0, print: 2 }
    },
    '4l-bopp-stitch': {
      name: '4 Layer BOPP STITCH BAG — BOPP + metallised, stitched', layers: 4,
      hint: 'Fabric + coating + BOPP + metallised film. Adhesive is added to the metallised layer.',
      stitched: true, bb: false,
      def: { W: 40, L: 70, mesh: 10, den: 800, coat: 18, bopp: 18, met: 12, fold: 'single', ham: 'single', patch: 0, valve: 0, exv: 0, print: 2 }
    },
    '2l-bb-valve': {
      name: '2 Layer BLOCK BOTTOM — valve bag (cement / putty type)', layers: 2,
      hint: 'Coated fabric, pasted top and bottom with a valve. Cut length = length + patch + overlap.',
      stitched: false, bb: true, valveDefault: true,
      def: { W: 48, L: 62, mesh: 10, den: 900, coat: 20, bopp: 0, met: 0, fold: 'none', ham: 'none', patch: 100, valve: 150, exv: 20, print: 1 }
    },
    '3l-bb-om': {
      name: '3 Layer BLOCK BOTTOM + OM — open mouth block bottom (no valve)', layers: 3,
      hint: 'Pasted bottom, open mouth. Cut length = length + patch ÷ 2 + overlap + hamming.',
      stitched: false, bb: true, valveDefault: false,
      def: { W: 40, L: 62, mesh: 10, den: 800, coat: 20, bopp: 20, met: 0, fold: 'none', ham: 'single', patch: 100, valve: 0, exv: 0, print: 2 }
    },
    '3l-bb-valve': {
      name: '3 Layer BLOCK BOTTOM — BOPP laminated valve bag', layers: 3,
      hint: 'Fabric + coating + BOPP film, pasted bottom with valve.',
      stitched: false, bb: true, valveDefault: true,
      def: { W: 45, L: 60, mesh: 11, den: 900, coat: 20, bopp: 20, met: 0, fold: 'none', ham: 'none', patch: 100, valve: 150, exv: 20, print: 2 }
    },
    '4l-bopp-bb': {
      name: '4 Layer BOPP BAG — BOPP + metallised block bottom', layers: 4,
      hint: 'Four layers: fabric, coating, BOPP film and metallised film, pasted bottom with valve.',
      stitched: false, bb: true, valveDefault: true,
      def: { W: 45, L: 62, mesh: 11, den: 900, coat: 20, bopp: 18, met: 12, fold: 'none', ham: 'none', patch: 100, valve: 150, exv: 20, print: 2 }
    }
  };
  // warp and weft carry the same count, so one mesh figure covers both
  var MESH = [6, 8, 9, 10, 11, 12, 13, 14];

  /* ---- example RM prices (Rs/kg) ---- */
  var PRICES = { fabric: 105, coat: 110, bopp: 165, met: 190, ink: 260, conv: 14 };

  /* ---- helpers ---- */
  function num(id, d) { var el = $('#' + id); if (!el) return d || 0; var v = parseFloat(el.value); return isNaN(v) ? (d || 0) : v; }
  function set(id, v) { var el = $('#' + id); if (el) el.value = v; }
  function txt(id, v) { var el = $('#' + id); if (el) el.textContent = v; }
  function show(id, on) { var el = $('#' + id); if (el) el.hidden = !on; }
  function val(id) { var el = $('#' + id); return el ? el.value : ''; }
  function inr(n) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }); }
  function inr0(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

  /* ---- units: mm, cm or inch ---- */
  var UNITS = { mm: 1, cm: 10, in: 25.4 };      // one unit expressed in mm
  var unit = 'cm';
  function toMM(v) { return v * UNITS[unit]; }
  function fromMM(v) { return v / UNITS[unit]; }
  function dp() { return unit === 'mm' ? 0 : unit === 'cm' ? 1 : 2; }
  function stepFor() { return unit === 'mm' ? 5 : unit === 'cm' ? 0.5 : 0.25; }

  var driver = 'den';   // 'den' => GSM follows denier; 'gsm' => denier follows GSM

  /* ---- build the selects ---- */
  var sel = $('#s_structure');
  Object.keys(STRUCTURES).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = STRUCTURES[k].name; sel.appendChild(o); });
  var meshSel = $('#s_mesh');
  MESH.forEach(function (m) { var o = document.createElement('option'); o.value = String(m); o.textContent = m + ' × ' + m + ' mesh'; meshSel.appendChild(o); });
  (function () { var o = document.createElement('option'); o.value = 'custom'; o.textContent = 'Custom mesh…'; meshSel.appendChild(o); })();

  function meshCount() {
    if (meshSel.value === 'custom') return num('s_meshcustom', 10);
    return parseFloat(meshSel.value) || 10;
  }
  function gsmFromDen(den, m) { return (den * m + den * m) / 228.6; }
  function denFromGsm(gsm, m) { return m > 0 ? Math.round((gsm * 228.6 / (m * 2)) / K.DNR_STEP) * K.DNR_STEP : 0; }

  function syncFabric() {
    var m = meshCount();
    if (driver === 'gsm') set('s_den', denFromGsm(num('s_gsm'), m));
    else set('s_gsm', gsmFromDen(num('s_den'), m).toFixed(1));
    show('tag_den', driver === 'gsm');
    show('tag_gsm', driver !== 'gsm');
  }

  function announce(what) {
    var m = meshCount(), el = $('#s_syncnote');
    if (!el) return;
    var meshTxt = m + ' × ' + m + ' mesh';
    if (what === 'mesh') {
      el.textContent = driver === 'gsm'
        ? meshTxt + ' → tape denier recalculated to ' + num('s_den') + '. GSM and bag weight held.'
        : meshTxt + ' → fabric GSM recalculated to ' + num('s_gsm') + ' and the bag weight updated. Denier held.';
    } else if (what === 'den') {
      el.textContent = 'Denier ' + num('s_den') + ' at ' + meshTxt + ' → fabric GSM ' + num('s_gsm') + ', bag weight updated.';
    } else if (what === 'gsm') {
      el.textContent = 'GSM ' + num('s_gsm') + ' at ' + meshTxt + ' → tape denier ' + num('s_den') + '.';
    } else { el.textContent = ''; }
  }

  function applyUnitLabels() {
    $$('.unitlbl').forEach(function (x) { x.textContent = unit; });
    ['s_w', 's_l', 's_patch', 's_valve', 's_exv'].forEach(function (id) {
      var el = $('#' + id); if (el) el.step = stepFor();
    });
  }

  function applyStructure(key) {
    var s = STRUCTURES[key]; if (!s) return;
    var d = s.def;
    set('s_w', +fromMM(d.W * 10).toFixed(dp()));
    set('s_l', +fromMM(d.L * 10).toFixed(dp()));
    set('s_patch', +fromMM(d.patch).toFixed(dp()));
    set('s_valve', +fromMM(d.valve).toFixed(dp()));
    set('s_exv', +fromMM(d.exv).toFixed(dp()));
    meshSel.value = String(d.mesh); show('f_meshcustom', false); set('s_meshcustom', d.mesh);
    set('s_den', d.den); driver = 'den';
    set('s_coat', d.coat); set('s_bopp', d.bopp); set('s_met', d.met);
    $('#s_fold').value = d.fold; $('#s_ham').value = d.ham; $('#s_print').value = String(d.print);
    $('#s_coat_sd').value = 'both'; $('#s_bopp_sd').value = 'both';
    $('#s_valve_on').checked = !!s.valveDefault;
    if ($('#s_meshmode')) $('#s_meshmode').value = 'keepgsm';
    announce('');

    // the lamination fields follow the layer count
    show('f_coat', s.layers >= 2); show('f_coat_sd', s.layers >= 2);
    show('f_bopp', s.layers >= 3); show('f_bopp_sd', s.layers >= 3);
    show('f_met', s.layers >= 4);
    show('f_print', s.layers >= 2);
    show('lam_block', s.layers >= 2);
    show('lam_none', s.layers < 2);

    show('f_fold', s.stitched);
    show('f_patch', s.bb); show('f_valve_on', s.bb);
    txt('s_struct_hint', s.hint);
    txt('o_layers', s.layers === 1 ? '1 layer — fabric only'
      : s.layers === 2 ? '2 layers — fabric + coating'
      : s.layers === 3 ? '3 layers — fabric + coating + BOPP'
      : '4 layers — fabric + coating + BOPP + metallised');
    applyUnitLabels();
    syncFabric(); recalc();
  }

  /* ---- the calculation (mirrors the desktop engine's stages) ---- */
  function recalc() {
    var key = sel.value, s = STRUCTURES[key]; if (!s) return;
    var m = meshCount();
    var W = toMM(num('s_w')), L = toMM(num('s_l'));
    var PATCH = s.bb ? toMM(num('s_patch')) : 0;
    var valveOn = s.bb && $('#s_valve_on').checked;
    var VALVE = valveOn ? toMM(num('s_valve')) : 0;
    var EXV = valveOn ? toMM(num('s_exv')) : 0;
    show('f_valve', valveOn); show('f_exv', valveOn);
    // a valve bag's cut length is length + patch + overlap, with no hamming term
    show('f_ham', !(s.bb && valveOn));

    var gsmFab = num('s_gsm');
    var coatRaw = s.layers >= 2 ? num('s_coat') : 0;
    var coatSd = val('s_coat_sd') === 'one' ? coatRaw / 2 : coatRaw;
    var boppMic = s.layers >= 3 ? num('s_bopp') : 0;
    var metMic = s.layers >= 4 ? num('s_met') : 0;
    var printSides = s.layers >= 2 ? (parseInt(val('s_print'), 10) || 0) : 0;
    var inkGsm = printSides > 0 ? K.INK_GSM : 0;
    var boppSd = boppMic > 0 ? ((val('s_bopp_sd') === 'one' ? boppMic / 2 : boppMic) * K.BOPP_FACTOR + inkGsm) : 0;
    var metSd = metMic > 0 ? (metMic * K.MET_FACTOR + K.ADHESIVE_GSM) : 0;
    var ptcCoatSd = coatRaw * (val('s_coat_sd') === 'one' ? 1 : 2) / 2;
    var waste = num('s_waste', 3), qty = Math.max(1, num('s_qty', 1000));

    var foldSz = val('s_fold') === 'single' ? K.SINGLE_FOLD : val('s_fold') === 'double' ? K.DOUBLE_FOLD : 0;
    var hamSz = val('s_ham') === 'single' ? K.SINGLE_HAM : val('s_ham') === 'double' ? K.DOUBLE_HAM : 0;
    if (!s.stitched) foldSz = 0;

    var OP = 0;
    if (s.bb) OP = VALVE < 1 ? K.OP_OPEN : (boppMic < 1 ? K.OP_FLEXO : K.OP_BOPP);

    var cutLen;
    if (PATCH < 1 && VALVE < 1) cutLen = L + foldSz + hamSz;
    else if (VALVE < 1) cutLen = L + PATCH / 2 + OP + hamSz;
    else cutLen = L + PATCH + OP;

    var areaFab = W * cutLen * 2;
    var areaCoat = (W + K.COAT_WIDTH_ALLOW) * cutLen * 2;
    var bodyFab = gsmFab / 1e6 * areaFab;
    var bodyCoat = coatSd / 1e6 * areaCoat;
    var bodyBopp = boppSd / 1e6 * areaCoat;
    var bodyMet = metSd / 1e6 * areaCoat;

    var tpArea = 0, bpArea = 0, vArea = 0;
    if (s.bb && PATCH > 0) {
      var A = K.PATCH_ALLOW;
      tpArea = Math.max(0, PATCH - A) * Math.max(0, (W + EXV) - PATCH - A);
      bpArea = Math.max(0, PATCH - A) * Math.max(0, W - (PATCH + A));
      if (valveOn) vArea = Math.max(0, VALVE + EXV) * Math.max(0, PATCH * 2 + K.VALVE_OVERLAP);
    }
    var ptcLayerGsm = gsmFab + ptcCoatSd + (boppMic > 0 ? (boppMic * K.BOPP_FACTOR + inkGsm) : 0);
    var tpG = ptcLayerGsm / 1e6 * tpArea;
    var bpG = ptcLayerGsm / 1e6 * bpArea;
    var vG = (gsmFab + ptcCoatSd) / 1e6 * vArea;

    var yts = (s.stitched && hamSz > 0) ? W : 0;
    var ybs = (s.stitched && foldSz > 0) ? W : 0;
    var yarnG = K.YARN_PER_MM * (yts / K.YARN_TOP_FACTOR + ybs);

    var total = bodyFab + bodyCoat + bodyBopp + bodyMet + tpG + bpG + vG + yarnG;

    var gsmLam = gsmFab + coatSd + boppSd + metSd;
    var gpmUL = gsmFab / 500 * W;
    var gpmLam = gsmLam / 500 * W;

    var wf = 1 + waste / 100;
    var kg = function (g) { return g / 1000 * wf; };
    var pF = num('p_fabric', PRICES.fabric), pC = num('p_coat', PRICES.coat), pB = num('p_bopp', PRICES.bopp),
        pM = num('p_met', PRICES.met), pI = num('p_ink', PRICES.ink), pConv = num('p_conv', PRICES.conv);
    var fabShare = ptcLayerGsm > 0 ? gsmFab / ptcLayerGsm : 1;
    var inkG = inkGsm > 0 ? (inkGsm / 1e6 * areaCoat) : 0;
    var matCost = kg(bodyFab + (tpG + bpG) * fabShare + vG + yarnG) * pF
                + kg(bodyCoat) * pC
                + kg(Math.max(0, bodyBopp - inkG)) * pB
                + kg(bodyMet) * pM
                + kg(inkG) * pI;
    var convCost = kg(total) * pConv;
    var costBag = matCost + convCost;

    var cmOf = function (mm) { return (mm / 10).toFixed(1) + ' cm'; };
    txt('o_total', total.toFixed(2));
    txt('o_structname', s.name);
    txt('o_gsm', gsmFab.toFixed(1));
    txt('o_gsmlam', gsmLam.toFixed(1));
    txt('o_gpm', gpmUL.toFixed(1));
    txt('o_gpmlam', gpmLam.toFixed(1));
    txt('o_den', num('s_den').toFixed(0));
    txt('o_cut', cmOf(cutLen) + ' × ' + cmOf(W * 2));
    txt('o_area', (areaFab / 1e6).toFixed(4) + ' m²');
    txt('o_per1000', (total * 1000 / 1000).toFixed(2) + ' kg');
    txt('o_rm', (total / 1000 * wf * qty).toFixed(1) + ' kg');
    txt('o_qty', qty.toLocaleString('en-IN'));
    txt('o_wastekg', ((total / 1000) * (waste / 100) * qty).toFixed(1) + ' kg');
    txt('o_cost', inr(costBag));
    txt('o_cost1000', inr0(costBag * 1000));
    txt('o_costqty', inr0(costBag * qty));
    txt('o_mat', inr(matCost));
    txt('o_conv', inr(convCost));
    txt('o_formula',
      'GSM = ' + num('s_den') + ' × (' + m + ' + ' + m + ') ÷ 228.6 = ' + gsmFab.toFixed(1) +
      ' · cut length = ' + cmOf(cutLen) + ' · body area = ' + (areaFab / 1e6).toFixed(4) + ' m², 2 fabric layers already included' +
      (coatSd ? ' · coating ' + coatSd.toFixed(1) + ' gsm' : '') +
      (boppSd ? ' · BOPP ' + boppMic + ' µm × 0.92' + (inkGsm ? ' + ink ' + K.INK_GSM : '') + ' = ' + boppSd.toFixed(1) + ' gsm' : '') +
      (metSd ? ' · metallised ' + metMic + ' µm × 0.92 + adhesive = ' + metSd.toFixed(1) + ' gsm' : ''));

    var comps = [
      ['Body fabric', bodyFab], ['Body coating', bodyCoat], ['BOPP film', bodyBopp], ['Metallised film', bodyMet],
      ['Top patch', tpG], ['Bottom patch', bpG], ['Valve strip', vG], ['Yarn / thread', yarnG]
    ].filter(function (c) { return c[1] > 0.0001; });
    var ul = $('#o_components'); ul.innerHTML = '';
    comps.forEach(function (c) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + c[0] + '</span><b class="blur">' + c[1].toFixed(2) + ' g · ' + (100 * c[1] / total).toFixed(1) + '%</b>';
      ul.appendChild(li);
    });
    txt('o_compcount', comps.length);

    var fb = document.getElementById('f_bag');
    if (fb && !fb.dataset.touched) { fb.value = total.toFixed(2); if (window.nxForecast) window.nxForecast(); }
  }

  /* ---- wiring ---- */
  sel.addEventListener('change', function () { applyStructure(sel.value); });
  function meshDriver() { return val('s_meshmode') === 'keepden' ? 'den' : 'gsm'; }
  meshSel.addEventListener('change', function () { show('f_meshcustom', meshSel.value === 'custom'); driver = meshDriver(); syncFabric(); recalc(); announce('mesh'); });
  var meshCustom = $('#s_meshcustom');
  if (meshCustom) meshCustom.addEventListener('input', function () { driver = meshDriver(); syncFabric(); recalc(); announce('mesh'); });
  $('#s_den').addEventListener('input', function () { driver = 'den'; syncFabric(); recalc(); announce('den'); });
  $('#s_gsm').addEventListener('input', function () { driver = 'gsm'; syncFabric(); recalc(); announce('gsm'); });
  $$('input, select').forEach(function (el) {
    if (['s_structure', 's_mesh', 's_meshcustom', 's_den', 's_gsm'].indexOf(el.id) >= 0) return;
    el.addEventListener('input', recalc); el.addEventListener('change', recalc);
  });
  $$('[data-unit]').forEach(function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-unit'); if (u === unit || !UNITS[u]) return;
      var mmVals = {};
      ['s_w', 's_l', 's_patch', 's_valve', 's_exv'].forEach(function (id) { mmVals[id] = toMM(num(id)); });
      unit = u;
      Object.keys(mmVals).forEach(function (id) { set(id, +fromMM(mmVals[id]).toFixed(dp())); });
      $$('[data-unit]').forEach(function (x) { x.classList.toggle('on', x === b); });
      applyUnitLabels();
      recalc();
    });
  });
  var resetBtn = $('#s_reset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    Object.keys(PRICES).forEach(function (k) { set('p_' + k, PRICES[k]); });
    set('s_waste', 3); set('s_qty', 10000);
    applyStructure(sel.value);
  });
  var priceBtn = $('#s_prices_toggle');
  if (priceBtn) priceBtn.addEventListener('click', function () {
    var p = $('#s_prices'); p.hidden = !p.hidden;
    priceBtn.textContent = p.hidden ? 'Edit example RM prices' : 'Hide RM prices';
  });
  Object.keys(PRICES).forEach(function (k) { set('p_' + k, PRICES[k]); });

  var preset = root.getAttribute('data-preset') || '';
  try { var q = new URLSearchParams(location.search).get('structure'); if (q && STRUCTURES[q]) preset = q; } catch (e) {}
  sel.value = STRUCTURES[preset] ? preset : '1l-stitch';
  applyStructure(sel.value);
})();
