if (location.pathname.endsWith('/') && location.pathname.length > 1) {
    location.pathname = location.pathname.substring(0, location.pathname.length - 1);
}

if (['http://www.qbreader.org', 'http://qbreader.herokuapp.com', 'https://qbreader.herokuapp.com'].includes(location.origin)) {
    location.href = 'https://www.qbreader.org' + location.pathname;
}

function isTouchDevice() {
    return true == ('ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch);
}

const stylesheet = document.querySelector('link[rel="stylesheet"]');
document.getElementById('toggle-dark-mode').addEventListener('click', function () {
    if (stylesheet.getAttribute('href') === '/bootstrap/light.css') {
        stylesheet.setAttribute('href', '/bootstrap/dark.css');
        localStorage.setItem('color-theme', 'dark');
    } else {
        stylesheet.setAttribute('href', '/bootstrap/light.css');
        localStorage.setItem('color-theme', 'light');
    }
});


var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    if (isTouchDevice()) return;

    return new bootstrap.Tooltip(tooltipTriggerEl);
});
