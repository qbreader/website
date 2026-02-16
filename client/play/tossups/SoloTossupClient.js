import { MODE_ENUM } from "../../../quizbowl/constants.js";
import questionStats from "../../scripts/auth/question-stats.js";
import upsertPlayerItem from "../upsert-player-item.js";
import TossupClient from "../TossupClient.js";

const modeVersion = "2025-01-14";
const queryVersion = "2025-05-07";
const settingsVersion = "2024-11-02";

export default class SoloTossupClient extends TossupClient {
  constructor(room, userId, socket, aiBot) {
    console.log("SoloTossupClient constructor called");
    super(room, userId, socket);
    this.aiBot = aiBot;
  }

  onmessage(message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case "clear-stats":
        return this.clearStats(data);
      case "toggle-ai-mode":
        return this.toggleAiMode(data);
      case "toggle-correct":
        return this.toggleCorrect(data);
      case "toggle-type-to-answer":
        return this.toggleTypeToAnswer(data);
      default:
        return super.onmessage(message);
    }
  }

  buzz({ timer, userId, username }) {
    if (userId !== this.USER_ID) {
      return;
    }

    super.buzz({ userId });

    if (this.room.settings.typeToAnswer) {
      document.getElementById("answer-input-group").classList.remove("d-none");
      document.getElementById("answer-input").focus();
    } else {
      document.getElementById("buzz").disabled = false;
      document.getElementById("buzz").textContent = "Reveal";
    }
  }

  clearStats({ userId }) {
    this.updateStatDisplay(this.room.players[userId]);
  }

  endCurrentTossup({ isSkip, starred, tossup }) {
    super.endCurrentTossup({ starred, tossup });
    if (
      !isSkip &&
      this.room.previousTossup.userId === this.USER_ID &&
      this.room.mode !== MODE_ENUM.LOCAL
    ) {
      const previous = this.room.previousTossup;
      const pointValue = previous.isCorrect
        ? previous.inPower
          ? previous.powerValue
          : 10
        : previous.endOfQuestion
          ? 0
          : previous.negValue;
      questionStats.recordTossup({
        _id: previous.tossup._id,
        celerity: previous.celerity,
        isCorrect: previous.isCorrect,
        multiplayer: false,
        pointValue,
      });
    }
  }

  async giveTossupAnswer({
    directive,
    directedPrompt,
    perQuestionCelerity,
    score,
    tossup,
    userId,
  }) {
    super.giveTossupAnswer({ directive, directedPrompt, score, userId });

    if (directive === "prompt") {
      return;
    }

    if (userId === this.USER_ID) {
      this.updateStatDisplay(this.room.players[this.USER_ID]);
    } else if (this.aiBot.active) {
      upsertPlayerItem(this.aiBot.player);
    }

    if (this.room.settings.rebuzz && directive === "reject") {
      document.getElementById("buzz").disabled = false;
      document.getElementById("buzz").textContent = "Buzz";
      document.getElementById("pause").disabled = false;
    }
  }

  async startNextTossup({ packetLength, tossup }) {
    super.startNextTossup({ tossup, packetLength });
    document.getElementById("next").disabled = false;
    document.getElementById("toggle-correct").textContent = "I was wrong";
    document.getElementById("toggle-correct").classList.add("d-none");
    document.getElementById("next").textContent = "Skip";
  }

  revealTossupAnswer({ answer, question }) {
    super.revealTossupAnswer({ answer, question });

    document.getElementById("buzz").disabled = true;
    document.getElementById("buzz").textContent = "Buzz";
    document.getElementById("next").disabled = false;
    document.getElementById("next").textContent = "Next";

    document.getElementById("toggle-correct").classList.remove("d-none");
    document.getElementById("toggle-correct").textContent = this.room
      .previousTossup.isCorrect
      ? "I was wrong"
      : "I was right";
  }

  setCategories({
    alternateSubcategories,
    categories,
    subcategories,
    percentView,
    categoryPercents,
  }) {
    super.setCategories();
    window.localStorage.setItem(
      "singleplayer-tossup-query",
      JSON.stringify({ ...this.room.query, version: queryVersion }),
    );
  }

  setDifficulties({ difficulties }) {
    window.localStorage.setItem(
      "singleplayer-tossup-query",
      JSON.stringify({ ...this.room.query, version: queryVersion }),
    );
  }

  setMaxYear({ maxYear }) {
    super.setMaxYear({ maxYear });
    window.localStorage.setItem(
      "singleplayer-tossup-query",
      JSON.stringify({ ...this.room.query, version: queryVersion }),
    );
  }

  setMinYear({ minYear }) {
    super.setMinYear({ minYear });
    window.localStorage.setItem(
      "singleplayer-tossup-query",
      JSON.stringify({ ...this.room.query, version: queryVersion }),
    );
  }

  setPacketNumbers({ packetNumbers }) {
    super.setPacketNumbers({ packetNumbers });
    window.localStorage.setItem(
      "singleplayer-tossup-query",
      JSON.stringify({ ...this.room.query, version: queryVersion }),
    );
  }

  setReadingSpeed({ readingSpeed }) {
    super.setReadingSpeed({ readingSpeed });
    window.localStorage.setItem(
      "singleplayer-tossup-settings",
      JSON.stringify({ ...this.room.settings, version: settingsVersion }),
    );
  }

  async setSetName({ setName, setLength }) {
    super.setSetName({ setName, setLength });
    window.localStorage.setItem(
      "singleplayer-tossup-query",
      JSON.stringify({ ...this.room.query, version: queryVersion }),
    );
  }

  setStrictness({ strictness }) {
    super.setStrictness({ strictness });
    window.localStorage.setItem(
      "singleplayer-tossup-settings",
      JSON.stringify({ ...this.room.settings, version: settingsVersion }),
    );
  }

  toggleAiMode({ aiMode }) {
    if (aiMode) {
      upsertPlayerItem(this.aiBot.player);
    }

    this.aiBot.active = aiMode;
    document.getElementById("ai-settings").disabled = !aiMode;
    document.getElementById("toggle-ai-mode").checked = aiMode;
    document
      .getElementById("player-list-group")
      .classList.toggle("d-none", !aiMode);
    document
      .getElementById("player-list-group-hr")
      .classList.toggle("d-none", !aiMode);
    window.localStorage.setItem(
      "singleplayer-tossup-settings",
      JSON.stringify({ ...this.room.settings, version: settingsVersion }),
    );
  }

  toggleCorrect({ correct, userId }) {
    this.updateStatDisplay(this.room.players[this.USER_ID]);
    document.getElementById("toggle-correct").textContent = correct
      ? "I was wrong"
      : "I was right";
  }

  togglePowermarkOnly({ powermarkOnly }) {
    super.togglePowermarkOnly({ powermarkOnly });
    window.localStorage.setItem(
      "singleplayer-tossup-query",
      JSON.stringify({ ...this.room.query, version: queryVersion }),
    );
  }

  toggleRebuzz({ rebuzz }) {
    super.toggleRebuzz({ rebuzz });
    window.localStorage.setItem(
      "singleplayer-tossup-settings",
      JSON.stringify({ ...this.room.settings, version: settingsVersion }),
    );
  }

  toggleStopOnPower({ stopOnPower }) {
    console.log("SoloTossupClient.toggleStopOnPower called");
    super.toggleStopOnPower({ stopOnPower });
    window.localStorage.setItem(
      "singleplayer-tossup-settings",
      JSON.stringify({ ...this.room.settings, version: settingsVersion }),
    );
  }

  setMode({ mode }) {
    switch (mode) {
      case MODE_ENUM.SET_NAME:
        document
          .getElementById("local-packet-settings")
          .classList.add("d-none");
        break;
      case MODE_ENUM.RANDOM:
        document
          .getElementById("local-packet-settings")
          .classList.add("d-none");
        break;
      case MODE_ENUM.STARRED:
        document.getElementById("difficulty-settings").classList.add("d-none");
        document
          .getElementById("local-packet-settings")
          .classList.add("d-none");
        document.getElementById("set-settings").classList.add("d-none");
        document.getElementById("toggle-powermark-only").disabled = true;
        document.getElementById("toggle-standard-only").disabled = true;
        break;
      case MODE_ENUM.LOCAL:
        document.getElementById("difficulty-settings").classList.add("d-none");
        document
          .getElementById("local-packet-settings")
          .classList.remove("d-none");
        document.getElementById("set-settings").classList.add("d-none");
        document.getElementById("toggle-powermark-only").disabled = true;
        document.getElementById("toggle-standard-only").disabled = true;
        break;
    }
    super.setMode({ mode });
    window.localStorage.setItem(
      "singleplayer-tossup-mode",
      JSON.stringify({ mode, version: modeVersion }),
    );
  }

  toggleStandardOnly({ standardOnly }) {
    super.toggleStandardOnly({ standardOnly });
    window.localStorage.setItem(
      "singleplayer-tossup-query",
      JSON.stringify({ ...this.room.query, version: queryVersion }),
    );
  }

  toggleTimer({ timer }) {
    super.toggleTimer({ timer });
    window.localStorage.setItem(
      "singleplayer-tossup-settings",
      JSON.stringify({ ...this.room.settings, version: settingsVersion }),
    );
  }

  toggleTypeToAnswer({ typeToAnswer }) {
    document.getElementById("type-to-answer").checked = typeToAnswer;
    window.localStorage.setItem(
      "singleplayer-tossup-settings",
      JSON.stringify({ ...this.room.settings, version: settingsVersion }),
    );
  }

  /**
   * Updates the displayed stat line.
   */
  updateStatDisplay({ powers, tens, negs, tuh, points, celerity }) {
    const averageCelerity = celerity.correct.average.toFixed(3);
    const plural = tuh === 1 ? "" : "s";
    document.getElementById("statline").innerHTML =
      `${powers}/${tens}/${negs} with ${tuh} tossup${plural} seen (${points} pts, celerity: ${averageCelerity})`;

    // disable clear stats button if no stats
    document.getElementById("clear-stats").disabled = tuh === 0;
  }
}
