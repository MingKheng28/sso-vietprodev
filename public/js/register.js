document.documentElement.dataset.js = 'enabled';

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function svgCheck() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
}

function svgX() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
}

function svgCheckSmall() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
}

// ─────────────────────────────────────────────────────────────
// Password visibility toggle (global)
// ─────────────────────────────────────────────────────────────

$$('.toggle-password').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = $(btn.dataset.target);
    if (!target) return;
    const show = target.type === 'password';
    target.type = show ? 'text' : 'password';

    const iconEye  = btn.querySelector('.icon-eye');
    const iconOff  = btn.querySelector('.icon-eye-off');
    if (iconEye)  iconEye.style.display  = show ? 'none' : '';
    if (iconOff)  iconOff.style.display = show ? '' : 'none';
  });
});

// ─────────────────────────────────────────────────────────────
// Password rules
// ─────────────────────────────────────────────────────────────

const RULES = {
  length:     (v) => v.length >= 12,
  uppercase:  (v) => /[A-Z]/.test(v),
  lowercase:  (v) => /[a-z]/.test(v),
  number:     (v) => /[0-9]/.test(v),
  special:    (v) => /[^A-Za-z0-9]/.test(v),
};

function evaluatePassword(password) {
  return {
    length:     RULES.length(password),
    uppercase:  RULES.uppercase(password),
    lowercase:  RULES.lowercase(password),
    number:     RULES.number(password),
    special:    RULES.special(password),
  };
}

function allRulesPassed(pw) {
  const results = evaluatePassword(pw);
  return Object.values(results).every(Boolean);
}

// ─────────────────────────────────────────────────────────────
// Strength score (1-4)
// ─────────────────────────────────────────────────────────────

function strengthScore(password) {
  if (!password) return 0;
  const rules = evaluatePassword(password);
  const passed = Object.values(rules).filter(Boolean).length;
  if (passed <= 2) return 1; // weak
  if (passed === 3) return 2; // fair
  if (passed === 4) return 3; // good
  return 4; // strong
}

const STRENGTH_META = {
  0: { label: 'Nhập mật khẩu',  cls: 'strength-none'   },
  1: { label: 'Yếu',            cls: 'strength-weak'    },
  2: { label: 'Trung bình',     cls: 'strength-fair'    },
  3: { label: 'Khá mạnh',      cls: 'strength-good'    },
  4: { label: 'Mạnh',           cls: 'strength-strong'  },
};

// ─────────────────────────────────────────────────────────────
// Email validation
// ─────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value) {
  if (!value.trim()) return { ok: false, msg: 'Email là bắt buộc' };
  if (!EMAIL_RE.test(value.trim())) return { ok: false, msg: 'Email không hợp lệ' };
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Field helpers
// ─────────────────────────────────────────────────────────────

