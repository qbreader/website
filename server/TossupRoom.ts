import checkAnswer from './checkAnswer.js';
import Player from './Player.js';
import RateLimit from './RateLimit.js';
import { HEADER, ENDC, OKBLUE, OKGREEN } from '../bcolors.js';
import { getSet, getRandomTossups } from '../database/questions.js';
import { DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR, PERMANENT_ROOMS } from '../constants.js';

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const rateLimiter = new RateLimit(50, 1000);

/**
 * @returns {Number} The number of points scored on a tossup.
 */
function scoreTossup({ isCorrect, inPower, endOfQuestion, isPace = false }) {
    const powerValue = isPace ? 20 : 15;
    const negValue = isPace ? 0 : -5;
    return isCorrect ? (inPower ? powerValue : 10) : (endOfQuestion ? 0 : negValue);
}

class TossupRoom {
    constructor(name, isPermanent = false) {
        this.name = name;
        this.isPermanent = isPermanent;

        this.players = {};
        this.sockets = {};

        this.timeoutID = null;
        this.buzzedIn = null;
        this.buzzes = [];
        this.paused = false;
        this.queryingQuestion = false;
        this.questionNumber = 0;
        this.questionProgress = 0; // 0 = not started, 1 = reading, 2 = answer revealed
        this.questionSplit = [];
        this.tossup = {};
        this.wordIndex = 0;

        this.randomQuestionCache = [];
        this.setCache = [];

        this.query = {
            difficulties: [4, 5],
            minYear: DEFAULT_MIN_YEAR,
            maxYear: DEFAULT_MAX_YEAR,
            packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
            setName: '2022 PACE NSC',
            categories: [],
            subcategories: [],
            reverse: true, // used for `database.getSet`
            powermarkOnly: false,
        };

        this.settings = {
            public: true,
            rebuzz: false,
            readingSpeed: 50,
            selectBySetName: false,
            skip: false,
        };

        this.rateLimitExceeded = new Set();
    }

    connection(socket, userId, username) {
        console.log(`Connection in room ${HEADER}${this.name}${ENDC} - userId: ${OKBLUE}${userId}${ENDC}, username: ${OKBLUE}${username}${ENDC} - with settings ${OKGREEN}${Object.keys(this.settings).map(key => [key, this.settings[key]].join(': ')).join('; ')};${ENDC}`);
        socket.on('message', message => {
            if (rateLimiter(socket) && !this.rateLimitExceeded.has(username)) {
                console.log(`Rate limit exceeded for ${OKBLUE}${username}${ENDC} in room ${HEADER}${this.name}${ENDC}`);
                this.rateLimitExceeded.add(username);
                return;
            }

            try {
                message = JSON.parse(message);
            } catch (error) {
                console.log(`Error parsing message: ${message}`);
                return;
            }
            this.message(userId, message);
        });

        socket.on('close', () => {
            if (this.buzzedIn === userId) {
                this.giveAnswer(userId, '');
                this.buzzedIn = null;
            }

            this.message(userId, {
                type: 'leave',
                userId: userId,
                username: username,
            });
        });

        this.sockets[userId] = socket;

        const isNew = !(userId in this.players);
        if (isNew) {
            this.createPlayer(userId);
        }
        this.players[userId].updateUsername(username);

        socket.send(JSON.stringify({
            type: 'connection-acknowledged',
            userId: userId,

            isPermanent: this.isPermanent,

            players: this.players,

            canBuzz: this.settings.rebuzz || !this.buzzes.includes(userId),
            buzzedIn: this.buzzedIn,
            tossup: this.tossup,
            questionProgress: this.questionProgress,

            difficulties: this.query.difficulties,
            minYear: this.query.minYear,
            maxYear: this.query.maxYear,
            packetNumbers: this.query.packetNumbers,
            setName: this.query.setName,
            validCategories: this.query.categories,
            validSubcategories: this.query.subcategories,

            public: this.settings.public,
            readingSpeed: this.settings.readingSpeed,
            rebuzz: this.settings.rebuzz,
            selectBySetName: this.settings.selectBySetName,
            skip: this.settings.skip,
        }));

        if (this.questionProgress > 0 && this.tossup?.question) {
            socket.send(JSON.stringify({
                type: 'update-question',
                word: this.questionSplit.slice(0, this.wordIndex).join(' '),
            }));
        }

        if (this.questionProgress === 2 && this.tossup?.answer) {
            socket.send(JSON.stringify({
                type: 'reveal-answer',
                answer: this.tossup.answer,
            }));
        }

        this.sendSocketMessage({
            type: 'join',
            isNew: isNew,
            userId: userId,
            username: username,
        });
    }

