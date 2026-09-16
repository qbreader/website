import Player from '../../shared/Player.js';
import { USERNAME_MAX_LENGTH } from './constants.js';

export default class ServerPlayer extends Player {
  constructor (userId) {
    super(userId, USERNAME_MAX_LENGTH);
    this.online = true;
    this.consecutiveEarlyCorrect = 0;
  }

  resetBotDetectionCounter () {
    this.consecutiveEarlyCorrect = 0;
  }

  recordEarlyCorrect () {
    this.consecutiveEarlyCorrect++;
    return this.consecutiveEarlyCorrect >= 3;
  }
}
