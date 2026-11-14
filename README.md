# Portfolio site

- `public/` is the website. Everything in it is public (index.html, resume.pdf, images/).
- `src/worker.js` handles the newsletter form (`POST /api/subscribe`).
- `wrangler.jsonc` tells Cloudflare how to deploy the `my` Worker (live at https://my.pugazzh7.workers.dev).
- `schema.sql` describes the subscriber table.
- `google-sheets/Code.gs` is the Apps Script that copies new subscribers into a Google Sheet.

## Placeholders to fill

Any text that starts with a yellow **✕ DUMMY** tag is placeholder copy. Search `public/index.html` for `DUMMY` to find every one.

Photos and logos show a striped "✕ Photo N" / "✕ Logo N" box until the file exists. Upload each file into
`public/images/` with exactly the name below and it replaces the box on its own. No code changes needed.

| File | Where it shows | Suggested size |
|---|---|---|
| `images/photo-1.jpg` | Hero portrait (also the image used when the link is shared) | 1600 × 2000, portrait |
| `images/photo-2.jpg` | Wide photo after the ROAS story ("at work") | 2400 × 1600, landscape |
| `images/photo-3.jpg` | LMES section ("presenting to a team") | 1600 × 2000, portrait |
| `images/photo-4.jpg` … `photo-7.jpg` | "Campaigns and creative" gallery | 1200 × 1500 each |
| `images/logo-1.png` | IshqME (brands wall + timeline) | transparent PNG, ~400 px wide |
| `images/logo-2.png` | LMES Academy (brands wall + timeline) | same |
| `images/logo-3.png` | Memob Plus (brands wall + timeline) | same |
| `images/logo-4.png` … `logo-6.png` | Extra brands on the brands wall (DUMMY) | same |
| `images/logo-7.png` | Meta (toolkit) | same |
| `images/logo-8.png` | Google Ads (toolkit) | same |
| `images/logo-9.png` | Google Analytics (toolkit) | same |
| `images/logo-10.png` | Google Tag Manager (toolkit) | same |
| `images/logo-11.png` | WhatsApp Business (toolkit) | same |
| `images/logo-12.png` | Power BI (toolkit) | same |
| `images/logo-13.png` | Excel (toolkit) | same |

Keep photos under ~400 KB each (export as JPG at about 80% quality) so the page stays fast.

## Where subscriber emails go

Into the Cloudflare D1 database called `newsletter`, table `subscribers`.
They are never written to this GitHub repo, so they stay private even if the repo is public.

To see them: Cloudflare dashboard → Storage & databases → D1 → `newsletter` → Console, then run

    SELECT email, source, country, created_at FROM subscribers ORDER BY created_at DESC;

### Copy to a Google Sheet

Each **new** subscriber is also added as a row in a Google Sheet (repeat signups are skipped).
D1 stays the main record; the sheet is a convenient copy.

1. Open the Google Sheet → Extensions → Apps Script. Replace the editor contents with `google-sheets/Code.gs`.
2. Project Settings (gear icon) → Script properties → add `TOKEN` with a long random value.
3. Back in the editor, pick `setup` and click Run. Allow access when Google asks.
4. Deploy → New deployment → type **Web app**. Execute as **Me**, Who has access **Anyone**. Copy the web app URL.
5. Cloudflare dashboard → Workers & Pages → `myportfolio` → Settings → Variables and Secrets → add two **secrets**:
   - `SHEETS_WEBHOOK_URL` = the web app URL from step 4
   - `SHEETS_TOKEN` = the same value as `TOKEN` from step 2
6. Subscribe once with a test email and check that a row appears.

If you edit `Code.gs` later, use Deploy → Manage deployments → edit → New version, so the URL stays the same.

## Tracking

Every successful signup pushes `{event: 'newsletter_signup', form_location, already_subscribed}`
to the GTM dataLayer (container GTM-NB2VZS58). The email address is never sent to GTM.
