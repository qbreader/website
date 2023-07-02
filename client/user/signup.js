const form = document.getElementById('signup-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        return;
    }

    document.getElementById('submission').textContent = 'Submitting...';

    const username = document.getElementById('username').value;
    fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            username: username,
        }),
    }).then(async function (response) {
        if (response.status === 200) {
            const { expires } = await response.json();
            sessionStorage.setItem('account-username', JSON.stringify({ username, expires }));
            window.location.href = '/user/my-profile';
        } else {
            document.getElementById('submission').textContent = 'Submit';
            document.getElementById('password').value = '';
            alert('Username already exists.');
        }
    });
}, false);
