# nexoraofficial.org

Static multi-page website for Nexora, hosted on Vercel (GoDaddy domain).

## Edit → build → deploy

```
src/partials/   head, header (menu), footer + demo modal, icon sprite
src/pages/      one file per page; a comment block at the top sets title / description
assets/         css, js, images (logo, app screenshots)
build.js        assembles src → static HTML at the repo root, writes sitemap.xml
```

1. Edit files under `src/` (never the built HTML at the root — it is overwritten).
2. `npm run site:build` (or `node build.js`) — rebuilds every page + sitemap.
3. `npm run serve` — local preview at http://localhost:5173 with Vercel-style clean URLs.
4. Commit and push, then `npm run deploy` (`vercel --prod`). The Vercel project is `nexora-11092026` (personal account); GitHub is not connected, so a push alone does not deploy.

Clean URLs are on (`vercel.json`): `/products/erp` serves `products/erp.html`.
The Formspree endpoint for the forms is in `assets/js/site.js` (`FORMSPREE`).

## If the domain does not update after a deploy

`vercel --prod` on this Windows machine sometimes crashes at exit (libuv assertion) *after* the
deployment is created but *before* the production alias is moved. Check with
`npx vercel ls nexora-11092026`, then point the domain at the newest deployment:

```
npx vercel alias set https://<newest-deployment>.vercel.app www.nexoraofficial.org
```

The deploy folder `D:\nexora-deploy` must stay linked to project **nexora-11092026**
(`.vercel/project.json`). The old project name `nexoraofficial_new` is not reachable from this account.
