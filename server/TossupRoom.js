import Player from './Player.js';
import RateLimit from './RateLimit.js';

import { HEADER, ENDC, OKBLUE, OKGREEN } from '../bcolors.js';
import { DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR, PERMANENT_ROOMS, ROOM_NAME_MAX_LENGTH } from '../constants.js';
import getRandomTossups from '../database/qbreader/get-random-tossups.js';
import getSet from '../database/qbreader/get-set.js';

import { insertTokensIntoHTML } from '../client/utilities/insert-tokens-into-html.js';

import checkAnswer from 'qb-answer-checker';

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const rateLimiter = new RateLimit(50, 1000);

const QuestionProgressEnum = Object.freeze({
    NOT_STARTED: 0,
    READING: 1,
    ANSWER_REVEALED: 2,
});

/**
 * @returns {Number} The number of points scored on a tossup.
 */
function scoreTossup({ isCorrect, inPower, endOfQuestion, isPace = false }) {
    const powerValue = isPace ? 20 : 15;
    const negValue = isPace ? 0 : -5;
    return isCorrect ? (inPower ? powerValue : 10) : (endOfQuestion ? 0 : negValue);
}

class TossupRoom {
    constructor(name, isPermanent = false, categories = [], subcategories = [], alternateSubcategories = []) {
        this.name = name;
        this.isPermanent = isPermanent;

        /**
         * @type {Object.<string, Player>}
         */
        this.players = {};
        this.sockets = {};

        this.timeoutID = null;
        this.buzzedIn = null;
        this.buzzes = [];
        this.buzzpointIndices = [];
        this.liveAnswer = '';
        this.paused = false;
        this.queryingQuestion = false;
        this.questionNumber = 0;
        this.questionProgress = QuestionProgressEnum.NOT_STARTED;
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
            setName: '2023 PACE NSC',
            alternateSubcategories: alternateSubcategories,
            categories: categories,
            subcategories: subcategories,
            reverse: true, // used for `database.getSet`
            powermarkOnly: false,
            standardOnly: false,
        };

        this.settings = {
            lock: false,
            public: true,
            rebuzz: false,
            readingSpeed: 50,
            selectBySetName: false,
            skip: false,
            timer: true,
        };

        this.rateLimitExceeded = new Set();

        this.timerInterval = null;
        this.timeRemaining = 0;

