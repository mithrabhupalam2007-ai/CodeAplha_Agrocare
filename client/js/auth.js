/**
 * Shared auth logic for login.html and register.html.
 * Validates every field client-side, then calls the API. Real rules
 * (duplicate email, wrong password) are enforced by the server too.
 */
(() => {
  const $ = (id) => document.getElementById(id);

  const EMAIL_RE = /^\S+@\S+\.\S+$/;
  const PHONE_RE = /^[6-9]\d{9}$/;
  const PINCODE_RE = /^\d{6}$/;

  function showError(field, msg) {
    const input = document.querySelector(`[name="${field}"]`);
    const err = document.querySelector(`[data-err="${field}"]`);
    if (input) input.classList.toggle('input--error', Boolean(msg));
    if (err) {
      err.textContent = msg || '';
      err.classList.toggle('show', Boolean(msg));
    }
  }

  function flash(kind, message) {
    const box = $('auth-alert');
    box.className = `alert show alert--${kind}`;
    box.textContent = message;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function fieldValue(name) {
    const el = document.querySelector(`[name="${name}"]`);
    return el ? el.value : '';
  }

  /* ---------------- validators ---------------- */
  function validateLogin() {
    const rules = {
      email: (v) => (EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address.'),
      password: (v) => (v ? '' : 'Password is required.'),
    };
    let ok = true;
    Object.entries(rules).forEach(([f, fn]) => {
      const msg = fn(fieldValue(f));
      showError(f, msg);
      if (msg) ok = false;
    });
    return ok;
  }

  function validateRegister() {
    const pw = fieldValue('password');
    const rules = {
      name: (v) => (v.trim().length >= 2 ? '' : 'Full name is required (min 2 characters).'),
      email: (v) => (EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address.'),
      phone: (v) => (PHONE_RE.test(v.trim()) ? '' : 'Enter a valid 10-digit Indian mobile number.'),
      password: (v) => {
        if (v.length < 8) return 'Password must be at least 8 characters.';
        if (!/[a-zA-Z]/.test(v)) return 'Password must contain at least one letter.';
        if (!/\d/.test(v)) return 'Password must contain at least one number.';
        return '';
      },
      confirmPassword: (v) => (v === pw ? '' : 'Passwords do not match.'),
      line1: (v) => (v.trim().length >= 3 ? '' : 'Address line is required.'),
      city: (v) => (v.trim().length >= 2 ? '' : 'City is required.'),
      state: (v) => (v.trim().length >= 2 ? '' : 'State is required.'),
      pincode: (v) => (PINCODE_RE.test(v.trim()) ? '' : 'PIN code must be 6 digits.'),
    };
    let ok = true;
    Object.entries(rules).forEach(([f, fn]) => {
      const msg = fn(fieldValue(f));
      showError(f, msg);
      if (msg) ok = false;
    });
    return ok;
  }

  /* ---------------- password widgets ---------------- */
  function wirePasswordWidgets() {
    document.querySelectorAll('[data-pw-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.textContent = showing ? 'Show' : 'Hide';
      });
    });

    const pwInput = document.querySelector('#register-form [name="password"]');
    const meter = $('pw-strength');
    if (pwInput && meter) {
      pwInput.addEventListener('input', () => {
        const v = pwInput.value;
        let score = 0;
        if (v.length >= 8) score += 1;
        if (/[a-zA-Z]/.test(v) && /\d/.test(v)) score += 1;
        if (v.length >= 12) score += 1;
        if (/[^a-zA-Z0-9]/.test(v)) score += 1;
        meter.className = 'pw-strength ' + ['', 'weak', 'fair', 'good', 'strong'][score];
      });
    }
  }

  /* ---------------- post-login redirect ---------------- */
  function nextAfterLogin(user) {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    if (next && next.startsWith('/')) return next;
    return user.role === 'admin' ? '/pages/admin.html' : '/';
  }

  /* ---------------- submit handlers ---------------- */
  async function handleLogin(e) {
    e.preventDefault();
    $('auth-alert').classList.remove('show');
    if (!validateLogin()) return;

    const btn = $('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
      const data = await api.post('/auth/login', {
        email: fieldValue('email').trim(),
        password: fieldValue('password'),
      });
      api.setToken(data.token);
      authStore.user = data.user;
      document.dispatchEvent(new CustomEvent('auth:changed'));
      flash('success', data.message);
      toast(data.message);
      setTimeout(() => (location.href = nextAfterLogin(data.user)), 500);
    } catch (err) {
      flash('error', err.message);
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    $('auth-alert').classList.remove('show');
    if (!validateRegister()) {
      toast('Please fix the highlighted fields.', 'error');
      const firstBad = document.querySelector('.input--error');
      if (firstBad) firstBad.focus();
      return;
    }

    const btn = $('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const data = await api.post('/auth/register', {
        name: fieldValue('name').trim(),
        email: fieldValue('email').trim(),
        phone: fieldValue('phone').trim(),
        password: fieldValue('password'),
        confirmPassword: fieldValue('confirmPassword'),
        address: {
          line1: fieldValue('line1').trim(),
          line2: fieldValue('line2').trim(),
          city: fieldValue('city').trim(),
          state: fieldValue('state').trim(),
          pincode: fieldValue('pincode').trim(),
        },
      });
      api.setToken(data.token);
      authStore.user = data.user;
      document.dispatchEvent(new CustomEvent('auth:changed'));
      flash('success', data.message);
      toast('Account created — welcome to AgroShield!');
      setTimeout(() => (location.href = nextAfterLogin(data.user)), 600);
    } catch (err) {
      flash('error', err.message);
      toast(err.message, 'error');
      // Duplicate email: jump the user to login with their email intact.
      if (err.status === 409) {
        setTimeout(() => {
          location.href = '/pages/login.html';
        }, 1600);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    UI.mountNav();
    wirePasswordWidgets();

    const loginForm = $('login-form');
    const registerForm = $('register-form');

    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
      loginForm.querySelectorAll('input').forEach((i) =>
        i.addEventListener('blur', () => {
          if (i.name === 'email') showError('email', EMAIL_RE.test(i.value.trim()) ? '' : 'Enter a valid email address.');
          if (i.name === 'password' && !i.value) showError('password', 'Password is required.');
        })
      );
      // Already logged in? Go where they wanted.
      if (authStore.isLoggedIn) {
        authStore.refresh().then((u) => {
          if (u) location.href = nextAfterLogin(u);
        });
      }
    }

    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
      registerForm.querySelectorAll('[name="confirmPassword"]').forEach((i) =>
        i.addEventListener('blur', () =>
          showError('confirmPassword', i.value === fieldValue('password') ? '' : 'Passwords do not match.')
        )
      );
    }
  });
})();
