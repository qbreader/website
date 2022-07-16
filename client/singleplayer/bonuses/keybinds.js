document.addEventListener('keydown', (event) => {
    if (document.activeElement.tagName === 'INPUT') return;

    switch (event.key) {
        case ' ':
            document.getElementById('reveal').click();
            break;
        case 'n':
            document.getElementById('next').click();
            break;
        case 's':
            document.getElementById('start').click();
            break;
        case 'k':
            document.getElementById(`checkbox-${currentBonusPart}`).click();
            break;
        case '1':
            document.getElementById('checkbox-1').click();
            break;
        case '2':
            document.getElementById('checkbox-2').click();
            break;
        case '3':
            document.getElementById('checkbox-3').click();
            break;
    }
});
