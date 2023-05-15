window.onload = () => {
    document.getElementById('username').innerHTML = getWithExpiry('username') ?? '';

    fetch('/auth/my-profile')
        .then(response => response.json())
        .then(data => {
            const recentQueries = document.getElementById('recent-queries');
            data.queries.forEach(query => {
                const li = document.createElement('li');
                li.innerHTML = `${query.query.queryString} (timestamp: ${query.createdAt})`;
                recentQueries.appendChild(li);
            });
        });
};

document.getElementById('logout').addEventListener('click', () => {
    fetch('/auth/logout', {
        method: 'POST',
    }).then(() => {
        localStorage.removeItem('username');
        window.location.href = '/users/login';
    });
});
