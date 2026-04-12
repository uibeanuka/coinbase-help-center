/* ========================
   COINBASE HELP CENTER APP
   ======================== */

// ── Search suggestions
const suggestions = [
  { icon: '💳', text: 'How to apply for a Coinbase Card', href: 'card.html' },
  { icon: '🔒', text: 'How to set up 2-step verification', href: '#' },
  { icon: '🛡️', text: 'How to avoid crypto scams', href: 'scam-alerts.html' },
  { icon: '🪪', text: 'How to verify my identity', href: '#' },
  { icon: '💸', text: 'Why is my purchase pending?', href: '#' },
  { icon: '📤', text: 'How to send crypto to another wallet', href: '#' },
  { icon: '🏦', text: 'How to link a bank account', href: '#' },
  { icon: '📊', text: 'Download my tax documents', href: '#' },
  { icon: '❄️', text: 'How to freeze my Coinbase Card', href: 'card.html' },
  { icon: '🔑', text: 'Reset my Coinbase password', href: '#' },
  { icon: '🚨', text: 'Report a scam to Coinbase', href: 'scam-alerts.html' },
  { icon: '💰', text: 'Coinbase Card spending limits', href: 'card.html' },
];

function handleSearch(value) {
  const box = document.getElementById('searchSuggestions');
  if (!box) return;

  const q = value.trim().toLowerCase();
  if (q.length < 2) {
    box.classList.remove('open');
    return;
  }

  const matches = suggestions.filter(s => s.text.toLowerCase().includes(q)).slice(0, 5);

  if (matches.length === 0) {
    box.classList.remove('open');
    return;
  }

  box.innerHTML = matches.map(m =>
    `<a href="${m.href}" class="suggestion-item">
      <span>${m.icon}</span>
      <span>${highlight(m.text, q)}</span>
    </a>`
  ).join('');

  box.classList.add('open');
}

function highlight(text, query) {
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<strong>$1</strong>');
}

// Close suggestions when clicking outside
document.addEventListener('click', e => {
  const box = document.getElementById('searchSuggestions');
  if (box && !box.contains(e.target) && !e.target.classList.contains('search-input')) {
    box.classList.remove('open');
  }
});

// ── FAQ accordion
function toggleFaq(el) {
  const wasOpen = el.classList.contains('open');
  // Close all within same group
  const group = el.closest('.faq-group, .faq-list');
  if (group) group.querySelectorAll('.faq-item.open').forEach(item => item.classList.remove('open'));
  else document.querySelectorAll('.faq-item.open').forEach(item => item.classList.remove('open'));
  if (!wasOpen) el.classList.add('open');
}

// ── FAQ tabs
function switchFaqTab(btn, groupId) {
  document.querySelectorAll('.faq-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.faq-group').forEach(g => g.classList.remove('active'));
  btn.classList.add('active');
  const group = document.getElementById('faq-' + groupId);
  if (group) group.classList.add('active');
}

// ── Apply flow stepper
let currentStep = 0;
const TOTAL_STEPS = 6;

