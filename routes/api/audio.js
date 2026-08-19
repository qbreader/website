import { EdgeTTS } from 'node-edge-tts';
import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const SUPPORTED_VOICES = {
  'en-US-GuyNeural': 'en-US-GuyNeural',
  'en-US-JennyNeural': 'en-US-JennyNeural',
  'en-GB-RyanNeural': 'en-GB-RyanNeural',
  'en-GB-SoniaNeural': 'en-GB-SoniaNeural'
};

router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice = 'en-US-GuyNeural', readingSpeed = 50 } = req.body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    if (text.length > 3000) {
      return res.status(400).json({ error: 'Text length exceeds maximum allowed limit of 3000 characters' });
    }

    const selectedVoice = SUPPORTED_VOICES[voice] || 'en-US-GuyNeural';

    // Map readingSpeed (0-100) to edge-tts rate percentage (+30% at default 50)
    const speedNum = isNaN(readingSpeed) ? 50 : Math.max(0, Math.min(100, Number(readingSpeed)));
    const ratePct = Math.round((speedNum - 50) * 0.6 + 30);
    const rate = `${ratePct >= 0 ? '+' : ''}${ratePct}%`;

    // Temporary files for audio and subtitle output
    const uniqueId = uuidv4();
    const tempAudioPath = path.join(os.tmpdir(), `qbreader_tts_${uniqueId}.mp3`);
    const tempJsonPath = `${tempAudioPath}.json`;

    const tts = new EdgeTTS({
      voice: selectedVoice,
      saveSubtitles: true,
      rate,
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
    });

    // Clean text by stripping ALL asterisks (*), powermark tokens, HTML tags, and HTML entities
    const cleanText = text
      .replace(/&#42;|&ast;|\(\*\)|\[\*\]|\(\+\)|\[\+\]|\(#\)|\*|\+/g, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/&[a-z0-9#]+;/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    await tts.ttsPromise(cleanText, tempAudioPath);

    let timestamps = [];
    if (fs.existsSync(tempJsonPath)) {
      const rawJson = fs.readFileSync(tempJsonPath, 'utf8');
      timestamps = JSON.parse(rawJson);
      fs.unlinkSync(tempJsonPath);
    }

    let audioBase64 = '';
    if (fs.existsSync(tempAudioPath)) {
      const audioBuffer = fs.readFileSync(tempAudioPath);
      audioBase64 = audioBuffer.toString('base64');
      fs.unlinkSync(tempAudioPath);
    }

    res.json({
      audioBase64,
      timestamps,
      mimeType: 'audio/mp3'
    });
  } catch (error) {
    console.error('TTS Synthesis Error:', error);
    res.status(500).json({ error: 'Failed to synthesize speech audio' });
  }
});

export default router;
