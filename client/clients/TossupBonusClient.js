import { BonusClientMixin } from './BonusClient.js';
import { TossupClientMixin } from './TossupClient.js';
import QuestionClient from './QuestionClient.js';
import { TOSSUP_BONUS_ROOM_MESSAGE_TYPE } from '../../shared/protocol/tossup-bonus-room.js';

export default class TossupBonusClient extends BonusClientMixin(TossupClientMixin(QuestionClient)) {
  constructor (room, userId, socket) {
    super(room, userId, socket);
    attachEventListeners(room, socket);
    this.bonusEligibleTeamId = null;
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case TOSSUP_BONUS_ROOM_MESSAGE_TYPE.SET_BONUS_ELIGIBLE_TEAM_ID: return this.setBonusEligibleTeamId(data);
      case TOSSUP_BONUS_ROOM_MESSAGE_TYPE.TOGGLE_ENABLE_BONUSES: return this.toggleEnableBonuses(data);
      default: return super.onmessage(message);
    }
  }

  setBonusEligibleTeamId ({ teamId }) {
    this.bonusEligibleTeamId = teamId;
  }

  startBonusAnswer () {
    if (this.bonusEligibleTeamId !== null && this.USER_ID !== this.bonusEligibleTeamId) { return; }
    super.startBonusAnswer();
  }

  startNextTossup ({ tossup, packetLength }) {
    super.startNextTossup({ tossup, packetLength });
    document.getElementById('reveal').disabled = true;
  }

  toggleEnableBonuses ({ enableBonuses }) {
    document.getElementById('toggle-enable-bonuses').checked = enableBonuses;
  }
}

function attachEventListeners (room, socket) {
  document.getElementById('toggle-enable-bonuses').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: TOSSUP_BONUS_ROOM_MESSAGE_TYPE.TOGGLE_ENABLE_BONUSES, enableBonuses: this.checked });
  });
}
