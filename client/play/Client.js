import { CLIENT_MESSAGE_TYPE, ROOM_MESSAGE_TYPE } from '../../shared/protocol/room.js';

export default class Client {
  constructor (room, userId, socket) {
    this.room = room;
    this.USER_ID = userId;
    attachEventListeners(room, socket);
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case ROOM_MESSAGE_TYPE.CLEAR_STATS: return this.clearStats(data);
      case CLIENT_MESSAGE_TYPE.LEAVE: return this.leave(data);
      case ROOM_MESSAGE_TYPE.SET_USERNAME: return this.setUsername(data);
      case CLIENT_MESSAGE_TYPE.TIMER_UPDATE: return this.timerUpdate(data);
    }
  }

  clearStats ({ userId }) {
    throw new Error('clearStats should be implemented in subclass');
  }

  leave ({ userId }) {
    throw new Error('leave should be implemented in subclass');
  }

  setUsername ({ userId, username }) {
    throw new Error('setUsername should be implemented in subclass');
  }

  timerUpdate ({ timeRemaining }) {
    const seconds = Math.floor(timeRemaining / 10);
    const tenths = timeRemaining % 10;
    document.querySelector('.timer .face').textContent = seconds;
    document.querySelector('.timer .fraction').textContent = '.' + tenths;
  }
}

function attachEventListeners (room, socket) {
  document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: ROOM_MESSAGE_TYPE.CLEAR_STATS });
  });
}
