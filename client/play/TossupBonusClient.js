import { BonusClientMixin } from './BonusClient.js';
import { TossupClientMixin } from './TossupClient.js';
import QuestionClient from './QuestionClient.js';

export default class TossupBonusClient extends BonusClientMixin(
  TossupClientMixin(QuestionClient)
) {
  constructor (room, userId, socket) {
    super(room, userId, socket);
    attachEventListeners(room, socket);
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'toggle-enable-bonuses':
        return this.toggleEnableBonuses(data);
      default:
        return super.onmessage(message);
    }
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
  document
    .getElementById('toggle-enable-bonuses')
    .addEventListener('click', function () {
      this.blur();
      socket.sendToServer({
        type: 'toggle-enable-bonuses',
        enableBonuses: this.checked
      });
    });
}
