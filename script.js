/* ==========================================================================
   Padelite — site-wide runtime helpers.
   • Injects shared header (<nav>) and footer via fetch so we don't
     duplicate that markup in every HTML file.
   • Highlights the current top-level section in the nav (aria-current).
   • Handles the mobile nav toggle once markup has arrived.
   • Handles the sponsor inquiry form submission (posts JSON to
     /api/sponsor-inquiry, a Cloudflare Pages Function).
   ========================================================================== */

(async function boot() {
  await Promise.all([
    inject('site-header', '/partials/header.html'),
    inject('site-footer', '/partials/footer.html'),
  ]);
  wireNav();
  wireSponsorForm();
})();

async function inject(id, url) {
  const slot = document.getElementById(id);
  if (!slot) return;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(url + ' -> ' + res.status);
    slot.innerHTML = await res.text();
  } catch (e) {
    // fetch:// doesn't work on file://, so this fallback keeps the
    // site usable when previewed by double-clicking the HTML.
    console.warn('inject failed for', url, e);
  }
}

function wireNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  if (!nav || !toggle) return;
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => nav.classList.remove('open'));
  });

  // Highlight the section this page belongs to.
  const section = document.body.dataset.section;
  if (section) {
    const active = document.querySelector('.nav-links a[data-section="' + section + '"]');
    if (active) active.setAttribute('aria-current', 'page');
  }
}

function wireSponsorForm() {
  const form = document.getElementById('sponsorForm');
  if (!form) return;
  const status = form.querySelector('.form-status');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    status.className = 'form-status';
    status.textContent = '';

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.dataset.orig = submit.textContent;
    submit.textContent = 'Sending…';

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/sponsor-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) {
        throw new Error(body.error || 'Submission failed');
      }
      status.classList.add('ok');
      status.textContent = "Thanks — we've received your inquiry and will reply within 48 hours.";
      form.reset();
    } catch (err) {
      status.classList.add('err');
      status.textContent = 'Sorry, that didn’t go through. Email amr.nabil@padeliteapp.com directly and we’ll pick up from there.';
    } finally {
      submit.disabled = false;
      submit.textContent = submit.dataset.orig;
    }
  });
}
