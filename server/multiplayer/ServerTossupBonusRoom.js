import ServerMultiplayerRoomMixin from './ServerMultiplayerRoomMixin.js'
import TossupBonusRoom from '../../quizbowl/TossupBonusRoom.js';

const ServerTossupBonusRoom = ServerMultiplayerRoomMixin(TossupBonusRoom);
export default ServerTossupBonusRoom;
