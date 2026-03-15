export default class audio {
  static soundEffects = window.localStorage.getItem('sound-effects') === 'true';
  static buzz = new window.Audio('/play/audio/buzz.mp3');
  static correct = new window.Audio('/play/audio/correct.mp3');
  static incorrect = new window.Audio('/play/audio/incorrect.mp3');
  static power = new window.Audio('/play/audio/power.mp3');
}
