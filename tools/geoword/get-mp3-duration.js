const LAYER_3_BITRATES = {
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
};
const SAMPLE_RATES = {
  1: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  2.5: [11025, 12000, 8000]
};

/**
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {{ length: number, samples: number, sampleRate: number } | null}
 */
function readFrameHeader (buffer, offset) {
  if (offset + 4 > buffer.length || buffer[offset] !== 0xFF || (buffer[offset + 1] & 0xE0) !== 0xE0) { return null; }

  const version = [2.5, null, 2, 1][(buffer[offset + 1] >> 3) & 3];
  const isLayer3 = ((buffer[offset + 1] >> 1) & 3) === 1;
  const bitrate = LAYER_3_BITRATES[version === 1 ? 1 : 2][buffer[offset + 2] >> 4];
  const sampleRate = SAMPLE_RATES[version]?.[(buffer[offset + 2] >> 2) & 3];
  if (!version || !isLayer3 || !bitrate || !sampleRate) { return null; }

  const samples = version === 1 ? 1152 : 576;
  const padding = (buffer[offset + 2] >> 1) & 1;
  return { length: Math.floor(samples / 8 * bitrate * 1000 / sampleRate) + padding, samples, sampleRate };
}

/**
 * @param {Buffer} buffer
 * @param {number} infoOffset
 * @returns {number}
 */
function readEncoderPadding (buffer, infoOffset) {
  const flags = buffer.readUInt32BE(infoOffset + 4);
  const tagOffset = infoOffset + 8 + (flags & 1 ? 4 : 0) + (flags & 2 ? 4 : 0) + (flags & 4 ? 100 : 0) + (flags & 8 ? 4 : 0);
  if (tagOffset + 24 > buffer.length || !/^(LAME|Lavc|Lavf)/.test(buffer.toString('latin1', tagOffset, tagOffset + 4))) { return 0; }

  const delay = (buffer[tagOffset + 21] << 4) | (buffer[tagOffset + 22] >> 4);
  const padding = ((buffer[tagOffset + 22] & 0x0F) << 8) | buffer[tagOffset + 23];
  return delay + padding;
}

/**
 * @param {Buffer} buffer
 * @returns {number}
 */
export default function getMp3Duration (buffer) {
  let offset = 0;
  if (buffer.toString('latin1', 0, 3) === 'ID3') {
    offset = 10 + ((buffer[6] & 0x7F) << 21 | (buffer[7] & 0x7F) << 14 | (buffer[8] & 0x7F) << 7 | (buffer[9] & 0x7F));
  }

  let seconds = 0;
  let first = true;
  while (offset < buffer.length) {
    const frame = readFrameHeader(buffer, offset);
    if (!frame) {
      offset++;
      continue;
    }

    const header = buffer.toString('latin1', offset, offset + Math.min(frame.length, 64));
    const infoIndex = first ? Math.max(header.indexOf('Xing'), header.indexOf('Info')) : -1;
    if (infoIndex === -1) {
      seconds += frame.samples / frame.sampleRate;
    } else {
      seconds -= readEncoderPadding(buffer, offset + infoIndex) / frame.sampleRate;
    }
    first = false;
    offset += frame.length;
  }

  if (seconds === 0) {
    throw new Error('No MP3 audio frames found.');
  }
  return seconds;
}
