/**
 * Shared auth logic for login.html, admin-login.html and register.html.
 *
 * AgroShield uses EMAIL-ONLY login (development demo mode): the server
 * verifies the email against MongoDB and checks the account's role there.
 * This file only does friendly format checks — every authorisation decision
 * (does the account exist, is it a customer/admin) belongs to the server.
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

  /* ---------------- validators (email-only auth) ---------------- */
  function validateLogin() {
    const msg = EMAIL_RE.test(fieldValue('email').trim()) ? '' : 'Enter a valid email address.';
    showError('email', msg);
    return !msg;
  }

  function validateRegister() {
    const rules = {
      name: (v) => (v.trim().length >= 2 ? '' : 'Full name is required (min 2 characters).'),
      email: (v) => (EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address.'),
      phone: (v) => (PHONE_RE.test(v.trim()) ? '' : 'Enter a valid 10-digit Indian mobile number.'),
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

  /* ---------------- post-login redirect ---------------- */
  function safeNext() {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    // Only allow redirects to our own pages (open-redirect protection).
    if (next && /^\/pages\/[a-z-]+\.html/i.test(next)) return next;
    return '';
  }

  function nextAfterLogin(user) {
    const next = safeNext();
    if (next) {
      // Deep links into the admin area stay admin-only.
      if (next.startsWith('/pages/admin')) return user.role === 'admin' ? next : '/pages/home.html';
      return next;
    }
    // Plain login always lands on the home page.
    return '/pages/home.html';
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
      });
      api.setToken(data.token);
      authStore.user = data.user;
      document.dispatchEvent(new CustomEvent('auth:changed'));
      flash('success', data.message);
      toast(data.message);
      setTimeout(() => (location.href = nextAfterLogin(data.user)), 500);
    } catch (err) {
      // 404 = this email has no account yet — point the visitor at signup.
      if (err.status === 404) {
        flash('error', `${err.message} Click "Create an account" below to sign up.`);
      } else {
        flash('error', err.message);
      }
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    $('auth-alert').classList.remove('show');
    if (!validateLogin()) return;

    const btn = $('admin-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    try {
      // The server owns authentication: it looks the email up in MongoDB and
      // returns the role stored in the database. `loginAs: 'admin'` only asks
      // the server to refuse non-admin accounts on this page — it can never
      // grant admin rights.
      const data = await api.post('/auth/login', {
        email: fieldValue('email').trim(),
        loginAs: 'admin',
      });

      if (!data.user || data.user.role !== 'admin') {
        flash('error', 'This account is not an administrator. Please sign in from the main Login page.');
        return;
      }

      api.setToken(data.token);
      authStore.user = data.user;
      document.dispatchEvent(new CustomEvent('auth:changed'));
      flash('success', 'Welcome back, administrator!');
      toast('Admin login successful.');
      setTimeout(() => (location.href = '/pages/admin.html'), 500);
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

  function wireEmailBlur(form) {
    if (!form) return;
    form.querySelectorAll('input[name="email"]').forEach((i) =>
      i.addEventListener('blur', () =>
        showError('email', EMAIL_RE.test(i.value.trim()) ? '' : 'Enter a valid email address.')
      )
    );
  }

  document.addEventListener('DOMContentLoaded', () => {
    UI.mountNav();

    const loginForm = $('login-form');
    const registerForm = $('register-form');
    const adminLoginForm = $('admin-login-form');

    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', handleAdminLogin);
      wireEmailBlur(adminLoginForm);
      // An administrator already signed in goes straight to the dashboard.
      if (authStore.isLoggedIn) {
        authStore.refresh().then((u) => {
          if (u && u.role === 'admin') location.href = '/pages/admin.html';
        });
      }
    }

    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
      wireEmailBlur(loginForm);
      // Already logged in? Go where they wanted.
      if (authStore.isLoggedIn) {
        authStore.refresh().then((u) => {
          if (u) location.href = nextAfterLogin(u);
        });
      }
    }

    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
      wireEmailBlur(registerForm);
    }
  });
})();
