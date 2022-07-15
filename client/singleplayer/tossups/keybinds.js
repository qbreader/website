document.addEventListener('keydown', (event) => {
    if (document.activeElement.tagName === 'INPUT') return;

    switch (event.key) {
        case ' ':
            document.getElementById('buzz').click();
            // Prevent spacebar from scrolling the page:
            if (event.target == document.body) event.preventDefault();
            break;
        case 'n':
            document.getElementById('next').click();
            break;
        case 'p':
            document.getElementById('pause').click();
            break;
        case 's':
            document.getElementById('start').click();
            break;
    }
});