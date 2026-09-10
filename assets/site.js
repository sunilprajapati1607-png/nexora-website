
    // ---- Mobile nav ----
    function toggleNav() {
      const header = document.getElementById('siteHeader');
      const open = header.classList.toggle('nav-open');
      const btn = document.getElementById('navToggle');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '✕' : '☰';
    }
    function closeNav() {
      const header = document.getElementById('siteHeader');
      header.classList.remove('nav-open');
      const btn = document.getElementById('navToggle');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '☰';
    }

    // ---- Theme (light / dark) ----
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      try { localStorage.setItem('nexora-theme', theme); } catch (e) {}
    }
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }
    (function initTheme() {
      let saved = 'dark';
      try { saved = localStorage.getItem('nexora-theme') || 'dark'; } catch (e) {}
      applyTheme(saved);
    })();

    // ---- Free calculator (real GSM / bag-weight engine) ----
    function runCalculator() {
      const len = parseFloat(document.getElementById('c_len').value) || 0;
      const wid = parseFloat(document.getElementById('c_wid').value) || 0;
      const epi = parseFloat(document.getElementById('c_epi').value) || 0;
      const ppi = parseFloat(document.getElementById('c_ppi').value) || 0;
      const den = parseFloat(document.getElementById('c_den').value) || 0;
      const rate = parseFloat(document.getElementById('c_rate').value) || 0;
      const lam = document.getElementById('c_lam').checked;

      let gsm = (den * epi + den * ppi) / 228.6;
      if (lam) gsm += 12;

      const areaM2 = (len / 100) * (wid / 100) * 2; // tubular fabric, two layers
      const wastage = 0.05;
      const fabricWeight = areaM2 * gsm * (1 + wastage);
      const threadWeight = 1.2;
      const bagWeight = fabricWeight + threadWeight;
      const costPerBag = (bagWeight / 1000) * rate;
      const costPer1000 = costPerBag * 1000;

      document.getElementById('c_gsm').textContent = gsm.toFixed(1);
      document.getElementById('c_area').textContent = areaM2.toFixed(3) + ' m²';
      document.getElementById('c_fw').textContent = fabricWeight.toFixed(2) + ' g';
      document.getElementById('c_bw').textContent = bagWeight.toFixed(2) + ' g';
      document.getElementById('c_cost').textContent = '₹' + costPerBag.toFixed(3);
      document.getElementById('c_cost1000').textContent = '₹' + costPer1000.toFixed(0);
      document.getElementById('c_formula').textContent =
        'GSM = (' + den + '×' + epi + ' + ' + den + '×' + ppi + ') / 228.6' + (lam ? ' + 12 (lamination)' : '') + ' = ' + gsm.toFixed(1);
    }

    // ---- App simulator tab controller ----
    function switchTab(tab, btn) {
      if (btn) {
        document.querySelectorAll('.app-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      const outlet = document.getElementById('tabOutlet');

      switch (tab) {
        case 'dash':
          outlet.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:10px; flex-wrap:wrap;">
              <div><h3 style="font-size:16px; font-weight:800;">Dashboard</h3><p style="font-size:11.5px; color:#64748b;">What is in the system, and what needs attention</p></div>
              <button class="app-tool-btn primary" onclick="goToApp('newcalc')">➕ New Calculation</button>
            </div>
            <div style="background:#fffbeb; border:1px solid #fef3c7; border-left:4px solid #f59e0b; padding:12px 16px; border-radius:6px; margin-bottom:18px; font-size:12px; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
              <div>⚠️ <strong>Needs Attention:</strong> CAL-2026-000004 (71.43 g) exceeds tolerance band of 68.60–71.40 g.</div>
              <button class="app-tool-btn" onclick="goToApp('engine')">Inspect</button>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:12px; margin-bottom:18px;">
              <div style="background:#fff; padding:12px; border:1px solid var(--border-color); border-radius:6px;">
                <div style="font-size:10px; color:#64748b; font-weight:700;">CALCULATIONS</div>
                <div style="font-size:22px; font-weight:800; font-family:monospace;">8</div>
                <div style="font-size:10px; color:#059669;">● 8 in last 7 days</div>
              </div>
              <div style="background:#fff; padding:12px; border:1px solid var(--border-color); border-radius:6px;">
                <div style="font-size:10px; color:#64748b; font-weight:700;">AVG COST PER BAG</div>
                <div style="font-size:22px; font-weight:800; font-family:monospace;">₹ 8.955</div>
                <div style="font-size:10px; color:#64748b;">average of 4 recent</div>
              </div>
              <div style="background:#fff; padding:12px; border:1px solid var(--border-color); border-radius:6px;">
                <div style="font-size:10px; color:#64748b; font-weight:700;">RAW MATERIALS PRICED</div>
                <div style="font-size:22px; font-weight:800; font-family:monospace;">9 / 9</div>
                <div style="font-size:10px; color:#059669;">● all up to date</div>
              </div>
              <div style="background:#fff; padding:12px; border:1px solid var(--border-color); border-radius:6px;">
                <div style="font-size:10px; color:#64748b; font-weight:700;">OUT OF TOLERANCE</div>
                <div style="font-size:22px; font-weight:800; font-family:monospace; color:#ef4444;">2</div>
                <div style="font-size:10px; color:#ef4444;">● check technical specs</div>
              </div>
            </div>
            <div style="background:#fff; border:1px solid var(--border-color); border-radius:8px; overflow:hidden;">
              <div style="padding:10px 14px; background:#f8fafc; font-weight:700; font-size:12px; border-bottom:1px solid var(--border-color);">Recent Calculations</div>
              <div class="table-scroll">
              <table class="sim-table" style="border:none; min-width:640px;">
                <thead><tr><th>Calc ID</th><th>Item Name</th><th>Construction</th><th>Target</th><th>Actual</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  <tr><td>CAL-2026-000008</td><td>Test 20KG</td><td>2L Block Bottom</td><td>75.00 g</td><td><strong>75.45 g</strong></td><td><span class="sim-badge badge-app">Approved</span></td><td><button class="app-tool-btn" onclick="openSpecModal()">Specsheet</button></td></tr>
                  <tr><td>CAL-2026-000007</td><td>ABC FERTI 25KG</td><td>2L Stitch Bag</td><td>60.00 g</td><td><strong>60.34 g</strong></td><td><span class="sim-badge badge-calc">Calculated</span></td><td><button class="app-tool-btn" onclick="goToApp('engine')">Open</button></td></tr>
                  <tr><td>CAL-2026-000006</td><td>NX-00006</td><td>2L Block Bottom</td><td>73.00 g</td><td><strong>72.89 g</strong></td><td><span class="sim-badge badge-calc">Calculated</span></td><td><button class="app-tool-btn" onclick="goToApp('engine')">Open</button></td></tr>
                </tbody>
              </table>
              </div>
            </div>
          `;
          break;

        case 'engine':
          outlet.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:10px; flex-wrap:wrap;">
              <div><h3 style="font-size:16px; font-weight:800;">Bag Weight Calculation — NX-00008</h3><p style="font-size:11px; color:#64748b;">CAL-2026-000008 &bull; Rev 1 &bull; 2L Block Bottom BOPP Bag</p></div>
              <div style="display:flex; gap:8px;"><button class="app-tool-btn primary" onclick="openSpecModal()">📄 Preview Specsheet</button><span class="sim-badge badge-app" style="font-size:11px; padding:6px 10px;">APPROVED</span></div>
            </div>
            <div class="gsm-quick-box">
              <div class="gsm-input-wrap"><label>Body Fabric GSM</label><input type="number" id="gsm_body" value="63" oninput="simRecalc()"></div>
              <div class="gsm-input-wrap"><label>Body Coating GSM</label><input type="number" id="gsm_coat" value="23" oninput="simRecalc()"></div>
              <div class="gsm-input-wrap"><label>Patch Fabric GSM</label><input type="number" id="gsm_patch" value="61" oninput="simRecalc()"></div>
              <div class="gsm-input-wrap"><label>Valve Coating GSM</label><input type="number" id="gsm_valve" value="25" oninput="simRecalc()"></div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px,1fr)); gap:16px;">
              <div style="background:#fff; border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><strong style="font-size:12px;">Component Weight Breakdown</strong><span id="sim_total_badge" style="font-weight:700; color:var(--primary);">75.45 g</span></div>
                <div class="table-scroll">
                <table class="sim-table" style="min-width:320px;">
                  <tr><td>Body (fabric+coating+BOPP)</td><td><strong id="sim_body_w">62.68</strong> g</td><td style="text-align:right;">83.1%</td></tr>
                  <tr><td>Top patch</td><td><strong id="sim_top_w">4.43</strong> g</td><td style="text-align:right;">5.9%</td></tr>
                  <tr><td>Bottom patch</td><td><strong id="sim_bot_w">4.17</strong> g</td><td style="text-align:right;">5.5%</td></tr>
                  <tr><td>Valve assembly</td><td><strong id="sim_valve_w">4.18</strong> g</td><td style="text-align:right;">5.5%</td></tr>
                  <tr style="background:#f0fdf4; font-weight:800; font-size:13px;"><td>TOTAL WEIGHT</td><td id="sim_total_w" style="color:var(--primary);">75.45 g</td><td style="text-align:right;">100.0%</td></tr>
                </table>
                </div>
              </div>
              <div style="background:#fff; border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                <strong style="font-size:12px; display:block; margin-bottom:10px;">Dimensional &amp; Mesh Parameters</strong>
                <div class="table-scroll">
                <table class="sim-table" style="min-width:260px;">
                  <tr><td>Cut Length</td><td style="text-align:right; font-family:monospace; font-weight:700;">725.00 mm</td></tr>
                  <tr><td>Body Width</td><td style="text-align:right; font-family:monospace; font-weight:700;">500.00 mm</td></tr>
                  <tr><td>Bottom Depth (Patch)</td><td style="text-align:right; font-family:monospace; font-weight:700;">100.00 mm</td></tr>
                  <tr><td>Body Denier</td><td style="text-align:right; font-family:monospace; font-weight:700;">860 D</td></tr>
                  <tr><td>Flat Denier</td><td style="text-align:right; font-family:monospace; font-weight:700;">840 D</td></tr>
                  <tr><td>Total Coating GSM</td><td style="text-align:right; font-family:monospace; font-weight:700; color:var(--primary);" id="sim_lami_gsm">86.00 GSM</td></tr>
                </table>
                </div>
              </div>
            </div>
          `;
          simRecalc();
          break;

        case 'newcalc':
          outlet.innerHTML = `
            <div style="margin-bottom:16px;"><h3 style="font-size:16px; font-weight:800;">Select Bag Construction</h3><p style="font-size:11px; color:#64748b;">29 bag types calibrated in Structure Master</p></div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px,1fr)); gap:12px;">
              <div style="background:#fff; border:1px solid var(--border-color); border-radius:8px; padding:14px; cursor:pointer;" onclick="goToApp('engine')"><strong style="font-size:12.5px; display:block;">1L Stitch Bag</strong><span style="font-size:11px; color:#64748b;">Unlami Stitch Bag</span></div>
              <div style="background:#eff6ff; border:1.5px solid var(--primary); border-radius:8px; padding:14px; cursor:pointer;" onclick="goToApp('engine')"><strong style="font-size:12.5px; display:block; color:var(--primary);">2L Block Bottom</strong><span style="font-size:11px; color:#64748b;">Block Bottom BOPP Bag</span></div>
              <div style="background:#fff; border:1px solid var(--border-color); border-radius:8px; padding:14px; cursor:pointer;" onclick="goToApp('engine')"><strong style="font-size:12.5px; display:block;">2L Block Bottom + 4L Patch</strong><span style="font-size:11px; color:#64748b;">Block Bottom + Patch Metallised</span></div>
              <div style="background:#fff; border:1px solid var(--border-color); border-radius:8px; padding:14px; cursor:pointer;" onclick="goToApp('engine')"><strong style="font-size:12.5px; display:block;">2L Easy Open</strong><span style="font-size:11px; color:#64748b;">Backseam Easyopen BOPP Bag</span></div>
              <div style="background:#fff; border:1px solid var(--border-color); border-radius:8px; padding:14px; cursor:pointer;" onclick="goToApp('engine')"><strong style="font-size:12.5px; display:block;">2L Stitch Bag + Liner</strong><span style="font-size:11px; color:#64748b;">Woven Bag Laminated with HM/LDPE Liner</span></div>
              <div style="background:#fff; border:1px solid var(--border-color); border-radius:8px; padding:14px; cursor:pointer;" onclick="goToApp('engine')"><strong style="font-size:12.5px; display:block;">3L Block Bottom + 2L Patch</strong><span style="font-size:11px; color:#64748b;">Heavy Duty Block Bottom</span></div>
            </div>
          `;
          break;

        case 'structure':
          outlet.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:10px; flex-wrap:wrap;">
              <div><h3 style="font-size:16px; font-weight:800;">Structure Master</h3><p style="font-size:11px; color:#64748b;">Bag constructions &mdash; tick which fields apply to each one</p></div>
              <button class="app-tool-btn primary" onclick="openDemoModal()" title="Available in the licensed app — request a demo">🔒 New Structure</button>
            </div>
            <div class="table-scroll">
            <table class="sim-table" style="min-width:640px;">
              <thead><tr><th>NAME</th><th>DESCRIPTION</th><th>SCOPE</th><th>STATUS</th><th>ACTIVE FIELDS</th></tr></thead>
              <tbody>
                <tr><td><strong>1L STITCH BAG</strong></td><td>UNLAMI STICH BAG</td><td>UNLAMINATED, STITCHED</td><td><span class="sim-badge badge-app">ACTIVE</span></td><td>27 fields</td></tr>
                <tr><td><strong>2L BLOCK BOTTOM</strong></td><td>BLOCK BOTTOM BOPP</td><td>LAMINATED, BLOCKBOTTOM</td><td><span class="sim-badge badge-app">ACTIVE</span></td><td>68 fields</td></tr>
                <tr><td><strong>2L BLOCK BOTTOM + 4L PATCH</strong></td><td>BLOCK BOTTOM + PATCH METALLISED</td><td>LAMINATED, BLOCKBOTTOM, PATCH</td><td><span class="sim-badge badge-app">ACTIVE</span></td><td>80 fields</td></tr>
                <tr><td><strong>2L EASY OPEN</strong></td><td>BACKSEAM EASYOPEN BOPP BAG</td><td>LAMINATED, BACKSEAM, EASYOPEN</td><td><span class="sim-badge badge-app">ACTIVE</span></td><td>55 fields</td></tr>
              </tbody>
            </table>
            </div>
          `;
          break;

        case 'rm':
          outlet.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:10px; flex-wrap:wrap;">
              <div><h3 style="font-size:16px; font-weight:800;">Raw Material Master &amp; Prices</h3><p style="font-size:11px; color:#64748b;">A new price never overwrites the old one &mdash; revision locked</p></div>
              <button class="app-tool-btn primary" onclick="openDemoModal()" title="Available in the licensed app — request a demo">🔒 Add Material</button>
            </div>
            <div class="table-scroll">
            <table class="sim-table" style="min-width:640px;">
              <thead><tr><th>CODE</th><th>MATERIAL NAME</th><th>UOM</th><th>WASTE %</th><th>CURRENT RATE (₹)</th><th>VERSION</th></tr></thead>
              <tbody>
                <tr><td><code>GRN-PP</code></td><td>PP Granule Homopolymer</td><td>KG</td><td>1.50 %</td><td>₹ 94.50</td><td><span class="sim-badge badge-app">v2.1 Active</span></td></tr>
                <tr><td><code>GRN-LD</code></td><td>LD Granule Extrusion Grade</td><td>KG</td><td>2.00 %</td><td>₹ 102.00</td><td><span class="sim-badge badge-app">v1.8 Active</span></td></tr>
                <tr><td><code>BOPP-FILM</code></td><td>BOPP Film 18 Micron</td><td>KG</td><td>3.00 %</td><td>₹ 145.00</td><td><span class="sim-badge badge-app">v3.0 Active</span></td></tr>
                <tr><td><code>ZIP-GLUE</code></td><td>Zipper Glue / Hotmelt</td><td>KG</td><td>0.50 %</td><td>₹ 180.00</td><td><span class="sim-badge badge-app">v1.0 Active</span></td></tr>
              </tbody>
            </table>
            </div>
          `;
          break;

        case 'route':
          outlet.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:10px; flex-wrap:wrap;">
              <div><h3 style="font-size:16px; font-weight:800;">Process &amp; Route Master</h3><p style="font-size:11px; color:#64748b;">Design each bag type's sequential path through the factory</p></div>
              <button class="app-tool-btn primary" onclick="openDemoModal()" title="Available in the licensed app — request a demo">🔒 New Route</button>
            </div>
            <div style="background:#fff; border:1px solid var(--border-color); border-radius:8px; padding:16px; margin-bottom:16px;">
              <strong style="font-size:13px; display:block; margin-bottom:8px;">BOPP Laminated Block Bottom (11 Sequential Steps)</strong>
              <div class="route-sequence">
                <span class="route-step">1. Tape</span> &rarr; <span class="route-step">2. Weaving</span> &rarr; <span class="route-step">3. BOPP Printing</span> &rarr;
                <span class="route-step">4. Adhesive Lami</span> &rarr; <span class="route-step">5. Slitting</span> &rarr; <span class="route-step">6. Lamination</span> &rarr;
                <span class="route-step">7. Backseam</span> &rarr; <span class="route-step">8. Patch Slit</span> &rarr; <span class="route-step">9. Block Bottom</span> &rarr;
                <span class="route-step">10. Finishing</span> &rarr; <span class="route-step">11. Packing</span>
              </div>
            </div>
          `;
          break;

        case 'history':
          outlet.innerHTML = `
            <div style="margin-bottom:14px;"><h3 style="font-size:16px; font-weight:800;">Calculation History</h3><p style="font-size:11px; color:#64748b;">Every saved calculation &mdash; revision tracked and audit logged</p></div>
            <div class="table-scroll">
            <table class="sim-table" style="min-width:760px;">
              <thead><tr><th>CALC NO</th><th>ITEM CODE</th><th>ITEM NAME</th><th>CONSTRUCTION</th><th>TARGET</th><th>ACTUAL</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
              <tbody>
                <tr><td>CAL-2026-000008 rev 1</td><td>NX-00008</td><td>Test 20KG</td><td>2L Block Bottom</td><td>75.0 g</td><td><strong>75.45 g</strong></td><td><span class="sim-badge badge-app">APPROVED</span></td><td><button class="app-tool-btn" onclick="openSpecModal()">Open</button></td></tr>
                <tr><td>CAL-2026-000007 rev 3</td><td>NX-00007</td><td>ABC FERTI 25KG</td><td>2L Stitch Bag</td><td>60.0 g</td><td><strong>60.34 g</strong></td><td><span class="sim-badge badge-calc">CALCULATED</span></td><td><button class="app-tool-btn" onclick="goToApp('engine')">Open</button></td></tr>
                <tr><td>CAL-2026-000006 rev 1</td><td>NX-00006</td><td>Rice 50KG</td><td>2L Block Bottom</td><td>73.0 g</td><td><strong>72.89 g</strong></td><td><span class="sim-badge badge-calc">CALCULATED</span></td><td><button class="app-tool-btn" onclick="goToApp('engine')">Open</button></td></tr>
                <tr><td>CAL-2026-000005 rev 1</td><td>NX-00005</td><td>Sugar 15KG</td><td>1L Stitch Bag</td><td>45.0 g</td><td><strong>44.89 g</strong></td><td><span class="sim-badge badge-calc">CALCULATED</span></td><td><button class="app-tool-btn" onclick="goToApp('engine')">Open</button></td></tr>
              </tbody>
            </table>
            </div>
          `;
          break;
      }
    }

    function goToApp(tab) {
      const frame = document.getElementById('simulator');
      frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const b = document.querySelector('.app-nav-btn[data-tab="' + tab + '"]');
        switchTab(tab, b);
      }, 420);
    }

    function simRecalc() {
      const elB = document.getElementById('gsm_body'), elC = document.getElementById('gsm_coat'),
            elP = document.getElementById('gsm_patch'), elV = document.getElementById('gsm_valve');
      if (!elB) return;
      const gsmB = parseFloat(elB.value) || 63;
      const gsmC = parseFloat(elC.value) || 23;
      const gsmP = parseFloat(elP.value) || 61;
      const gsmV = parseFloat(elV.value) || 25;

      const bodyW = 0.725 * (gsmB + gsmC + 16.5);
      const topW = 0.051 * (gsmP + 22);
      const botW = 0.048 * (gsmP + 22);
      const valveW = 0.042 * (58 + gsmV);
      const totalW = bodyW + topW + botW + valveW;

      document.getElementById('sim_body_w').innerText = bodyW.toFixed(2);
      document.getElementById('sim_top_w').innerText = topW.toFixed(2);
      document.getElementById('sim_bot_w').innerText = botW.toFixed(2);
      document.getElementById('sim_valve_w').innerText = valveW.toFixed(2);
      document.getElementById('sim_total_w').innerText = totalW.toFixed(2) + ' g';
      document.getElementById('sim_total_badge').innerText = totalW.toFixed(2) + ' g';
      document.getElementById('sim_lami_gsm').innerText = (gsmB + gsmC).toFixed(2) + ' GSM';
    }

    // ---- Modals ----
    function openSpecModal() { document.getElementById('specModal').classList.add('open'); }
    function closeSpecModal() { document.getElementById('specModal').classList.remove('open'); }
    function openDemoModal() { document.getElementById('demoModal').classList.add('open'); closeNav(); }
    function closeDemoModal() { document.getElementById('demoModal').classList.remove('open'); }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeSpecModal(); closeDemoModal(); }
    });

    // ---- Silent background alert to info@nexoraofficial.org via Formspree ----
    // Fires regardless of which channel (WhatsApp / Email) the visitor picks, so a
    // demo request is never missed even if they close the WhatsApp/mail window.
    // Formspree endpoint: create a free form at https://formspree.io pointed at
    // info@nexoraofficial.org, then replace FORM_ID below with the ID it gives you
    // (the part after /f/ in your form's endpoint URL).
    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzebyndo';
    function notifyFormspree(name, company, phone, channel) {
      try {
        fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name, company, phone,
            channel_chosen: channel,
            source_page: window.location.href,
            _subject: 'New Nexora Demo Request — ' + company
          })
        }).catch(() => {});
      } catch (e) {}
    }

    // ---- Demo dispatch: WhatsApp or Email ----
    function sendDemo(channel) {
      const form = document.getElementById('demoForm');
      if (!form.reportValidity()) return;
      if (document.getElementById('d_hp').value) return; // honeypot tripped — likely a bot, drop silently
      const name = document.getElementById('d_name').value.trim();
      const company = document.getElementById('d_company').value.trim();
      const phone = document.getElementById('d_phone').value.trim();

      notifyFormspree(name, company, phone, channel);

      if (channel === 'whatsapp') {
        const text = '*New Nexora Demo Enquiry (nexoraofficial.org)*%0A%0A*Name:* ' + encodeURIComponent(name) +
          '%0A*Company:* ' + encodeURIComponent(company) + '%0A*Contact:* ' + encodeURIComponent(phone);
        window.open('https://wa.me/917567161607?text=' + text, '_blank');
      } else {
        const subject = encodeURIComponent('Nexora Demo Request — ' + company);
        const body = encodeURIComponent(
          'Name: ' + name + '\n' + 'Company: ' + company + '\n' + 'Contact number: ' + phone + '\n\n' +
          'Requesting a walkthrough of Nexora Bag Weight Calculation for our plant.'
        );
        window.location.href = 'mailto:info@nexoraofficial.org?subject=' + subject + '&body=' + body;
      }
      closeDemoModal();
    }

    // ---- Scroll-reveal + animated stat counters ----
    function initScrollEffects() {
      const revealSelectors = [
        '.service-card', '.feature-box', '.tour-card', '.why-card',
        '.story-step', '.founder-card', '.portfolio-col', '.calc-card',
        '.founder-story-side'
      ];
      const revealEls = document.querySelectorAll(revealSelectors.join(','));
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced || !('IntersectionObserver' in window)) {
        revealEls.forEach(el => el.classList.add('reveal', 'is-visible'));
      } else {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach((el, i) => {
          el.classList.add('reveal');
          el.style.transitionDelay = (i % 4) * 0.07 + 's';
          io.observe(el);
        });
      }

      // Animated count-up for the founder story-meta numbers (e.g. "16+ yrs", "4 Roles")
      const counters = document.querySelectorAll('.story-meta strong');
      if (counters.length && !prefersReduced && ('IntersectionObserver' in window)) {
        const counterIO = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            counterIO.unobserve(entry.target);
            const el = entry.target;
            const text = el.textContent.trim();
            const match = text.match(/^(\d+)(.*)$/);
            if (!match) return;
            const target = parseInt(match[1], 10);
            const suffix = match[2];
            const duration = 900;
            const start = performance.now();
            function step(now) {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = Math.round(target * eased) + suffix;
              if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          });
        }, { threshold: 0.5 });
        counters.forEach(el => counterIO.observe(el));
      }
    }

    // ---- Wire-up ----
    // Guarded: the app simulator (#tabOutlet) and the calculator (#c_len etc.)
    // only exist on the App & Calculator page now that the site is multi-page,
    // so these two only run there. Everything else (nav, theme, scroll-reveal)
    // is shared and runs on every page.
    window.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('tabOutlet')) switchTab('dash');
      if (document.getElementById('c_len')) runCalculator();
      document.querySelectorAll('.nav-menu a, .header-actions button:not(#themeToggle)').forEach(el => {
        el.addEventListener('click', closeNav);
      });
      initScrollEffects();
    });
  