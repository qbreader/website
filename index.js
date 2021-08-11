currentlyBuzzing = false

questiontext = '1 j s s f g d s s s a a  s s 3 4 6 7 9 1 2 2 1 1 2 1 2 3  4 5 3  2 2';
questiontext = questiontext.split(' ');
console.log(questiontext);

document.getElementById('start').addEventListener('click', () => {
    var intervalId = window.setInterval(() => {
        document.getElementById('question').innerHTML += questiontext.shift() + ' ';
        if (currentlyBuzzing || questiontext.length == 0) {
            clearInterval(intervalId);
        }
    }, 300);
});

function buzz() {
    currentlyBuzzing = true;
}

document.getElementById('buzz').addEventListener('click', buzz);

document.addEventListener('keyup', () => {
    if (event.which == 32) {
        buzz();
    }
})