    async message(userId, message) {
        const type = message.type || '';

        switch (type) {
        case 'buzz':
            this.buzz(userId);
            break;

        case 'change-username':
            this.sendSocketMessage({
                type: 'change-username',
                userId: userId,
                oldUsername: this.players[userId].username,
                newUsername: message.username,
            });
            this.players[userId].updateUsername(message.username);
            break;

        case 'chat':
            this.sendSocketMessage({
                type: 'chat',
                username: this.players[userId].username,
                message: message.message,
                userId: userId,
            });
            break;

        case 'chat-live-update':
            this.sendSocketMessage({
                type: 'chat-live-update',
                username: this.players[userId].username,
                message: message.message,
                userId: userId,
            });
            break;

        case 'clear-stats':
            this.players[userId].clearStats();
            this.sendSocketMessage({
                type: 'clear-stats',
                userId: userId,
            });
            break;

        case 'difficulties':
            this.sendSocketMessage({
                type: 'difficulties',
                username: this.players[userId].username,
                value: message.value,
            });
            this.adjustQuery(['difficulties'], [message.value]);
            break;

        case 'give-answer':
            this.giveAnswer(userId, message.givenAnswer);
            break;

        case 'give-answer-live-update':
            this.sendSocketMessage({
                type: 'give-answer-live-update',
                username: this.players[userId].username,
                message: message.message,
            });
            break;

        case 'leave':
            // this.deletePlayer(userId);
            delete this.sockets[userId];
            this.sendSocketMessage(message);
            break;

        case 'next':
        case 'skip':
        case 'start':
            this.next(userId, type);
            break;

        case 'packet-number':
            this.adjustQuery(['packetNumbers'], [message.value]);
            this.sendSocketMessage({
                type: 'packet-number',
                username: this.players[userId].username,
                value: this.query.packetNumbers,
            });
            break;

        case 'pause':
            this.pause(userId);
            break;

        case 'reading-speed':
            this.settings.readingSpeed = message.value;
            this.sendSocketMessage({
                type: 'reading-speed',
                username: this.players[userId].username,
                value: this.settings.readingSpeed,
            });
            break;

        case 'set-name':
            this.sendSocketMessage({
                type: 'set-name',
                username: this.players[userId].username,
                value: message.value,
            });
            this.adjustQuery(['setName', 'packetNumbers'], [message.value, message.packetNumbers]);
            break;

        case 'toggle-powermark-only':
            this.query.powermarkOnly = message.powermarkOnly;
            this.sendSocketMessage({
                type: 'toggle-powermark-only',
                powermarkOnly: message.powermarkOnly,
                username: this.players[userId].username,
            });
            this.adjustQuery(['powermarkOnly'], [message.powermarkOnly]);
            break;

        case 'toggle-rebuzz':
            this.settings.rebuzz = message.rebuzz;
            this.sendSocketMessage({
                type: 'toggle-rebuzz',
                rebuzz: this.settings.rebuzz,
                username: this.players[userId].username,
            });
            break;

        case 'toggle-select-by-set-name':
            this.sendSocketMessage({
                type: 'toggle-select-by-set-name',
                selectBySetName: message.selectBySetName,
                setName: this.query.setName,
                username: this.players[userId].username,
            });
            this.settings.selectBySetName = message.selectBySetName;
            this.adjustQuery(['setName'], [message.setName]);
            break;

        case 'toggle-skip':
            this.settings.skip = message.skip;
            this.sendSocketMessage({
                type: 'toggle-skip',
                skip: this.settings.skip,
                username: this.players[userId].username,
            });
            break;

        case 'toggle-visibility':
            if (this.isPermanent)
                break;

            this.settings.public = message.public;
            this.sendSocketMessage({
                type: 'toggle-visibility',
                public: this.settings.public,
                username: this.players[userId].username,
            });
            break;

        case 'update-categories':
            this.sendSocketMessage({
                type: 'update-categories',
                categories: message.categories,
                subcategories: message.subcategories,
                username: this.players[userId].username,
            });
            this.adjustQuery(['categories', 'subcategories'], [message.categories, message.subcategories]);
            break;

        case 'year-range': {
            const minYear = isNaN(message.minYear) ? DEFAULT_MIN_YEAR : parseInt(message.minYear);
            const maxYear = isNaN(message.maxYear) ? DEFAULT_MAX_YEAR : parseInt(message.maxYear);
            this.sendSocketMessage({
                type: 'year-range',
                minYear: minYear,
                maxYear: maxYear,
            });
            this.adjustQuery(['minYear', 'maxYear'], [minYear, maxYear]);
            break;
        }
        }
    }

