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

(async () => {
    const username = await getAccountUsername();
    if (username) {
        document.getElementById('welcome-username').textContent = `, ${username}`;
    }
})();
