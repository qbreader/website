import ServerMultiplayerRoomMixin from './ServerMultiplayerRoomMixin.js';
import TossupBonusRoom from '../../quizbowl/TossupBonusRoom.js';
import { QUESTION_TYPE_ENUM, TOSSUP_PROGRESS_ENUM } from '../../quizbowl/constants.js';

export default class ServerTossupBonusRoom extends ServerMultiplayerRoomMixin(TossupBonusRoom) {
  constructor (name, ownerId, isPermanent, categoryManager, isVerified = false) {
    super(name, ownerId, isPermanent, categoryManager, ['tossups', 'bonuses'], isVerified);
  }

  giveAnswerLiveUpdate ({ userId, username }, { givenAnswer }) {
    // Allow live updates during bonuses (when buzzedIn is null) or from the user who buzzed
    switch (this.currentQuestionType) {
      case QUESTION_TYPE_ENUM.TOSSUP:
        if (userId !== this.buzzedIn) { return false; }
        break;
      case QUESTION_TYPE_ENUM.BONUS:
        if (!this.canUserAnswerBonus({ userId, username })) { return false; }
        break;
    }
    super.giveAnswerLiveUpdate({ userId, username }, { givenAnswer });
  }

  next ({ userId, username }) {
    // prevents spam-skipping trolls
    if (
      this.currentQuestionType === QUESTION_TYPE_ENUM.TOSSUP &&
      this.tossupProgress === TOSSUP_PROGRESS_ENUM.READING &&
      this.wordIndex < 3
    ) { return false; }
    super.next({ userId, username });
  }
}
