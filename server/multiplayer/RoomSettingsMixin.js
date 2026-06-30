import isAppropriateString from '../moderation/is-appropriate-string.js';
import { MODE_ENUM } from '../../quizbowl/constants.js';

const RoomSettingsMixin = (RoomClass) => class extends RoomClass {
  allowed (userId) {
    return (userId === this.ownerId) || this.settings.public || !this.settings.controlled;
  }

  setCategories ({ userId, username }, { categories, subcategories, alternateSubcategories, percentView, categoryPercents }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setCategories({ userId, username }, { categories, subcategories, alternateSubcategories, percentView, categoryPercents });
  }

  setMode ({ userId, username }, { mode }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    if (this.mode !== MODE_ENUM.SET_NAME && this.mode !== MODE_ENUM.RANDOM) { return; }
    super.setMode({ userId, username }, { mode });
    this.adjustQuery(['setName'], [this.query.setName]);
  }

  setPacketNumbers ({ userId, username }, { packetNumbers }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setPacketNumbers({ userId, username }, { doNotFetch: false, packetNumbers });
  }

  setReadingSpeed ({ userId, username }, { readingSpeed }) {
    if (this.isPermanent || !this.allowed(userId)) { return false; }
    super.setReadingSpeed({ userId, username }, { readingSpeed });
  }

  async setSetName ({ userId, username }, { setName }) {
    if (!this.allowed(userId)) { return; }
    if (!this.packetList) { return; }
    if (!this.packetList.includes(setName)) { return; }
    super.setSetName({ userId, username }, { doNotFetch: false, setName });
  }

  setStrictness ({ userId, username }, { strictness }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setStrictness({ userId, username }, { strictness });
  }

  setMinYear ({ userId, username }, { minYear }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setMinYear({ userId, username }, { minYear });
  }

  setMaxYear ({ userId, username }, { maxYear }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setMaxYear({ userId, username }, { maxYear });
  }

  setUsername ({ userId }, { username }) {
    if (typeof username !== 'string') { return false; }

    if (!isAppropriateString(username)) {
      this.sendToSocket(userId, {
        type: 'force-username',
        username: this.players[userId].username,
        message: 'Your username contains an inappropriate word, so it has been reverted.'
      });
      return;
    }

    const oldUsername = this.players[userId]?.username;
    const newUsername = this.players[userId].safelySetUsername(username);
    this.emitMessage({ type: 'set-username', userId, oldUsername, newUsername });
  }

  toggleControlled ({ userId, username }, { controlled }) {
    if (this.settings.public) { return; }
    if (userId !== this.ownerId) { return; }
    this.settings.controlled = !!controlled;
    this.emitMessage({ type: 'toggle-controlled', controlled, username });
  }

  toggleEnableBonuses ({ userId, username }, { enableBonuses }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.toggleEnableBonuses({ userId, username }, { enableBonuses });
  }

  toggleLock ({ userId, username }, { lock }) {
    if (this.settings.public || !this.allowed(userId)) { return; }
    this.settings.lock = lock;
    this.emitMessage({ type: 'toggle-lock', lock, username });
  }

  toggleLoginRequired ({ userId, username }, { loginRequired }) {
    if (this.isVerified || this.settings.public || !this.allowed(userId)) { return; }
    this.settings.loginRequired = loginRequired;
    this.emitMessage({ type: 'toggle-login-required', loginRequired, username });
  }

  toggleMute ({ userId }, { targetId, targetUsername, muteStatus }) {
    if (userId !== this.ownerId) return;
    this.sendToSocket(userId, { type: 'mute-player', targetId, targetUsername, muteStatus });
  }

  togglePowermarkOnly ({ userId, username }, { powermarkOnly }) {
    if (!this.allowed(userId)) { return; }
    super.togglePowermarkOnly({ userId, username }, { powermarkOnly });
  }

  toggleSkip ({ userId, username }, { skip }) {
    if (!this.allowed(userId)) { return; }
    super.toggleSkip({ userId, username }, { skip });
  }

  toggleStandardOnly ({ userId, username }, { standardOnly }) {
    if (!this.allowed(userId)) { return; }
    super.toggleStandardOnly({ userId, username }, { doNotFetch: false, standardOnly });
  }

  togglePublic ({ userId, username }, { public: isPublic }) {
    if (this.isPermanent || this.settings.controlled) { return; }
    this.settings.public = isPublic;
    if (isPublic) {
      this.settings.lock = false;
      this.settings.loginRequired = false;
      this.settings.timer = true;
    }
    this.emitMessage({ type: 'toggle-public', public: isPublic, username });
  }

  toggleRebuzz ({ userId, username }, { rebuzz }) {
    if (!this.allowed(userId)) { return false; }
    super.toggleRebuzz({ userId, username }, { rebuzz });
  }

  toggleTimer ({ userId, username }, { timer }) {
    if (this.settings.public || !this.allowed(userId)) { return; }
    super.toggleTimer({ userId, username }, { timer });
  }
};

export default RoomSettingsMixin;
