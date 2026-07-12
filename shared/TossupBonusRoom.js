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

  async message ({ userId, username }, message) {
    switch (message.type) {
      case 'give-answer': return this.giveAnswer({ userId, username }, message);
      case 'start-bonus-answer': return this.startBonusAnswer({ userId, username }, message);
      case 'toggle-enable-bonuses': return this.toggleEnableBonuses({ userId, username }, message);
      default: return super.message({ userId, username }, message);
    }
  }

  canUserAnswerBonus ({ userId }) {
    return this.players[userId].teamId === this.bonusEligibleTeamId;
  }

  giveAnswer ({ userId, username }, { givenAnswer }) {
    switch (this.currentQuestionType) {
      case QUESTION_TYPE_ENUM.BONUS:
        return this.giveBonusAnswer({ userId, username }, { givenAnswer });
      case QUESTION_TYPE_ENUM.TOSSUP:
        return this.giveTossupAnswer({ userId, username }, { givenAnswer });
    }
  }

  giveBonusAnswer ({ userId, username }, { givenAnswer }) {
    if (!this.canUserAnswerBonus({ userId, username })) { return false; }
    super.giveBonusAnswer({ userId, username }, { givenAnswer });
  }

  giveTossupAnswer ({ userId, username }, { givenAnswer }) {
    super.giveTossupAnswer({ userId, username }, { givenAnswer });
    if (Object.keys(this.tossup || {}).length === 0) { return; }
    const { directive } = this.scoreTossup({ givenAnswer });
    if (directive === 'accept') {
      const teamId = this.players[userId].teamId;
      this.bonusEligibleTeamId = teamId;
      this.emitMessage({ type: 'set-bonus-eligible-team-id', teamId });
    }
  }

  async next ({ userId, username }) {
    const gameNotStarted = this.tossupProgress === TOSSUP_PROGRESS_ENUM.NOT_STARTED && this.bonusProgress === BONUS_PROGRESS_ENUM.NOT_STARTED;
    const nextBonus = async (currentUser) => {
      if (gameNotStarted) {
        return await this.startNextBonus(currentUser);
      }
      const allowed = this.endCurrentBonus(currentUser);
      if (!allowed) { return; }
      await this.startNextTossup(currentUser);
    };

    const nextTossup = async (currentUser) => {
      if (gameNotStarted) {
        return await this.startNextTossup(currentUser);
      }
      const allowed = this.endCurrentTossup(currentUser);
      if (!allowed) { return; }
      if (this.bonusEligibleTeamId && this.settings.enableBonuses) {
        await this.startNextBonus(currentUser);
      } else {
        await this.startNextTossup(currentUser);
      }
    };

    switch (this.currentQuestionType) {
      case QUESTION_TYPE_ENUM.BONUS: return await nextBonus({ userId, username });
      case QUESTION_TYPE_ENUM.TOSSUP: return await nextTossup({ userId, username });
    }
  }

  startBonusAnswer ({ userId, username }) {
    if (!this.canUserAnswerBonus({ userId, username })) { return false; }
    super.startBonusAnswer({ userId, username });
  }

  startNextBonus ({ userId, username }) {
    this.currentQuestionType = QUESTION_TYPE_ENUM.BONUS;
    return super.startNextBonus({ userId, username });
  }

  startNextTossup ({ userId, username }) {
    this.bonusEligibleTeamId = null;
    this.currentQuestionType = QUESTION_TYPE_ENUM.TOSSUP;
    return super.startNextTossup({ userId, username });
  }

  toggleEnableBonuses ({ username }, { enableBonuses }) {
    this.settings.enableBonuses = enableBonuses;
    this.emitMessage({ type: 'toggle-enable-bonuses', enableBonuses, username });
  }
}
