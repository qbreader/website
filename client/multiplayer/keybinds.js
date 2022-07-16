document.addEventListener('keydown', function (event) {
    // press escape to close chat
    if (event.key === 'Escape' && document.activeElement.tagName === 'INPUT') {
        document.getElementById('chat-input-group').classList.add('d-none');
    }
});

// Prevent spacebar from scrolling the page:
window.addEventListener('keydown', function (event) {
    if (document.activeElement.tagName === 'INPUT') return;

    if (event.key === ' ') {
        document.getElementById('buzz').click();
        if (event.target == document.body) event.preventDefault();
    }
});

window.addEventListener('keypress', function (event) {
    // needs to be keypress
    // keydown immediately hides the input group
    // keyup shows the input group again after submission
    if (event.key === 'Enter') {
        if (event.target == document.body) {
            document.getElementById('chat').click();
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (document.activeElement.tagName === 'INPUT') return;

    if (event.key == 'n' || event.key == 'N') {
        document.getElementById('next').click();
    } else if (event.key == 'p' || event.key == 'P') {
        document.getElementById('pause').click();
    } else if (event.key == 's' || event.key == 'S') { // pressing 'S'
        document.getElementById('start').click();
    }
});
