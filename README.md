# qb-packet-reader
- a [quizbug](https://quizbug2.karangurazada.com/)/[protobowl](https://protobowl.com/)/tkbot where you pick a packet and it reads its tossups or bonuses to you
- vanilla html/css/js on the frontend, express.js server on the backend
- check out the website at https://qbreader.herokuapp.com/
- regex-based packet parser in python I used: https://github.com/thedoge42/qb-packet-parser
- credit goes to https://github.com/kgurazad/quizbug2 as i probably could not have done this without consulting this

## how to use
- run the server file by using the command `node server.js` (requires `node.js`, I have version v14.16.0), website is at localhost:3000 or 127.0.0.1:3000
- pull requests are welcome

## todo
- add a back button
- randomize questions
- bookmarks
- add pdf packets
- add a better method of selecting subcategories:
    - add optgroups and when all options in an optgroup are empty, they should all be valid
