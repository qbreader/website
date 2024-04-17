export default class audio {
    static soundEffects = localStorage.getItem('sound-effects') === 'true';
    static buzz = new Audio('/audio/buzz.mp3');
    static correct = new Audio('/audio/correct.mp3');
    static incorrect = new Audio('/audio/incorrect.mp3');
}
