// Javascript code common to *all* pages of the site.

// Never use trailing slash, except for the root directory
if (location.pathname.endsWith('/') && location.pathname.length > 1) {
    location.pathname = location.pathname.substring(0, location.pathname.length - 1);
}

// Always use https and www
if (['http://www.qbreader.org', 'http://qbreader.herokuapp.com', 'https://qbreader.herokuapp.com'].includes(location.origin)) {
    location.href = 'https://www.qbreader.org' + location.pathname;
}

function isTouchDevice() {
    return true == ('ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch);
}

const stylesheet = document.querySelector('#custom-css');
document.getElementById('toggle-dark-mode').addEventListener('click', function () {
    if (stylesheet.getAttribute('href') === '/bootstrap/light.css') {
        stylesheet.setAttribute('href', '/bootstrap/dark.css');
        localStorage.setItem('color-theme', 'dark');
    } else {
        stylesheet.setAttribute('href', '/bootstrap/light.css');
        localStorage.setItem('color-theme', 'light');
    }
});


const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    if (isTouchDevice()) return;

    return new bootstrap.Tooltip(tooltipTriggerEl);
});


function setWithExpiry(key, value, ttl) {
    const now = new Date();

    // `item` is an object which contains the original value
    // as well as the time when it's supposed to expire
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };

    localStorage.setItem(key, JSON.stringify(item));
}

function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);

    // if the item doesn't exist, return null
    if (!itemStr) {
        return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date();

    // compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
        // If the item is expired, delete the item from storage
        // and return null
        localStorage.removeItem(key);
        return null;
    }

    return item.value;
}

{
    const username = getWithExpiry('username');
    if (username) {
        document.getElementById('login-link').innerHTML = username;
        document.getElementById('login-link').href = '/users/my-profile';
    }
}
