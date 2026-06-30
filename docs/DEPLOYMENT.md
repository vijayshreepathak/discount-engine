# Deployment Guide

**Live deployment:** [https://disengine.vercel.app/](https://disengine.vercel.app/)

The Discount Engine is a **static React SPA** built with Vite. Deploy the `dist/` folder to any static host.

---

## Build Settings (All Platforms)

| Setting | Value |
|---------|-------|
| **Build command** | `npm run build` |
| **Output directory** | `dist` |
| **Install command** | `npm install` |
| **Node version** | 18.x or 20.x |

Verify locally before deploying:

```bash
npm install
npm run build
npm run preview
```

Open the preview URL and confirm the app loads.

---

## Vercel

1. Push the repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the repository.
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables** (optional — only for AI rules):

   | Name | Value |
   |------|-------|
   | `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key |

6. Click **Deploy**.

Vercel auto-detects Vite in most cases. No custom routing needed — SPA fallback is handled automatically.

---

## Netlify

1. Push the repository to GitHub.
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**.
3. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. **Environment variables** (Site settings → Environment variables):

   | Key | Value |
   |-----|-------|
   | `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key (optional) |

5. Deploy.

### SPA Redirect (if routes 404)

Create `public/_redirects`:

```
/*    /index.html   200
```

Vite copies `public/` contents into `dist/` on build.

---

## GitHub Pages

1. Install the deploy helper (one-time):

   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json` scripts:

   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

3. Set `base` in `vite.config.js` for project pages:

   ```js
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react()],
   })
   ```

4. Deploy:

   ```bash
   npm run deploy
   ```

5. Enable GitHub Pages in repository **Settings → Pages** → source: `gh-pages` branch.

> **Note:** Anthropic client-side keys on GitHub Pages are visible in the bundle. Use AI rules only with a serverless proxy in production.

---

## Environment Variables

| Variable | Required | When |
|----------|----------|------|
| `VITE_ANTHROPIC_API_KEY` | No | Natural Language Rule parsing only |
| `VITE_ANTHROPIC_MODEL` | No | Claude model override (default: `claude-sonnet-4-6`) |

**No environment variables are required** for CSV upload, PDF upload, calculation, or export.

On Vercel/Netlify, add variables in the dashboard **before** redeploying — Vite embeds `VITE_*` vars at build time.

---

## Post-Deploy Verification

- [ ] Home page loads without console errors
- [ ] Upload `sample-data/rules.csv` and `cart.csv`
- [ ] Calculate → final total Rs.5,339
- [ ] Export results downloads CSV
- [ ] Dark mode works
- [ ] Mobile layout acceptable
- [ ] AI rules work (if key configured)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page on refresh | Add SPA redirect (`_redirects` or Vercel auto-handling) |
| `VITE_ANTHROPIC_API_KEY` undefined | Redeploy after adding env var in host dashboard (Vercel → Settings → Environment Variables) |
| PDF upload fails | pdf.js worker loads from separate chunk — ensure full `dist/` is deployed |
| Large bundle warning | Expected — PDF parser is lazy-loaded (~367 KB separate chunk) |
