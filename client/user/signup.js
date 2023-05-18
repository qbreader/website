const form = document.getElementById('signup-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        return;
    }

    document.getElementById('submission').innerHTML = 'Submitting...';

    const username = document.getElementById('username').value;
    fetch('/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            username: username,
        })
    }).then(function (response) {
        if (response.status === 200) {
            sessionStorage.setItem('account-username', username);
            window.location.href = '/user/my-profile';
        } else {
            document.getElementById('submission').innerHTML = 'Submit';
            document.getElementById('password').value = '';
            alert('Username already exists.');
        }
    });
}, false);
