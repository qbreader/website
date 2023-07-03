(async () => {
    const username = await getAccountUsername();
    if (username) {
        document.getElementById('welcome-username').textContent = username;
    }
})();
