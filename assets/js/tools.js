/* Nexora — textile conversion tools (denier / GSM / GPM / fabric weight) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function num(id, d) { var el = $('#' + id); if (!el) return d || 0; var v = parseFloat(el.value); return isNaN(v) ? (d || 0) : v; }
  function txt(id, v) { var el = $('#' + id); if (el) el.textContent = v; }
  function meshOf(prefix) {
    var sel = $('#' + prefix + '_mesh'); if (!sel) return { epi: num(prefix + '_epi'), ppi: num(prefix + '_ppi') };
    var v = sel.value;
    var custom = $('#' + prefix + '_custom'); if (custom) custom.hidden = v !== 'custom';
    if (v === 'custom') return { epi: num(prefix + '_epi'), ppi: num(prefix + '_ppi') };
    var p = v.split('x'); return { epi: parseFloat(p[0]), ppi: parseFloat(p[1]) };
  }
  function fillMesh(sel) {
    if (!sel || sel.options.length) return;
    ['6x6', '8x8', '9x9', '10x10', '11x11', '12x10', '12x12', '13x13', '14x14', 'custom'].forEach(function (m) {
      var o = document.createElement('option'); o.value = m; o.textContent = m === 'custom' ? 'Custom' : m.replace('x', ' × ') + ' mesh'; if (m === '10x10') o.selected = true; sel.appendChild(o);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('select[id$="_mesh"]'), fillMesh);

  function widthM(prefix) {
    var w = num(prefix + '_w'); var form = $('#' + prefix + '_form'); var f = form ? form.value : 'flat';
    var wm = w / 100; if (f === 'tube') wm *= 2; return wm;
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
      txt('g2d_out', Math.round(d));
      txt('g2d_formula', 'Denier = ' + g + ' × 228.6 / (' + m2.epi + ' + ' + m2.ppi + ') = ' + d.toFixed(0));
    }
    /* gsm → gpm */
    if ($('#g2p_gsm')) {
      var wm = widthM('g2p'); var gs = num('g2p_gsm'); var gpm = gs * wm;
      txt('g2p_out', gpm.toFixed(2));
      txt('g2p_formula', 'GPM = ' + gs + ' gsm × ' + wm.toFixed(3) + ' m fabric width = ' + gpm.toFixed(2) + ' g per running metre');
      var rollLen = num('g2p_len'); if (rollLen) txt('g2p_roll', (gpm * rollLen / 1000).toFixed(2) + ' kg');
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
      txt('p2d_gsm', gsm4.toFixed(1)); txt('p2d_out', Math.round(den4));
      txt('p2d_formula', 'GSM = ' + gp4 + ' / ' + wm4.toFixed(3) + ' = ' + gsm4.toFixed(1) + ' → Denier = ' + gsm4.toFixed(1) + ' × 228.6 / (' + m4.epi + ' + ' + m4.ppi + ') = ' + den4.toFixed(0));
      var tg = num('p2d_tape'); if (tg) txt('p2d_tapeout', Math.round(tg * 9000));
    }
    /* width × length × gsm = weight */
    if ($('#fw_w')) {
      var w = num('fw_w'), l = num('fw_l'), gsm5 = num('fw_gsm'), layers = num('fw_layers', 1), q = num('fw_qty', 1);
      var unitSel = $('#fw_unit'); var f = unitSel && unitSel.value === 'in' ? 2.54 : 1;
      var area = (w * f) * (l * f) / 10000 * layers;      // m²
      var gw = area * gsm5;
      txt('fw_area', area.toFixed(4) + ' m²'); txt('fw_out', gw.toFixed(2)); txt('fw_kg', (gw * q / 1000).toFixed(2) + ' kg');
      txt('fw_formula', 'Weight = ' + (w * f).toFixed(1) + ' cm × ' + (l * f).toFixed(1) + ' cm ÷ 10,000 × ' + layers + ' layer(s) × ' + gsm5 + ' gsm = ' + gw.toFixed(2) + ' g');
      var rw = num('fw_rw'), rl = num('fw_rl'), rg = num('fw_rgsm');
      if ($('#fw_rw')) txt('fw_roll', ((rw / 100) * rl * rg / 1000).toFixed(2) + ' kg');
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll('.tool input, .tool select'), function (el) { el.addEventListener('input', run); el.addEventListener('change', run); });
  run();
})();
