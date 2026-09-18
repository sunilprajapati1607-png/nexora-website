/* Nexora — invoice & quotation generator.
   Everything happens in this browser. The logo is read with FileReader and never
   leaves the page; nothing is posted anywhere. The seller's own details, terms and
   bank lines are remembered in localStorage as a convenience; the buyer and the
   items are not, so the form opens empty every time.

   Deliberately NOT here: cost, margin, profit, or anything the costing engine
   knows. This is a document formatter — the rates are the user's own. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = $('#invtool');
  if (!root) return;

  var STORE = 'nx_inv_seller_v1';
  var state = { type: 'quotation', tax: 'cgst', logo: '' };

  /* ---------- helpers ---------- */
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function money(n) {
    return (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function lines(s) { return esc(s).split(/\n/).filter(function (x) { return x.trim(); }); }

  /* amount in words, Indian system */
  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function under100(n) {
    if (n < 20) return ONES[n];
    return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  }
  function under1000(n) {
    var h = Math.floor(n / 100), r = n % 100;
    return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? under100(r) : '');
  }
  function words(n) {
    n = Math.round(n * 100) / 100;
    var whole = Math.floor(n), paise = Math.round((n - whole) * 100);
    if (whole === 0 && paise === 0) return '';
    var parts = [], units = [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']];
    for (var i = 0; i < units.length; i++) {
      var d = Math.floor(whole / units[i][0]);
      if (d) { parts.push(under1000(d) + ' ' + units[i][1]); whole %= units[i][0]; }
    }
    if (whole) parts.push(under1000(whole));
    var out = parts.join(' ').replace(/\s+/g, ' ').trim();
    if (paise) out += (out ? ' and ' : '') + under100(paise) + ' Paise';
    return 'Rupees ' + out + ' Only';
  }

  /* ---------- item rows ---------- */
  var rowsBox = $('#inv_rows');
  function rowHtml(i) {
    return '<div class="inv-row" data-row>' +
      '<div class="inv-c desc"><input type="text" data-f="desc" placeholder="' + esc(PLACE.desc[i % PLACE.desc.length]) + '" aria-label="Description"></div>' +
      '<div class="inv-c hsn"><input type="text" data-f="hsn" placeholder="' + esc(PLACE.hsn[i % PLACE.hsn.length]) + '" aria-label="HSN or SAC"></div>' +
      '<div class="inv-c qty"><input type="number" data-f="qty" min="0" step="any" inputmode="decimal" placeholder="0" aria-label="Quantity"></div>' +
      '<div class="inv-c unit"><input type="text" data-f="unit" placeholder="Nos" aria-label="Unit"></div>' +
      '<div class="inv-c rate"><input type="number" data-f="rate" min="0" step="any" inputmode="decimal" placeholder="0.00" aria-label="Rate"></div>' +
      '<div class="inv-c amt"><span data-f="amt">—</span></div>' +
      '<div class="inv-c del"><button type="button" class="inv-x" aria-label="Remove this line">&times;</button></div>' +
      '</div>';
  }
  var PLACE = {
    desc: ['PP woven sack 50 x 90 cm, 78 GSM, printed 2 colour',
           'BOPP laminated bag 45 x 75 cm, 18 micron film',
           'Block bottom valve bag 40 x 65 x 12 cm',
           'LDPE liner 48 x 92 cm, 50 micron'],
    hsn: ['63053200', '39232990', '63053300', '39232100']
  };
  function addRow() {
    var n = $$('[data-row]', rowsBox).length;
    rowsBox.insertAdjacentHTML('beforeend', rowHtml(n));
    wireRow(rowsBox.lastElementChild);
    render();
  }
  function wireRow(row) {
    $$('input', row).forEach(function (i) { i.addEventListener('input', render); });
    $('.inv-x', row).addEventListener('click', function () {
      if ($$('[data-row]', rowsBox).length > 1) row.remove(); else $$('input', row).forEach(function (i) { i.value = ''; });
      render();
    });
  }

  /* ---------- read the form ---------- */
  function readItems() {
    return $$('[data-row]', rowsBox).map(function (r) {
      var g = function (f) { var e = $('[data-f="' + f + '"]', r); return e ? e.value.trim() : ''; };
      var qty = num(g('qty')), rate = num(g('rate'));
      var amt = qty * rate;
      var cell = $('span[data-f="amt"]', r);
      if (cell) cell.textContent = (qty || rate) ? money(amt) : '—';
      return { desc: g('desc'), hsn: g('hsn'), qty: qty, unit: g('unit'), rate: rate, amt: amt };
    }).filter(function (it) { return it.desc || it.qty || it.rate; });
  }

  function totals(items) {
    var sub = items.reduce(function (a, i) { return a + i.amt; }, 0);
    var charges = [
      { label: 'Freight', v: num(val('inv_freight')) },
      { label: 'Packing', v: num(val('inv_packing')) },
      { label: val('inv_other_label') || 'Other charges', v: num(val('inv_other')) }
    ].filter(function (c) { return c.v; });
    var chargeTotal = charges.reduce(function (a, c) { return a + c.v; }, 0);
    var discount = num(val('inv_discount'));
    var taxable = sub + chargeTotal - discount;
    var rate = num(val('inv_taxrate'));
    var tax = [];
    if (state.tax === 'cgst' && rate) {
      tax.push({ label: 'CGST @ ' + (rate / 2) + '%', v: taxable * rate / 200 });
      tax.push({ label: 'SGST @ ' + (rate / 2) + '%', v: taxable * rate / 200 });
    } else if (state.tax === 'igst' && rate) {
      tax.push({ label: 'IGST @ ' + rate + '%', v: taxable * rate / 100 });
    }
    var taxTotal = tax.reduce(function (a, t) { return a + t.v; }, 0);
    var gross = taxable + taxTotal;
    var round = 0, grand = gross;
    if ($('#inv_round') && $('#inv_round').checked) { grand = Math.round(gross); round = grand - gross; }
    return { sub: sub, charges: charges, discount: discount, taxable: taxable, tax: tax, taxTotal: taxTotal, round: round, grand: grand };
  }

  /* ---------- the document ---------- */
  var TITLES = { quotation: 'QUOTATION', proforma: 'PROFORMA INVOICE', invoice: 'TAX INVOICE' };

  function render() {
    var items = readItems();
    var t = totals(items);
    var isQuote = state.type === 'quotation';

    var head = '<div class="doc-head">' +
      '<div class="doc-brand">' +
      (state.logo ? '<img src="' + state.logo + '" alt="">' : '') +
      '<div><div class="doc-co">' + (esc(val('inv_co')) || 'Your Company Name') + '</div>' +
      lines(val('inv_coaddr')).map(function (l) { return '<div class="doc-sm">' + l + '</div>'; }).join('') +
      (val('inv_cogst') ? '<div class="doc-sm"><b>GSTIN:</b> ' + esc(val('inv_cogst')) + '</div>' : '') +
      (val('inv_cophone') ? '<div class="doc-sm">' + esc(val('inv_cophone')) + (val('inv_coemail') ? ' &bull; ' + esc(val('inv_coemail')) : '') + '</div>'
        : (val('inv_coemail') ? '<div class="doc-sm">' + esc(val('inv_coemail')) + '</div>' : '')) +
      '</div></div>' +
      '<div class="doc-type"><div class="doc-t">' + TITLES[state.type] + '</div>' +
      (val('inv_no') ? '<div class="doc-sm"><b>No:</b> ' + esc(val('inv_no')) + '</div>' : '') +
      (val('inv_date') ? '<div class="doc-sm"><b>Date:</b> ' + esc(val('inv_date')) + '</div>' : '') +
      (val('inv_due') ? '<div class="doc-sm"><b>' + (isQuote ? 'Valid until' : 'Due') + ':</b> ' + esc(val('inv_due')) + '</div>' : '') +
      '</div></div>';

    var party = '<div class="doc-party">' +
      '<div><div class="doc-lbl">' + (isQuote ? 'Quotation for' : 'Bill to') + '</div>' +
      '<div class="doc-co2">' + (esc(val('inv_buyer')) || '—') + '</div>' +
      lines(val('inv_buyeraddr')).map(function (l) { return '<div class="doc-sm">' + l + '</div>'; }).join('') +
      (val('inv_buyergst') ? '<div class="doc-sm"><b>GSTIN:</b> ' + esc(val('inv_buyergst')) + '</div>' : '') + '</div>' +
      (val('inv_pos') ? '<div><div class="doc-lbl">Place of supply</div><div class="doc-sm">' + esc(val('inv_pos')) + '</div></div>' : '') +
      '</div>';

    var body = items.length
      ? items.map(function (it, i) {
          return '<tr><td class="c">' + (i + 1) + '</td><td>' + (esc(it.desc) || '—') + '</td><td class="c">' + esc(it.hsn) + '</td>' +
            '<td class="r">' + (it.qty ? it.qty.toLocaleString('en-IN') : '') + '</td><td class="c">' + esc(it.unit) + '</td>' +
            '<td class="r">' + (it.rate ? money(it.rate) : '') + '</td><td class="r">' + money(it.amt) + '</td></tr>';
        }).join('')
      : '<tr class="doc-empty"><td colspan="7">Add a line and it appears here</td></tr>';

    var sumRows = '';
    if (items.length) {
      sumRows += '<tr><td>Subtotal</td><td class="r">' + money(t.sub) + '</td></tr>';
      t.charges.forEach(function (c) { sumRows += '<tr><td>' + esc(c.label) + '</td><td class="r">' + money(c.v) + '</td></tr>'; });
      if (t.discount) sumRows += '<tr><td>Less: discount</td><td class="r">- ' + money(t.discount) + '</td></tr>';
      if (t.charges.length || t.discount) sumRows += '<tr><td>Taxable value</td><td class="r">' + money(t.taxable) + '</td></tr>';
      t.tax.forEach(function (x) { sumRows += '<tr><td>' + esc(x.label) + '</td><td class="r">' + money(x.v) + '</td></tr>'; });
      if (t.round) sumRows += '<tr><td>Rounding</td><td class="r">' + (t.round < 0 ? '- ' : '') + money(Math.abs(t.round)) + '</td></tr>';
      sumRows += '<tr class="doc-grand"><td>Total</td><td class="r">&#8377; ' + money(t.grand) + '</td></tr>';
    }

    var w = items.length ? words(t.grand) : '';
    var foot = '';
    if (w) foot += '<div class="doc-words"><b>Amount in words:</b> ' + esc(w) + '</div>';
    var terms = lines(val('inv_terms')), bank = lines(val('inv_bank'));
    if (terms.length || bank.length) {
      foot += '<div class="doc-cols">' +
        (terms.length ? '<div><div class="doc-lbl">Terms &amp; conditions</div><ol class="doc-terms">' +
          terms.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ol></div>' : '') +
        (bank.length ? '<div><div class="doc-lbl">Bank details</div>' +
          bank.map(function (l) { return '<div class="doc-sm">' + l + '</div>'; }).join('') + '</div>' : '') +
        '</div>';
    }
    foot += '<div class="doc-sign"><div>' +
      (isQuote ? 'We look forward to your order.' : 'Received the above goods in good condition.') +
      '</div><div class="doc-sig">For <b>' + (esc(val('inv_co')) || 'Your Company Name') + '</b>' +
      '<div class="doc-sigline">Authorised signatory</div></div></div>';

    $('#inv_doc').innerHTML = head + party +
      '<table class="doc-items"><thead><tr><th class="c">#</th><th>Description</th><th class="c">HSN/SAC</th>' +
      '<th class="r">Qty</th><th class="c">Unit</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>' +
      '<tbody>' + body + '</tbody></table>' +
      (sumRows ? '<div class="doc-sum"><table>' + sumRows + '</table></div>' : '') + foot;

    saveSeller();
    fit();
  }

  /* The document is laid out at a fixed A4 content width and scaled to whatever
     the preview column gives it, so the miniature is the printed page and not a
     second, narrower layout. Below the two-column breakpoint we let it scroll
     instead — a half-size page on a phone would be unreadable. */
  var A4_CONTENT = 720;
  function fit() {
    var box = $('#inv_scale'), doc = $('#inv_doc');
    if (!box || !doc) return;
    var two = window.matchMedia('(min-width: 1081px)').matches;
    root.classList.toggle('scaled', two);
    if (!two) { doc.style.transform = ''; box.style.height = ''; return; }
    var s = Math.min(1, box.clientWidth / A4_CONTENT);
    doc.style.transform = s < 1 ? 'scale(' + s + ')' : '';
    box.style.height = Math.ceil(doc.offsetHeight * s) + 'px';
  }
  var fitTimer;
  window.addEventListener('resize', function () { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 120); });

  /* ---------- seller details remembered, buyer and items never ---------- */
  var SELLER = ['inv_co', 'inv_coaddr', 'inv_cogst', 'inv_cophone', 'inv_coemail', 'inv_terms', 'inv_bank'];
  function saveSeller() {
    try {
      var o = {};
      SELLER.forEach(function (k) { o[k] = val(k); });
      if (state.logo && state.logo.length < 400000) o.logo = state.logo;
      localStorage.setItem(STORE, JSON.stringify(o));
    } catch (e) { /* private window, blocked storage — the tool still works */ }
  }
  function loadSeller() {
    try {
      var o = JSON.parse(localStorage.getItem(STORE) || '{}');
      SELLER.forEach(function (k) { if (o[k] && document.getElementById(k)) document.getElementById(k).value = o[k]; });
      if (o.logo) { state.logo = o.logo; showLogo(); }
    } catch (e) { /* ignore */ }
  }

  function showLogo() {
    var box = $('#inv_logo_prev');
    if (!box) return;
    box.innerHTML = state.logo ? '<img src="' + state.logo + '" alt="Your logo">' : '';
    box.hidden = !state.logo;
    if ($('#inv_logo_clear')) $('#inv_logo_clear').hidden = !state.logo;
  }

  /* ---------- wiring ---------- */
  $$('#invtool input, #invtool textarea').forEach(function (e) {
    if (e.type !== 'file') e.addEventListener('input', render);
  });
  $$('[data-doctype]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.type = btn.getAttribute('data-doctype');
      $$('[data-doctype]').forEach(function (b) { b.classList.toggle('on', b === btn); });
      var t = $('#inv_duelabel');
      if (t) t.textContent = state.type === 'quotation' ? 'Valid until' : 'Due date';
      render();
    });
  });
  $$('[data-taxmode]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.tax = btn.getAttribute('data-taxmode');
      $$('[data-taxmode]').forEach(function (b) { b.classList.toggle('on', b === btn); });
      var f = $('#inv_taxrate_field');
      if (f) f.hidden = state.tax === 'none';
      render();
    });
  });
  if ($('#inv_round')) $('#inv_round').addEventListener('change', render);
  if ($('#inv_addrow')) $('#inv_addrow').addEventListener('click', addRow);

  var file = $('#inv_logo');
  if (file) file.addEventListener('change', function () {
    var f = file.files && file.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { alert('Please choose an image file.'); file.value = ''; return; }
    if (f.size > 2 * 1024 * 1024) { alert('Please choose an image under 2 MB.'); file.value = ''; return; }
    var r = new FileReader();
    r.onload = function () { state.logo = r.result; showLogo(); render(); };
    r.readAsDataURL(f);
  });
  if ($('#inv_logo_clear')) $('#inv_logo_clear').addEventListener('click', function () {
    state.logo = ''; if (file) file.value = ''; showLogo(); render();
  });

  if ($('#inv_print')) $('#inv_print').addEventListener('click', function () { window.print(); });
  if ($('#inv_reset')) $('#inv_reset').addEventListener('click', function () {
    if (!confirm('Clear the buyer and all the lines? Your own company details and terms are kept.')) return;
    ['inv_buyer', 'inv_buyeraddr', 'inv_buyergst', 'inv_pos', 'inv_no', 'inv_due',
     'inv_freight', 'inv_packing', 'inv_other', 'inv_other_label', 'inv_discount'].forEach(function (k) {
      var e = document.getElementById(k); if (e) e.value = '';
    });
    rowsBox.innerHTML = '';
    addRow(); addRow(); addRow();
    render();
  });

  /* date defaults to today, in the form people here write it */
  var d = new Date();
  var today = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  if ($('#inv_date') && !val('inv_date')) $('#inv_date').value = today;

  loadSeller();
  addRow(); addRow(); addRow();
  render();
})();
