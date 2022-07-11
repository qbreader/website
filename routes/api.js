const express = require('express');
const router = express.Router();
const fs = require('fs');

router.get('/get-packet', async (req, res) => {
    req.query.year = decodeURI(req.query.year);
    req.query.set_name = decodeURI(req.query.set_name.toLowerCase());
    req.query.set_name = req.query.set_name.replace(/\s/g, '_');
    var directory = `../packets/${req.query.year}-${req.query.set_name}/${req.query.packet_number}.json`;
    try {
        var jsonfile = require(directory);
        res.send(JSON.stringify(jsonfile));
    } catch (error) {
        console.log('ERROR: Could not find packet located at ' + directory);
        res.send(JSON.stringify({}));
    }
});

router.get('/get-num-packets', async (req, res) => {
    req.query.year = decodeURI(req.query.year);
    req.query.set_name = decodeURI(req.query.set_name.toLowerCase());
    req.query.set_name = req.query.set_name.replace(/\s/g, '_');
    var directory = `packets/${req.query.year}-${req.query.set_name}`;
    var numPackets = 0;
    try {
        fs.readdirSync(directory).forEach(file => {
            if (file.endsWith('.json')) {
                numPackets++;
            }
        });
        res.send(JSON.stringify({ num_packets: numPackets.toString() }));
    } catch (error) {
        console.log(error);
        console.log('ERROR: Could not find directory ' + directory);
        res.send(JSON.stringify({ num_packets: 0 }));
    }
});

module.exports = router;