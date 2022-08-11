const uuid = require('uuid');

const database = require('./database');
const Player = require('./players');
const quizbowl = require('./quizbowl');

class Room {
    constructor(name) {
        this.name = name;

        this.players = {};
        this.sockets = {};

        this.tossup = {};
        this.questionNumber = 0;
        this.questionProgress = 0, // 0 = not started, 1 = reading, 2 = answer reveale;
        this.wordIndex = 0;

        this.difficulties = [4, 5];
        this.setName = '2022 PACE NSC';
        this.packetNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
        this.packetNumber = 1;
        this.readingSpeed = 50;
        this.validCategories = [];
        this.validSubcategories = [];
        this.endOfSet = false;
        this.public = true;
        this.allowMultipleBuzzes = true;
        this.selectByDifficulty = true;
        this.paused = false;
        this.buzzTimeout = null;
        this.buzzedIn = false;
    }

    connection(socket, userId, username) {
        console.log(`User with userId ${userId} and username ${username} connected in room ${this.name}`);

        this.sockets[userId] = socket;

        socket.on('message', message => {
            message = JSON.parse(message);
            this.message(message, userId);
        });

        const isNew = !(userId in this.players);
        if (isNew) {
            this.createPlayer(userId);
        }

        this.players[userId].updateUsername(username);

        socket.send(JSON.stringify({
            type: 'connection-acknowledged',
            players: this.players,
            userId: userId,
            difficulties: this.difficulties,
            validCategories: this.validCategories,
            validSubcategories: this.validSubcategories,
            setName: this.setName,
            packetNumbers: this.packetNumbers,
            packetNumber: this.packetNumber,
            questionNumber: this.questionNumber,
            readingSpeed: this.readingSpeed,
            public: this.public,
            allowMultipleBuzzes: this.allowMultipleBuzzes,
            questionProgress: this.questionProgress
        }));

        this.sendSocketMessage({
            type: 'join',
            isNew: isNew,
            userId: userId,
            username: username,
        });

        if (this.questionProgress > 0) {
            socket.send(JSON.stringify({
                type: 'update-question',
                word: this.tossup.question.split(' ').slice(0, this.wordIndex).join(' ')
            }));
        }

        if (this.questionProgress === 2) {
            socket.send(JSON.stringify({
                type: 'update-answer',
                answer: this.tossup.answer
            }));
        }
    }

    message(message, userId) {
        let type = message.type || '';
        if (type === 'buzz') {
            this.buzz(userId);
        }

        if (type === 'change-username' || type === 'join') {
            this.sendSocketMessage({
                type: 'change-username',
                userId: userId,
                oldUsername: this.players[userId].username,
                newUsername: message.username
            });
            this.players[userId].username = message.username;
        }

        if (type === 'chat') {
            this.chat(userId, message.message);
        }

        if (type === 'clear-stats') {
            this.players[userId].clearStats();
            this.sendSocketMessage(message);
        }
        
        if (type === 'difficulties') {
            this.difficulties = message.value;
            this.sendSocketMessage(message);
        }

        if (type === 'give-answer') {
            this.giveAnswer(userId, message.givenAnswer, message.celerity);
        }

        if (type === 'leave') {
            // this.deletePlayer(userId);
            this.sendSocketMessage(message);
        }

        if (type === 'next' || type === 'skip') {
            this.next(userId);
        }

        if (type === 'start') {
            this.start(userId);
        }

        if (type === 'packet-number') {
            this.packetNumbers = message.value;
            this.packetNumber = message.value[0];
            this.questionNumber = -1;
            this.sendSocketMessage(message);
        }

        if (type === 'pause') {
            this.pause(userId);
        }
        
        if (type === 'reading-speed') {
            this.readingSpeed = message.value;
            this.sendSocketMessage(message);
        }
        
        if (type === 'set-name') {
            this.setName = message.value;
            this.questionNumber = -1;
            this.sendSocketMessage(message);
        }
        
        if (type === 'toggle-multiple-buzzes') {
            this.allowMultipleBuzzes = message.allowMultipleBuzzes;
            this.sendSocketMessage(message);
        }
        
        if (type === 'toggle-select-by-difficulty') {
            this.selectByDifficulty = message.selectByDifficulty;
            this.setName = message.setName;
            this.questionNumber = -1;
            this.sendSocketMessage(message);
        }

        if (type === 'toggle-visibility') {
            this.public = message.public;
            this.sendSocketMessage(message);
        }
        
        if (type === 'update-categories') {
            this.validCategories = message.categories;
            this.validSubcategories = message.subcategories;
            this.sendSocketMessage(message);
        }
    }

