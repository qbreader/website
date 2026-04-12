#!/bin/bash

# Dump the questions in the database ('qbreader') to generate a backup
# mongodump and bsondump can be installed from the MongoDB Database Tools

# .env should be a file with the MONGODB_USERNAME and MONGODB_PASSWORD in the same directory as this file
# defined as bash variables (a standard .env file should do the trick)
source .env
CLUSTER_URL="qbreader2.z35tynb"
URI="mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${CLUSTER_URL}.mongodb.net/?retryWrites=true&w=majority"
mongodump --uri=$URI -d qbreader
current_date=$(date +%Y-%m-%d_%H:%M:%S)
mv dump/qbreader $current_date
rm -r dump
cd $current_date
bsondump --outFile=tossups.json tossups.bson
bsondump --outFile=bonuses.json bonuses.bson
bsondump --outFile=packets.json packets.bson
bsondump --outFile=sets.json sets.bson
