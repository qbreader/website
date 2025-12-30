/**
 * This file is run at the start of every page.
 * Because it must be run immmediately, it **cannot** defer and cannot be a module.
 */

function isTouchDevice () {
  if ('ontouchstart' in window) return true;

  // eslint-disable-next-line no-undef
  return window.DocumentTouch && document instanceof DocumentTouch;
}

const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
for (const tooltipTriggerEl of tooltipTriggerList) {
  if (isTouchDevice()) continue;

  // eslint-disable-next-line no-new
  new bootstrap.Tooltip(tooltipTriggerEl);
}

window.addEventListener('DOMContentLoaded', () => {
  function myCallback (username) {
    if (!username) { return; }
    document.getElementById('login-link').textContent = username;
    document.getElementById('login-link').href = '/user/my-profile';
  }
  const data = window.sessionStorage.getItem('account-username');
  if (data !== null) { return myCallback(JSON.parse(data).username); }
  fetch('/auth/get-username').then(response => {
    if (response.status === 401) { return { username: null }; }
    return response.json();
  }).then(json => json.username)
    .then(username => { myCallback(username); window.sessionStorage.setItem('account-username', JSON.stringify({ username })); });
});

// mostly copied from https://getbootstrap.com/docs/5.3/customize/color-modes/#javascript

const getStoredTheme = () => window.localStorage.getItem('color-theme');
const setStoredTheme = theme => window.localStorage.setItem('color-theme', theme);
const getPreferredTheme = () => {
  const storedTheme = getStoredTheme();
  if (storedTheme === 'dark') { return 'night'; }
  if (storedTheme) { return storedTheme; }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'light';
};

const setTheme = theme => {
  const htmlTag = document.documentElement;
  if (theme === 'auto') {
    htmlTag.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'light'));
  } else {
    htmlTag.setAttribute('data-bs-theme', theme);
  }
};

setTheme(getPreferredTheme());

const showActiveTheme = (theme, focus = false) => {
  const activeThemeIcon = document.querySelector('.theme-icon-active i');
  const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`);
  const svgClassOfActiveBtn = Array.from(btnToActive.querySelector('i').classList).filter(cls => cls.startsWith('bi-'))[0];

  document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
    element.classList.remove('active');
    element.querySelector('.bi-check2').classList.add('d-none');
  });

  btnToActive.classList.add('active');
  btnToActive.querySelector('.bi-check2').classList.remove('d-none');
  activeThemeIcon.className = 'bi ' + svgClassOfActiveBtn;

  if (focus) {
    document.querySelector('#bd-theme').focus();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  showActiveTheme(getPreferredTheme());

  document.querySelectorAll('[data-bs-theme-value]')
    .forEach(toggle => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('data-bs-theme-value');
        setStoredTheme(theme);
        setTheme(theme);
        showActiveTheme(theme, true);
      });
    });
});
