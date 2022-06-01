# qb-packet-reader
- a [quizbug](https://quizbug2.karangurazada.com/)/[protobowl](https://protobowl.com/)/tkbot where you pick a packet and it reads tossups or bonuses to you
- check out the website at http://www.qbreader.org
- regex-based packet parser in python I used: https://github.com/thedoge42/qb-packet-parser
- credit goes to https://github.com/kgurazad/quizbug2 as i probably could not have done this without consulting this
- pull requests are welcome

## how to use
if you want to run the server locally:
- clone the repository
- run `npm install` to install express
- inside the server file, run `node server.js` (requires `node.js`, I have version v14.16.0), website is at localhost:3000

## todo
- add more packets
- advanced stats (stats per category/subcategory, stats per packet)
- add a back button
- fix issue with subcategory \[x\] updating when some subcategories are selected