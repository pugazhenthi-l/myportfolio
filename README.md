# Portfolio site

- `public/` is the website. Everything in it is public (index.html, resume.pdf, images/).
- `src/worker.js` handles the newsletter form (`POST /api/subscribe`).
- `wrangler.jsonc` tells Cloudflare how to deploy the `myportfolio` Worker.
- `schema.sql` describes the subscriber table.

## Where subscriber emails go

Into the Cloudflare D1 database called `newsletter`, table `subscribers`.
They are never written to this GitHub repo, so they stay private even if the repo is public.

To see them: Cloudflare dashboard → Storage & databases → D1 → `newsletter` → Console, then run

    SELECT email, source, country, created_at FROM subscribers ORDER BY created_at DESC;

## Tracking

Every successful signup pushes `{event: 'newsletter_signup', form_location, already_subscribed}`
to the GTM dataLayer (container GTM-NB2VZS58). The email address is never sent to GTM.