        this.DEAD_TIME_LIMIT = 5; // time to buzz after question is read
        this.ANSWER_TIME_LIMIT = 10; // time to give answer after buzzing
    }

    connection(socket, userId, username) {
        const isNew = !(userId in this.players);
        if (isNew) {
            this.createPlayer(userId);
        }
        username = this.players[userId].updateUsername(username);
        this.players[userId].isOnline = true;

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

        socket.send(JSON.stringify({
            type: 'connection-acknowledged',
            userId: userId,

            isPermanent: this.isPermanent,

            players: this.players,

            canBuzz: this.settings.rebuzz || !this.buzzes.includes(userId),
            buzzedIn: this.buzzedIn,
            questionProgress: this.questionProgress,

            public: this.settings.public,
            readingSpeed: this.settings.readingSpeed,
            rebuzz: this.settings.rebuzz,
            selectBySetName: this.settings.selectBySetName,
            skip: this.settings.skip,
            timer: this.settings.timer,
        }));

        socket.send(JSON.stringify({
            type: 'connection-acknowledged-query',
            ...this.query,
        }));

        socket.send(JSON.stringify({
            type: 'connection-acknowledged-tossup',
            tossup: this.tossup,
        }));

        if (this.questionProgress === QuestionProgressEnum.READING) {
            socket.send(JSON.stringify({
                type: 'update-question',
                word: this.questionSplit.slice(0, this.wordIndex).join(' '),
            }));
        }

        if (this.questionProgress === QuestionProgressEnum.ANSWER_REVEALED && this.tossup?.answer) {
            socket.send(JSON.stringify({
                type: 'reveal-answer',
                question: insertTokensIntoHTML(this.tossup.question, this.tossup.question_sanitized, [this.buzzpointIndices], [' (#) ']),
                answer: this.tossup.answer,
            }));
        }

        this.sendSocketMessage({
            type: 'join',
            isNew: isNew,
            userId: userId,
            username: username,
            user: this.players[userId],
        });
    }

    async message(userId, message) {
        const type = message.type || '';

        switch (type) {
        case 'buzz':
            this.buzz(userId);
            break;

        case 'change-username': {
            const oldUsername = this.players[userId].username;
            const newUsername = this.players[userId].updateUsername(message.username);
            this.sendSocketMessage({
                type: 'change-username',
                userId: userId,
                oldUsername: oldUsername,
                newUsername: newUsername,
            });
            break;
        }

        case 'chat':
            // prevent chat messages if room is public, since they can still be sent with API
            // also done in next event
            if (this.settings.public)
                return;

            this.sendSocketMessage({
                type: 'chat',
                username: this.players[userId].username,
                message: message.message,
                userId: userId,
            });
            break;

        case 'chat-live-update':
            if (this.settings.public)
                return;

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
            if (message.value.some((value) => typeof value !== 'number' || isNaN(value) || value < 1 || value > 10)) {
                return;
            }

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
            this.liveAnswer = message.message;
            this.sendSocketMessage({
                type: 'give-answer-live-update',
                username: this.players[userId].username,
                message: message.message,
            });
            break;

        case 'leave':
            // this.deletePlayer(userId);
            this.players[userId].isOnline = false;
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
            this.pause(userId, message.pausedTime);
            break;

        case 'reading-speed':
            if (isNaN(message.value) || message.value > 100 || message.value < 0)
                return;

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

        case 'toggle-lock':
            if (this.settings.public) {
                return;
            }

            this.settings.lock = message.lock;
            this.sendSocketMessage({
                type: 'toggle-lock',
                lock: this.settings.lock,
                username: this.players[userId].username,
            });
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
            if (this.isPermanent) {
                break;
            }

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

        case 'toggle-standard-only':
            this.query.standardOnly = message.standardOnly;
            this.sendSocketMessage({
                type: 'toggle-standard-only',
                standardOnly: message.standardOnly,
                username: this.players[userId].username,
            });
            this.adjustQuery(['standardOnly'], [message.standardOnly]);
            break;

        case 'toggle-timer':
            if (this.settings.public) {
                return;
            }

            this.settings.timer = message.timer;
            this.sendSocketMessage({
                type: 'toggle-timer',
                timer: this.settings.timer,
                username: this.players[userId].username,
            });
            break;

        case 'toggle-visibility':
            if (this.isPermanent)
                break;

            this.settings.public = message.public;
            this.settings.timer = true;
            this.sendSocketMessage({
                type: 'toggle-visibility',
                public: this.settings.public,
                username: this.players[userId].username,
            });
            break;

        case 'update-categories':
            if (this.isPermanent) {
                break;
            }

            this.sendSocketMessage({
                type: 'update-categories',
                categories: message.categories,
                subcategories: message.subcategories,
                alternateSubcategories: message.alternateSubcategories,
                username: this.players[userId].username,
            });
            this.adjustQuery(['categories', 'subcategories', 'alternateSubcategories'], [message.categories, message.subcategories, message.alternateSubcategories]);
            break;

        case 'year-range': {
            const minYear = isNaN(message.minYear) ? DEFAULT_MIN_YEAR : parseInt(message.minYear);
            const maxYear = isNaN(message.maxYear) ? DEFAULT_MAX_YEAR : parseInt(message.maxYear);

            if (maxYear < minYear)
                return this.sendSocketMessage({
                    type: 'year-range',
                    minYear: this.query.minYear,
                    maxYear: this.query.maxYear,
                });

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
        this.buzzpointIndices = [];
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
                this.questionNumber = this.tossup.number;
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

        this.questionProgress = QuestionProgressEnum.READING;
        this.questionSplit = this.tossup.question_sanitized.split(' ').filter(word => word !== '');
        return true;
    }

    buzz(userId) {
        if (!this.settings.rebuzz && this.buzzes.includes(userId)) {
            return;
        }

        clearTimeout(this.timeoutID);

        if (this.buzzedIn) {
            this.sendSocketMessage({
                type: 'lost-buzzer-race',
                userId: userId,
                username: this.players[userId].username,
            });
            return;
        }

        this.buzzedIn = userId;
        this.buzzes.push(userId);
        this.buzzpointIndices.push(this.questionSplit.slice(0, this.wordIndex).join(' ').length);
        this.sendSocketMessage({
            type: 'buzz',
            userId: userId,
            username: this.players[userId].username,
        });

        this.sendSocketMessage({
            type: 'update-question',
            word: '(#)',
        });

        this.startServerTimer(this.ANSWER_TIME_LIMIT * 10, () => {
            this.giveAnswer(userId, this.liveAnswer);
        });
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
        this.liveAnswer = '';
        clearInterval(this.timerInterval);
        this.sendSocketMessage({
            type: 'timer-update',
            timeRemaining: this.ANSWER_TIME_LIMIT * 10,
        });

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
        case 'prompt':
            this.startServerTimer(this.ANSWER_TIME_LIMIT * 10, () => {
                this.giveAnswer(userId, this.liveAnswer);
            });
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
        if (this.questionProgress === QuestionProgressEnum.READING && !this.settings.skip) return;
        if (type === 'skip' && this.wordIndex < 5) return; // prevents spam-skipping bots

        clearTimeout(this.timeoutID);

        if (this.questionProgress !== QuestionProgressEnum.ANSWER_REVEALED) {
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
            clearInterval(this.timerInterval);
        } else if (this.wordIndex >= this.questionSplit.length) {
            this.startServerTimer(this.timeRemaining, this.revealQuestion.bind(this));
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
            this.startServerTimer(this.DEAD_TIME_LIMIT * 10, this.revealQuestion.bind(this));
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

        this.questionProgress = QuestionProgressEnum.ANSWER_REVEALED;
        this.sendSocketMessage({
            type: 'reveal-answer',
            question: insertTokensIntoHTML(this.tossup.question, this.tossup.question_sanitized, [this.buzzpointIndices], [' (#) ']),
            answer: this.tossup.answer,
        });
    }

    sendSocketMessage(message) {
        message = JSON.stringify(message);
        for (const socket of Object.values(this.sockets)) {
            socket.send(message);
        }
    }

    /**
     *
     * @param {number} time
     * @param {Function} callback - called when timer is up
     * @returns
     */
    startServerTimer(time, callback) {
        if (this.settings.timer === false) {
            return;
        }

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timeRemaining = time;

        this.timerInterval = setInterval(() => {
            if (this.timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                callback();
            }

            this.sendSocketMessage({
                type: 'timer-update',
                timeRemaining: this.timeRemaining,
            });
            this.timeRemaining--;
        }, 100);
    }
}

const tossupRooms = {};

for (const room of PERMANENT_ROOMS) {
    const { name, categories, subcategories } = room;
    tossupRooms[name] = new TossupRoom(name, true, categories, subcategories);
}


/**
 * Returns the room with the given room name.
 * If the room does not exist, it is created.
 * @param {String} roomName
 * @returns {TossupRoom}
 */
function createAndReturnRoom(roomName, isPrivate = false) {
    roomName = DOMPurify.sanitize(roomName);
    roomName = roomName?.substring(0, ROOM_NAME_MAX_LENGTH) ?? '';

    if (!Object.prototype.hasOwnProperty.call(tossupRooms, roomName)) {
        const newRoom = new TossupRoom(roomName, false);
        newRoom.settings.public = !isPrivate;
        tossupRooms[roomName] = newRoom;
    }

    return tossupRooms[roomName];
}


export { createAndReturnRoom, tossupRooms };
