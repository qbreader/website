import account from './accounts.js';

// Javascript code common to *all* pages of the site.

// Never use trailing slash, except for the root directory
if (location.pathname.endsWith('/') && location.pathname.length > 1) {
    location.pathname = location.pathname.substring(0, location.pathname.length - 1);
}

// Always use www
if (['qbreader.herokuapp.com', 'qbreader-production.herokuapp.com', 'qbreader.org'].includes(location.hostname)) {
    location.hostname = 'www.qbreader.org';
}

if (['qbreader-test.herokuapp.com', 'qbreader-test.herokuapp.com'].includes(location.hostname)) {
    location.hostname = 'test.qbreader.org';
}

// Use https if not on localhost
if (location.hostname !== 'localhost' && location.protocol !== 'https:') {
    location.protocol = 'https:';
}


function isTouchDevice() {
    // eslint-disable-next-line no-undef
    return true == ('ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch);
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
