import TossupBonusClient from '../all/TossupBonusClient.js';
import MultiplayerClientMixin from './MultiplayerClientMixin.js';

const MultiplayerTossupBonusClient = MultiplayerClientMixin(TossupBonusClient);
export default MultiplayerTossupBonusClient;
