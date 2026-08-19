/**
 * AudioReaderController
 *
 * Encapsulates all state and logic for the audio question reader feature.
 * TossupClient.js calls the thin public API below; no state lives in TossupClient.
 */

import audio from '../audio.js';

class AudioReaderController {
  constructor () {
    /** Toggle state queued for the *next* question (avoids mid-question desync). */
    this.pendingEnable = false;

    /** True once the current question's audio has fully finished playing. */
    this.audioFinished = false;

    /** True while the audio reader is actively playing and driving word reveal. */
    this.isReadingActive = false;

    /**
     * Callback that performs the full reveal (including any subclass UI updates).
     * Stored when the server's reveal-tossup-answer arrives before audio/countdown ends.
     * @type {(() => void) | null}
     */
    this._pendingRevealCallback = null;

    /** setInterval handle for the client-side 5-second dead-time countdown. */
    this._deadTimerInterval = null;

    /** Remaining dead time in tenths of a second. */
    this.deadTimeRemaining = 50;

    /** True if the post-question countdown is currently paused. */
    this.countdownPaused = false;
  }

  // ---------------------------------------------------------------------------
  // Public API — called by TossupClient hooks
  // ---------------------------------------------------------------------------

  /**
   * Call at the start of each new tossup.
   * Resets state, applies the pending toggle, and starts audio playback.
   */
  onStartNextTossup (tossup, readingSpeed, room, socket) {
    this._clearDeadTimer();
    this.audioFinished = false;
    this.isReadingActive = false;
    this._pendingRevealCallback = null;
    this.countdownPaused = false;

    // Apply the pending enable state — toggle takes effect per question.
    audio.questionReader.enabled = this.pendingEnable;

    if (!audio.questionReader.enabled || !tossup?.question) return;

    this.isReadingActive = true;

    // Immediately pause the simulated room's timeout loop so it doesn't run ahead of the audio.
    clearTimeout(room.timeoutID);
    room.paused = true;

    // Clear question display — audio drives word-by-word reveal.
    document.getElementById('question').innerHTML = '';

    audio.questionReader.onWordCallback = (_index, word) => {
      room.wordIndex = _index + 1;
      document.getElementById('question').innerHTML += word;
    };

    audio.questionReader.onEndedCallback = () => {
      this.audioFinished = true;
      room.wordIndex = room.questionSplit.length;

      this.deadTimeRemaining = 50;
      this._startCountdown(socket);
    };

    audio.questionReader.loadAndPlay(tossup.question, readingSpeed);
  }

  _startCountdown (socket) {
    clearInterval(this._deadTimerInterval);
    this._deadTimerInterval = setInterval(() => {
      this.deadTimeRemaining--;
      const seconds = Math.floor(this.deadTimeRemaining / 10);
      const tenths = this.deadTimeRemaining % 10;
      const timerFace = document.querySelector('.timer .face');
      const timerFraction = document.querySelector('.timer .fraction');
      if (timerFace) timerFace.textContent = seconds;
      if (timerFraction) timerFraction.textContent = '.' + tenths;

      if (this.deadTimeRemaining <= 0) {
        this._clearDeadTimer();
        socket.sendToServer({ type: 'reveal-tossup-answer' });
      }
    }, 100);
  }

  /**
   * Call when any player buzzes in.
   * Stops audio immediately and lets the server answer-timer take over.
   */
  onBuzz () {
    this._clearDeadTimer();
    this.audioFinished = true; // allow server timer-update messages through
    this.isReadingActive = false; // fall back to server text updates if room continues (e.g. neg/rebuzz)
    audio.questionReader.stop();
  }

  /**
   * Call when the current tossup ends (skip, next, etc.).
   * Fully resets audio state.
   */
  onEndQuestion () {
    this._clearDeadTimer();
    audio.questionReader.stop();
    this.isReadingActive = false;
    this._pendingRevealCallback = null;
    this.audioFinished = false;
  }

  /**
   * Call when the room is paused or unpaused.
   * @param {boolean} paused
   */
  onPause (paused, room, socket) {
    if (paused) {
      audio.questionReader.pause();
      clearTimeout(room.timeoutID);
      room.paused = true;

      if (this._deadTimerInterval !== null) {
        clearInterval(this._deadTimerInterval);
        this._deadTimerInterval = null;
        this.countdownPaused = true;
      }
    } else {
      audio.questionReader.resume();
      clearTimeout(room.timeoutID);
      room.paused = true;

      if (this.countdownPaused) {
        this.countdownPaused = false;
        this._startCountdown(socket);
      }
    }
  }

  /**
   * Returns true when server `timer-update` messages should be suppressed
   * (i.e. audio is reading OR client countdown is still running).
   */
  shouldSuppressTimer () {
    return audio.questionReader.enabled && (!this.audioFinished || this._deadTimerInterval !== null || this.countdownPaused);
  }

  /**
   * If audio is still reading or countdown is running, stores the full reveal
   * callback for deferred execution.
   * @param {() => void} revealCallback  Zero-arg function that performs the full reveal.
   * @returns {boolean} true if the reveal was deferred (caller should return early)
   */
  tryDeferReveal (revealCallback) {
    if (!audio.questionReader.enabled) return false;
    // Defer while audio is still reading OR while the client countdown is running.
    if (!this.audioFinished || this._deadTimerInterval !== null || this.countdownPaused) {
      this._pendingRevealCallback = revealCallback;
      return true;
    }
    return false;
  }

  /**
   * Returns true while audio is active and driving the question display.
   * Used by updateQuestion to skip server word-tick updates.
   */
  isReading () {
    return audio.questionReader.enabled && this.isReadingActive;
  }

  /**
   * Call when the toggle switch changes.
   * Turning OFF takes effect immediately; turning ON is deferred to next question.
   * @param {boolean} checked
   */
  onToggleChanged (checked) {
    this.pendingEnable = checked;
    if (!checked) {
      this._clearDeadTimer();
      audio.questionReader.stop();
      audio.questionReader.enabled = false;
      this.audioFinished = false;
      this.isReadingActive = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  _clearDeadTimer () {
    clearInterval(this._deadTimerInterval);
    this._deadTimerInterval = null;
    this.countdownPaused = false;
  }

  _revealPending () {
    if (!this._pendingRevealCallback) return;
    const cb = this._pendingRevealCallback;
    this._pendingRevealCallback = null;
    cb();
  }
}

export default new AudioReaderController();
