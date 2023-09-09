async function starBonus(bonus_id) {
    return fetch('/auth/stars/star-bonus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonus_id }),
    }).then(response => {
        if (response.status === 401) {
            const toast = new bootstrap.Toast(document.getElementById('star-toast'));
            toast.show();
        } else if (!response.ok) {
            alert('There was an error starring the bonus.');
        }
        return response.ok;
    }).catch(_error => {
        alert('There was an error starring the bonus.');
        return false;
    });
}


async function starTossup(tossup_id) {
    return fetch('/auth/stars/star-tossup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tossup_id }),
    }).then(response => {
        if (response.status === 401) {
            const toast = new bootstrap.Toast(document.getElementById('star-toast'));
            toast.show();
        } else if (!response.ok) {
            alert('There was an error starring the bonus.');
        }
        return response.ok;
    }).catch(_error => {
        alert('There was an error starring the bonus.');
        return false;
    });
}


function unstarBonus(bonus_id) {
    fetch('/auth/stars/unstar-bonus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonus_id }),
    }).then(response => {
        if (response.status === 401) {
            const toast = new bootstrap.Toast(document.getElementById('star-toast'));
            toast.show();
        } else if (!response.ok) {
            alert('There was an error unstarring the bonus.');
        }
    }).catch(_error => {
        alert('There was an error unstarring the bonus.');
    });
}


function unstarTossup(tossup_id) {
    fetch('/auth/stars/unstar-tossup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tossup_id }),
    }).then(response => {
        if (response.status === 401) {
            const toast = new bootstrap.Toast(document.getElementById('star-toast'));
            toast.show();
        } else if (!response.ok) {
            alert('There was an error unstarring the bonus.');
        }
    }).catch(_error => {
        alert('There was an error unstarring the bonus.');
    });
}

async function isStarredBonus(bonus_id) {
    if (!(await getAccountUsername())) {
        return false;
    }

    return await fetch(`/auth/stars/is-starred-bonus?bonus_id=${bonus_id}`)
        .then(response => response.json())
        .then(response => response.isStarred);
}

async function isStarredTossup(tossup_id) {
    if (!(await getAccountUsername())) {
        return false;
    }

    return await fetch(`/auth/stars/is-starred-tossup?tossup_id=${tossup_id}`)
        .then(response => response.json())
        .then(response => response.isStarred);
}
