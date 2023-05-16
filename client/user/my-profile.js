fetch('/auth/get-profile')
    .then(response => response.json())
    .then(data => {
        document.getElementById('username').innerHTML = data.user.username;
        document.getElementById('email').innerHTML = data.user.email;
        if (data.user.verifiedEmail) {
            document.getElementById('email-verified').innerHTML = 'Yes';
        } else {
            document.getElementById('email-verified').innerHTML = 'No';
            document.getElementById('email-verification-span').classList.remove('d-none');
        }
    });


document.getElementById('email-verification-link').addEventListener('click', async () => {
    await fetch('/auth/send-verification-email');
    document.getElementById('email-verification-span').classList.add('d-none');
    document.getElementById('email-verification-confirmation').classList.remove('d-none');
});


document.getElementById('logout').addEventListener('click', () => {
    fetch('/auth/logout', {
        method: 'POST',
    }).then(() => {
        localStorage.removeItem('account-username');
        window.location.href = '/user/login';
    });
});