    adjustQuery(settings, values) {
        if (settings.length !== values.length)
            return;

        for (let i = 0; i < settings.length; i++) {
            const setting = settings[i];
            const value = values[i];
            if (Object.prototype.hasOwnProperty.call(this.query, setting)) {
                this.query[setting] = value;
            }
        }

        if (this.settings.selectBySetName) {
            this.questionNumber = 0;
            getSet(this.query).then(set => {
                this.setCache = set;
            });
        } else {
            getRandomTossups(this.query).then(tossups => {
                this.randomQuestionCache = tossups;
            });
        }
    }

    async advanceQuestion() {
        this.buzzedIn = null;
        this.buzzes = [];
        this.paused = false;
        this.queryingQuestion = true;
        this.wordIndex = 0;

        if (this.settings.selectBySetName) {
            if (this.setCache.length === 0) {
                this.sendSocketMessage({
                    type: 'end-of-set',
                });
                return false;
            } else {
                this.tossup = this.setCache.pop();
                this.questionNumber = this.tossup.questionNumber;
                this.query.packetNumbers = this.query.packetNumbers.filter(packetNumber => packetNumber >= this.tossup.packet.number);
            }
        } else {
            if (this.randomQuestionCache.length === 0) {
                this.randomQuestionCache = await getRandomTossups(this.query);
                if (this.randomQuestionCache.length === 0) {
                    this.tossup = {};
                    this.sendSocketMessage({
                        type: 'no-questions-found',
                    });
                    return false;
                }
            }

            this.tossup = this.randomQuestionCache.pop();
        }

        if (Object.prototype.hasOwnProperty.call(this.tossup, 'formatted_answer')) {
            this.tossup.answer = this.tossup.formatted_answer;
        }

        this.questionProgress = 1;
        this.questionSplit = this.tossup.question.split(' ').filter(word => word !== '');
        return true;
    }

    buzz(userId) {
        if (!this.settings.rebuzz && this.buzzes.includes(userId)) {
            return;
        }

        if (this.buzzedIn) {
            this.sendSocketMessage({
                type: 'lost-buzzer-race',
                userId: userId,
                username: this.players[userId].username,
            });
        } else {
            this.buzzedIn = userId;
            this.buzzes.push(userId);
            clearTimeout(this.timeoutID);
            this.sendSocketMessage({
                type: 'buzz',
                userId: userId,
                username: this.players[userId].username,
            });

            this.sendSocketMessage({
                type: 'update-question',
                word: '(#)',
            });
        }
    }

    createPlayer(userId) {
        this.players[userId] = new Player(userId);
    }

    deletePlayer(userId) {
        this.sendSocketMessage({
            type: 'leave',
            userId: userId,
            username: this.players[userId].username,
        });

        delete this.players[userId];
    }

