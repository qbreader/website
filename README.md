# qb-packet-reader
- a [quizbug](https://quizbug2.karangurazada.com/)/[protobowl](https://protobowl.com/)/tkbot where you can input a packet and it reads it (tossups and/or bonuses) to you
- front end uses html/css and backend uses express.js server
- check out the website at https://qbreader.herokuapp.com/
- a useful packet parser I used: https://github.com/alopezlago/YetAnotherPacketParser
- I also wrote a rudimentary regex-based packet parser in python: https://github.com/thedoge42/qb-packet-parser
- credit goes to https://github.com/kgurazad/quizbug2 as i probably could not have done this without consulting this

## how to use
- run the server file by using the command `node server.js` (requires `node.js`, I have version 14.16.0), website is at localhost:3000 or 127.0.0.1:3000
- pull requests are welcome

## todo
- add a back button
- add more feedback for no packet and running out of questions