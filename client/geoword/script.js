function escapeHTML(unsafe) {
    return unsafe?.replaceAll('&', '&amp;')?.replaceAll('<', '&lt;')?.replaceAll('>', '&gt;')?.replaceAll('"', '&quot;')?.replaceAll('\'', '&#039;');
}

function titleCase(name) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
