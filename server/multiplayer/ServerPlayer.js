import Player from '../../quizbowl/Player.js';

export default class ServerPlayer extends Player {
  constructor (userId) {
    super(userId);
    this.online = true;
  }
}
