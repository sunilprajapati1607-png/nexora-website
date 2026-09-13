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
2. `npm run build` (or `node build.js`) — rebuilds every page + sitemap.
3. `npm run serve` — local preview at http://localhost:5173 with Vercel-style clean URLs.
4. Commit and push, or `npm run deploy` (`vercel --prod`) from the linked folder.

Clean URLs are on (`vercel.json`): `/products/erp` serves `products/erp.html`.
The Formspree endpoint for the forms is in `assets/js/site.js` (`FORMSPREE`).
