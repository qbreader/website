window.onload = () => {
    fetch('/auth/get-profile')
        .then(response => response.json())
        .then(data => {
            document.getElementById('username').value = data.user.username;
            document.getElementById('email').value = data.user.email;
        });
};

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
    fetch('/auth/edit-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: document.getElementById('email').value,
            username: username,
        })
    }).then(function (response) {
        if (response.status === 200) {
            localStorage.removeItem('account-username');
            window.location.href = '/user/login';
        } else {
            document.getElementById('submission').innerHTML = 'Submit';
            alert('Username already taken.');
        }
    });
}, false);
