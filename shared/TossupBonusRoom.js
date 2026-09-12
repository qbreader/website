import { BONUS_PROGRESS_ENUM, QUESTION_TYPE_ENUM, TOSSUP_PROGRESS_ENUM } from './constants.js';
import { BonusRoomMixin } from './BonusRoom.js';
import { TossupRoomMixin } from './TossupRoom.js';
import QuestionRoom from './QuestionRoom.js';
import { QUESTION_ROOM_MESSAGE_TYPE } from './protocol/question-room.js';
import { BONUS_ROOM_MESSAGE_TYPE } from './protocol/bonus-room.js';
import { TOSSUP_BONUS_ROOM_MESSAGE_TYPE } from './protocol/tossup-bonus-room.js';

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

  /**
   * @param {{userId: string, username: string}} player
   */
  async message ({ userId, username }, message) {
    switch (message.type) {
      // sadly this needs to be here to prevent parent classes from calling a different function on give-answer
      case QUESTION_ROOM_MESSAGE_TYPE.GIVE_ANSWER: return this.giveAnswer({ userId, username }, message);
      case BONUS_ROOM_MESSAGE_TYPE.START_BONUS_ANSWER: return this.startBonusAnswer({ userId, username }, message);
      case TOSSUP_BONUS_ROOM_MESSAGE_TYPE.TOGGLE_ENABLE_BONUSES: return this.toggleEnableBonuses({ userId, username }, message);
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
      this.emitMessage({ type: TOSSUP_BONUS_ROOM_MESSAGE_TYPE.SET_BONUS_ELIGIBLE_TEAM_ID, teamId });
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
    this.emitMessage({ type: TOSSUP_BONUS_ROOM_MESSAGE_TYPE.TOGGLE_ENABLE_BONUSES, enableBonuses, username });
  }
}
