import { EARLY_CORRECT_CELERITY_THRESHOLD } from './constants.js';
import ServerMultiplayerRoomMixin from './ServerMultiplayerRoomMixin.js';
import TossupBonusRoom from '../../quizbowl/TossupBonusRoom.js';
import { QUESTION_TYPE_ENUM, TOSSUP_PROGRESS_ENUM } from '../../quizbowl/constants.js';

export default class ServerTossupBonusRoom extends ServerMultiplayerRoomMixin(TossupBonusRoom) {
  constructor (name, ownerId, isPermanent, categoryManager, isVerified = false) {
    super(name, ownerId, isPermanent, categoryManager, ['tossups', 'bonuses'], isVerified);
  }

  giveAnswerLiveUpdate ({ userId, username }, { givenAnswer }) {
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

  giveTossupAnswer ({ userId, username }, { givenAnswer }) {
    if (typeof givenAnswer !== 'string') { return false; }
    if (this.buzzedIn !== userId) { return false; }

    if (Object.keys(this.tossup || {}).length === 0) { return; }

    const { celerity, directive } = this.scoreTossup({ givenAnswer });

    if (directive === 'accept' && celerity >= EARLY_CORRECT_CELERITY_THRESHOLD) {
      const shouldKick = this.players[userId].recordEarlyCorrect();
      if (shouldKick) {
        console.log(`Bot detected: User ${userId} (${username}) got 3 correct with abnormally high celerity. Kicking.`);
        this.sendToSocket(userId, { type: 'alert', message: 'You were removed for suspected bot behavior.' });
        setTimeout(() => this.closeConnection({ userId, username }), 100);
        return;
      }
    } else {
      this.players[userId].resetBotDetectionCounter();
    }

    super.giveTossupAnswer({ userId, username }, { givenAnswer });
  }

  next ({ userId, username }) {
    if (
      this.currentQuestionType === QUESTION_TYPE_ENUM.TOSSUP &&
      this.tossupProgress === TOSSUP_PROGRESS_ENUM.READING &&
      this.wordIndex < 3
    ) { return false; }
    super.next({ userId, username });
  }
}
