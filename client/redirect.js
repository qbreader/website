if (location.pathname.endsWith('/') && location.pathname.length > 1) {
    location.pathname = location.pathname.substring(0, location.pathname.length - 1);
}

if (location.origin === 'http://www.qbreader.org') {
    location.href = 'https://www.qbreader.org' + location.pathname;
}

if (document.URL.substring(0, 30) === 'https://qbreader.herokuapp.com') {
    window.location.href = 'https://www.qbreader.org' + document.URL.substring(30);
}