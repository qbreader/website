import TossupClient from '../TossupClient.js';
import MultiplayerClientMixin from './MultiplayerClientMixin.js';

const MultiplayerTossupClient = MultiplayerClientMixin(TossupClient);
export default MultiplayerTossupClient;
