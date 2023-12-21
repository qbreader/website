if (localStorage.getItem('font-size')) {
    document.getElementById('font-size').value = localStorage.getItem('font-size');
    document.getElementById('font-size-display').textContent = localStorage.getItem('font-size');
}

if (localStorage.getItem('database-font-size') === 'true') {
    document.getElementById('toggle-database-font-size').checked = true;
}

if (localStorage.getItem('high-contrast-question-text') === 'true') {
    document.getElementById('toggle-high-contrast-question-text').checked = true;
}

if (localStorage.getItem('sound-effects') === 'true') {
    document.getElementById('toggle-sound-effects').checked = true;
}

const stylesheet = document.querySelector('#custom-css');
document.getElementById('toggle-color-theme').addEventListener('click', function () {
    if (stylesheet.getAttribute('href') === '/bootstrap/light.css') {
        stylesheet.setAttribute('href', '/bootstrap/dark.css');
        localStorage.setItem('color-theme', 'dark');
    } else {
        stylesheet.setAttribute('href', '/bootstrap/light.css');
        localStorage.setItem('color-theme', 'light');
    }
});

document.getElementById('reset-color-theme').addEventListener('click', function () {
    localStorage.removeItem('color-theme');
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Get OS preferred color scheme
        document.querySelector('#custom-css').setAttribute('href', '/bootstrap/dark.css');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.querySelector('#custom-css').setAttribute('href', '/bootstrap/light.css');
    }
});

document.getElementById('font-size').addEventListener('input', function () {
    localStorage.setItem('font-size', this.value);
    document.getElementById('font-size-display').textContent = this.value;
});

document.getElementById('toggle-database-font-size').addEventListener('click', function () {
    this.blur();
    if (this.checked) {
        localStorage.setItem('database-font-size', 'true');
    } else {
        localStorage.removeItem('database-font-size');
    }
});

document.getElementById('toggle-high-contrast-question-text').addEventListener('click', function () {
    this.blur();
    if (this.checked) {
        localStorage.setItem('high-contrast-question-text', 'true');
    } else {
        localStorage.removeItem('high-contrast-question-text');
    }
});

document.getElementById('toggle-sound-effects').addEventListener('click', function () {
    this.blur();
    if (this.checked) {
        localStorage.setItem('sound-effects', 'true');
    } else {
        localStorage.removeItem('sound-effects');
    }
});
