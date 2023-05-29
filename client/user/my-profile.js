fetch('/auth/get-profile')
    .then(response => response.json())
    .then(data => {
        document.getElementById('username').textContent = data.user.username;
        document.getElementById('email').textContent = data.user.email;
        if (data.user.verifiedEmail) {
            document.getElementById('email-verified').textContent = 'Yes';
        } else {
            document.getElementById('email-verified').textContent = 'No';
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
        deleteAccountUsername();
        window.location.href = '/user/login';
    });
});
