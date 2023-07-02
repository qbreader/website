deleteAccountUsername();

const form = document.getElementById('forgot-password-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        return;
    }

    const password = document.getElementById('new-password').value;
    if (password !== document.getElementById('confirm-password').value) {
        document.getElementById('confirm-password').value = '';
        return;
    }

    document.getElementById('submission').textContent = 'Submitting...';

    fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    }).then(response => {
        if (response.status === 401) {
            window.alert('Unable to reset password. Try requesting a new password reset email.');
            document.getElementById('confirm-password').value;
            throw new Error('Unable to reset password.');
        }
        return response;
    }).then(() => {
        window.location.href = '/user/login';
    });

}, false);
