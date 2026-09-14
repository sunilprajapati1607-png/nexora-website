/* Nexora — woven bag weight & costing simulator (website edition)
   -----------------------------------------------------------------
   The geometry, allowances and layer build-up below follow the same
   structure as the Nexora desktop engine (constants shown in K below are
   that engine's seed values). The desktop app is still the accurate one:
   it carries 29 constructions, per-construction field sets, your own
   Constants Master and a versioned RM price master. This page is a
   quotation sanity-check, not a production costing. */
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
    LINER_GAUGE_F: 4, LINER_DIVISOR: 3300,
    LINER_BTM_SEAL: 60,                        // mm
    YARN_PER_MM: 0.002,                        // g per mm
    YARN_TOP_FACTOR: 1.5,
    DNR_STEP: 10
  };

  /* ---- structures: real Nexora construction families ---- */
  var STRUCTURES = {
    '1l-stitch': {
      name: '1L STITCH BAG — plain PP / HDPE woven sack',
      hint: 'Uncoated tubular fabric. Cut length = length + bottom fold + top hem (hamming).',
      stitched: true, bb: false,
      def: { W: 50, L: 90, mesh: '10x10', den: 900, coat: 0, bopp: 0, met: 0, liner: 0, fold: 'single', ham: 'single', patch: 0, valve: 0, exv: 0, print: 0 }
    },
    '2l-stitch': {
      name: '2L STITCH BAG — laminated (coated) woven sack',
      hint: 'Fabric + extrusion coating, stitched. Coating is spread over body width + 10 mm allowance.',
      stitched: true, bb: false,
      def: { W: 50, L: 90, mesh: '10x10', den: 900, coat: 18, bopp: 0, met: 0, liner: 0, fold: 'single', ham: 'single', patch: 0, valve: 0, exv: 0, print: 1 }
    },
    '2l-stitch-lnr': {
      name: '2L STITCH BAG + LNR — laminated sack with LDPE liner',
      hint: 'Coated sack with an inner LDPE liner. Liner weight = gauge ÷ 3300 × width(in) × cut length(in).',
      stitched: true, bb: false,
      def: { W: 50, L: 90, mesh: '10x10', den: 900, coat: 18, bopp: 0, met: 0, liner: 40, fold: 'single', ham: 'single', patch: 0, valve: 0, exv: 0, print: 1 }
    },
    '4l-bopp-stitch': {
      name: '4L BOPP STITCH BAG — BOPP laminated, open mouth stitched',
      hint: 'Fabric + coating + BOPP film, stitched top and bottom. Ink is added to the film layer.',
      stitched: true, bb: false,
      def: { W: 40, L: 70, mesh: '10x10', den: 800, coat: 18, bopp: 18, met: 0, liner: 0, fold: 'single', ham: 'single', patch: 0, valve: 0, exv: 0, print: 2 }
    },
    '3l-bb-om': {
      name: '3L BLOCK BOTTOM + OM — open mouth block bottom (no valve)',
      hint: 'Pasted bottom, open mouth. Cut length = length + patch ÷ 2 + overlap + hamming.',
      stitched: false, bb: true, valveDefault: false,
      def: { W: 40, L: 62, mesh: '10x10', den: 800, coat: 20, bopp: 20, met: 0, liner: 0, fold: 'none', ham: 'single', patch: 100, valve: 0, exv: 0, print: 2 }
    },
    '2l-bb-valve': {
      name: '2L BLOCK BOTTOM — valve bag (cement / putty type)',
      hint: 'Pasted top and bottom with a valve. Cut length = length + patch + overlap.',
      stitched: false, bb: true, valveDefault: true,
      def: { W: 48, L: 62, mesh: '10x10', den: 900, coat: 20, bopp: 0, met: 0, liner: 0, fold: 'none', ham: 'none', patch: 100, valve: 150, exv: 20, print: 1 }
    },
    '3l-bb-valve': {
      name: '3L BLOCK BOTTOM — BOPP laminated valve bag',
      hint: 'Fabric + coating + BOPP film, pasted bottom with valve.',
      stitched: false, bb: true, valveDefault: true,
      def: { W: 45, L: 60, mesh: '11x11', den: 900, coat: 20, bopp: 20, met: 0, liner: 0, fold: 'none', ham: 'none', patch: 100, valve: 150, exv: 20, print: 2 }
    },
    '4l-bopp-bb': {
      name: '4L BOPP BAG — BOPP + metallised block bottom',
      hint: 'Four layers: fabric, coating, BOPP film and metallised film. Adhesive is added to the metallised layer.',
      stitched: false, bb: true, valveDefault: true,
      def: { W: 45, L: 62, mesh: '11x11', den: 900, coat: 20, bopp: 18, met: 12, liner: 0, fold: 'none', ham: 'none', patch: 100, valve: 150, exv: 20, print: 2 }
    }
  };
  var MESH = ['6x6', '8x8', '9x9', '10x10', '10x11', '11x11', '12x10', '12x12', '13x13', '14x14', 'custom'];

  /* ---- example RM prices (Rs/kg) ---- */
  var PRICES = { fabric: 105, coat: 110, bopp: 165, met: 190, liner: 108, ink: 260, conv: 14 };

  /* ---- helpers ---- */
  function num(id, d) { var el = $('#' + id); if (!el) return d || 0; var v = parseFloat(el.value); return isNaN(v) ? (d || 0) : v; }
  function set(id, v) { var el = $('#' + id); if (el) el.value = v; }
  function txt(id, v) { var el = $('#' + id); if (el) el.textContent = v; }
  function show(id, on) { var el = $('#' + id); if (el) el.hidden = !on; }
  function val(id) { var el = $('#' + id); return el ? el.value : ''; }
  function inr(n) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }); }
  function inr0(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

  var unit = 'cm';
  function toMM(v) { return unit === 'in' ? v * 25.4 : v * 10; }     // field value -> mm
  var driver = 'den';   // 'den' => GSM follows denier; 'gsm' => denier follows GSM

  /* ---- build selects ---- */
  var sel = $('#s_structure');
  Object.keys(STRUCTURES).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = STRUCTURES[k].name; sel.appendChild(o); });
  var meshSel = $('#s_mesh');
  MESH.forEach(function (m) { var o = document.createElement('option'); o.value = m; o.textContent = m === 'custom' ? 'Custom (enter warp × weft)' : m.replace('x', ' × ') + ' mesh'; meshSel.appendChild(o); });

  function meshPair() {
    if (meshSel.value === 'custom') return { epi: num('s_epi', 10), ppi: num('s_ppi', 10) };
    var p = meshSel.value.split('x');
    return { epi: parseFloat(p[0]), ppi: parseFloat(p[1]) };
  }
  function gsmFromDen(den, m) { return (den * m.epi + den * m.ppi) / 228.6; }
  function denFromGsm(gsm, m) { var s = m.epi + m.ppi; return s > 0 ? Math.round((gsm * 228.6 / s) / K.DNR_STEP) * K.DNR_STEP : 0; }

  function syncFabric() {
    var m = meshPair();
    if (driver === 'gsm') set('s_den', denFromGsm(num('s_gsm'), m));
    else set('s_gsm', gsmFromDen(num('s_den'), m).toFixed(1));
    // the "auto" tag belongs on whichever box the engine is filling in
    show('tag_den', driver === 'gsm');
    show('tag_gsm', driver !== 'gsm');
  }

  // One line saying what the last change actually moved, so nothing looks stuck.
  function announce(what) {
    var m = meshPair(), el = $('#s_syncnote');
    if (!el) return;
    var meshTxt = m.epi + ' × ' + m.ppi + ' mesh';
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

  function applyStructure(key) {
    var s = STRUCTURES[key]; if (!s) return;
    var d = s.def, f = unit === 'in' ? 1 / 25.4 : 1 / 10;   // mm -> field unit
    set('s_w', +(d.W * 10 * f).toFixed(2));
    set('s_l', +(d.L * 10 * f).toFixed(2));
    set('s_patch', +(d.patch * f).toFixed(2));
    set('s_valve', +(d.valve * f).toFixed(2));
    set('s_exv', +(d.exv * f).toFixed(2));
    meshSel.value = d.mesh; show('f_meshcustom', false);
    set('s_den', d.den); driver = 'den';
    set('s_coat', d.coat); set('s_bopp', d.bopp); set('s_met', d.met); set('s_liner', d.liner);
    $('#s_fold').value = d.fold; $('#s_ham').value = d.ham; $('#s_print').value = String(d.print);
    $('#s_coat_sd').value = 'both'; $('#s_bopp_sd').value = 'both';
    if ($('#s_meshmode')) $('#s_meshmode').value = 'keepgsm';
    announce('');
    $('#s_valve_on').checked = !!s.valveDefault;
    show('f_fold', s.stitched);
    show('f_patch', s.bb); show('f_valve_on', s.bb); show('f_valve', s.bb && !!s.valveDefault); show('f_exv', s.bb && !!s.valveDefault);
    txt('s_struct_hint', s.hint);
    syncFabric(); recalc();
  }

  /* ---- the calculation (mirrors the desktop engine's stages) ---- */
  function recalc() {
    var key = sel.value, s = STRUCTURES[key]; if (!s) return;
    var m = meshPair();
    var W = toMM(num('s_w')), L = toMM(num('s_l'));
    var PATCH = s.bb ? toMM(num('s_patch')) : 0;
    var valveOn = s.bb && $('#s_valve_on').checked;
    var VALVE = valveOn ? toMM(num('s_valve')) : 0;
    var EXV = valveOn ? toMM(num('s_exv')) : 0;
    show('f_valve', valveOn); show('f_exv', valveOn);
    // A valve bag's cut length is length + patch + overlap — no hamming term — so
    // the hamming field would sit there doing nothing. Hide it for valve bags.
    show('f_ham', !(s.bb && valveOn));

    var gsmFab = num('s_gsm');
    var coatSd = val('s_coat_sd') === 'one' ? num('s_coat') / 2 : num('s_coat');
    var boppMic = num('s_bopp'), metMic = num('s_met'), linerMic = num('s_liner');
    var printSides = parseInt(val('s_print'), 10) || 0;
    var inkGsm = printSides > 0 ? K.INK_GSM : 0;
    var boppSd = boppMic > 0 ? ((val('s_bopp_sd') === 'one' ? boppMic / 2 : boppMic) * K.BOPP_FACTOR + inkGsm) : 0;
    var metSd = metMic > 0 ? (metMic * K.MET_FACTOR + K.ADHESIVE_GSM) : 0;
    var ptcCoatSd = num('s_coat') * (val('s_coat_sd') === 'one' ? 1 : 2) / 2;   // patch sees the flat-fabric coating
    var waste = num('s_waste', 3), qty = Math.max(1, num('s_qty', 1000));

    // fold / hamming
    var foldSz = val('s_fold') === 'single' ? K.SINGLE_FOLD : val('s_fold') === 'double' ? K.DOUBLE_FOLD : 0;
    var hamSz = val('s_ham') === 'single' ? K.SINGLE_HAM : val('s_ham') === 'double' ? K.DOUBLE_HAM : 0;
    if (!s.stitched) foldSz = 0;

    // patch overlap (OP)
    var OP = 0;
    if (s.bb) OP = VALVE < 1 ? K.OP_OPEN : (boppMic < 1 ? K.OP_FLEXO : K.OP_BOPP);

    // cut length
    var cutLen;
    if (PATCH < 1 && VALVE < 1) cutLen = L + foldSz + hamSz;
    else if (VALVE < 1) cutLen = L + PATCH / 2 + OP + hamSz;
    else cutLen = L + PATCH + OP;

    // body areas (mm²) — base fabric on width, coating/film on width + allowance
    var areaFab = W * cutLen * 2;
    var areaCoat = (W + K.COAT_WIDTH_ALLOW) * cutLen * 2;
    var bodyFab = gsmFab / 1e6 * areaFab;
    var bodyCoat = coatSd / 1e6 * areaCoat;
    var bodyBopp = boppSd / 1e6 * areaCoat;
    var bodyMet = metSd / 1e6 * areaCoat;

    // patches & valve
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

    // yarn / thread
    var yts = (s.stitched && hamSz > 0) ? W : 0;
    var ybs = (s.stitched && foldSz > 0) ? W : 0;
    var yarnG = K.YARN_PER_MM * (yts / K.YARN_TOP_FACTOR + ybs);

    // liner
    var linerG = 0, linerCut = 0;
    if (linerMic > 0) {
      linerCut = L + K.LINER_BTM_SEAL;
      linerG = ((linerMic * K.LINER_GAUGE_F) / K.LINER_DIVISOR) * (W / 25.4) * (linerCut / 25.4);
    }

    var total = bodyFab + bodyCoat + bodyBopp + bodyMet + tpG + bpG + vG + yarnG + linerG;

    // reporting figures
    var gsmLam = gsmFab + coatSd + boppSd + metSd;
    var gpmUL = gsmFab / 500 * W;
    var gpmLam = gsmLam / 500 * W;

    // costing (example rates)
    var wf = 1 + waste / 100;
    var kg = function (g) { return g / 1000 * wf; };
    var pF = num('p_fabric', PRICES.fabric), pC = num('p_coat', PRICES.coat), pB = num('p_bopp', PRICES.bopp),
        pM = num('p_met', PRICES.met), pL = num('p_liner', PRICES.liner), pI = num('p_ink', PRICES.ink), pConv = num('p_conv', PRICES.conv);
    var fabShare = ptcLayerGsm > 0 ? gsmFab / ptcLayerGsm : 1;
    var inkG = inkGsm > 0 ? (inkGsm / 1e6 * areaCoat) : 0;
    var matCost = kg(bodyFab + (tpG + bpG) * fabShare + vG + yarnG) * pF
                + kg(bodyCoat) * pC
                + kg(Math.max(0, bodyBopp - inkG)) * pB
                + kg(bodyMet) * pM
                + kg(linerG) * pL
                + kg(inkG) * pI;
    var convCost = kg(total) * pConv;
    var costBag = matCost + convCost;

    // ---- outputs ----
    txt('o_total', total.toFixed(2));
    txt('o_structname', s.name);
    txt('o_gsm', gsmFab.toFixed(1));
    txt('o_gsmlam', gsmLam.toFixed(1));
    txt('o_gpm', gpmUL.toFixed(1));
    txt('o_gpmlam', gpmLam.toFixed(1));
    txt('o_den', num('s_den').toFixed(0));
    txt('o_cut', (cutLen / 10).toFixed(1) + ' cm × ' + (W * 2 / 10).toFixed(1) + ' cm');
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
      'GSM = ' + num('s_den') + ' × (' + m.epi + ' + ' + m.ppi + ') ÷ 228.6 = ' + gsmFab.toFixed(1) +
      ' · cut length = ' + (cutLen / 10).toFixed(1) + ' cm · body area = ' + (areaFab / 1e6).toFixed(4) + ' m² × 2 layers already included' +
      (coatSd ? ' · coating ' + coatSd.toFixed(1) + ' gsm' : '') +
      (boppSd ? ' · BOPP ' + boppMic + ' µm × 0.92' + (inkGsm ? ' + ink ' + K.INK_GSM : '') + ' = ' + boppSd.toFixed(1) + ' gsm' : '') +
      (metSd ? ' · metallised ' + metMic + ' µm × 0.92 + adhesive = ' + metSd.toFixed(1) + ' gsm' : ''));

    // component list (blurred — demo feature)
    var comps = [
      ['Body fabric', bodyFab], ['Body coating', bodyCoat], ['BOPP film', bodyBopp], ['Metallised film', bodyMet],
      ['Top patch', tpG], ['Bottom patch', bpG], ['Valve strip', vG], ['LDPE liner', linerG], ['Yarn / thread', yarnG]
    ].filter(function (c) { return c[1] > 0.0001; });
    var ul = $('#o_components'); ul.innerHTML = '';
    comps.forEach(function (c) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + c[0] + '</span><b class="blur">' + c[1].toFixed(2) + ' g · ' + (100 * c[1] / total).toFixed(1) + '%</b>';
      ul.appendChild(li);
    });
    txt('o_compcount', comps.length);

    // feed the order forecast tool on the same page
    var fb = document.getElementById('f_bag');
    if (fb && !fb.dataset.touched) { fb.value = total.toFixed(2); if (window.nxForecast) window.nxForecast(); }
  }

  /* ---- wiring ---- */
  sel.addEventListener('change', function () { applyStructure(sel.value); });
  // Mesh, denier and GSM are one equation, so a mesh change must move one of the
  // other two. s_meshmode says which one holds: keep the denier (default) and the
  // GSM and bag weight move; keep the GSM and the denier moves instead.
  // "keepgsm" (default, and how the desktop engine works: GSM + mesh are the
  // inputs, denier is a reported figure) -> the denier is recalculated.
  // "keepden" -> the GSM, and therefore the bag weight, is recalculated instead.
  function meshDriver() { return val('s_meshmode') === 'keepden' ? 'den' : 'gsm'; }
  meshSel.addEventListener('change', function () { show('f_meshcustom', meshSel.value === 'custom'); driver = meshDriver(); syncFabric(); recalc(); announce('mesh'); });
  $('#s_den').addEventListener('input', function () { driver = 'den'; syncFabric(); recalc(); announce('den'); });
  $('#s_gsm').addEventListener('input', function () { driver = 'gsm'; syncFabric(); recalc(); announce('gsm'); });
  ['s_epi', 's_ppi'].forEach(function (id) { var el = $('#' + id); if (el) el.addEventListener('input', function () { driver = meshDriver(); syncFabric(); recalc(); announce('mesh'); }); });
  $$('input, select').forEach(function (el) {
    if (['s_structure', 's_mesh', 's_den', 's_gsm', 's_epi', 's_ppi'].indexOf(el.id) >= 0) return;
    el.addEventListener('input', recalc); el.addEventListener('change', recalc);
  });
  $$('[data-unit]').forEach(function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-unit'); if (u === unit) return;
      var f = u === 'in' ? 1 / 2.54 : 2.54;
      var dp = u === 'in' ? 2 : 1;   // keep the round trip free of visible drift
      ['s_w', 's_l'].forEach(function (id) { set(id, +(num(id) * f).toFixed(dp)); });
      ['s_patch', 's_valve', 's_exv'].forEach(function (id) { set(id, +(num(id) * f).toFixed(2)); });
      unit = u;
      $$('[data-unit]').forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('.unitlbl').forEach(function (x) { x.textContent = unit; });
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
