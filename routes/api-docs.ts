import { Router } from 'express';
import * as fs from 'fs';

const router = Router();
const docsDir = './client/api-docs';

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: docsDir });
});

// routes every html doc in /client/api-docs
fs.readdirSync(docsDir).forEach(file => {
    if (file.endsWith('.html') && file !== 'index.html') {
        const route = file.substring(0, file.length - 5);
        router.get(`/${route}`, (req, res) => {
            res.sendFile(file, { root: docsDir });
        });
    }
});

fs.readdirSync(`${docsDir}/multiplayer`).forEach(file => {
    if (file.endsWith('.html') && file !== 'index.html') {
        const route = file.substring(0, file.length - 5);
        router.get(`/multiplayer/${route}`, (req, res) => {
            res.sendFile(file, { root: docsDir + '/multiplayer' });
        });
    }
});

export default router;
