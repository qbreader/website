import Votekick from './VoteKick.js';

const VotekickMixin = (RoomClass) => class extends RoomClass {
  votekickInit ({ userId }, { targetId }) {
    if (this.players[userId].tens === 0 && this.players[userId].powers === 0) { return; }
    if (!this.players[targetId]) { return; }
    const targetUsername = this.players[targetId].username;

    const currentTime = Date.now();
    if (this.lastVotekickTime[userId] && (currentTime - this.lastVotekickTime[userId] < 90000)) {
      return;
    }

    this.lastVotekickTime[userId] = currentTime;

    for (const votekick of this.votekickList) {
      if (votekick.exists(targetId)) { return; }
    }
    let activePlayers = 0;
    Object.keys(this.players).forEach(playerId => {
      if (this.players[playerId].online) {
        activePlayers += 1;
      }
    });

    const threshold = Math.max(Math.floor(activePlayers * 3 / 4), 2);
    const votekick = new Votekick(targetId, threshold, []);
    votekick.vote(userId);
    this.votekickList.push(votekick);
    if (votekick.check()) {
      this.emitMessage({ type: 'successful-vk', targetUsername, targetId });
      this.kickedUserList.set(targetId, Date.now());
    } else {
      this.kickedUserList.set(targetId, Date.now());
      this.emitMessage({ type: 'initiated-vk', targetUsername, threshold });
    }
  }

  votekickVote ({ userId }, { targetId }) {
    if (this.players[userId].tens === 0 && this.players[userId].powers === 0) {
      this.emitMessage({ type: 'no-points-votekick-attempt', userId });
      return;
    }
    if (!this.players[targetId]) { return; }
    const targetUsername = this.players[targetId].username;

    let exists = false;
    let thisVotekick;
    for (const votekick of this.votekickList) {
      if (votekick.exists(targetId)) {
        thisVotekick = votekick;
        exists = true;
      }
    }
    if (!exists) { return; }

    thisVotekick.vote(userId);
    if (thisVotekick.check()) {
      this.emitMessage({ type: 'successful-vk', targetUsername, targetId });
      this.kickedUserList.set(targetId, Date.now());

      setTimeout(() => this.closeConnection({ userId: targetId, username: targetUsername }), 1000);

      if (targetId === this.ownerId) {
        const onlinePlayers = Object.keys(this.players).filter(playerId => this.players[playerId].online && playerId !== targetId);
        const newHost = onlinePlayers.reduce(
          (maxPlayer, playerId) => (this.players[playerId].tuh || 0) > (this.players[maxPlayer].tuh || 0) ? playerId : maxPlayer,
          onlinePlayers[0]
        );
        // ^^ highest tuh player becomes new host

        this.ownerId = newHost;

        this.emitMessage({ type: 'owner-change', newOwner: newHost });
      }
    }
  }
};

export default VotekickMixin;