function goStep(n) {
  const panels = document.querySelectorAll('.apply-panel');
  const dots = document.querySelectorAll('.ap-dot');
  const fill = document.getElementById('apFill');

  if (!panels.length) return;

  panels.forEach((p, i) => p.classList.toggle('active', i === n));

  dots.forEach((d, i) => {
    d.classList.remove('active', 'done');
    if (i < n) d.classList.add('done');
    else if (i === n) d.classList.add('active');
    // mark done dots with checkmark
    if (i < n) d.querySelector('span').textContent = '✓';
    else d.querySelector('span').textContent = i + 1;
  });

  if (fill) fill.style.width = `${(n / (TOTAL_STEPS - 1)) * 100}%`;
  currentStep = n;

  // scroll to section top
  const section = document.getElementById('how-to-apply');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Reward selector
function selectReward(el, asset) {
  document.querySelectorAll('.ap-reward-opt').forEach(opt => {
    opt.classList.remove('ap-reward-selected');
    const check = opt.querySelector('.ap-r-check');
    if (check) check.style.opacity = '0';
  });
  el.classList.add('ap-reward-selected');
  const check = el.querySelector('.ap-r-check');
  if (check) check.style.opacity = '1';
}

// ── Mobile menu
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

// ── Security checklist
let checkedItems = new Set();

function toggleCheck(id) {
  const el = document.getElementById(id);
  if (!el) return;

  if (checkedItems.has(id)) {
    checkedItems.delete(id);
    el.classList.remove('checked');
  } else {
    checkedItems.add(id);
    el.classList.add('checked');
  }

  const count = checkedItems.size;
  const total = document.querySelectorAll('.check-item').length;
  const countEl = document.getElementById('checkedCount');
  const fillEl = document.getElementById('progressFill');

  if (countEl) countEl.textContent = count;
  if (fillEl) fillEl.style.width = `${(count / total) * 100}%`;
}

// ── Smooth scroll polyfill for older Safari
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Card tilt effect
const cards = document.querySelectorAll('.cb-card');
cards.forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    card.style.transform = `${card.style.transform.split(' rotate').join('')} rotateX(${y}deg) rotateY(${x}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ── Animate elements on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.category-card, .reward-card, .rule-card, .scam-card, .step-item, .article-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  observer.observe(el);
});

// ── Identity Verification Modal ────────────────────────────────
let vmCurrentStep = 0;
const VM_TOTAL = 5;
const VM_LABELS = ['Personal Information', 'Home Address', 'Upload ID', 'Take a Selfie', 'Review & Submit'];
let vmIdType = "Driver's License";
let vmFrontUploaded = false;
let vmBackUploaded = false;
let vmSelfieCapured = false;

function openVerifyModal() {
  vmCurrentStep = 0;
  vmFrontUploaded = false;
  vmBackUploaded = false;
  vmSelfieCapured = false;
  vmRenderStep();
  document.getElementById('verifyOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVerifyModal() {
  document.getElementById('verifyOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeVerifyIfBg(e) {
  if (e.target === document.getElementById('verifyOverlay')) closeVerifyModal();
}

function vmRenderStep() {
  // Panels
  document.querySelectorAll('.vm-panel').forEach((p, i) =>
    p.classList.toggle('active', i === vmCurrentStep)
  );

  // Dot states
  document.querySelectorAll('.vm-step').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i < vmCurrentStep) { dot.classList.add('done'); dot.textContent = '✓'; }
    else if (i === vmCurrentStep) { dot.classList.add('active'); dot.textContent = i + 1; }
    else { dot.textContent = i + 1; }
  });

  // Progress fill
  const fill = document.getElementById('vmFill');
  if (fill) fill.style.width = `${((vmCurrentStep + 1) / VM_TOTAL) * 100}%`;

  // Step label
  const lbl = document.getElementById('vmStepLabel');
  if (lbl) lbl.textContent = VM_LABELS[vmCurrentStep];

  // Counter
  const ctr = document.getElementById('vmCounter');
  if (ctr) ctr.textContent = `Step ${vmCurrentStep + 1} of ${VM_TOTAL}`;

  // Back button
  const back = document.getElementById('vmBack');
  if (back) back.style.display = vmCurrentStep === 0 ? 'none' : 'inline-flex';

  // Next button label
  const next = document.getElementById('vmNext');
  if (next) {
    next.textContent = vmCurrentStep === VM_TOTAL - 1 ? 'Submit Verification →' : 'Continue →';
    next.disabled = vmCurrentStep === VM_TOTAL - 1 && !document.getElementById('vmConsent')?.checked;
  }

  // On review step, populate summary
  if (vmCurrentStep === 4) vmPopulateReview();
}

function vmGoStep(dir) {
  const next = document.getElementById('vmNext');

  if (dir === 1) {
    // Validate current step before advancing
    if (!vmValidateStep()) return;

    if (vmCurrentStep === VM_TOTAL - 1) {
      // Submit
      closeVerifyModal();
      document.body.style.overflow = '';
      setTimeout(() => {
        const success = document.getElementById('verifySuccessOverlay');
        if (success) success.classList.add('open');
      }, 200);
      return;
    }
    vmCurrentStep = Math.min(vmCurrentStep + 1, VM_TOTAL - 1);
  } else {
    vmCurrentStep = Math.max(vmCurrentStep - 1, 0);
  }
  vmRenderStep();
}

function vmValidateStep() {
  if (vmCurrentStep === 0) {
    const first = document.getElementById('vf-first')?.value.trim();
    const last  = document.getElementById('vf-last')?.value.trim();
    const mm    = document.getElementById('vf-mm')?.value.trim();
    const dd    = document.getElementById('vf-dd')?.value.trim();
    const yyyy  = document.getElementById('vf-yyyy')?.value.trim();
    const ssn   = document.getElementById('vf-ssn')?.value.trim();
    const phone = document.getElementById('vf-phone')?.value.trim();
    if (!first || !last) { vmAlert('Please enter your first and last name.'); return false; }
    if (!mm || !dd || !yyyy || yyyy.length < 4) { vmAlert('Please enter a valid date of birth.'); return false; }
    if (!ssn) { vmAlert('Please enter your SSN.'); return false; }
    if (!phone) { vmAlert('Please enter your phone number.'); return false; }
  }
  if (vmCurrentStep === 1) {
    const street = document.getElementById('vf-street')?.value.trim();
    const city   = document.getElementById('vf-city')?.value.trim();
    const state  = document.getElementById('vf-state')?.value;
    const zip    = document.getElementById('vf-zip')?.value.trim();
    if (!street) { vmAlert('Please enter your street address.'); return false; }
    if (!city || !state || zip.length < 5) { vmAlert('Please complete your city, state, and ZIP code.'); return false; }
  }
  if (vmCurrentStep === 2) {
    if (!vmFrontUploaded) { vmAlert('Please upload the front of your ID.'); return false; }
    if (!vmBackUploaded)  { vmAlert('Please upload the back of your ID.'); return false; }
  }
  if (vmCurrentStep === 3) {
    if (!vmSelfieCapured) { vmAlert('Please capture your selfie before continuing.'); return false; }
  }
  if (vmCurrentStep === 4) {
    if (!document.getElementById('vmConsent')?.checked) {
      vmAlert('Please check the consent box to continue.'); return false;
    }
  }
  return true;
}

function vmAlert(msg) {
  // Inline shake on modal instead of browser alert
  const modal = document.getElementById('verifyModal');
  modal.style.animation = 'none';
  modal.offsetHeight; // reflow
  modal.style.animation = 'vmShake .35s ease';
  // Show a brief inline error
  const existing = modal.querySelector('.vm-error-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'vm-error-toast';
  toast.textContent = msg;
  modal.querySelector('.vm-footer').insertAdjacentElement('beforebegin', toast);
  setTimeout(() => toast.remove(), 3000);
}

function vmPopulateReview() {
  const first  = document.getElementById('vf-first')?.value || '—';
  const last   = document.getElementById('vf-last')?.value || '—';
  const mm     = document.getElementById('vf-mm')?.value || '—';
  const dd     = document.getElementById('vf-dd')?.value || '—';
  const yyyy   = document.getElementById('vf-yyyy')?.value || '—';
  const phone  = document.getElementById('vf-phone')?.value || '—';
  const street = document.getElementById('vf-street')?.value || '—';
  const apt    = document.getElementById('vf-apt')?.value;
  const city   = document.getElementById('vf-city')?.value || '—';
  const state  = document.getElementById('vf-state')?.value || '—';
  const zip    = document.getElementById('vf-zip')?.value || '—';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('rv-name', `${first} ${last}`);
  set('rv-dob', `${mm}/${dd}/${yyyy}`);
  set('rv-phone', phone);
  set('rv-street', street + (apt ? `, ${apt}` : ''));
  set('rv-citystate', `${city}, ${state} ${zip}`);
  set('rv-idtype', vmIdType);

  const rvFront = document.getElementById('rv-front');
  const rvBack  = document.getElementById('rv-back');
  const rvSelf  = document.getElementById('rv-selfie');
  if (rvFront) { rvFront.textContent = vmFrontUploaded ? '✓ Uploaded' : '✗ Missing'; rvFront.className = 'rv-status ' + (vmFrontUploaded ? 'rv-ok' : 'rv-missing'); }
  if (rvBack)  { rvBack.textContent  = vmBackUploaded  ? '✓ Uploaded' : '✗ Missing'; rvBack.className  = 'rv-status ' + (vmBackUploaded  ? 'rv-ok' : 'rv-missing'); }
  if (rvSelf)  { rvSelf.textContent  = vmSelfieCapured ? '✓ Captured' : '✗ Missing'; rvSelf.className  = 'rv-status ' + (vmSelfieCapured ? 'rv-ok' : 'rv-missing'); }
}

function checkConsent() {
  const next = document.getElementById('vmNext');
  if (next) next.disabled = !document.getElementById('vmConsent')?.checked;
}

// ID type selector
function selectIdType(btn, type) {
  document.querySelectorAll('.vm-id-type').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  vmIdType = { drivers: "Driver's License", passport: 'Passport', stateid: 'State ID' }[type];
  // Hide back upload for passport
  const backBox = document.getElementById('uploadBack');
  if (backBox) backBox.style.opacity = type === 'passport' ? '.4' : '1';
  if (type === 'passport') { vmBackUploaded = true; } // passport only needs front
}

// File upload simulation
function simulateUpload(boxId, side) {
  const box = document.getElementById(boxId);
  if (!box) return;
  // Simulate a file picker + upload animation
  const inner = box.querySelector('.vm-upload-inner');
  inner.innerHTML = '<div class="vm-upload-icon" style="animation:spin .8s linear infinite">⟳</div><span style="color:var(--text-muted);font-size:12px">Uploading…</span>';
  setTimeout(() => {
    box.classList.add('uploaded');
    // Inject success badge
    const badge = document.createElement('div');
    badge.className = 'vm-uploaded-badge';
    badge.innerHTML = `<div class="vm-ub-icon">✅</div><span>${side === 'front' ? 'Front' : 'Back'} uploaded</span><span style="font-size:10px;color:#6B7280">document_${side}.jpg</span>`;
    box.appendChild(badge);
    if (side === 'front') vmFrontUploaded = true;
    if (side === 'back')  vmBackUploaded  = true;
  }, 1200);
}

// Selfie flow simulation
function startSelfie() {
  document.getElementById('cameraBtnStart').style.display = 'none';
  document.getElementById('cameraBtnCapture').style.display = 'flex';
  // Add scanning animation to oval
  const oval = document.querySelector('.vm-selfie-oval');
  if (oval) oval.style.background = '#0A0B0D';
  const placeholder = document.getElementById('selfiePlaceholder');
  if (placeholder) {
    placeholder.querySelector('.vm-face-icon').style.opacity = '.6';
    placeholder.querySelector('span').textContent = 'Camera active…';
  }
}

function captureSelfie() {
  document.getElementById('cameraBtnCapture').style.display = 'none';
  document.getElementById('cameraBtnRetry').style.display = 'flex';
  const oval = document.querySelector('.vm-selfie-oval');
  if (oval) oval.style.background = '#F0FDF4';
  document.getElementById('selfiePlaceholder').style.display = 'none';
  document.getElementById('selfieDone').style.display = 'flex';
  vmSelfieCapured = true;
}

function retrySelfie() {
  document.getElementById('cameraBtnCapture').style.display = 'flex';
  document.getElementById('cameraBtnRetry').style.display = 'none';
  const oval = document.querySelector('.vm-selfie-oval');
  if (oval) oval.style.background = '#0A0B0D';
  document.getElementById('selfiePlaceholder').style.display = 'flex';
  document.getElementById('selfieDone').style.display = 'none';
  vmSelfieCapured = false;
}

// Close success and advance to Step 2
function closeSuccess() {
  document.getElementById('verifySuccessOverlay').classList.remove('open');
  document.body.style.overflow = '';
  goStep(1); // advance apply flow to step 2
}

// Escape key closes modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeVerifyModal();
    document.getElementById('verifySuccessOverlay')?.classList.remove('open');
  }
});

console.log('%c🛡️ Coinbase Help Center', 'font-size:18px;font-weight:bold;color:#0052FF');
console.log('%cReminder: Coinbase will never ask for your password, seed phrase, or 2FA code.', 'color:#D23F31;font-size:13px');
