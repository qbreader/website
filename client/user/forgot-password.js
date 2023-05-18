sessionStorage.removeItem('account-username');

const form = document.getElementById('forgot-password-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        return;
    }

    document.getElementById('submission').innerHTML = 'Submitting...';

    const username = document.getElementById('username').value;
    fetch('/auth/send-password-reset-email?username=' + encodeURIComponent(username));
}, false);
