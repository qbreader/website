import account from './accounts.js';

// Javascript code common to *all* pages of the site.

// Never use trailing slash, except for the root directory
if (window.location.pathname.endsWith('/') && window.location.pathname.length > 1) {
  window.location.pathname = window.location.pathname.substring(0, window.location.pathname.length - 1);
}

// Always use www
if (['qbreader.herokuapp.com', 'qbreader-production.herokuapp.com', 'qbreader.org'].includes(window.location.hostname)) {
  window.location.hostname = 'www.qbreader.org';
}

if (['qbreader-test.herokuapp.com', 'qbreader-test.herokuapp.com'].includes(window.location.hostname)) {
  window.location.hostname = 'test.qbreader.org';
}

// Use https if not on localhost
if (window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
  window.location.protocol = 'https:';
}

function isTouchDevice () {
  if ('ontouchstart' in window) return true;

  // eslint-disable-next-line no-undef
  return window.DocumentTouch && document instanceof DocumentTouch;
}

const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (tooltipTriggerEl) {
  if (isTouchDevice()) return;

  // eslint-disable-next-line no-undef
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

account.getUsername().then(username => {
  if (username) {
    document.getElementById('login-link').textContent = username;
    document.getElementById('login-link').href = '/user/my-profile';
  }
});
