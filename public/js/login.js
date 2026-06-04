document.documentElement.dataset.js = 'enabled';

// Password visibility toggle
document.querySelectorAll('.toggle-password').forEach(function(btn) {
  btn.addEventListener('click', function() {
    const input = document.querySelector(btn.dataset.target);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    } else {
      input.type = 'password';
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    }
  });
});

// Password strength meter
function checkPasswordStrength(password) {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { score: 1, label: 'Yếu' };
  if (score <= 4) return { score: 2, label: 'Trung bình' };
  return { score: 3, label: 'Mạnh' };
}

document.querySelectorAll('input[type="password"]').forEach(function(input) {
  if (input.name !== 'password' && input.name !== 'newPassword' && input.name !== 'confirmPassword') return;
  const form = input.closest('form');
  if (!form) return;

  const strengthWrapper = form.querySelector('.password-strength');
  const strengthLabel = form.querySelector('.strength-label');
  const bars = strengthWrapper ? strengthWrapper.querySelectorAll('.strength-bar') : [];
  const strengthClasses = ['', 'strength-weak', 'strength-fair', 'strength-strong'];
  const strengthLabels = { 0: 'Mức độ: ', 1: 'Yếu', 2: 'Trung bình', 3: 'Mạnh' };

  input.addEventListener('input', function() {
    const { score } = checkPasswordStrength(input.value);
    const cls = strengthClasses[score] || '';

    if (strengthWrapper) strengthWrapper.className = 'password-strength ' + cls;

    if (strengthLabel) {
      strengthLabel.className = 'strength-label ' + cls;
      const base = strengthLabel.dataset.base || strengthLabel.textContent;
      if (!strengthLabel.dataset.base) strengthLabel.dataset.base = base;
      if (score === 0) {
        strengthLabel.textContent = base;
      } else {
        strengthLabel.textContent = strengthLabels[score];
      }
    }
  });
});

// Client-side validation on form submit
document.querySelectorAll('form[data-validate]').forEach(function(form) {
  form.addEventListener('submit', function(e) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(function(field) {
      const err = field.closest('.form-group')?.querySelector('.field-error');
      if (!field.value.trim()) {
        field.classList.add('error');
        if (err) { err.classList.add('visible'); err.textContent = 'Trường này là bắt buộc'; }
        valid = false;
      } else {
        field.classList.remove('error');
        if (err) err.classList.remove('visible');
      }
    });

    // Email validation
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const err = emailField.closest('.form-group')?.querySelector('.field-error');
      if (!emailRe.test(emailField.value)) {
        emailField.classList.add('error');
        if (err) { err.classList.add('visible'); err.textContent = 'Email không hợp lệ'; }
        valid = false;
      }
    }

    // Password match for register
    const pw = form.querySelector('input[name="password"]');
    const confirm = form.querySelector('input[name="confirmPassword"]');
    if (pw && confirm && confirm.value && pw.value !== confirm.value) {
      confirm.classList.add('error');
      const err = confirm.closest('.form-group')?.querySelector('.field-error');
      if (err) { err.classList.add('visible'); err.textContent = 'Mật khẩu xác nhận không khớp'; }
      valid = false;
    }

    if (!valid) e.preventDefault();
  });
});

// Remove error on input
document.querySelectorAll('input').forEach(function(input) {
  input.addEventListener('input', function() {
    input.classList.remove('error');
    const err = input.closest('.form-group')?.querySelector('.field-error');
    if (err) err.classList.remove('visible');
  });
});

// Loading state on submit
document.querySelectorAll('form[data-validate]').forEach(function(form) {
  form.addEventListener('submit', function() {
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('btn-loading');
      const original = btn.textContent;
      btn.setAttribute('data-original-text', original);
      btn.textContent = 'Đang xử lý...';
    }
  });
});
