import ServerMultiplayerRoomMixin from './ServerMultiplayerRoomMixin.js'
import TossupRoom from '../../quizbowl/TossupRoom.js';

const ServerTossupRoom = ServerMultiplayerRoomMixin(TossupRoom);
export default ServerTossupRoom;
