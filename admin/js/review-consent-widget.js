/**
 * CyberCheck Review Consent Widget
 * Drop this on any booking confirmation page.
 *
 * Usage (plain HTML):
 *   <div id="cybercheck-consent"
 *        data-site-id="YOUR_SITE_ID"
 *        data-name="{{customer_name}}"
 *        data-booking-ref="{{booking_id}}"
 *        data-visit-date="{{visit_date}}"
 *        data-items='[{"name":"Kayak Tour - 2hr"},{"name":"Snorkel Gear"}]'>
 *   </div>
 *   <script src="https://cybercheck-links.vercel.app/js/review-consent-widget.js"></script>
 *
 * Usage (JavaScript):
 *   CyberCheckConsent.init({
 *     siteId:     'YOUR_SITE_ID',
 *     name:       'Maria',
 *     bookingRef: 'BK-1234',
 *     visitDate:  '2025-05-10',
 *     items:      [{ name: 'Half Day Kayak Tour' }],
 *     container:  '#cybercheck-consent',  // optional selector
 *   });
 */

(function () {
  'use strict';

  var API = '/api';

  var styles = `
    .cc-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; }
    .cc-box { background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 12px; padding: 18px 20px; margin: 16px 0; }
    .cc-title { font-size: 14px; font-weight: 700; color: #0369a1; margin-bottom: 4px; }
    .cc-sub { font-size: 12px; color: #64748b; margin-bottom: 14px; line-height: 1.5; }
    .cc-items-preview { font-size: 12px; color: #475569; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; margin-bottom: 12px; line-height: 1.6; }
    .cc-items-label { font-weight: 700; color: #0f172a; margin-bottom: 3px; }
    .cc-phone-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .cc-phone-input { flex: 1; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #1a202c; outline: none; transition: border-color 0.2s; background: #fff; }
    .cc-phone-input:focus { border-color: #0096c7; }
    .cc-consent-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; cursor: pointer; }
    .cc-checkbox { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 4px; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; background: #fff; transition: all 0.15s; cursor: pointer; }
    .cc-checkbox.checked { background: #0096c7; border-color: #0096c7; }
    .cc-checkbox-check { color: #fff; font-size: 12px; font-weight: 800; display: none; }
    .cc-checkbox.checked .cc-checkbox-check { display: block; }
    .cc-consent-text { font-size: 12px; color: #64748b; line-height: 1.5; }
    .cc-consent-text strong { color: #0f172a; }
    .cc-submit { width: 100%; padding: 11px; background: #0096c7; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
    .cc-submit:disabled { opacity: 0.45; cursor: not-allowed; }
    .cc-submit:hover:not(:disabled) { opacity: 0.88; }
    .cc-success { text-align: center; padding: 14px; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 10px; font-size: 13px; color: #166534; font-weight: 500; }
    .cc-error { font-size: 12px; color: #dc2626; margin-top: 6px; text-align: center; }
    .cc-opt-out { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 8px; }
  `;

  function injectStyles() {
    if (document.getElementById('cc-widget-styles')) return;
    var s = document.createElement('style');
    s.id = 'cc-widget-styles';
    s.textContent = styles;
    document.head.appendChild(s);
  }

  function buildWidget(config) {
    var items    = config.items || [];
    var name     = config.name || '';
    var siteId   = config.siteId;
    var visitDate = config.visitDate || '';
    var bookingRef = config.bookingRef || '';

    var itemsHtml = '';
    if (items.length) {
      var names = items.slice(0, 4).map(function (i) { return i.name || i.item_name || String(i); }).filter(Boolean);
      if (names.length) {
        itemsHtml = '<div class="cc-items-preview"><div class="cc-items-label">Your booking</div>' +
          names.map(function (n) { return '✓ ' + n; }).join('<br>') + '</div>';
      }
    }

    var firstName = name ? name.split(' ')[0] : '';
    var greeting  = firstName ? 'Hi ' + firstName + '! ' : '';

    var html = '<div class="cc-widget"><div class="cc-box">' +
      '<div class="cc-title">⭐ ' + greeting + 'Get a text after your visit?</div>' +
      '<div class="cc-sub">We\'ll send you one quick message asking how it went. Real feedback from real customers — no spam, ever.</div>' +
      itemsHtml +
      '<div class="cc-phone-row">' +
        '<input class="cc-phone-input" id="cc-phone" type="tel" placeholder="Your mobile number" autocomplete="tel">' +
      '</div>' +
      '<label class="cc-consent-row" onclick="CyberCheckConsent._toggle()">' +
        '<div class="cc-checkbox" id="cc-checkbox"><span class="cc-checkbox-check">✓</span></div>' +
        '<div class="cc-consent-text">I agree to receive <strong>one SMS</strong> after my visit with a link to share my feedback. Reply STOP anytime to opt out.</div>' +
      '</label>' +
      '<button class="cc-submit" id="cc-submit" onclick="CyberCheckConsent._submit()" disabled>Remind me to review</button>' +
      '<div class="cc-error" id="cc-error" style="display:none;"></div>' +
      '<div class="cc-opt-out">Msg & data rates may apply. One message per booking.</div>' +
    '</div></div>';

    return html;
  }

  function init(config) {
    injectStyles();

    var container = document.querySelector(config.container || '#cybercheck-consent');
    if (!container) {
      console.warn('CyberCheck: container not found');
      return;
    }

    container.innerHTML = buildWidget(config);
    window.__ccConfig = config;

    // Phone input → enable button when valid
    var phoneEl = document.getElementById('cc-phone');
    if (phoneEl) {
      if (config.phone) phoneEl.value = config.phone;
      phoneEl.addEventListener('input', function () {
        updateSubmitState();
      });
    }
  }

  function _toggle() {
    var cb = document.getElementById('cc-checkbox');
    if (!cb) return;
    cb.classList.toggle('checked');
    updateSubmitState();
  }

  function updateSubmitState() {
    var phone   = (document.getElementById('cc-phone') || {}).value || '';
    var checked = (document.getElementById('cc-checkbox') || {}).classList.contains('checked');
    var btn     = document.getElementById('cc-submit');
    if (btn) btn.disabled = !(phone.replace(/\D/g,'').length >= 10 && checked);
  }

  async function _submit() {
    var config  = window.__ccConfig || {};
    var phone   = (document.getElementById('cc-phone') || {}).value || '';
    var btn     = document.getElementById('cc-submit');
    var errEl   = document.getElementById('cc-error');

    if (!phone || !config.siteId) return;

    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    if (errEl) errEl.style.display = 'none';

    try {
      var r = await fetch(API + '/api/reviews/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id:     config.siteId,
          phone:       phone,
          name:        config.name        || null,
          email:       config.email       || null,
          booking_ref: config.bookingRef  || null,
          items:       config.items       || [],
          visit_date:  config.visitDate   || null,
          source:      config.source      || 'widget',
        })
      });
      var d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');

      // Success — replace widget with confirmation
      var box = document.querySelector('.cc-box');
      if (box) box.innerHTML = '<div class="cc-success">✓ Got it! You\'ll receive one text after your visit. Thanks!</div>';
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Remind me to review'; }
      if (errEl) { errEl.textContent = e.message || 'Something went wrong. Please try again.'; errEl.style.display = ''; }
    }
  }

  // Auto-init from data attributes on <div id="cybercheck-consent">
  function autoInit() {
    var el = document.getElementById('cybercheck-consent');
    if (!el) return;
    var items = [];
    try { items = JSON.parse(el.dataset.items || '[]'); } catch (e) {}
    init({
      siteId:     el.dataset.siteId     || el.dataset.site_id || '',
      name:       el.dataset.name       || '',
      email:      el.dataset.email      || '',
      bookingRef: el.dataset.bookingRef || el.dataset.booking_ref || '',
      visitDate:  el.dataset.visitDate  || el.dataset.visit_date  || '',
      phone:      el.dataset.phone      || '',
      items:      items,
      source:     el.dataset.source     || 'widget',
      container:  '#cybercheck-consent',
    });
  }

  // Expose global
  window.CyberCheckConsent = {
    init:    init,
    _toggle: _toggle,
    _submit: _submit,
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
