const form = document.getElementById('signup-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        return;
    }

    if (document.getElementById('new-password').value !== document.getElementById('confirm-password').value) {
        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        return;
    }

    document.getElementById('submission').innerHTML = 'Submitting...';

    const username = getWithExpiry('account-username');
    fetch('/auth/edit-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            oldPassword: document.getElementById('old-password').value,
            newPassword: document.getElementById('new-password').value,
        })
    }).then(function (response) {
        if (response.status === 200) {
            setWithExpiry('account-username', username, 1000 * 60 * 60 * 24);
            window.location.href = '/user/my-profile';
        } else {
            document.getElementById('submission').innerHTML = 'Submit';
            document.getElementById('old-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
            alert('Make sure your password is correct.');
        }
    });
}, false);
