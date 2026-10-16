import { JSDOM } from 'jsdom';

import { readFile } from 'fs/promises';
import { inflateRawSync } from 'zlib';

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50;
const DEFLATE = 8;

/**
 * Extracts one file from a zip archive (a .docx is a zip), using only Node's zlib.
 * @param {Buffer} zip
 * @param {string} entryName
 * @returns {Buffer}
 */
function readZipEntry (zip, entryName) {
  let end = zip.length - 22;
  while (end >= 0 && zip.readUInt32LE(end) !== END_OF_CENTRAL_DIRECTORY) { end--; }
  if (end < 0) {
    throw new Error('Not a zip file.');
  }

  let offset = zip.readUInt32LE(end + 16);
  const entryCount = zip.readUInt16LE(end + 10);

  for (let i = 0; i < entryCount && zip.readUInt32LE(offset) === CENTRAL_DIRECTORY_ENTRY; i++) {
    const method = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localHeader = zip.readUInt32LE(offset + 42);
    const name = zip.toString('utf-8', offset + 46, offset + 46 + nameLength);

    if (name === entryName) {
      // The local header's name and extra field lengths can differ from the central directory's.
      const start = localHeader + 30 + zip.readUInt16LE(localHeader + 26) + zip.readUInt16LE(localHeader + 28);
      const data = zip.subarray(start, start + compressedSize);
      return method === DEFLATE ? inflateRawSync(data) : data;
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  throw new Error(`No ${entryName} in the archive.`);
}

/**
 * Reads the text of a .docx, one string per non-empty paragraph. Formatting is dropped.
 * @param {string} filePath
 * @returns {Promise<string[]>}
 */
export default async function readDocxParagraphs (filePath) {
  const xml = readZipEntry(await readFile(filePath), 'word/document.xml').toString('utf-8');
  const { document } = new JSDOM(xml, { contentType: 'text/xml' }).window;

  return [...document.getElementsByTagName('w:p')]
    .map(paragraph => [...paragraph.getElementsByTagName('w:t')].map(text => text.textContent).join('').trim())
    .filter(text => text !== '');
}
