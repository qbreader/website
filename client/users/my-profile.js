window.onload = () => {
    document.getElementById('username').innerHTML = getWithExpiry('username') ?? '';
};

document.getElementById('logout').addEventListener('click', () => {
    fetch('/auth/logout', {
        method: 'POST',
    }).then(() => {
        localStorage.removeItem('username');
        window.location.href = '/users/login';
    });
});
