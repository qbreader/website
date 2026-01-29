import TossupClient from '../tossups/TossupClient.js';
import MultiplayerClientMixin from './MultiplayerClientMixin.js';

const MultiplayerTossupClient = MultiplayerClientMixin(TossupClient);
export default MultiplayerTossupClient;
