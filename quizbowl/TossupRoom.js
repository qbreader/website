import {
  ANSWER_TIME_LIMIT,
  DEAD_TIME_LIMIT,
  MODE_ENUM,
  TOSSUP_PROGRESS_ENUM,
} from "./constants.js";
import insertTokensIntoHTML from "./insert-tokens-into-html.js";
import QuestionRoom from "./QuestionRoom.js";

export const TossupRoomMixin = (QuestionRoomClass) =>
  class extends QuestionRoomClass {
    constructor(name, categoryManager, supportedQuestionTypes = ["tossup"]) {
      super(name, categoryManager, supportedQuestionTypes);

      this.timeoutID = null;
      /**
       * @type {string | null}
       * The userId of the player who buzzed in.
       * We should ensure that buzzedIn is null before calling any readQuestion.
       */
      this.buzzedIn = null;
      this.buzzes = [];
      this.buzzpointIndices = [];
      this.liveAnswer = "";
      this.paused = false;
      this.questionSplit = [];
      this.tossup = {};
      this.tossupProgress = TOSSUP_PROGRESS_ENUM.NOT_STARTED;
      this.wordIndex = 0;

      this.query = {
        ...this.query,
        powermarkOnly: false,
      };

      this.settings = {
        ...this.settings,
        rebuzz: false,
        stopOnPower: false,
        readingSpeed: 50,
      };

      this.previousTossup = {
        celerity: 0,
        endOfQuestion: false,
        isCorrect: true,
        inPower: false,
        negValue: -5,
        powerValue: 15,
        tossup: {},
        userId: null,
      };
    }

    async message(userId, message) {
      switch (message.type) {
        case "buzz":
          return this.buzz(userId, message);
        case "give-answer":
          return this.giveTossupAnswer(userId, message);
        case "next":
          return this.next(userId, message);
        case "pause":
          return this.pause(userId, message);
        case "set-reading-speed":
          return this.setReadingSpeed(userId, message);
        case "toggle-powermark-only":
          return this.togglePowermarkOnly(userId, message);
        case "toggle-rebuzz":
          return this.toggleRebuzz(userId, message);
        case "toggle-stop-on-power":
          return this.toggleStopOnPower(userId, message);
        default:
          return super.message(userId, message);
      }
    }

    buzz(userId) {
      if (!this.settings.rebuzz && this.buzzes.includes(userId)) {
        return;
      }
      if (this.tossupProgress !== TOSSUP_PROGRESS_ENUM.READING) {
        return;
      }

      const username = this.players[userId].username;
      if (this.buzzedIn) {
        return this.emitMessage({ type: "lost-buzzer-race", userId, username });
      }

      clearTimeout(this.timeoutID);
      this.buzzedIn = userId;
      this.buzzes.push(userId);
      this.buzzpointIndices.push(
        this.questionSplit.slice(0, this.wordIndex).join(" ").length,
      );
      this.paused = false;

      this.emitMessage({ type: "buzz", userId, username });
      this.emitMessage({ type: "update-question", word: "(#)" });

      this.startServerTimer(
        ANSWER_TIME_LIMIT * 10,
        (time) =>
          this.emitMessage({ type: "timer-update", timeRemaining: time }),
        () => this.giveTossupAnswer(userId, { givenAnswer: this.liveAnswer }),
      );
    }

    endCurrentTossup(userId) {
      if (this.buzzedIn) {
        return false;
      } // prevents skipping when someone has buzzed in
      if (this.queryingQuestion) {
        return false;
      }
      const isSkip = this.tossupProgress === TOSSUP_PROGRESS_ENUM.READING;
      if (isSkip && !this.settings.skip) {
        return false;
      }

      clearInterval(this.timer.interval);
      clearTimeout(this.timeoutID);
      this.emitMessage({ type: "timer-update", timeRemaining: 0 });

      this.buzzedIn = null;
      this.buzzes = [];
      this.buzzpointIndices = [];
      this.paused = false;

      if (this.tossupProgress !== TOSSUP_PROGRESS_ENUM.ANSWER_REVEALED) {
        this.revealTossupAnswer();
      }

      const starred =
        this.mode === MODE_ENUM.STARRED
          ? true
          : this.mode === MODE_ENUM.LOCAL
            ? false
            : null;
      this.emitMessage({
        type: "end-current-tossup",
        isSkip,
        starred,
        tossup: this.tossup,
      });
      return true;
    }

    giveTossupAnswer(userId, { givenAnswer }) {
      if (typeof givenAnswer !== "string") {
        return false;
      }
      if (this.buzzedIn !== userId) {
        return false;
      }

      this.liveAnswer = "";
      clearInterval(this.timer.interval);
      this.emitMessage({
        type: "timer-update",
        timeRemaining: ANSWER_TIME_LIMIT * 10,
      });

      if (Object.keys(this.tossup || {}).length === 0) {
        return;
      }

      const { celerity, directive, directedPrompt, points } = this.scoreTossup({
        givenAnswer,
      });

      switch (directive) {
        case "accept":
          this.buzzedIn = null;
          this.revealTossupAnswer();
          this.players[userId].updateStats(points, celerity);
          Object.values(this.players).forEach((player) => {
            player.tuh++;
          });
          break;
        case "reject":
          this.buzzedIn = null;
          this.players[userId].updateStats(points, celerity);
          if (
            !this.settings.rebuzz &&
            this.buzzes.length === Object.keys(this.sockets).length
          ) {
            this.revealTossupAnswer();
            Object.values(this.players).forEach((player) => {
              player.tuh++;
            });
          } else {
            this.readQuestion(Date.now());
          }
          break;
        case "prompt":
          this.startServerTimer(
            ANSWER_TIME_LIMIT * 10,
            (time) =>
              this.emitMessage({ type: "timer-update", timeRemaining: time }),
            () =>
              this.giveTossupAnswer(userId, { givenAnswer: this.liveAnswer }),
          );
      }

      this.emitMessage({
        type: "give-tossup-answer",
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

    async next(userId) {
      if (this.tossupProgress === TOSSUP_PROGRESS_ENUM.NOT_STARTED) {
        return await this.startNextTossup(userId);
      }
      const allowed = this.endCurrentTossup(userId);
      if (allowed) {
        await this.startNextTossup(userId);
      }
    }

    pause(userId) {
      if (this.buzzedIn) {
        return false;
      }
      if (this.tossupProgress === TOSSUP_PROGRESS_ENUM.ANSWER_REVEALED) {
        return false;
      }

      this.paused = !this.paused;
      if (this.paused) {
        clearTimeout(this.timeoutID);
        clearInterval(this.timer.interval);
      } else if (this.wordIndex >= this.questionSplit.length) {
        this.startServerTimer(
          this.timer.timeRemaining,
          (time) =>
            this.emitMessage({ type: "timer-update", timeRemaining: time }),
          () => this.revealTossupAnswer(),
        );
      } else {
        this.readQuestion(Date.now());
      }
      const username = this.players[userId].username;
      this.emitMessage({ type: "pause", paused: this.paused, username });
    }

    async readQuestion(expectedReadTime) {
      if (Object.keys(this.tossup || {}).length === 0) {
        return;
      }
      if (this.wordIndex >= this.questionSplit.length) {
        this.startServerTimer(
          DEAD_TIME_LIMIT * 10,
          (time) =>
            this.emitMessage({ type: "timer-update", timeRemaining: time }),
          () => this.revealTossupAnswer(),
        );
        return;
      }

      const word = this.questionSplit[this.wordIndex];

      // stop reading and start timer if power and stopOnPower is enabled
      if ((word === "(*)" || word === "[*]") && this.settings.stopOnPower) {
        this.startServerTimer(
          DEAD_TIME_LIMIT * 10,
          (time) =>
            this.emitMessage({ type: "timer-update", timeRemaining: time }),
          () => this.revealTossupAnswer(),
        );
        return;
      }

      this.wordIndex++;
      this.emitMessage({ type: "update-question", word });

      // calculate time needed before reading next word
      let time = Math.log(word.length) + 1;
      if (
        (word.endsWith(".") &&
          word.charCodeAt(word.length - 2) > 96 &&
          word.charCodeAt(word.length - 2) < 123) ||
        word.slice(-2) === ".\u201d" ||
        word.slice(-2) === "!\u201d" ||
        word.slice(-2) === "?\u201d"
      ) {
        time += 2.5;
      } else if (word.endsWith(",") || word.slice(-2) === ",\u201d") {
        time += 1.5;
      } else if (word === "(*)" || word === "[*]") {
        time = 0;
      }

      time = time * 0.9 * (140 - this.settings.readingSpeed);
      const delay = time - Date.now() + expectedReadTime;

      this.timeoutID = setTimeout(() => {
        this.readQuestion(time + expectedReadTime);
      }, delay);
    }

    revealTossupAnswer() {
      if (Object.keys(this.tossup || {}).length === 0) return;
      this.tossupProgress = TOSSUP_PROGRESS_ENUM.ANSWER_REVEALED;
      this.tossup.markedQuestion = insertTokensIntoHTML(
        this.tossup.question,
        this.tossup.question_sanitized,
        { " (#) ": this.buzzpointIndices },
      );
      this.emitMessage({
        type: "reveal-tossup-answer",
        question: insertTokensIntoHTML(
          this.tossup.question,
          this.tossup.question_sanitized,
          { " (#) ": this.buzzpointIndices },
        ),
        answer: this.tossup.answer,
      });
    }

    scoreTossup({ givenAnswer }) {
      const celerity =
        this.questionSplit.slice(this.wordIndex).join(" ").length /
        this.tossup.question.length;
      const endOfQuestion = this.wordIndex === this.questionSplit.length;
      const inPower =
        Math.max(
          this.questionSplit.indexOf("(*)"),
          this.questionSplit.indexOf("[*]"),
        ) >= this.wordIndex;
      const { directive, directedPrompt } = this.checkAnswer(
        this.tossup.answer,
        givenAnswer,
        this.settings.strictness,
      );
      const isCorrect = directive === "accept";
      const points = isCorrect
        ? inPower
          ? this.previousTossup.powerValue
          : 10
        : endOfQuestion
          ? 0
          : this.previousTossup.negValue;

      this.previousTossup = {
        ...this.previousTossup,
        celerity,
        endOfQuestion,
        inPower,
        isCorrect,
        tossup: this.tossup,
        userId: this.buzzedIn,
      };

      return {
        celerity,
        directive,
        directedPrompt,
        endOfQuestion,
        inPower,
        points,
      };
    }

    setReadingSpeed(userId, { readingSpeed }) {
      if (isNaN(readingSpeed)) {
        return false;
      }
      if (readingSpeed > 100) {
        readingSpeed = 100;
      }
      if (readingSpeed < 0) {
        readingSpeed = 0;
      }

      this.settings.readingSpeed = readingSpeed;
      const username = this.players[userId].username;
      this.emitMessage({ type: "set-reading-speed", username, readingSpeed });
    }

    async startNextTossup(userId) {
      const username = this.players[userId].username;
      this.tossup = await this.getNextQuestion("tossups");
      this.queryingQuestion = false;
      if (!this.tossup) {
        return;
      }
      this.emitMessage({
        type: "start-next-tossup",
        packetLength: this.packet.tossups.length,
        tossup: this.tossup,
        userId,
        username,
      });
      this.questionSplit = this.tossup.question_sanitized
        .split(" ")
        .filter((word) => word !== "");
      this.wordIndex = 0;
      this.tossupProgress = TOSSUP_PROGRESS_ENUM.READING;
      clearTimeout(this.timeoutID);
      this.readQuestion(Date.now());
    }

    togglePowermarkOnly(userId, { powermarkOnly }) {
      this.query.powermarkOnly = powermarkOnly;
      const username = this.players[userId].username;
      this.adjustQuery(["powermarkOnly"], [powermarkOnly]);
      this.emitMessage({
        type: "toggle-powermark-only",
        powermarkOnly,
        username,
      });
    }

    toggleRebuzz(userId, { rebuzz }) {
      this.settings.rebuzz = rebuzz;
      const username = this.players[userId].username;
      this.emitMessage({ type: "toggle-rebuzz", rebuzz, username });
    }

    toggleStopOnPower(userId, { stopOnPower }) {
      this.settings.stopOnPower = stopOnPower;
      const username = this.players[userId].username;
      this.emitMessage({ type: "toggle-stop-on-power", stopOnPower, username });
    }
  };

const TossupRoom = TossupRoomMixin(QuestionRoom);
export default TossupRoom;
