#!/bin/bash

echo "*******************"
echo "POPULATING DATABASE"
echo "*******************"

# changing into the script's directory
cd "$(dirname "$0")"

# create the schema
mongo schema/schema.js

#importing everything
mongoimport -d swforum-radar --jsonArray -c users --file data/users.json
mongoimport -d swforum-radar --jsonArray -c projects --file data/projects.json
mongoimport -d swforum-radar --jsonArray -c classifications --file data/classifications.json
mongoimport -d swforum-radar --jsonArray -c mtrlscores --file data/mtrlscores.json
mongoimport -d swforum-radar --jsonArray -c radars --file data/radars.json
mongoimport -d swforum-radar --jsonArray -c radarrenderings --file data/radarrenderings.json
mongoimport -d swforum-radar --jsonArray -c sequences --file data/sequences.json
