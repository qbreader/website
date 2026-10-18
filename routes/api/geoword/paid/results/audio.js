import * as validateInt from '../../../../validators/int.js';
import validateString from '../../../../validators/string.js';

import getAudio from '../../../../../database/geoword/get-audio.js';

import { Router } from 'express';

const router = Router();

/**
 * Serves a tossup's audio for replaying after the game.
 * Supports Range requests, which browsers need to seek in an <audio> element.
 */
router.get('/question.mp3', async (req, res) => {
  req.query = validateString(req.query, 'division');
  req.query = validateInt.default(req.query, 'questionNumber', { lowerBound: 1 });
  const { packetName, division, questionNumber } = req.query;

  if (!division || isNaN(questionNumber)) {
    return res.status(400).send('Invalid division or question number');
  }

  const audio = await getAudio({ packetName, division, questionNumber });
  if (!audio) {
    return res.status(404).send('Audio not found');
  }

  res.set({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=86400',
    'Content-Type': 'audio/mpeg'
  });

  const ranges = req.range(audio.length);
  if (ranges === -1) {
    res.set('Content-Range', `bytes */${audio.length}`);
    return res.sendStatus(416);
  }

  // A malformed header (-2), no header, or several ranges all get the whole file
  if (ranges === undefined || ranges === -2 || ranges.length !== 1) {
    return res.send(audio);
  }

  const { start, end } = ranges[0];
  res.status(206);
  res.set('Content-Range', `bytes ${start}-${end}/${audio.length}`);
  res.send(audio.subarray(start, end + 1));
});

export default router;
