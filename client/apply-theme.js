if (localStorage.getItem('color-theme') === 'dark') {
    document.querySelector('#custom-css').setAttribute('href', '/bootstrap/dark.css');
} else if (localStorage.getItem('color-theme') === 'light') {
    document.querySelector('#custom-css').setAttribute('href', '/bootstrap/light.css');
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Get OS preferred color scheme
    document.querySelector('#custom-css').setAttribute('href', '/bootstrap/dark.css');
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.querySelector('#custom-css').setAttribute('href', '/bootstrap/light.css');
}