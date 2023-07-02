deleteAccountUsername();

const form = document.getElementById('login-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        return;
    }

    document.getElementById('submission').textContent = 'Logging in...';

    const username = document.getElementById('username').value;
    fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            password: document.getElementById('password').value,
        }),
    }).then(async function (response) {
        if (response.status === 200) {
            const { expires } = await response.json();
            sessionStorage.setItem('account-username', JSON.stringify({ username, expires }));
            window.location.href = '/user/my-profile';
        } else {
            document.getElementById('submission').textContent = 'Login';
            document.getElementById('password').value = '';
            alert('Invalid username or password.');
        }
    });
}, false);
