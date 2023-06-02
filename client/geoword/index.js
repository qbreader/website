getAccountUsername().then(username => {
    if (username) {
        document.getElementById('login-warning').classList.add('d-none');
    }
});
