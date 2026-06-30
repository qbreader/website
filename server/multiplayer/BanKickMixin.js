const BAN_DURATION = 1000 * 60 * 30; // 30 minutes

const BanKickMixin = (RoomClass) => class extends RoomClass {
  ban ({ userId }, { targetId, targetUsername }) {
    console.log('Ban request received. Target ' + targetId);
    if (this.ownerId !== userId) { return; }

    this.emitMessage({ type: 'confirm-ban', targetId, targetUsername });
    this.bannedUserList.set(targetId, Date.now());

    setTimeout(() => this.closeConnection({ userId: targetId, username: targetUsername }), 1000);
  }

  cleanupExpiredBansAndKicks () {
    const now = Date.now();

    this.bannedUserList.forEach((banTime, userId) => {
      if (now - banTime > BAN_DURATION) {
        this.bannedUserList.delete(userId);
      }
    });

    this.kickedUserList.forEach((kickTime, userId) => {
      if (now - kickTime > BAN_DURATION) {
        this.kickedUserList.delete(userId);
      }
    });
  }
};

export default BanKickMixin;
