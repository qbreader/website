import { bucketName, s3 } from '../databases.js';
import * as AWS from '@aws-sdk/client-s3';

/**
 *
 * @param {String} packetName
 * @param {String} division
 * @param {Integer} questionNumber
 * @returns {Promise<Buffer>}
 */
async function getAudio ({ packetName, division, sample = false, questionNumber }) {
  const filepath = sample ? `${packetName}/sample.mp3` : `${packetName}/${division}/${questionNumber}.mp3`;
  const command = new AWS.GetObjectCommand({ Bucket: bucketName, Key: 'geoword/audio/' + filepath });
  const { Body } = await s3.send(command);
  const byteArray = await Body.transformToByteArray();
  return Buffer.from(byteArray);
}

export default getAudio;
