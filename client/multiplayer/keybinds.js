document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.activeElement.id === 'chat-input') {
        // press escape to close chat
        document.getElementById('chat-input-group').classList.add('d-none');
    } else if (event.key === ' ' && document.activeElement.tagName !== 'INPUT') {
        // Prevent spacebar from scrolling the page
        document.getElementById('buzz').click();
        if (event.target == document.body) event.preventDefault();
    }
});

document.addEventListener('keypress', function (event) {
    // needs to be keypress
    // keydown immediately hides the input group
    // keyup shows the input group again after submission
    if (event.key === 'Enter' && event.target == document.body) {
        document.getElementById('chat').click();
    }
});

document.addEventListener('keyup', (event) => {
    if (document.activeElement.tagName === 'INPUT') return;

    if (event.key == 'n' || event.key == 'N' || event.key == 's' || event.key == 'S') {
        document.getElementById('next').click();
    } else if (event.key == 'p' || event.key == 'P') {
        document.getElementById('pause').click();
    }
});
