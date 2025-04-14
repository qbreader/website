import { packets, sampleAudio } from '../../collections.js';

export default async function getSampleAudio ({ packetName }) {
  const packet = await packets.findOne({ name: packetName });
  if (!packet) { return null; }

  const sampleAudioFile = await sampleAudio.findOne({ _id: packet.sample_audio_id });
  if (!sampleAudioFile) { return null; }

  return sampleAudioFile.audio.buffer;
}
