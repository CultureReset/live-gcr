/* ============================================================
   gcr-live-photo.js — Verified Live Food Photo Module

   Completely standalone. Zero dependencies. Drop it anywhere.

   Usage:
     GCRLivePhoto.capture({
       site_id: 'xxx',
       table_qr_id: 'xxx',       // optional — QR code of the table
       user_phone: 'xxx',         // optional — pre-filled if known
       dish_name: 'Grouper Tacos', // optional — helps AI tagging
       points_reward: 10,          // optional — loyalty points shown
       on_complete: function(result) {
         // result.photo_url, result.photo_id, result.points_earned
       },
       on_cancel: function() {}
     });

   Add to any page: <script src="js/gcr-live-photo.js"></script>
   ============================================================ */

const GCRLivePhoto = (function() {

  const API = '/api';

  // ── Inject styles ──────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .glp-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.85);
      z-index: 99999;
      display: flex; align-items: flex-end; justify-content: center;
    }
    .glp-sheet {
      background: #fff;
      border-radius: 24px 24px 0 0;
      padding: 28px 24px 44px;
      width: 100%; max-width: 480px;
      text-align: center;
      animation: glpSlide .3s cubic-bezier(.32,.72,0,1);
    }
    @keyframes glpSlide {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    .glp-title   { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
    .glp-sub     { font-size: 14px; color: #64748b; margin: 0 0 20px; line-height: 1.5; }
    .glp-preview { width: 100%; max-height: 280px; object-fit: cover; border-radius: 16px; margin-bottom: 16px; display: none; }
    .glp-btn-primary {
      width: 100%; padding: 15px;
      background: #0b7a75; color: #fff;
      border: none; border-radius: 14px;
      font-size: 16px; font-weight: 700; cursor: pointer;
      margin-bottom: 10px; display: flex;
      align-items: center; justify-content: center; gap: 8px;
    }
    .glp-btn-primary:disabled { opacity: .6; cursor: default; }
    .glp-btn-secondary {
      width: 100%; padding: 12px;
      background: #f1f5f9; color: #475569;
      border: none; border-radius: 14px;
      font-size: 14px; cursor: pointer; margin-bottom: 8px;
    }
    .glp-btn-skip {
      background: none; border: none;
      color: #94a3b8; font-size: 13px; cursor: pointer;
    }
    .glp-points {
      display: inline-flex; align-items: center; gap: 6px;
      background: #fef3c7; border: 1px solid #fcd34d;
      border-radius: 999px; padding: 6px 14px;
      font-size: 13px; font-weight: 700; color: #92400e;
      margin-bottom: 16px;
    }
    .glp-phone-input {
      width: 100%; padding: 13px;
      border: 2px solid #e2e8f0; border-radius: 12px;
      font-size: 17px; text-align: center;
      margin-bottom: 12px; box-sizing: border-box;
      color: #0f172a;
    }
    .glp-phone-input:focus { outline: none; border-color: #0b7a75; }
    .glp-success {
      background: #f0fdf4; border: 1px solid #86efac;
      border-radius: 14px; padding: 20px; margin-bottom: 12px;
    }
    .glp-error { color: #ef4444; font-size: 13px; margin-bottom: 10px; }
    .glp-verified-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: #f0fdf4; border: 1px solid #86efac;
      border-radius: 999px; padding: 4px 12px;
      font-size: 11px; font-weight: 700; color: #166534;
      position: absolute; top: 10px; left: 10px;
    }
  `;
  document.head.appendChild(style);

  // ── Timestamp watermark burned onto photo ──────────────────
  function addWatermark(imgDataUrl, text) {
    return new Promise(function(resolve) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const fontSize = Math.max(16, Math.round(canvas.width / 30));
        ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
        const padding = fontSize * 0.6;
        const metrics = ctx.measureText(text);
        const w = metrics.width + padding * 2;
        const h = fontSize + padding * 1.5;
        // Bottom-left watermark box
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(10, canvas.height - h - 10, w, h, 8) : ctx.rect(10, canvas.height - h - 10, w, h);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, 10 + padding, canvas.height - 10 - padding * 0.4);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = imgDataUrl;
    });
  }

  // ── Main capture function ──────────────────────────────────
  function capture(opts) {
    opts = opts || {};
    const siteId        = opts.site_id || '';
    const tableQrId     = opts.table_qr_id || '';
    const dishName      = opts.dish_name || '';
    const pointsReward  = opts.points_reward || 10;
    const sendReview    = opts.send_review !== false; // default true
    const businessName  = opts.business_name || '';
    const reviewDelay   = opts.review_delay_minutes || 0; // 0 = send immediately after
    const onComplete    = opts.on_complete || function() {};
    const onCancel      = opts.on_cancel || function() {};

    let capturedDataUrl = null;
    let capturedFile    = null;
    let userPhone       = opts.user_phone || '';

    // ── Build the sheet ──────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'glp-overlay';

    function render(step) {
      let html = '';

      if (step === 'capture') {
        html = `
          <div class="glp-sheet">
            <div style="font-size:40px;margin-bottom:10px;">📸</div>
            <div class="glp-title">Show Us Your Meal!</div>
            <div class="glp-sub">Take a live photo${dishName ? ' of the <strong>' + esc(dishName) + '</strong>' : ' of your food'} and earn ${pointsReward} loyalty points. Your photo helps other tourists see what's actually great here.</div>
            ${pointsReward ? `<div class="glp-points">⭐ +${pointsReward} loyalty points</div>` : ''}
            <img id="glp-preview" class="glp-preview" alt="Preview">
            <input type="file" id="glp-file-input" accept="image/*" capture="environment" style="display:none" onchange="window._glpHandleFile(this)">
            <button class="glp-btn-primary" id="glp-shoot-btn" onclick="document.getElementById('glp-file-input').click()">
              📷 Take Photo Now
            </button>
            <button class="glp-btn-secondary" id="glp-submit-btn" style="display:none;" onclick="window._glpSubmit()">
              ✅ Submit This Photo
            </button>
            <button class="glp-btn-skip" onclick="window._glpCancel()">Skip for now</button>
          </div>`;
      }

      if (step === 'phone') {
        html = `
          <div class="glp-sheet">
            <img id="glp-thumb" src="${capturedDataUrl}" style="width:100%;height:200px;object-fit:cover;border-radius:16px;margin-bottom:14px;">
            <div style="position:relative;">
              <span class="glp-verified-badge">✓ Live Photo</span>
            </div>
            <div class="glp-title">Almost There!</div>
            <div class="glp-sub">Enter your phone to post your photo${pointsReward ? ` and earn <strong>${pointsReward} loyalty points</strong>` : ''}.</div>
            <div id="glp-err" class="glp-error" style="display:none;"></div>
            <input type="tel" class="glp-phone-input" id="glp-phone" placeholder="(555) 555-5555" value="${esc(userPhone)}">
            <button class="glp-btn-primary" id="glp-post-btn" onclick="window._glpPost()">
              Post My Photo
            </button>
            <button class="glp-btn-skip" onclick="window._glpCancel()">Cancel</button>
          </div>`;
      }

      if (step === 'uploading') {
        html = `
          <div class="glp-sheet" style="padding:48px 24px;">
            <div style="font-size:40px;margin-bottom:16px;">⏳</div>
            <div class="glp-title">Uploading your photo...</div>
          </div>`;
      }

      if (step === 'success') {
        html = `
          <div class="glp-sheet">
            <div class="glp-success">
              <div style="font-size:36px;margin-bottom:8px;">🎉</div>
              <div style="font-weight:800;font-size:18px;color:#166534;margin-bottom:4px;">Photo Posted!</div>
              <div style="font-size:14px;color:#166534;">Your verified photo is now live on our menu listing.</div>
              ${pointsReward ? `<div style="margin-top:10px;font-size:15px;font-weight:700;color:#166534;">+${pointsReward} loyalty points added!</div>` : ''}
            </div>
            <button class="glp-btn-primary" onclick="window._glpClose()">Done ✓</button>
          </div>`;
      }

      overlay.innerHTML = html;
    }

    // ── Handlers ─────────────────────────────────────────────
    window._glpHandleFile = async function(input) {
      const file = input.files[0];
      if (!file) return;
      capturedFile = file;
      const reader = new FileReader();
      reader.onload = async function(e) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) + ' · ' + now.toLocaleDateString('en-US',{month:'short',day:'numeric'});
        const label = [dishName, timeStr].filter(Boolean).join(' · ');
        capturedDataUrl = await addWatermark(e.target.result, '✓ Verified Diner · ' + label);
        const preview = document.getElementById('glp-preview');
        if (preview) { preview.src = capturedDataUrl; preview.style.display = 'block'; }
        const shootBtn  = document.getElementById('glp-shoot-btn');
        const submitBtn = document.getElementById('glp-submit-btn');
        if (shootBtn)  shootBtn.textContent = '📷 Retake Photo';
        if (submitBtn) submitBtn.style.display = '';
      };
      reader.readAsDataURL(file);
    };

    window._glpSubmit = function() {
      if (!capturedDataUrl) return;
      render('phone');
    };

    window._glpPost = async function() {
      const phone = (document.getElementById('glp-phone')?.value || '').replace(/\D/g,'');
      if (phone.length < 10) {
        const err = document.getElementById('glp-err');
        if (err) { err.textContent = 'Please enter a valid phone number'; err.style.display = ''; }
        return;
      }
      userPhone = phone;
      render('uploading');

      try {
        // Convert dataUrl → blob
        const res = await fetch(capturedDataUrl);
        const blob = await res.blob();
        const form = new FormData();
        form.append('photo', blob, 'live-photo.jpg');
        form.append('site_id', siteId);
        form.append('table_qr_id', tableQrId);
        form.append('phone', phone);
        form.append('dish_name', dishName);
        form.append('points_reward', String(pointsReward));
        form.append('send_review', String(sendReview));
        form.append('business_name', businessName);
        form.append('review_delay_minutes', String(reviewDelay));
        form.append('timestamp', new Date().toISOString());

        const r = await fetch(API + '/api/qr/live-photo', { method: 'POST', body: form });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Upload failed');

        render('success');
        onComplete({ photo_url: data.photo_url, photo_id: data.id, points_earned: pointsReward });
      } catch(e) {
        render('phone');
        const err = document.getElementById('glp-err');
        if (err) { err.textContent = e.message; err.style.display = ''; }
      }
    };

    window._glpCancel = function() {
      overlay.remove();
      onCancel();
    };

    window._glpClose = function() {
      overlay.remove();
    };

    function esc(s) {
      const d = document.createElement('div');
      d.textContent = String(s || '');
      return d.innerHTML;
    }

    render('capture');
    document.body.appendChild(overlay);
  }

  return { capture };
})();
