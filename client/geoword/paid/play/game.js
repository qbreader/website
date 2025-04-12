/* globals Audio */

import { titleCase } from '../../../scripts/utilities/strings.js';
import audio from '../../../audio/index.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

let packetLength = 20;

let currentAudio;
let questionNumber = 0;
const sampleAudio = new Audio('/api/geoword/paid/play/audio/sample.mp3?' + new URLSearchParams({ packetName }));

let division;
let numberCorrect = 0;
let points = 0;
let prompts = [];
let totalCorrectCelerity = 0;
let tossupsHeard = 0;

document.getElementById('geoword-stats').href = '../results/stats?packetName=' + packetName;

fetch('/api/geoword/paid/play/get-progress?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    ({ division, numberCorrect, points, totalCorrectCelerity, tossupsHeard } = data);

    document.getElementById('packet-name').textContent = `${packetTitle} (${division})`;

    if (tossupsHeard > 0) {
      questionNumber = tossupsHeard;
      document.getElementById('progress-info').textContent = `You have already read ${tossupsHeard} tossups and will start on question ${tossupsHeard + 1}.`;
      updateStatline(numberCorrect, points, tossupsHeard, totalCorrectCelerity);
    } else {
      numberCorrect = 0;
      points = 0;
      totalCorrectCelerity = 0;
      tossupsHeard = 0;
    }

    fetch('/api/geoword/paid/play/get-question-count?' + new URLSearchParams({ packetName, division }))
      .then(response => response.json())
      .then(data => {
        packetLength = data.questionCount;
        document.getElementById('packet-length').textContent = packetLength;
      });
  });

async function checkGeowordAnswer (givenAnswer, questionNumber) {
  return await fetch('/api/geoword/paid/play/check-answer?' + new URLSearchParams({
    givenAnswer,
    packetName,
    questionNumber,
    division
  }))
    .then(response => response.json())
    .then(data => {
      const { actualAnswer, directive, directedPrompt } = data;
      return { actualAnswer, directive, directedPrompt };
    });
}

async function giveAnswer (givenAnswer) {
  const { actualAnswer, directive, directedPrompt } = await checkGeowordAnswer(givenAnswer, questionNumber);

  switch (directive) {
    case 'accept':
      updateScore(true, givenAnswer, actualAnswer, prompts);
      prompts = [];
      break;
    case 'prompt':
      document.getElementById('answer-input-group').classList.remove('d-none');
      document.getElementById('answer-input').focus();
      document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
      prompts.push(givenAnswer);
      break;
    case 'reject':
      updateScore(false, givenAnswer, actualAnswer, prompts);
      prompts = [];
      break;
  }
}

function next () {
  sampleAudio.pause();
  sampleAudio.currentTime = 0;

  document.getElementById('start-content').classList.add('d-none');
  document.getElementById('record-protest-confirmation').classList.add('d-none');
  document.getElementById('protest-text').classList.add('d-none');
  document.getElementById('question-info').classList.add('d-none');
  document.getElementById('next').disabled = true;

  questionNumber++;

  if (questionNumber > packetLength) {
    document.getElementById('end-content').classList.remove('d-none');
    return;
  }

  document.getElementById('buzz').disabled = false;
  document.getElementById('start').disabled = true;

  currentAudio = new Audio(encodeURI(
    '/api/geoword/paid/play/audio/question.mp3?' +
    new URLSearchParams({ packetName, division, questionNumber })
  ));
  currentAudio.play();
}

function recordProtest (packetName, questionNumber) {
  fetch('/api/geoword/paid/play/record-protest?', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packetName,
      questionNumber
    })
  }).then(() => {
    document.getElementById('record-protest-confirmation').classList.remove('d-none');
  });
}

function recordBuzz (packetName, questionNumber, celerity, points, givenAnswer, prompts = []) {
  fetch('/api/geoword/paid/play/record-buzz?' + new URLSearchParams({
    packetName,
    questionNumber,
    celerity,
    points,
    givenAnswer,
    prompts
  }));
}

function updateScore (isCorrect, givenAnswer, actualAnswer, prompts = []) {
  const celerity = 1 - currentAudio.currentTime / currentAudio.duration;
  const currentPoints = isCorrect ? 10 + Math.round(10 * celerity) : 0;

  if (isCorrect) {
    audio.correct.play();
    numberCorrect++;
  } else {
    audio.incorrect.play();
    document.getElementById('protest-text').classList.remove('d-none');
  }

  recordBuzz(packetName, questionNumber, celerity, currentPoints, givenAnswer, prompts);

  points += currentPoints;
  tossupsHeard++;
  totalCorrectCelerity += isCorrect ? celerity : 0;

  updateStatline(numberCorrect, points, tossupsHeard, totalCorrectCelerity);

  document.getElementById('current-actual-answer').innerHTML = actualAnswer;
  document.getElementById('current-celerity').textContent = celerity.toFixed(3);
  document.getElementById('current-given-answer').textContent = givenAnswer;
  document.getElementById('current-points').textContent = currentPoints;
  document.getElementById('current-question-number').textContent = questionNumber;
  document.getElementById('current-status').textContent = isCorrect ? 'Correct' : 'Incorrect';

  document.getElementById('buzz').disabled = true;
  document.getElementById('next').disabled = false;

  document.getElementById('question-info').classList.remove('d-none');
}

function updateStatline (numberCorrect, points, tossupsHeard, totalCorrectCelerity) {
  const averageCelerity = (numberCorrect === 0 ? 0 : totalCorrectCelerity / numberCorrect).toFixed(3);
  const pointsPerTossup = (tossupsHeard === 0 ? 0 : points / tossupsHeard).toFixed(2);
  document.getElementById('statline').textContent = `${pointsPerTossup} points per question (${points} points / ${tossupsHeard} TUH), celerity: ${averageCelerity}`;
}

document.getElementById('answer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  const answer = document.getElementById('answer-input').value;

  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').blur();
  document.getElementById('answer-input').placeholder = 'Enter answer';
  document.getElementById('answer-input-group').classList.add('d-none');

  giveAnswer(answer);
});

document.getElementById('buzz').addEventListener('click', function () {
  currentAudio.pause();
  audio.buzz.play();

  document.getElementById('answer-input-group').classList.remove('d-none');
  document.getElementById('answer-input').focus();

  this.disabled = true;
});

document.getElementById('next').addEventListener('click', next);

document.getElementById('play-sample').addEventListener('click', function () {
  if (this.classList.contains('btn-primary')) {
    sampleAudio.play();
    this.classList.remove('btn-primary');
    this.classList.add('btn-danger');
  } else {
    sampleAudio.pause();
    sampleAudio.currentTime = 0;
    this.classList.remove('btn-danger');
    this.classList.add('btn-primary');
  }

  sampleAudio.addEventListener('ended', () => {
    this.classList.remove('btn-danger');
    this.classList.add('btn-primary');
  });
});

document.getElementById('record-protest').addEventListener('click', () => {
  recordProtest(packetName, questionNumber);
});

document.getElementById('start').addEventListener('click', next);

document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    return;
  }

  switch (event.key?.toLowerCase()) {
    case ' ':
      document.getElementById('buzz').click();
      // Prevent spacebar from scrolling the page
      if (event.target === document.body) { event.preventDefault(); }
      break;

    case 'n': return document.getElementById('next').click();
    case 's': return document.getElementById('start').click();
  }
});
