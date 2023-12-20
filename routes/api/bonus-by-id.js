import { Router } from 'express';
import getBonus from '../../database/qbreader/get-bonus.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
    if (!req.query.id) {
        res.status(400).send('Bonus ID not specified');
        return;
    }
    let oid;
    try {
        oid = ObjectId(req.query.id);
    } catch (b) {
        res.status(400).send('Invalid Bonus ID');
        return;
    }
    const bonus = await getBonus(oid);
    if (bonus === null) {
        res.status(404).send(`Bonus with ID ${req.query.id} was not found`);
        return;
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.json({ bonus });

});

export default router;
