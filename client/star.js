function starBonus(bonus_id) {
    fetch('/auth/stars/star-bonus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonus_id }),
    }).then(response => {
        if (!response.ok) {
            alert('There was an error starring the bonus.');
        }
    }).catch(_error => {
        alert('There was an error starring the bonus.');
    });
}


function starTossup(tossup_id) {
    fetch('/auth/stars/star-tossup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tossup_id }),
    }).then(response => {
        if (!response.ok) {
            alert('There was an error starring the bonus.');
        }
    }).catch(_error => {
        alert('There was an error starring the bonus.');
    });
}


function unstarBonus(bonus_id) {
    fetch('/auth/stars/unstar-bonus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonus_id }),
    }).then(response => {
        if (!response.ok) {
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
        if (!response.ok) {
            alert('There was an error unstarring the bonus.');
        }
    }).catch(_error => {
        alert('There was an error unstarring the bonus.');
    });
}
