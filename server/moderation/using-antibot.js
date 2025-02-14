import fs from 'fs';
import path from 'path';

const isUsingAntibot = fs.existsSync(path.join(import.meta.dirname, '..', 'antibot'));
export { isUsingAntibot };