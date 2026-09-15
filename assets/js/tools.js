/* Nexora — textile conversion tools (denier / GSM / GPM / fabric weight) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function num(id, d) { var el = $('#' + id); if (!el) return d || 0; var v = parseFloat(el.value); return isNaN(v) ? (d || 0) : v; }
  function txt(id, v) { var el = $('#' + id); if (el) el.textContent = v; }
  // Warp and weft carry the same count, so one mesh figure covers both.
  function meshOf(prefix) {
    var sel = $('#' + prefix + '_mesh');
    var m = 10;
    if (!sel) m = num(prefix + '_meshcustom', 10);
    else {
      var custom = $('#' + prefix + '_custom'); if (custom) custom.hidden = sel.value !== 'custom';
      m = sel.value === 'custom' ? num(prefix + '_meshcustom', 10) : (parseFloat(sel.value) || 10);
    }
    return { epi: m, ppi: m, m: m };
  }
  function fillMesh(sel) {
    if (!sel || sel.options.length) return;
    [6, 8, 9, 10, 11, 12, 13, 14].forEach(function (m) {
      var o = document.createElement('option'); o.value = String(m); o.textContent = m + ' × ' + m + ' mesh'; if (m === 10) o.selected = true; sel.appendChild(o);
    });
    var c = document.createElement('option'); c.value = 'custom'; c.textContent = 'Custom mesh…'; sel.appendChild(c);
  }
  Array.prototype.forEach.call(document.querySelectorAll('select[id$="_mesh"]'), fillMesh);

  // every width carries its own mm / cm / inch select
  var UNIT_MM = { mm: 1, cm: 10, in: 25.4 };
  // a roll length is quoted in metres, yards or feet — never millimetres
  var UNIT_M = { m: 1, yd: 0.9144, ft: 0.3048 };
  function lenM(inputId) {
    var sel = document.querySelector('[data-lfor="' + inputId + '"]');
    return UNIT_M[sel ? sel.value : 'm'] || 1;
  }
  function unitFor(inputId) {
    var sel = document.querySelector('[data-wfor="' + inputId + '"]');
    return UNIT_MM[sel ? sel.value : 'cm'] || 10;
  }
  function widthM(prefix) {
    var mm = num(prefix + '_w') * unitFor(prefix + '_w');
    var form = $('#' + prefix + '_form'); var f = form ? form.value : 'flat';
    var wm = mm / 1000; if (f === 'tube') wm *= 2; return wm;
  }

  function run() {
    /* denier → gsm */
    if ($('#d2g_den')) {
      var m = meshOf('d2g'); var den = num('d2g_den');
      var gsm = (den * m.epi + den * m.ppi) / 228.6;
      txt('d2g_out', gsm.toFixed(1));
      txt('d2g_formula', 'GSM = (' + den + ' × ' + m.epi + ' + ' + den + ' × ' + m.ppi + ') / 228.6 = ' + gsm.toFixed(2));
    }
    /* gsm → denier */
    if ($('#g2d_gsm')) {
      var m2 = meshOf('g2d'); var g = num('g2d_gsm');
      var d = (m2.epi + m2.ppi) > 0 ? g * 228.6 / (m2.epi + m2.ppi) : 0;
      txt('g2d_out', Math.round(d / 10) * 10);
      txt('g2d_formula', 'Denier = ' + g + ' × 228.6 / (' + m2.epi + ' + ' + m2.ppi + ') = ' + d.toFixed(0));
    }
    /* gsm → gpm */
    if ($('#g2p_gsm')) {
      var wm = widthM('g2p'); var gs = num('g2p_gsm'); var gpm = gs * wm;
      txt('g2p_out', gpm.toFixed(2));
      txt('g2p_formula', 'GPM = ' + gs + ' gsm × ' + wm.toFixed(3) + ' m fabric width = ' + gpm.toFixed(2) + ' g per running metre');
      var rollLen = num('g2p_len') * lenM('g2p_len'); if (rollLen) txt('g2p_roll', (gpm * rollLen / 1000).toFixed(2) + ' kg');
    }
    /* gpm → gsm */
    if ($('#p2g_gpm')) {
      var wm2 = widthM('p2g'); var gp = num('p2g_gpm'); var gsm2 = wm2 > 0 ? gp / wm2 : 0;
      txt('p2g_out', gsm2.toFixed(1));
      txt('p2g_formula', 'GSM = ' + gp + ' g/m ÷ ' + wm2.toFixed(3) + ' m = ' + gsm2.toFixed(2));
    }
    /* denier → gpm (fabric) + tape g/m */
    if ($('#d2p_den')) {
      var m3 = meshOf('d2p'); var dn = num('d2p_den'); var wm3 = widthM('d2p');
      var gsm3 = (dn * m3.epi + dn * m3.ppi) / 228.6; var gpm3 = gsm3 * wm3;
      txt('d2p_gsm', gsm3.toFixed(1)); txt('d2p_out', gpm3.toFixed(2));
      txt('d2p_tape', (dn / 9000).toFixed(4));
      txt('d2p_formula', 'GSM = ' + dn + ' × (' + m3.epi + ' + ' + m3.ppi + ') / 228.6 = ' + gsm3.toFixed(1) + ' → GPM = ' + gsm3.toFixed(1) + ' × ' + wm3.toFixed(3) + ' m = ' + gpm3.toFixed(2));
    }
    /* gpm → denier */
    if ($('#p2d_gpm')) {
      var m4 = meshOf('p2d'); var gp4 = num('p2d_gpm'); var wm4 = widthM('p2d');
      var gsm4 = wm4 > 0 ? gp4 / wm4 : 0; var den4 = (m4.epi + m4.ppi) > 0 ? gsm4 * 228.6 / (m4.epi + m4.ppi) : 0;
      txt('p2d_gsm', gsm4.toFixed(1)); txt('p2d_out', Math.round(den4 / 10) * 10);
      txt('p2d_formula', 'GSM = ' + gp4 + ' / ' + wm4.toFixed(3) + ' = ' + gsm4.toFixed(1) + ' → Denier = ' + gsm4.toFixed(1) + ' × 228.6 / (' + m4.epi + ' + ' + m4.ppi + ') = ' + den4.toFixed(0));
      var tg = num('p2d_tape'); if (tg) txt('p2d_tapeout', Math.round(tg * 9000 / 10) * 10);
    }
    /* width × length × gsm = weight */
    if ($('#fw_w')) {
      var gsm5 = num('fw_gsm'), layers = num('fw_layers', 1), q = num('fw_qty', 1);
      var wcm = num('fw_w') * unitFor('fw_w') / 10;       // each size carries its own unit
      var lcm = num('fw_l') * unitFor('fw_l') / 10;
      var area = wcm * lcm / 10000 * layers;              // m²
      var gw = area * gsm5;
      txt('fw_area', area.toFixed(4) + ' m²'); txt('fw_out', gw.toFixed(2)); txt('fw_kg', (gw * q / 1000).toFixed(2) + ' kg');
      txt('fw_formula', 'Weight = ' + wcm.toFixed(1) + ' cm × ' + lcm.toFixed(1) + ' cm ÷ 10,000 × ' + layers + ' layer(s) × ' + gsm5 + ' gsm = ' + gw.toFixed(2) + ' g');
      var rw = num('fw_rw') * unitFor('fw_rw') / 1000, rl = num('fw_rl') * lenM('fw_rl'), rg = num('fw_rgsm');
      if ($('#fw_rw')) txt('fw_roll', (rw * rl * rg / 1000).toFixed(2) + ' kg');
    }
  }
  function retitle(sel, inputId) {
    var inp = document.getElementById(inputId);
    if (!inp) return;
    var prev = sel.dataset.prev || 'cm';
    var mm = (parseFloat(inp.value) || 0) * (UNIT_MM[prev] || 10);
    var v = mm / (UNIT_MM[sel.value] || 10);
    inp.value = +v.toFixed(sel.value === 'mm' ? 0 : sel.value === 'cm' ? 1 : 2);
    inp.step = sel.value === 'mm' ? 5 : sel.value === 'cm' ? 0.5 : 0.25;
    sel.dataset.prev = sel.value;
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-lfor]'), function (sel) {
    sel.dataset.prev = sel.value;
    sel.addEventListener('change', function () {
      var inp = document.getElementById(sel.getAttribute('data-lfor'));
      if (inp) {
        var metres = (parseFloat(inp.value) || 0) * (UNIT_M[sel.dataset.prev] || 1);
        inp.value = +(metres / (UNIT_M[sel.value] || 1)).toFixed(1);
      }
      sel.dataset.prev = sel.value; run();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-wfor]'), function (sel) {
    sel.dataset.prev = sel.value;
    sel.addEventListener('change', function () { retitle(sel, sel.getAttribute('data-wfor')); run(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.tool input, .tool select'), function (el) { el.addEventListener('input', run); el.addEventListener('change', run); });
  run();
})();
