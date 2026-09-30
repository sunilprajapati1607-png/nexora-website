/**
 * Nexora website — PUBLISH, in one go (run by the owner: double-click D:\nexora-website\Publish Website.bat)
 * =========================================================================================================
 *   1. builds the pages (node build.js)
 *   2. copies what is built into D:\nexora-deploy (the folder linked to the Vercel project), removing what the source
 *      no longer has from assets/
 *   3. deploys it to production (vercel --prod, personal scope) — the CLI creates the deployment and then does not exit,
 *      so its address is read from what it prints and it is stopped
 *   4. points www.nexoraofficial.org AND nexoraofficial.org at the new deployment (the domains are manual aliases)
 *   5. reads the live home page back to prove it is the new build
 */
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const SRC = path.join(__dirname, '..');
const DEPLOY = 'D:\\nexora-deploy';
const SCOPE = 'sunilprajapati1607-1181';
const DOMAINS = ['www.nexoraofficial.org', 'nexoraofficial.org'];

function step(t) { console.log('\n=== ' + t + ' ==='); }
function run(cmd, cwd) { console.log('> ' + cmd); return execSync(cmd, { cwd: cwd || SRC, stdio: 'pipe', encoding: 'utf8', shell: true }); }

(async () => {
  step('1. Build');
  console.log(run('node build.js').trim().split('\n').slice(-2).join('\n'));
  const build = (fs.readFileSync(path.join(SRC, 'index.html'), 'utf8').match(/\?v=(\d{12})/) || [])[1] || '';
  console.log('build stamp ' + build);

  step('2. Copy into ' + DEPLOY);
  if (!fs.existsSync(path.join(DEPLOY, '.vercel', 'project.json'))) throw new Error(DEPLOY + ' is not linked to Vercel.');
  const top = fs.readdirSync(SRC).filter((f) => /\.html$/.test(f) || ['vercel.json', 'robots.txt', 'sitemap.xml', 'favicon.ico'].includes(f));
  top.forEach((f) => fs.copyFileSync(path.join(SRC, f), path.join(DEPLOY, f)));
  fs.mkdirSync(path.join(DEPLOY, 'products'), { recursive: true });
  fs.readdirSync(path.join(SRC, 'products')).filter((f) => /\.html$/.test(f)).forEach((f) => fs.copyFileSync(path.join(SRC, 'products', f), path.join(DEPLOY, 'products', f)));
  /* assets whole: what the source dropped must not stay live */
  fs.rmSync(path.join(DEPLOY, 'assets'), { recursive: true, force: true });
  fs.cpSync(path.join(SRC, 'assets'), path.join(DEPLOY, 'assets'), { recursive: true });
  console.log('copied ' + top.length + ' pages, products/ and assets/');

  step('3. Deploy to production');
  /* The CLI on this PC often prints nothing and never exits, although the deployment IS made. So the new deployment is
     found in Vercel's own list: the first address that was not there before, once it says Ready. */
  const URL_RX = /https:\/\/nexora-11092026-[a-z0-9-]+\.vercel\.app/ig;
  const listNow = () => { try { return run('npx vercel ls nexora-11092026 --scope ' + SCOPE, DEPLOY); } catch (e) { return String(e.stdout || '') + String(e.stderr || ''); } };
  const before = new Set(listNow().match(URL_RX) || []);
  console.log(before.size + ' deployments already there');
  const child = spawn('npx vercel --prod --yes --scope ' + SCOPE, { cwd: DEPLOY, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (b) => process.stdout.write(b.toString()));
  child.stderr.on('data', (b) => process.stdout.write(b.toString()));
  const started = Date.now();
  let url = null;
  while (!url && Date.now() - started < 10 * 60 * 1000) {
    await new Promise((r) => setTimeout(r, 15000));
    const out = listNow();
    const lines = out.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/https:\/\/nexora-11092026-[a-z0-9-]+\.vercel\.app/i);
      if (m && !before.has(m[0])) {
        /* the list's columns are cut on a narrow window, so the status is asked of the deployment itself */
        let st = '';
        try { st = run('npx vercel inspect ' + m[0] + ' --scope ' + SCOPE, DEPLOY); } catch (e) { st = String(e.stdout || '') + String(e.stderr || ''); }
        if (/status\s+\W*\s*Ready/i.test(st) || /Ready/i.test(line)) { url = m[0]; break; }
        if (/status\s+\W*\s*(Error|Canceled)/i.test(st)) { try { child.kill(); } catch (e) {} throw new Error('The new deployment failed on Vercel: ' + m[0]); }
        console.log('  building: ' + m[0] + ' …');
      }
    }
  }
  try { child.kill(); } catch (e) {}
  if (!url) throw new Error('No new Ready deployment in 10 minutes — look at vercel.com, then run this again.');
  console.log('\ndeployment ' + url);

  step('4. Point the domains at it');
  DOMAINS.forEach((d) => console.log(run('npx vercel alias set ' + url + ' ' + d + ' --scope ' + SCOPE, DEPLOY).trim()));

  step('5. Check the live site');
  await new Promise((r) => setTimeout(r, 8000));
  const res = await fetch('https://www.nexoraofficial.org/?v=' + Date.now(), { redirect: 'follow' });
  const html = await res.text();
  const live = (html.match(/\?v=(\d{12})/) || [])[1] || '';
  console.log('live build ' + live + (live === build ? '  — the new one. Done.' : '  — NOT the new one yet (' + build + '); wait a minute and reload.'));
})().catch((e) => { console.error('\nSTOPPED: ' + e.message); process.exitCode = 1; });
