export class QuestionAudioPlayer {
  constructor () {
    this.audio = new Audio();
    this.timestamps = [];
    this.enabled = false;
    this.voice = 'en-US-GuyNeural';
    this.currentWordIndex = -1;
    this.onWordCallback = null;
    this.onEndedCallback = null;
    this.animFrameId = null;

    this.audio.addEventListener('ended', () => {
      cancelAnimationFrame(this.animFrameId);
      if (this.timestamps && this.currentWordIndex < this.timestamps.length - 1) {
        for (let i = this.currentWordIndex + 1; i < this.timestamps.length; i++) {
          if (typeof this.onWordCallback === 'function') {
            this.onWordCallback(i, this.timestamps[i].part);
          }
        }
        this.currentWordIndex = this.timestamps.length - 1;
      }
      if (typeof this.onEndedCallback === 'function') {
        this.onEndedCallback();
      }
    });
  }

  async loadAndPlay (text, readingSpeed = 50) {
    if (!this.enabled || !text) return;
    this.stop();

    try {
      const response = await fetch('/api/audio/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: this.voice, readingSpeed })
      });
      if (!response.ok) return;

      const data = await response.json();
      if (!data.audioBase64) return;

      this.timestamps = data.timestamps || [];
      this.currentWordIndex = -1;
      this.audio.src = `data:${data.mimeType || 'audio/mp3'};base64,${data.audioBase64}`;
      this.audio.playbackRate = 1.0;

      await this.audio.play();
      this._startAnimationLoop();
    } catch (err) {
      console.error('Failed to play question audio stream:', err);
    }
  }

  _startAnimationLoop () {
    cancelAnimationFrame(this.animFrameId);
    const loop = () => {
      if (!this.audio || this.audio.paused || this.audio.ended) return;
      const currentTimeMs = this.audio.currentTime * 1000;

      for (let i = this.timestamps.length - 1; i >= 0; i--) {
        if (currentTimeMs >= this.timestamps[i].start) {
          if (i !== this.currentWordIndex) {
            this.currentWordIndex = i;
            if (typeof this.onWordCallback === 'function') {
              this.onWordCallback(i, this.timestamps[i].part);
            }
          }
          break;
        }
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  pause () {
    if (this.audio) {
      this.audio.pause();
    }
    cancelAnimationFrame(this.animFrameId);
  }

  resume () {
    if (this.audio && this.audio.src) {
      this.audio.play();
      this._startAnimationLoop();
    }
  }

  stop () {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
    }
    cancelAnimationFrame(this.animFrameId);
    this.timestamps = [];
    this.currentWordIndex = -1;
  }
}

export const questionAudioPlayer = new QuestionAudioPlayer();
export default questionAudioPlayer;
