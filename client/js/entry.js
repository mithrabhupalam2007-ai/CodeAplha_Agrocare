/**
 * Login selection page (client/index.html).
 * Carries a ?next= destination (set by the server login wall or the client
 * guards) through to the user login page so the visitor lands where they
 * originally wanted to go.
 */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var next = params.get('next') || '';

  if (next && /^\/pages\/[a-z-]+\.html/i.test(next)) {
    var userBtn = document.getElementById('user-login-btn');
    if (userBtn) {
      userBtn.setAttribute('href', '/pages/login.html?next=' + encodeURIComponent(next));
    }
  }
})();
