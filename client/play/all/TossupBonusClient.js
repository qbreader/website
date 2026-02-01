import { BonusClientMixin } from '../bonuses/BonusClient.js';
import { TossupClientMixin } from '../tossups/TossupClient.js';
import QuestionClient from '../QuestionClient.js';

const TossupBonusClient = BonusClientMixin(TossupClientMixin(QuestionClient));
export default TossupBonusClient;
