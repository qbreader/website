import { BONUS_PROGRESS_ENUM, QUESTION_TYPE_ENUM, TOSSUP_PROGRESS_ENUM } from './constants.js';
import { BonusRoomMixin } from './BonusRoom.js';
import { TossupRoomMixin } from './TossupRoom.js';
import QuestionRoom from './QuestionRoom.js';

export default class TossupBonusRoom extends BonusRoomMixin(TossupRoomMixin(QuestionRoom)) {
  constructor (name, categoryManager, supportedQuestionTypes = ['tossups', 'bonuses']) {
    super(name, categoryManager, supportedQuestionTypes);
    this.currentQuestionType = QUESTION_TYPE_ENUM.TOSSUP;
    this.settings = {
      enableBonuses: false,
      ...this.settings
    };
    // Only the user who answered the tossup correctly can answer the bonus
    this.bonusEligibleTeamId = null;
  }

  async message (userId, message) {
    switch (message.type) {
      case 'give-answer': return this.giveAnswer(userId, message);
      case 'start-bonus-answer': return this.startBonusAnswer(userId, message);
      case 'toggle-enable-bonuses': return this.toggleEnableBonuses(userId, message);
      default: return super.message(userId, message);
    }
  }

  canUserAnswerBonus (userId) {
    return this.players[userId].teamId === this.bonusEligibleTeamId;
  }

  giveAnswer (userId, { givenAnswer }) {
    switch (this.currentQuestionType) {
      case QUESTION_TYPE_ENUM.BONUS:
        return this.giveBonusAnswer(userId, { givenAnswer });
      case QUESTION_TYPE_ENUM.TOSSUP:
        return this.giveTossupAnswer(userId, { givenAnswer });
    }
  }

  giveBonusAnswer (userId, { givenAnswer }) {
    if (!this.canUserAnswerBonus(userId)) { return false; }
    super.giveBonusAnswer(userId, { givenAnswer });
  }

  giveTossupAnswer (userId, { givenAnswer }) {
    super.giveTossupAnswer(userId, { givenAnswer });
    const { directive } = this.scoreTossup({ givenAnswer });
    if (directive === 'accept') {
      const teamId = this.players[userId].teamId;
      this.bonusEligibleTeamId = teamId;
    }
  }

  async next (userId) {
    const gameNotStarted = this.tossupProgress === TOSSUP_PROGRESS_ENUM.NOT_STARTED && this.bonusProgress === BONUS_PROGRESS_ENUM.NOT_STARTED;
    const nextBonus = async (userId) => {
      if (gameNotStarted) {
        return await this.startNextBonus(userId);
      }
      const allowed = this.endCurrentBonus(userId);
      if (!allowed) { return; }
      await this.startNextTossup(userId);
    };

    const nextTossup = async (userId) => {
      if (gameNotStarted) {
        return await this.startNextTossup(userId);
      }
      const allowed = this.endCurrentTossup(userId);
      if (!allowed) { return; }
      if (this.bonusEligibleTeamId && this.settings.enableBonuses) {
        await this.startNextBonus(userId);
      } else {
        await this.startNextTossup(userId);
      }
    };

    switch (this.currentQuestionType) {
      case QUESTION_TYPE_ENUM.BONUS: return await nextBonus(userId);
      case QUESTION_TYPE_ENUM.TOSSUP: return await nextTossup(userId);
    }
  }

  startBonusAnswer (userId) {
    if (!this.canUserAnswerBonus(userId)) { return false; }
    super.startBonusAnswer(userId);
  }

  startNextBonus (userId) {
    this.currentQuestionType = QUESTION_TYPE_ENUM.BONUS;
    return super.startNextBonus(userId);
  }

  startNextTossup (userId) {
    this.bonusEligibleTeamId = null;
    this.currentQuestionType = QUESTION_TYPE_ENUM.TOSSUP;
    return super.startNextTossup(userId);
  }

  toggleEnableBonuses (userId, { enableBonuses }) {
    const username = this.players[userId].username;
    this.settings.enableBonuses = enableBonuses;
    this.emitMessage({ type: 'toggle-enable-bonuses', enableBonuses, username });
  }
}
