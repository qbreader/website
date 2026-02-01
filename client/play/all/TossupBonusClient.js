import { BonusClientMixin } from '../bonuses/BonusClient.js';
import { TossupClientMixin } from '../tossups/TossupClient.js';
import QuestionClient from '../QuestionClient.js';

export default class TossupBonusClient extends BonusClientMixin(TossupClientMixin(QuestionClient)) {
  startNextTossup ({ tossup, packetLength }) {
    super.startNextTossup({ tossup, packetLength });
    document.getElementById('reveal').disabled = true;
  }
}
