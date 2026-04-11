export default class audio {
  static soundEffects = window.localStorage.getItem('sound-effects') === 'true';
  static buzz = new window.Audio('https://qbreader.github.io/website/buzz.mp3');
  static correct = new window.Audio('https://qbreader.github.io/website/correct.mp3');
  static incorrect = new window.Audio('https://qbreader.github.io/website/incorrect.mp3');
  static power = new window.Audio('https://qbreader.github.io/website/power.mp3');
}