function setFieldState(field, state, msg) {
  const group = field.closest('.form-group');
  if (!group) return;

  const statusEl = group.querySelector('.input-status-icon');
  const errorEl  = group.querySelector('.field-error');

  field.classList.remove('error', 'valid');

  if (state === 'error') {
    field.classList.add('error');
    if (statusEl) statusEl.innerHTML = svgX();
    if (errorEl)  { errorEl.textContent = msg; errorEl.classList.add('visible'); }
  } else if (state === 'valid') {
    field.classList.add('valid');
    if (statusEl) statusEl.innerHTML = svgCheck();
    if (errorEl)  { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
  } else {
    if (statusEl) statusEl.innerHTML = '';
    if (errorEl)  { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
  }
}

// ─────────────────────────────────────────────────────────────
// Password field — real-time validation
// ─────────────────────────────────────────────────────────────

const pwField    = $('#password');
const checklist  = $('#password-checklist');
const strengthEl = $('#password-strength');
const fillEl     = $('#strength-fill');
const strengthTxt = $('#strength-text');
const submitBtn  = $('#submit-btn');

if (pwField) {
  pwField.addEventListener('input', () => {
    const pw = pwField.value;

    // Show/hide checklist
    if (pw.length > 0) {
      checklist.classList.add('visible');
    } else {
      checklist.classList.remove('visible');
      resetStrength();
      submitBtn.disabled = true;
      return;
    }

    const results = evaluatePassword(pw);

    // Update each rule item
    for (const [rule, passed] of Object.entries(results)) {
      const item = $(`#rule-${rule}`);
      if (!item) continue;
      item.classList.remove('passed', 'failed');
      item.classList.add(passed ? 'passed' : 'failed');
    }

    // Update strength bar
    const score = strengthScore(pw);
    const meta  = STRENGTH_META[score];
    const parent = strengthEl;

    parent.className = 'password-strength ' + meta.cls;
    if (fillEl)     fillEl.style.width     = score === 0 ? '0%' : `${(score / 4) * 100}%`;
    if (strengthTxt) strengthTxt.textContent = meta.label;

    // Update confirm password field if already touched
    const confirmField = $('#confirmPassword');
    if (confirmField && confirmField.value) {
      const confirmGroup = confirmField.closest('.form-group');
      const confirmErr   = confirmGroup?.querySelector('.field-error');
      if (pw !== confirmField.value) {
        confirmField.classList.add('error');
        confirmField.classList.remove('valid');
        if (confirmErr) { confirmErr.textContent = 'Mật khẩu xác nhận không khớp'; confirmErr.classList.add('visible'); }
      } else {
        confirmField.classList.remove('error');
        confirmField.classList.add('valid');
        if (confirmErr) { confirmErr.textContent = ''; confirmErr.classList.remove('visible'); }
      }
    }

    // Enable/disable submit button
    submitBtn.disabled = !allRulesPassed(pw);
  });

  // Blur: show failed rules summary
  pwField.addEventListener('blur', () => {
    const pw = pwField.value;
    if (!pw) return;
    const results = evaluatePassword(pw);
    const failed = Object.entries(results).filter(([, v]) => !v).map(([k]) => k);
    if (failed.length > 0) {
      const errEl = $('#password-error');
      const failedLabels = failed.map((k) => {
        if (k === 'length')    return 'ít nhất 12 ký tự';
        if (k === 'uppercase') return 'chữ hoa';
        if (k === 'lowercase') return 'chữ thường';
        if (k === 'number')    return 'chữ số';
        if (k === 'special')   return 'ký tự đặc biệt';
        return k;
      });
      if (errEl) {
        errEl.textContent = `Mật khẩu còn thiếu: ${failedLabels.join(', ')}.`;
        errEl.classList.add('visible');
      }
    }
  });

  // Clear error on input
  pwField.addEventListener('input', () => {
    const errEl = $('#password-error');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
  });
}

function resetStrength() {
  if (strengthEl) strengthEl.className = 'password-strength strength-none';
  if (fillEl)     fillEl.style.width   = '0%';
  if (strengthTxt) strengthTxt.textContent = 'Nhập mật khẩu';
}

// ─────────────────────────────────────────────────────────────
// Confirm password — real-time validation
// ─────────────────────────────────────────────────────────────

const confirmField = $('#confirmPassword');
if (confirmField) {
  confirmField.addEventListener('input', () => {
    const pw = pwField?.value ?? '';
    const confirm = confirmField.value;

    if (!confirm) {
      setFieldState(confirmField, 'neutral');
      return;
    }

    if (pw === confirm) {
      setFieldState(confirmField, 'valid');
    } else {
      setFieldState(confirmField, 'error', 'Mật khẩu xác nhận không khớp');
    }

    // Re-evaluate submit button
    if (pwField) {
      submitBtn.disabled = !allRulesPassed(pw) || pw !== confirm;
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Email field — real-time + blur validation
// ─────────────────────────────────────────────────────────────

const emailField = $('#email');
if (emailField) {
  emailField.addEventListener('input', () => {
    const errEl = $('#email-error');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }

    const val = emailField.value;
    if (!val) {
      setFieldState(emailField, 'neutral');
      return;
    }

    if (EMAIL_RE.test(val.trim())) {
      setFieldState(emailField, 'valid');
    }
    // On input, only show valid state — don't show error until blur
  });

  emailField.addEventListener('blur', () => {
    const val = emailField.value.trim();
    const result = validateEmail(val);
    if (result.ok) {
      setFieldState(emailField, 'valid');
    } else if (val) {
      setFieldState(emailField, 'error', result.msg);
    } else {
      setFieldState(emailField, 'neutral');
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Username field — real-time validation
// ─────────────────────────────────────────────────────────────

const usernameField = $('#username');
if (usernameField) {
  usernameField.addEventListener('input', () => {
    const errEl = $('#username-error');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
  });
}

// ─────────────────────────────────────────────────────────────
// Global: clear field error on any input
// ─────────────────────────────────────────────────────────────

$$('input').forEach((input) => {
  input.addEventListener('input', () => {
    input.classList.remove('error');
    const err = input.closest('.form-group')?.querySelector('.field-error');
    if (err) { err.textContent = ''; err.classList.remove('visible'); }
  });
});

// ─────────────────────────────────────────────────────────────
// Form submission — client-side gate + loading state
// ─────────────────────────────────────────────────────────────

const form = $('form[data-register-form]');
if (form) {
  form.addEventListener('submit', (e) => {
    const pw = pwField?.value ?? '';
    const confirm = confirmField?.value ?? '';

    // 1. Re-validate all fields
    let hasError = false;

    // Email
    if (emailField) {
      const result = validateEmail(emailField.value.trim());
      if (!result.ok) {
        setFieldState(emailField, 'error', result.msg);
        hasError = true;
      }
    }

    // Password checklist
    if (pwField) {
      const results = evaluatePassword(pw);
      const failed = Object.entries(results).filter(([, v]) => !v);
      if (failed.length > 0) {
        // Highlight failed rules
        failed.forEach(([rule]) => {
          const item = $(`#rule-${rule}`);
          if (item) { item.classList.remove('passed'); item.classList.add('failed'); }
        });
        const errEl = $('#password-error');
        const labels = failed.map(([k]) => {
          if (k === 'length')    return 'ít nhất 12 ký tự';
          if (k === 'uppercase') return 'chữ hoa';
          if (k === 'lowercase') return 'chữ thường';
          if (k === 'number')    return 'chữ số';
          if (k === 'special')   return 'ký tự đặc biệt';
          return k;
        });
        if (errEl) { errEl.textContent = `Mật khẩu chưa đủ: ${labels.join(', ')}.`; errEl.classList.add('visible'); }
        hasError = true;
      }
    }

    // Confirm password
    if (confirmField) {
      if (!confirm) {
        setFieldState(confirmField, 'error', 'Xác nhận mật khẩu là bắt buộc');
        hasError = true;
      } else if (pw !== confirm) {
        setFieldState(confirmField, 'error', 'Mật khẩu xác nhận không khớp');
        hasError = true;
      }
    }

    if (hasError) {
      e.preventDefault();
      // Scroll to first error
      const firstError = form.querySelector('.error, input.error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 2. Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // 3. Re-enable after 15s timeout (safety net)
    setTimeout(() => {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }, 15_000);
  });
}

// ─────────────────────────────────────────────────────────────
// Server error banner — auto-dismiss
// ─────────────────────────────────────────────────────────────

const serverErr = $('#server-error');
if (serverErr) {
  // Auto-dismiss after 8s
  setTimeout(() => {
    serverErr.style.transition = 'opacity 400ms ease';
    serverErr.style.opacity = '0';
    setTimeout(() => serverErr.remove(), 400);
  }, 8000);
}

// ─────────────────────────────────────────────────────────────
// Restore preserved field values after server error
// ─────────────────────────────────────────────────────────────

$$('[data-preserve]').forEach((field) => {
  if (field.value) {
    setFieldState(field, 'valid');
  }
});

// Re-evaluate submit button state after server-rendered page
if (pwField && confirmField && submitBtn) {
  const pw = pwField.value;
  const confirm = confirmField.value;
  if (pw && allRulesPassed(pw) && pw === confirm) {
    submitBtn.disabled = false;
  }
}

// ─────────────────────────────────────────────────────────────
// Initial submit button state
// ─────────────────────────────────────────────────────────────

if (submitBtn) {
  submitBtn.disabled = true;
}
