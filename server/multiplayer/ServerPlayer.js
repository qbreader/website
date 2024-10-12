import Player from '../../quizbowl/Player.js';
import { USERNAME_MAX_LENGTH } from './constants.js';

export default class ServerPlayer extends Player {
  constructor (userId) {
    super(userId, USERNAME_MAX_LENGTH);
    this.online = true;
  }
}