    async advanceQuestion() {
        if (this.selectByDifficulty) {
            this.tossup = await database.getRandomQuestion(
                'tossup',
                this.difficulties,
                this.validCategories,
                this.validSubcategories
            );
            this.setName = this.tossup.setName;
        } else {
            this.tossup = await database.getNextQuestion(
                this.setName,
                this.packetNumbers,
                this.questionNumber,
                this.validCategories,
                this.validSubcategories
            );
        }

        this.endOfSet = Object.keys(this.tossup).length === 0;

        this.questionProgress = 1;
        this.packetNumbers = this.packetNumbers.filter(packetNumber => packetNumber >= this.tossup.packetNumber);
        this.packetNumber = this.tossup.packetNumber;
        this.questionNumber = this.tossup.questionNumber;
        this.wordIndex = 0;
        this.buzzedIn = false;
    }

    buzz(userId) {
        if (this.buzzedIn) {
            this.sendSocketMessage({
                type: 'lost-buzzer-race',
                userId: userId,
                username: this.players[userId].username
            });
        } else {
            this.buzzedIn = true;
            clearTimeout(this.buzzTimeout);
            this.sendSocketMessage({
                type: 'buzz',
                userId: userId,
                username: this.players[userId].username
            });

            this.sendSocketMessage({
                type: 'update-question',
                word: '(#)'
            });
        }
    }

    chat(userId, message) {
        this.sendSocketMessage({
            type: 'chat',
            userId: userId,
            username: this.players[userId].username,
            message: message
        });
    }

    createPlayer(userId) {
        this.players[userId] = new Player(userId);
    }

    currentQuestion() {
        return {
            endOfSet: this.endOfSet,
            question: this.tossup,
            packetNumber: this.packetNumber,
            questionNumber: this.questionNumber,
            setName: this.setName,
        };
    }

    deletePlayer(userId) {            
        this.sendSocketMessage({
            type: 'leave',
            userId: userId,
            username: this.players[userId].username
        });

        delete this.players[userId];
    }

    giveAnswer(userId, givenAnswer, celerity) {
        this.buzzedIn = false;
        let endOfQuestion = (this.wordIndex === this.tossup.question.split(' ').length);
        let inPower = this.tossup.question.includes('(*)') && !this.tossup.question.split(' ').slice(0, this.wordIndex).join(' ').includes('(*)');
        let points = quizbowl.scoreTossup(this.tossup.answer, givenAnswer, inPower, endOfQuestion);

        if (points > 0) {
            this.revealQuestion();
            this.questionProgress = 2;
            Object.values(this.players).forEach(player => { player.tuh++; });
        } else {
            this.updateQuestion();
        }

        this.players[userId].updateStats(points, celerity);

        this.sendSocketMessage({
            type: 'give-answer',
            userId: userId,
            username: this.players[userId].username,
            givenAnswer: givenAnswer,
            score: points,
            celerity: celerity
        });
    }

    next(userId) {
        clearTimeout(this.buzzTimeout);
        this.revealQuestion();
        this.advanceQuestion().then(() => {
            this.sendSocketMessage({
                type: 'next',
                userId: userId,
                username: this.players[userId].username,
                tossup: this.tossup
            });
            this.paused = false;
            this.updateQuestion();
        });
    }

    pause(userId) {
        this.paused = !this.paused;

        if (this.paused) {
            clearTimeout(this.buzzTimeout);
        } else {
            this.updateQuestion();
        }

        this.sendSocketMessage({
            type: 'pause',
            paused: this.paused,
            userId: userId,
            username: this.players[userId].username
        });
    }

    revealQuestion() {
        let remainingQuestion = this.tossup.question.split(' ').slice(this.wordIndex).join(' ');
        this.sendSocketMessage({
            type: 'update-question',
            word: remainingQuestion
        });

        this.sendSocketMessage({
            type: 'update-answer',
            answer: this.tossup.answer
        });

        this.wordIndex = this.tossup.question.split(' ').length;
    }

    sendSocketMessage(message) {
        for (const socket of Object.values(this.sockets)) {
            socket.send(JSON.stringify(message));
        }
    }

    start(userId) {
        this.advanceQuestion().then(() => {
            this.sendSocketMessage({
                type: 'start',
                userId: userId,
                username: this.players[userId].username,
                tossup: this.tossup
            });
            this.updateQuestion();
        });
    }

    updateQuestion() {
        let questionSplit = this.tossup.question.split(' ');
        if (this.wordIndex >= questionSplit.length) {
            return;
        }

        let word = questionSplit[this.wordIndex];
        this.wordIndex++;

        // calculate time needed before reading next word
        let time = Math.log(word.length) + 1;
        if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123)
            || word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d')
            time += 2;
        else if (word.endsWith(',') || word.slice(-2) === ',\u201d')
            time += 0.75;
        else if (word === "(*)")
            time = 0;

        this.sendSocketMessage({
            type: 'update-question',
            word: word
        });

        this.buzzTimeout = setTimeout(() => {
            this.updateQuestion();
        }, time * 0.9 * (125 - this.readingSpeed));
    }
}

module.exports = Room;