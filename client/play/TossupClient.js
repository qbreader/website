import addTossupGameCard from './tossups/add-tossup-game-card.js';
import QuestionClient from './QuestionClient.js';
import audio from '../audio/index.js';
import { MODE_ENUM } from '../../quizbowl/constants.js';

export const TossupClientMixin = (ClientClass) => class extends ClientClass {
	constructor(room, userId, socket) {
		super(room, userId, socket);
		attachEventListeners(room, socket);
	}

	onmessage(message) {
		const data = JSON.parse(message);
		switch (data.type) {
			case 'buzz': return this.buzz(data);
			case 'end-current-tossup': return this.endCurrentTossup(data);
			case 'give-tossup-answer': return this.giveTossupAnswer(data);
			case 'pause': return this.pause(data);
			case 'reveal-tossup-answer': return this.revealTossupAnswer(data);
			case 'set-reading-speed': return this.setReadingSpeed(data);
			case 'start-next-tossup': return this.startNextTossup(data);
			case 'toggle-powermark-only': return this.togglePowermarkOnly(data);
			case 'toggle-rebuzz': return this.toggleRebuzz(data);
			case 'toggle-stop-on-power': return this.toggleStopOnPower(data);
			case 'update-question': return this.updateQuestion(data);
			default: return super.onmessage(message);
		}
	}

	buzz({ userId }) {
		document.getElementById('buzz').disabled = true;
		document.getElementById('next').disabled = true;
		document.getElementById('pause').disabled = true;
		if (userId === this.USER_ID && audio.soundEffects) { audio.buzz.play(); }
	}

	endCurrentTossup({ starred, tossup }) {
		addTossupGameCard({ starred, tossup });
	}

	giveTossupAnswer({ directive, directedPrompt, score, userId }) {
		super.giveAnswer({ directive, directedPrompt, score, userId });

		if (directive !== 'prompt') {
			document.getElementById('next').disabled = false;
		}
	}

	pause({ paused }) {
		document.getElementById('pause').textContent = paused ? 'Resume' : 'Pause';
	}

	revealTossupAnswer({ answer, question }) {
		document.getElementById('question').innerHTML = question;
		document.getElementById('answer').innerHTML = 'ANSWER: ' + answer;
		document.getElementById('pause').disabled = true;
	}

	setMode({ mode }) {
		super.setMode({ mode });
		switch (mode) {
			case MODE_ENUM.SET_NAME:
				document.getElementById('toggle-powermark-only').disabled = true;
				document.getElementById('toggle-standard-only').disabled = true;
				break;
			case MODE_ENUM.RANDOM:
				document.getElementById('toggle-powermark-only').disabled = false;
				document.getElementById('toggle-standard-only').disabled = false;
				break;
		}
	}

	setReadingSpeed({ readingSpeed }) {
		document.getElementById('reading-speed').value = readingSpeed;
		document.getElementById('reading-speed-display').textContent = readingSpeed;
	}

	startNextTossup({ tossup, packetLength }) {
		this.startNextQuestion({ question: tossup, packetLength });
		document.getElementById('buzz').textContent = 'Buzz';
		document.getElementById('buzz').disabled = false;
		document.getElementById('pause').textContent = 'Pause';
		document.getElementById('pause').disabled = false;
		this.room.tossup = tossup;
	}

	togglePowermarkOnly({ powermarkOnly }) {
		document.getElementById('toggle-powermark-only').checked = powermarkOnly;
	}

	toggleRebuzz({ rebuzz }) {
		document.getElementById('toggle-rebuzz').checked = rebuzz;
	}

	toggleStopOnPower({ stopOnPower }) {
		document.getElementById('toggle-stop-on-power').checked = stopOnPower;
	}

	updateQuestion({ word }) {
		if (word === '(*)' || word === '[*]') { return; }
		document.getElementById('question').innerHTML += word + ' ';
	}
};

function attachEventListeners(room, socket) {
	document.getElementById('buzz').addEventListener('click', function() {
		this.blur();
		socket.sendToServer({ type: 'buzz' });
		socket.sendToServer({ type: 'give-answer-live-update', givenAnswer: '' });
	});

	document.getElementById('pause').addEventListener('click', function() {
		this.blur();
		const seconds = parseFloat(document.querySelector('.timer .face').textContent);
		const tenths = parseFloat(document.querySelector('.timer .fraction').textContent);
		const pausedTime = (seconds + tenths) * 10;
		socket.sendToServer({ type: 'pause', pausedTime });
	});

	document.getElementById('reading-speed').addEventListener('change', function() {
		socket.sendToServer({ type: 'set-reading-speed', readingSpeed: this.value });
	});

	document.getElementById('reading-speed').addEventListener('input', function() {
		document.getElementById('reading-speed-display').textContent = this.value;
	});

	document.getElementById('toggle-powermark-only').addEventListener('click', function() {
		this.blur();
		socket.sendToServer({ type: 'toggle-powermark-only', powermarkOnly: this.checked });
	});

	document.getElementById('toggle-rebuzz').addEventListener('click', function() {
		this.blur();
		socket.sendToServer({ type: 'toggle-rebuzz', rebuzz: this.checked });
	});

	document.getElementById('toggle-stop-on-power').addEventListener('click', function() {
		this.blur();
		socket.sendToServer({ type: 'toggle-stop-on-power', stopOnPower: this.checked });
	});
}

const TossupClient = TossupClientMixin(QuestionClient);
export default TossupClient;
