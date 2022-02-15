# qb-packet-reader
- a [quizbug](https://quizbug2.karangurazada.com/)/[protobowl](https://protobowl.com/)/tkbot where you pick a packet and it reads its tossups or bonuses to you
- check out the website at http://www.qbreader.org
- regex-based packet parser in python I used: https://github.com/thedoge42/qb-packet-parser
- credit goes to https://github.com/kgurazad/quizbug2 as i probably could not have done this without consulting this

## how to use
if you want to run the server locally:
- clone the reponsitory
- inside the server file, run `node server.js` (requires `node.js`, I have version v14.16.0), website is at localhost:3000
- pull requests are welcome

## todo
- add more packets
- add a back button
- randomize questions
- bookmarks
- add a better method of selecting subcategories:
    - add optgroups and when all options in an optgroup are empty, they should all be valid
