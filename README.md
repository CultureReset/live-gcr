# live-gcr

The May 2026 Gulf Coast Radar admin and API in one deployable: an Express server on Vercel and about 100 admin pages for businesses, menus, cards, automations, analytics and AI chat.

Superseded by [`Admin-dashboard-main`](https://github.com/CultureReset/Admin-dashboard-main) (admin) and [`gcr-api-clean`](https://github.com/CultureReset/gcr-api-clean) (API). Nothing runs from it.

## How it works

- **`server.js`** (on Vercel) answers `/api/*`: accounts with JWT and bcrypt, uploads, owner update links, and AI, SMS and email through their providers. `db.js` and `gcr-db.js` connect to Supabase.
- **`admin/`** is the admin console as static pages: `businesses.html`, `admin-editor.html`, `card.html`, `automations.html`, `analytics.html`, `ai-chat.html` and reusable components (artist schedules, ticketing and more).
- **`config.js`** sets the API base; `js/` and `css/` are shared.

```bash
npm install
npm run dev     # needs Supabase and provider keys in .env
```
