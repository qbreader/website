localStorage.removeItem('account-username');

const form = document.getElementById('login-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        return;
    }

    document.getElementById('submission').innerHTML = 'Logging in...';

    const username = document.getElementById('username').value;
    fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: document.getElementById('password').value
        })
    }).then(function (response) {
        if (response.status === 200) {
            setWithExpiry('account-username', username, 1000 * 60 * 60 * 24);
            window.location.href = '/user/my-profile';
        } else {
            document.getElementById('submission').innerHTML = 'Login';
            document.getElementById('password').value = '';
            alert('Invalid username or password.');
        }
    });
}, false);
