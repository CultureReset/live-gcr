/**
 * GCR Ride Request Widget
 * Drop on any booking confirmation page so customers can schedule a ride.
 *
 * Usage (HTML):
 *   <div id="gcr-ride-request"
 *        data-site-id="YOUR_SITE_ID"
 *        data-pickup="123 Beach Blvd"
 *        data-destination="Circle Boats Marina"
 *        data-pax="4">
 *   </div>
 *   <script src="https://cybercheck-links.vercel.app/js/ride-request-widget.js"></script>
 *
 * Usage (JS):
 *   GCRRides.init({ siteId, pickup, destination, pax, customerName, customerPhone, container });
 */
(function () {
  'use strict';

  var API = '/api';

  var styles = `
    .gcr-ride { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; }
    .gcr-box { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 18px 20px; margin: 16px 0; }
    .gcr-title { font-size: 14px; font-weight: 700; color: #15803d; margin-bottom: 4px; }
    .gcr-sub { font-size: 12px; color: #64748b; margin-bottom: 14px; line-height: 1.5; }
    .gcr-route-preview { font-size: 12px; color: #475569; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; margin-bottom: 12px; line-height: 1.6; }
    .gcr-route-label { font-weight: 700; color: #0f172a; margin-bottom: 3px; }
    .gcr-field { margin-bottom: 10px; }
    .gcr-field input, .gcr-field select { width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #1a202c; outline: none; background: #fff; transition: border-color 0.2s; }
    .gcr-field input:focus, .gcr-field select:focus { border-color: #2a9d5c; }
    .gcr-field label { display: block; font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px; }
    .gcr-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .gcr-submit { width: 100%; padding: 11px; background: linear-gradient(135deg, #2a9d5c, #1ec96b); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
    .gcr-submit:disabled { opacity: 0.45; cursor: not-allowed; }
    .gcr-submit:hover:not(:disabled) { opacity: 0.88; }
    .gcr-success { text-align: center; padding: 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; font-size: 13px; color: #15803d; font-weight: 500; }
    .gcr-error { font-size: 12px; color: #dc2626; margin-top: 6px; text-align: center; }
    .gcr-note { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 8px; }
  `;

  function injectStyles() {
    if (document.getElementById('gcr-ride-styles')) return;
    var s = document.createElement('style');
    s.id = 'gcr-ride-styles';
    s.textContent = styles;
    document.head.appendChild(s);
  }

  function buildWidget(config) {
    var pickup      = config.pickup || '';
    var destination = config.destination || '';
    var pax         = config.pax || 1;

    var routeHtml = '';
    if (pickup || destination) {
      routeHtml = '<div class="gcr-route-preview"><div class="gcr-route-label">Suggested route</div>' +
        (pickup ? '📍 ' + pickup : '') +
        (pickup && destination ? ' → ' : '') +
        (destination ? destination : '') +
        '</div>';
    }

    return '<div class="gcr-ride"><div class="gcr-box">' +
      '<div class="gcr-title">🚗 Need a Ride?</div>' +
      '<div class="gcr-sub">Schedule a ride at the same time. A local driver will text you a price — no upfront booking.</div>' +
      routeHtml +
      '<div class="gcr-field"><label>Your Name</label><input id="gcr-name" type="text" placeholder="First Last" value="' + esc(config.customerName || '') + '"></div>' +
      '<div class="gcr-field"><label>Your Phone</label><input id="gcr-phone" type="tel" placeholder="251-555-0000" value="' + esc(config.customerPhone || '') + '"></div>' +
      '<div class="gcr-field"><label>Pickup Address</label><input id="gcr-pickup" type="text" placeholder="Hotel name or address" value="' + esc(pickup) + '"></div>' +
      '<div class="gcr-field"><label>Drop-off</label><input id="gcr-dest" type="text" placeholder="Marina, restaurant, airport…" value="' + esc(destination) + '"></div>' +
      '<div class="gcr-row2">' +
        '<div class="gcr-field"><label>Passengers</label>' +
          '<select id="gcr-pax">' +
            [1,2,3,4,5,6,7,8].map(function(n){ return '<option value="'+n+'"'+(n==pax?' selected':'')+'>'+n+' pax</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<div class="gcr-field"><label>Pickup Time</label><input id="gcr-time" type="datetime-local"></div>' +
      '</div>' +
      '<div class="gcr-field"><label>Notes (optional)</label><input id="gcr-notes" type="text" placeholder="e.g. wheelchair accessible, child seat…"></div>' +
      '<button class="gcr-submit" id="gcr-submit" onclick="GCRRides._submit()">Request a Ride</button>' +
      '<div class="gcr-error" id="gcr-error" style="display:none;"></div>' +
      '<div class="gcr-note">A local driver will text you a price. No booking fee — you pay the driver directly.</div>' +
    '</div></div>';
  }

  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function init(config) {
    injectStyles();
    var container = document.querySelector(config.container || '#gcr-ride-request');
    if (!container) { console.warn('GCRRides: container not found'); return; }
    container.innerHTML = buildWidget(config);
    window.__gcrConfig = config;
  }

  async function _submit() {
    var config = window.__gcrConfig || {};
    var name   = (document.getElementById('gcr-name')   || {}).value || '';
    var phone  = (document.getElementById('gcr-phone')  || {}).value || '';
    var pickup = (document.getElementById('gcr-pickup') || {}).value || '';
    var dest   = (document.getElementById('gcr-dest')   || {}).value || '';
    var pax    = (document.getElementById('gcr-pax')    || {}).value || 1;
    var time   = (document.getElementById('gcr-time')   || {}).value || '';
    var notes  = (document.getElementById('gcr-notes')  || {}).value || '';
    var btn    = document.getElementById('gcr-submit');
    var errEl  = document.getElementById('gcr-error');

    if (!phone || !pickup || !dest) {
      if (errEl) { errEl.textContent = 'Phone, pickup, and drop-off are required.'; errEl.style.display = ''; }
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    if (errEl) errEl.style.display = 'none';

    try {
      var r = await fetch(API + '/api/rides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:     name || null,
          customer_phone:    phone,
          pickup_address:    pickup,
          destination:       dest,
          pickup_time:       time ? new Date(time).toISOString() : null,
          passengers:        parseInt(pax) || 1,
          notes:             notes || null,
          source:            config.source || 'widget',
          source_booking_id: config.bookingRef || null,
        })
      });
      var d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');

      var box = document.querySelector('.gcr-box');
      if (box) box.innerHTML = '<div class="gcr-success">✓ Ride request sent! A local driver will text you shortly with their price.</div>';
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Request a Ride'; }
      if (errEl) { errEl.textContent = e.message || 'Something went wrong. Please try again.'; errEl.style.display = ''; }
    }
  }

  function autoInit() {
    var el = document.getElementById('gcr-ride-request');
    if (!el) return;
    init({
      siteId:       el.dataset.siteId     || el.dataset.site_id || '',
      pickup:       el.dataset.pickup     || '',
      destination:  el.dataset.destination || '',
      pax:          el.dataset.pax        || 1,
      customerName: el.dataset.name       || '',
      customerPhone:el.dataset.phone      || '',
      source:       el.dataset.source     || 'widget',
      bookingRef:   el.dataset.bookingRef || '',
      container:    '#gcr-ride-request',
    });
  }

  window.GCRRides = { init: init, _submit: _submit };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