    giveAnswer(userId, givenAnswer) {
        if (Object.keys(this.tossup).length === 0)
            return;

        this.buzzedIn = null;
        const celerity = this.questionSplit.slice(this.wordIndex).join(' ').length / this.tossup.question.length;
        const endOfQuestion = (this.wordIndex === this.questionSplit.length);
        const inPower = this.questionSplit.indexOf('(*)') >= this.wordIndex;
        const { directive, directedPrompt } = checkAnswer(this.tossup.answer, givenAnswer);
        const points = scoreTossup({
            isCorrect: directive === 'accept',
            inPower,
            endOfQuestion,
        });

        switch (directive) {
        case 'accept':
            this.revealQuestion();
            this.players[userId].updateStats(points, celerity);
            Object.values(this.players).forEach(player => { player.tuh++; });
            break;
        case 'reject':
            this.players[userId].updateStats(points, celerity);
            if (!this.settings.rebuzz && this.buzzes.length === Object.keys(this.sockets).length) {
                this.revealQuestion();
                Object.values(this.players).forEach(player => { player.tuh++; });
            } else {
                this.readQuestion(Date.now());
            }
            break;
        }

        this.sendSocketMessage({
            type: 'give-answer',
            userId,
            username: this.players[userId].username,
            givenAnswer,
            directive,
            directedPrompt,
            score: points,
            celerity: this.players[userId].celerity.correct.average,
            // the below fields are used to record buzzpoint data
            tossup: this.tossup,
            perQuestionCelerity: celerity,
        });
    }

    async next(userId, type) {
        if (this.queryingQuestion) return;
        if (this.questionProgress === 1 && !this.settings.skip) return;

        clearTimeout(this.timeoutID);

        if (this.questionProgress !== 2) {
            this.revealQuestion();
        }

        const hasNextQuestion = await this.advanceQuestion();

        this.queryingQuestion = false;

        if (!hasNextQuestion) return;

        this.sendSocketMessage({
            type: type,
            userId: userId,
            username: this.players[userId].username,
            tossup: this.tossup,
        });
        this.readQuestion(Date.now());
    }

    pause(userId) {
        this.paused = !this.paused;

        if (this.paused) {
            clearTimeout(this.timeoutID);
        } else {
            this.readQuestion(Date.now());
        }

        this.sendSocketMessage({
            type: 'pause',
            paused: this.paused,
            username: this.players[userId].username,
        });
    }

    async readQuestion(expectedReadTime) {
        if (Object.keys(this.tossup).length === 0) return;
        if (this.wordIndex >= this.questionSplit.length) {
            return;
        }

        const word = this.questionSplit[this.wordIndex];
        this.wordIndex++;

        this.sendSocketMessage({
            type: 'update-question',
            word: word,
        });

        // calculate time needed before reading next word
        let time = Math.log(word.length) + 1;
        if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123)
        || word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d') {
            time += 2;
        } else if (word.endsWith(',') || word.slice(-2) === ',\u201d') {
            time += 0.75;
        } else if (word === '(*)') {
            time = 0;
        }

        time = time * 0.9 * (125 - this.settings.readingSpeed);
        const delay = time - Date.now() + expectedReadTime;

        this.timeoutID = setTimeout(() => {
            this.readQuestion(time + expectedReadTime);
        }, delay);
    }

    revealQuestion() {
        if (Object.keys(this.tossup).length === 0) return;

        const remainingQuestion = this.questionSplit.slice(this.wordIndex).join(' ');
        this.sendSocketMessage({
            type: 'update-question',
            word: remainingQuestion,
        });

        this.sendSocketMessage({
            type: 'reveal-answer',
            answer: this.tossup.answer,
        });

        this.wordIndex = this.questionSplit.length;
        this.questionProgress = 2;
    }

    sendSocketMessage(message) {
        message = JSON.stringify(message);
        for (const socket of Object.values(this.sockets)) {
            socket.send(message);
        }
    }
}

const tossupRooms = {};

for (const roomName of PERMANENT_ROOMS) {
    tossupRooms[roomName] = new TossupRoom(roomName, true);
}


/**
 * Returns the room with the given room name.
 * If the room does not exist, it is created.
 * @param {String} roomName
 * @returns {TossupRoom}
 */
function createAndReturnRoom(roomName) {
    roomName = DOMPurify.sanitize(roomName);

    if (!Object.prototype.hasOwnProperty.call(tossupRooms, roomName)) {
        tossupRooms[roomName] = new TossupRoom(roomName, false);
    }

    return tossupRooms[roomName];
}


export { createAndReturnRoom, tossupRooms };
