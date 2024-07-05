export default class Timer {
  constructor () {
    this.tenthsRemaining = 0;
  }

  get seconds () {
    return Math.floor(this.tenthsRemaining / 10);
  }

  get tenths () {
    return this.tenthsRemaining % 10;
  }

  stopTimer () {
    clearInterval(this.timerInterval);
  }

  /**
   *
   * @param {number} duration - duration of the timer, in seconds
   * @param {Function} callback
   */
  startTimer (duration, callback) {
    clearInterval(this.timerInterval);
    this.tenthsRemaining = Math.floor(duration * 10);
    this.timerInterval = setInterval(() => {
      if (this.tenthsRemaining <= 0) {
        clearInterval(this.timerInterval);
        callback();
      }
      this.updateDisplay();
      this.tenthsRemaining--;
    }, 100);
  }

  updateDisplay () {
    document.querySelector('.timer .face').innerText = this.seconds;
    document.querySelector('.timer .fraction').innerText = '.' + this.tenths;
  }
}
