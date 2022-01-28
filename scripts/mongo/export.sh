#!/bin/bash

echo "*******************"
echo "EXPORTING DATABASE"
echo "*******************"

# changing into the script's directory
cd "$(dirname "$0")"

#export everything
mongoexport -d swforum-radar --jsonArray --pretty -c users --out data/users.json
mongoexport -d swforum-radar --jsonArray --pretty -c projects --out data/projects.json
mongoexport -d swforum-radar --jsonArray --pretty -c classifications --out data/classifications.json
mongoexport -d swforum-radar --jsonArray --pretty -c mtrlscores --out data/mtrlscores.json
mongoexport -d swforum-radar --jsonArray --pretty -c radars --out data/radars.json
mongoexport -d swforum-radar --jsonArray --pretty -c radarrenderings --out data/radarrenderings.json
mongoexport -d swforum-radar --jsonArray --pretty -c sequences --out data/sequences.json
