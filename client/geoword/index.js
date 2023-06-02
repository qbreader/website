const packetName = 'beterword-sample';
let packetLength = 20;

fetch('/geoword/api/get-question-count?' + new URLSearchParams({ packetName }))
    .then(response => response.json())
    .then(data => {
        packetLength = data.questionCount;
    });

const buzzAudio = new Audio('/geoword/audio/buzz.mp3');
const correctAudio = new Audio('/geoword/audio/correct.mp3');
const incorrectAudio = new Audio('/geoword/audio/incorrect.mp3');
const promptAudio = new Audio('/geoword/audio/correct.mp3');
const sampleAudio = new Audio('/geoword/audio/sample.mp3');

let currentAudio;
let currentQuestionNumber = 0;
let startTime = null;
let endTime = null;

let deads = 0;
let negs = 0;
let numberCorrect = 0;
let points = 0;
let tens = 0;
let totalCorrectCelerity = 0;
let tuh = 0;

async function checkGeowordAnswer(givenAnswer, questionNumber) {
    return await fetch('/geoword/api/check-answer?' + new URLSearchParams({
        givenAnswer,
        packetName,
        questionNumber,
    }))
        .then(response => response.json())
        .then(data => {
            const { actualAnswer, directive, directedPrompt } = data;
            return { actualAnswer, directive, directedPrompt };
        });
}

async function giveAnswer(givenAnswer) {
    currentlyBuzzing = false;

    const { actualAnswer, directive, directedPrompt } = await checkGeowordAnswer(givenAnswer, currentQuestionNumber);
    console.log(actualAnswer);

    switch (directive) {
    case 'accept':
        correctAudio.play();
        updateScore(true, givenAnswer, actualAnswer);
        break;
    case 'prompt':
        promptAudio.play();
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
        document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
        break;
    case 'reject':
        incorrectAudio.play();
        updateScore(false, givenAnswer, actualAnswer);
        break;
    }
}

function next() {
    sampleAudio.pause();
    sampleAudio.currentTime = 0;

    document.getElementById('start-content').classList.add('d-none');
    document.getElementById('question-info').classList.add('d-none');

    currentQuestionNumber++;

    if (currentQuestionNumber > packetLength) {
        document.getElementById('end-content').classList.remove('d-none');
        return;
    }

    document.getElementById('buzz').disabled = false;
    document.getElementById('next').disabled = true;
    document.getElementById('start').disabled = true;

    currentAudio = new Audio(`/geoword/audio/${packetName}/${currentQuestionNumber}.mp3`);
    startTime = performance.now();
    currentAudio.play();
}

function recordBuzz() {
    return;
}

function updateScore(isCorrect, givenAnswer, actualAnswer) {
    recordBuzz();

    const delta = (endTime - startTime) / 1000;
    const isEndOfQuestion = delta > currentAudio.duration;
    const celerity = isEndOfQuestion ? 0 : 1 - delta / currentAudio.duration;
    totalCorrectCelerity += isCorrect ? celerity : 0;
    tuh++;

    if (isCorrect) {
        tens++;
    } else if (isEndOfQuestion) {
        deads++;
    } else {
        negs++;
    }

    points = 10 * tens - 5 * negs;

    const averageCelerity = tens === 0 ? 0 : totalCorrectCelerity / tens;
    const includePlural = tuh === 1 ? '' : 's';

    document.getElementById('current-actual-answer').innerHTML = actualAnswer;
    document.getElementById('current-celerity').textContent = celerity.toFixed(3);
    document.getElementById('current-given-answer').textContent = givenAnswer;
    document.getElementById('current-status').textContent = isCorrect ? 'Correct' : 'Incorrect';
    document.getElementById('statline').textContent = `${tens}/${deads}/${negs} (10/0s/-5) with ${tuh} tossup${includePlural} seen (${points} pts, celerity: ${averageCelerity.toFixed(3)})`;

    document.getElementById('buzz').disabled = true;
    document.getElementById('next').disabled = false;
    document.getElementById('start').disabled = false;
}


document.getElementById('answer-form').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    const answer = document.getElementById('answer-input').value;

    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input').blur();
    document.getElementById('answer-input').placeholder = 'Enter answer';
    document.getElementById('answer-input-group').classList.add('d-none');
    document.getElementById('question-info').classList.remove('d-none');

    giveAnswer(answer);
});

document.getElementById('buzz').addEventListener('click', function () {
    endTime = performance.now();

    currentAudio.pause();
    buzzAudio.play();

    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();

    this.disabled = true;
});

document.getElementById('next').addEventListener('click', next);

document.getElementById('play-sample').addEventListener('click', () => {
    sampleAudio.play();
});

document.getElementById('start').addEventListener('click', next);

document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
    }

    switch (event.key) {
    case ' ':
        document.getElementById('buzz').click();
        // Prevent spacebar from scrolling the page:
        if (event.target == document.body) {
            event.preventDefault();
        }
        break;
    case 'n':
        document.getElementById('next').click();
        break;
    case 's':
        document.getElementById('start').click();
        break;
    }
});
