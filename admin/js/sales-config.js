/* ── CyberCheck Sales Site — Config Loader & Shared Helpers ────────────────
   Each sales page calls SalesConfig.load(pageId, DEFAULTS, applyFn).
   The API overlay is applied on top of hardcoded defaults.
   If the API is unavailable, defaults are used silently.
   ──────────────────────────────────────────────────────────────────────── */

const SALES_API = '/api';

const SalesConfig = {

  async load(pageId, defaults, applyFn) {
    let config = defaults;
    try {
      const res = await fetch(`${SALES_API}/api/gcr/sales-page/${pageId}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.sections) {
          config = data;
        }
      }
    } catch (_) { /* API down — use defaults */ }
    applyFn(config);
  },

  // Get a section's data by id (returns null if disabled)
  section(config, id) {
    if (!config || !config.sections) return null;
    const s = config.sections.find(s => s.id === id);
    return (s && s.enabled !== false) ? s.data : null;
  },

};

/* ── Shared nav ──────────────────────────────────────────────────────────── */
const SALES_NAV_LINKS = [
  { href: '/index.html',          label: 'Home' },
  { href: '/gcr.html',            label: 'Gulf Coast Radar' },
  { href: '/booking.html',        label: 'Booking' },
  { href: '/menu-updates.html',   label: 'Menu Updates' },
  { href: '/reviews.html',        label: 'Reviews' },
  { href: '/artists.html',        label: 'Artists' },
  { href: '/automations.html',    label: 'Automations' },
  { href: '/platform.html',       label: 'Platform' },
];

function renderSalesNav(activeLabel) {
  const el = document.getElementById('s-nav');
  if (!el) return;
  el.innerHTML = `
    <a href="/index.html" class="s-nav-logo" style="display:flex;align-items:center;gap:10px;">
        <img src="/img/cybercheck-logo.jpg" alt="CyberCheck" style="height:38px;width:38px;border-radius:50%;object-fit:cover;mix-blend-mode:screen;">
        <span>Cyber<span style="color:var(--primary2)">Check</span></span>
      </a>
    <div class="s-nav-links" id="s-nav-links">
      ${SALES_NAV_LINKS.map(l =>
        `<a href="${l.href}" class="s-nav-link${l.label === activeLabel ? ' active' : ''}">${l.label}</a>`
      ).join('')}
    </div>
    <div class="s-nav-right">
      <button class="s-nav-cta" onclick="openSalesModal()">Get Started</button>
      <button class="s-nav-ham" id="s-nav-ham" aria-label="Menu">☰</button>
    </div>
  `;
  document.getElementById('s-nav-ham').addEventListener('click', () => {
    document.getElementById('s-nav-links').classList.toggle('open');
  });
}

/* ── Shared lead-capture modal ───────────────────────────────────────────── */
function renderSalesModal(opts = {}) {
  if (document.getElementById('s-modal')) return;
  const modal = document.createElement('div');
  modal.className = 's-modal-overlay';
  modal.id = 's-modal';
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  modal.innerHTML = `
    <div class="s-modal">
      <div class="s-modal-header">
        <button class="s-modal-close" onclick="closeSalesModal()">✕</button>
        <h3>${opts.title || 'Get Your Business Set Up'}</h3>
        <p>${opts.subtitle || "Fill in your info and we'll get you live — usually same day."}</p>
      </div>
      <div class="s-modal-body">
        <div id="s-form-wrap">
          <div class="s-form-row">
            <div class="s-form-group">
              <label>Business Name *</label>
              <input type="text" id="sf-biz" placeholder="Harbor House Grill">
            </div>
            <div class="s-form-group">
              <label>Your Name *</label>
              <input type="text" id="sf-name" placeholder="John Smith">
            </div>
          </div>
          <div class="s-form-row">
            <div class="s-form-group">
              <label>Phone Number *</label>
              <input type="tel" id="sf-phone" placeholder="+1 (850) 555-0100">
            </div>
            <div class="s-form-group">
              <label>Business Type</label>
              <select id="sf-type">
                <option value="">— Select —</option>
                <option>Restaurant / Bar</option>
                <option>Seafood / Fish Market</option>
                <option>Boat Rental / Charter</option>
                <option>Activity / Tour</option>
                <option>Artist / Musician</option>
                <option>Photographer</option>
                <option>Retail / Shop</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div class="s-form-group">
            <label>Website URL</label>
            <input type="url" id="sf-url" placeholder="https://yourbusiness.com">
          </div>
          <div class="s-form-group">
            <label>Email Address</label>
            <input type="email" id="sf-email" placeholder="you@yourbusiness.com">
          </div>
          <div class="s-check-group">
            <label class="s-check-row">
              <input type="checkbox" id="sf-terms">
              <span>By checking this box, I agree to receive SMS messages from <strong>CyberCheck LLC</strong> regarding my account, services, and platform updates. Reply <strong>STOP</strong> to opt out at any time. Reply <strong>HELP</strong> for support. Msg &amp; data rates may apply. Message frequency varies.
              <br><a href="/privacy.html" target="_blank">Privacy Policy</a> &middot; <a href="/terms.html" target="_blank">Terms of Service</a> &middot; <a href="/sms-terms.html" target="_blank">SMS Terms</a></span>
            </label>
          </div>
          <button class="s-form-submit" onclick="salesSubmitForm()">🚀 Get Me Set Up</button>
          <div class="s-form-note">We'll reach out within a few hours. No spam, ever.</div>
        </div>
        <div class="s-form-success" id="s-form-success">
          <div class="s-success-icon">🎉</div>
          <h4>You're on the list!</h4>
          <p>We got your info and will reach out shortly to get you set up.<br><br>Check your phone — we may text you first.</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSalesModal(); });
}

function openSalesModal() {
  document.getElementById('s-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSalesModal() {
  document.getElementById('s-modal').classList.remove('open');
  document.body.style.overflow = '';
}

async function salesSubmitForm() {
  const biz   = document.getElementById('sf-biz').value.trim();
  const name  = document.getElementById('sf-name').value.trim();
  const phone = document.getElementById('sf-phone').value.trim();
  const terms = document.getElementById('sf-terms').checked;

  if (!biz)   { alert('Please enter your business name.'); return; }
  if (!name)  { alert('Please enter your name.'); return; }
  if (!phone) { alert('Please enter your phone number.'); return; }
  if (!terms) { alert('Please agree to the SMS terms to continue.'); return; }

  const btn = document.querySelector('.s-form-submit');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  const payload = {
    business_name: biz,
    contact_name:  name,
    phone,
    email:         document.getElementById('sf-email').value.trim(),
    website_url:   document.getElementById('sf-url').value.trim(),
    business_type: document.getElementById('sf-type').value,
    source:        'sales-site-' + (window.SALES_PAGE_ID || 'unknown'),
    sms_consent:   true,
  };

  try {
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    document.getElementById('s-form-wrap').style.display = 'none';
    document.getElementById('s-form-success').style.display = 'block';
  } catch (e) {
    // Show success anyway — don't block the lead on a network error
    document.getElementById('s-form-wrap').style.display = 'none';
    document.getElementById('s-form-success').style.display = 'block';
  }
}

/* ── Shared footer ───────────────────────────────────────────────────────── */
function renderSalesFooter() {
  const el = document.getElementById('s-footer');
  if (!el) return;
  el.innerHTML = `
    <div class="s-footer-inner">
      <div class="s-footer-brand">
        <div class="logo">Cyber<span>Check</span></div>
        <p>The all-in-one booking, menu, and marketing platform for Gulf Coast businesses.</p>
      </div>
      <div class="s-footer-links">
        <h4>Products</h4>
        <a href="/gcr.html">Gulf Coast Radar</a>
        <a href="/booking.html">Booking Engine</a>
        <a href="/menu-updates.html">Menu Updates</a>
        <a href="/reviews.html">Reviews</a>
        <a href="/artists.html">Artist Platform</a>
        <a href="/automations.html">Automations</a>
        <a href="/platform.html">Full Platform</a>
      </div>
      <div class="s-footer-links">
        <h4>Verticals</h4>
        <a href="/gcr.html">Restaurants &amp; Bars</a>
        <a href="/booking.html">Boat Rentals &amp; Charters</a>
        <a href="/artists.html">Musicians &amp; Artists</a>
        <a href="/booking.html">Photographers</a>
        <a href="/booking.html">Activities &amp; Tours</a>
      </div>
      <div class="s-footer-links">
        <h4>Company</h4>
        <a href="#" onclick="openSalesModal();return false;">Get Started</a>
        <a href="https://beachsidecircleboats.com" target="_blank" rel="noopener">Live Demo</a>
      </div>
    </div>
    <div class="s-footer-bottom">
      <span>© ${new Date().getFullYear()} CyberCheck LLC. All rights reserved. &nbsp;·&nbsp; (205) 810-4950 &nbsp;·&nbsp; info@cybercheckinc.com</span>
      <span>
        <a href="/privacy.html" style="color:inherit;text-decoration:underline;">Privacy Policy</a>
        &nbsp;·&nbsp;
        <a href="/terms.html" style="color:inherit;text-decoration:underline;">Terms</a>
        &nbsp;·&nbsp;
        <a href="/sms-terms.html" style="color:inherit;text-decoration:underline;">SMS Terms</a>
        &nbsp;·&nbsp;
        <a href="/card" style="color:#00ada8;text-decoration:none;font-weight:600;">Get Matt's Card</a>
      </span>
    </div>
  `;
}

/* ── Lazy iframe loader ───────────────────────────────────────────────────── */
function lazyPhone(id, src) {
  const el = document.getElementById(id);
  if (!el) return;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { el.src = src; obs.disconnect(); }
  }, { threshold: 0.05 });
  obs.observe(el);
}

/* ── Init: call this on every sales page ────────────────────────────────── */
function initSalesPage(pageId, activeNavLabel) {
  window.SALES_PAGE_ID = pageId;
  renderSalesNav(activeNavLabel);
  renderSalesModal();
  renderSalesFooter();
}
