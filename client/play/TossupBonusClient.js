import { BonusClientMixin } from './BonusClient.js';
import { TossupClientMixin } from './TossupClient.js';
import QuestionClient from './QuestionClient.js';

export default class TossupBonusClient extends BonusClientMixin(TossupClientMixin(QuestionClient)) {
  startNextTossup ({ tossup, packetLength }) {
    super.startNextTossup({ tossup, packetLength });
    document.getElementById('reveal').disabled = true;
  }
}
