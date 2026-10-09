// Worker for pugazh's portfolio.
// Serves the static site, and handles POST /api/subscribe for the newsletter form.
// Subscriber emails are stored in the Cloudflare D1 database bound as `DB` (see wrangler.jsonc),
// never in the GitHub repository.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/subscribe") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      }
      return subscribe(request, env, url);
    }

    // Everything else is the static site.
    return env.ASSETS.fetch(request);
  },
};

async function subscribe(request, env, url) {
  // Only accept posts from this site's own pages.
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) {
    return reply(request, url, 403, { ok: false, error: "forbidden" });
  }

  let email = "", source = "", trap = "";
  try {
    const type = request.headers.get("Content-Type") || "";
    if (type.includes("application/json")) {
      const body = await request.json();
      email = body.email; source = body.source; trap = body.company;
    } else {
      const form = await request.formData();
      email = form.get("email"); source = form.get("source"); trap = form.get("company");
    }
  } catch {
    return reply(request, url, 400, { ok: false, error: "bad_request" });
  }

  // Bots fill the hidden "company" field. Pretend it worked, store nothing.
  if (trap) return reply(request, url, 200, { ok: true });

  email = String(email || "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return reply(request, url, 400, { ok: false, error: "invalid_email" });
  }

  try {
    const result = await env.DB.prepare(
      "INSERT OR IGNORE INTO subscribers (email, source, country) VALUES (?1, ?2, ?3)"
    )
      .bind(email, String(source || "").slice(0, 40), request.cf?.country || null)
      .run();
    const already = result.meta.changes === 0;
    return reply(request, url, 200, { ok: true, already });
  } catch (err) {
    console.error("subscribe failed", err);
    return reply(request, url, 500, { ok: false, error: "server" });
  }
}

// JSON for the page's script; a redirect back to the page for plain form posts (no JavaScript).
function reply(request, url, status, body) {
  const accept = request.headers.get("Accept") || "";
  if (accept.includes("application/json")) {
    return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  }
  const flag = body.ok ? (body.already ? "already" : "ok") : body.error === "invalid_email" ? "invalid" : "error";
  return Response.redirect(`${url.origin}/?subscribed=${flag}#newsletter`, 303);
}
