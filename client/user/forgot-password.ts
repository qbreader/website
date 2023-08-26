deleteAccountUsername();

const form = document.getElementById('forgot-password-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        return;
    }

    document.getElementById('submission').textContent = 'Submitting...';

    const username = document.getElementById('username').value;
    fetch('/auth/send-password-reset-email?' + new URLSearchParams({ username }));
    window.location.href = '/';
}, false);
