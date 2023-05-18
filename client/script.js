// Javascript code common to *all* pages of the site.

// Never use trailing slash, except for the root directory
if (location.pathname.endsWith('/') && location.pathname.length > 1) {
    location.pathname = location.pathname.substring(0, location.pathname.length - 1);
}

// Always use https and www
if (['http://www.qbreader.org', 'http://qbreader.herokuapp.com', 'https://qbreader.herokuapp.com'].includes(location.origin)) {
    location.href = 'https://www.qbreader.org' + location.pathname;
}


if (['http://test.qbreader.org', 'http://qbreader-test.herokuapp.com', 'https://qbreader-test.herokuapp.com'].includes(location.origin)) {
    location.href = 'https://test.qbreader.org' + location.pathname;
}


function isTouchDevice() {
    return true == ('ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch);
}


const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    if (isTouchDevice()) return;

    return new bootstrap.Tooltip(tooltipTriggerEl);
});


async function getAccountUsername() {
    let username = sessionStorage.getItem('account-username');
    if (username === null || username === undefined) {
        username = await fetch('/auth/get-username')
            .then(response => {
                if (response.status === 401) {
                    return { username: null };
                }
                return response.json();
            })
            .then(data => {
                return data.username;
            });
        sessionStorage.setItem('account-username', username);
    } else if (username === 'null') {
        username = null;
    }

    return username;
}

(async () => {
    const username = await getAccountUsername();
    if (username) {
        document.getElementById('login-link').innerHTML = username;
        document.getElementById('login-link').href = '/user/my-profile';
    }
})();
