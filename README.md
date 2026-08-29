# Toolbench

Affiliate review site that tests AI and SaaS tools for small businesses — writing, SEO, video, voice, and marketing/CRM — and links out to the tools it recommends.

**Live site:** https://wiyadadev.github.io/toolbench/

---

## What this is

Toolbench publishes hands-on reviews and comparisons of small-business software (Jasper, Semrush, Systeme.io, etc.) and earns a commission when a reader signs up through one of the site's affiliate links. Every recommendation follows one rule: say what a tool is actually good at, and say where it falls short — see [`affiliate-disclosure.html`](affiliate-disclosure.html) for the full policy.

## Tech stack

Plain HTML, CSS, and vanilla JS — no build step, no framework, no server. Hosted on **GitHub Pages**, deployed automatically from the `main` branch.

## Folder structure

```
toolbench/
├── index.html                              Home
├── tools.html                              Tested tools, by category
├── systeme-io-review.html                  Dedicated Systeme.io review (highest-intent page)
├── systeme-io-vs-getresponse.html          Comparison article
├── best-ai-tools-small-business-2026.html  Report: AI tools roundup
├── best-seo-tools-small-business-2026.html Report: SEO tools roundup
├── privacy-policy.html
├── affiliate-disclosure.html
├── styles.css                              Shared design tokens ("field-tested lab report" theme)
├── sitemap.xml                             Submitted to Google Search Console
├── robots.txt
├── rss.xml                                 Feed for auto-syndication (Zapier/Make → social)
├── affiliate-programs.csv                  Affiliate program database (source of truth)
├── data/
│   └── affiliate-programs.json             Same data, JSON — read by the admin panel
├── admin/
│   ├── index.html                          Affiliate Program Manager
│   ├── admin.css
│   └── admin.js                            CRUD UI + local rule-based "Copilot" (no external API)
├── toolbench-content-system.md             Reusable AI prompt for drafting new tool reviews
└── .github/workflows/indexnow.yml          Auto-pings Bing/Yandex on every push
```

## Running locally

No build step needed — just serve the folder:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly via `file://` will break the admin panel (it fetches `data/affiliate-programs.json`, which requires `http://`).

## Admin panel

`/admin/` manages `data/affiliate-programs.json` — search, filter, add/edit programs, and a local "Copilot" that answers questions about the dataset (missing fields, broken URLs, category breakdown) using simple rules, not an external AI API, so it's free and has no usage limits.

**Important:** the admin panel has no backend. Edits made in the browser are not saved automatically. After editing, click **Export JSON**, replace `data/affiliate-programs.json` with the exported file, and push — otherwise changes are lost on refresh.

## Analytics

Google Analytics 4 is wired into every page (Measurement ID `G-6FHRXW8VXH`). Affiliate buttons fire a custom `affiliate_click` event with the tool name and click position (e.g. `bottom_cta`, `tools_grid_card`) so it's possible to see which page and which button position actually drives clicks — not just total traffic.

## SEO / discovery automation

- **`sitemap.xml`** — submitted manually via Google Search Console (GitHub Pages project sites can't rely on `robots.txt` auto-discovery, since `robots.txt` only lives at `wiyadadev.github.io/toolbench/robots.txt`, not the domain root).
- **`.github/workflows/indexnow.yml`** — pings Bing/Yandex automatically on every push to `main`. Requires an IndexNow key file to be present at the repo root (see workflow comments).
- **`rss.xml`** — intended to be watched by Zapier/Make.com to auto-post new articles to social channels without any manual posting.
- **Schema markup** (`Review` + `FAQPage` JSON-LD) on `systeme-io-review.html` — helps the page surface in Google rich results and AI answer engines (ChatGPT, Perplexity, AI Overviews).

## Adding a new tool review

1. Add the program's terms to `affiliate-programs.csv`, then regenerate `data/affiliate-programs.json` to match.
2. Use the prompt template in `toolbench-content-system.md` to draft the review — always edit the AI draft by hand before publishing (fact-check pricing/features, adjust tone).
3. Add the new page's `<loc>` to `sitemap.xml` and an `<item>` to `rss.xml`.
4. Commit and push — the IndexNow workflow pings search engines automatically.
