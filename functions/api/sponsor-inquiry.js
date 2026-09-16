/**
 * Cloudflare Pages Function — POST /api/sponsor-inquiry
 * =====================================================
 * Accepts sponsor inquiries from /sponsors/inquiry.html and emails them
 * to Padelite. Uses MailChannels' free Cloudflare-Workers transport, so
 * there's no third-party service to sign up for and no credentials to
 * store: as long as the Cloudflare Worker's outbound domain matches the
 * From address (padeliteapp.com is served through Cloudflare, so it does),
 * MailChannels lets the message through and DKIM-signs it for us.
 *
 * Expected request body (JSON):
 *   { name, brand, email, phone?, interest, message }
 *
 * Response:
 *   200 { ok: true }              on success
 *   400 { ok:false, error:'...' } on validation failure
 *   500 { ok:false, error:'...' } on transport failure
 */

export async function onRequestPost({ request }) {
  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const { name, brand, email, phone, interest, message } = payload || {};

  // Minimal validation — bots get 400, humans get a clear error.
  const problems = [];
  if (!name || typeof name !== 'string' || name.length > 120) problems.push('name');
  if (!brand || typeof brand !== 'string' || brand.length > 120) problems.push('brand');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push('email');
  if (!message || typeof message !== 'string' || message.length > 4000) problems.push('message');
  if (problems.length) return json({ ok: false, error: 'missing_' + problems.join('_') }, 400);

  const subject = `[Padelite Sponsorship] ${brand} — ${interest || 'inquiry'}`;
  const plain = [
    'New sponsorship inquiry via padeliteapp.com/sponsors/inquiry',
    '',
    'Name:      ' + name,
    'Brand:     ' + brand,
    'Email:     ' + email,
    'Phone:     ' + (phone || '—'),
    'Interest:  ' + (interest || '—'),
    '',
    '--- Message ---',
    message,
  ].join('\n');

  const html = `
    <h2 style="font-family:system-ui,sans-serif;color:#0A0F17;">New sponsorship inquiry</h2>
    <p style="font-family:system-ui,sans-serif;color:#1F2A38;">Received via <b>padeliteapp.com/sponsors/inquiry</b>.</p>
    <table style="font-family:system-ui,sans-serif;color:#1F2A38;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;color:#55606E;">Name</td><td>${esc(name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#55606E;">Brand</td><td>${esc(brand)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#55606E;">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#55606E;">Phone</td><td>${esc(phone || '—')}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#55606E;">Interest</td><td>${esc(interest || '—')}</td></tr>
    </table>
    <h3 style="font-family:system-ui,sans-serif;color:#0A0F17;margin-top:20px;">Message</h3>
    <div style="font-family:system-ui,sans-serif;color:#1F2A38;white-space:pre-wrap;border-left:3px solid #E66B23;padding:8px 12px;">${esc(message)}</div>
  `;

  const body = {
    personalizations: [{
      to: [{ email: 'amr.nabil@padeliteapp.com', name: 'Padelite' }],
      // Reply-To routes the organizer's reply straight back to the sender.
      reply_to: { email, name },
    }],
    from: { email: 'no-reply@padeliteapp.com', name: 'Padelite Sponsorship' },
    subject,
    content: [
      { type: 'text/plain', value: plain },
      { type: 'text/html', value: html },
    ],
  };

  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return json({ ok: false, error: 'mail_failed', detail }, 500);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'mail_exception', detail: String(err) }, 500);
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
