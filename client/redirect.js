if (location.pathname.endsWith('/') && location.pathname.length > 1) {
    location.pathname = location.pathname.substring(0, location.pathname.length - 1);
}

if (location.origin === 'http://www.qbreader.org') {
    location.href = 'https://www.qbreader.org' + location.pathname;
}