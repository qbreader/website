import ServerMultiplayerRoomMixin from './ServerMultiplayerRoomMixin.js';
import TossupRoom from '../../quizbowl/TossupRoom.js';
import { TOSSUP_PROGRESS_ENUM } from '../../quizbowl/constants.js';

export default class ServerTossupRoom extends ServerMultiplayerRoomMixin(TossupRoom) {
  constructor (name, ownerId, isPermanent, categoryManager) {
    super(name, ownerId, isPermanent, categoryManager, ['tossups']);
  }

  giveAnswerLiveUpdate ({ userId, username }, { givenAnswer }) {
    if (userId !== this.buzzedIn) { return false; }
    super.giveAnswerLiveUpdate({ userId, username }, { givenAnswer });
  }

  next ({ userId, username }) {
    // prevents spam-skipping trolls
    if (this.tossupProgress === TOSSUP_PROGRESS_ENUM.READING && this.wordIndex < 3) { return false; }
    super.next({ userId, username });
  }
}
