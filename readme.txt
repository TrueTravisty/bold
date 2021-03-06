Website for BO-LD

To run, a Mongodb installation is required.

The following collections should be pre-populated from the Eve Static Data drops:

 * invTypes
 * invGroups
 * mapSolarSystems

to export:
  mongodump --collection invTypes --db boldsite
  mongodump --collection invGroups --db boldsite
  mongodump --collection mapSolarSystems --db boldsite

to import:
  mongorestore --collection invTypes --db boldsite invTypes.bson
  mongorestore --collection invGroups --db boldsite invGroups.bson
  mongorestore --collection mapSolarSystems --db boldsite mapSolarSystems.bson



to export from mySql: (do a select * to find fields, but remove description)
  (SELECT 'typeID','groupID','typeName','mass','volume',
  'capacity','portionSize','raceID','basePrice','published','marketGroupID','iconID','soundID')
  union
  (SELECT typeID,groupID,typeName,mass,volume,
  capacity,portionSize,raceID,basePrice,published,marketGroupID,iconID,soundID FROM frostline.invTypes
  INTO OUTFILE '/Users/torlivar/dbdata/invTypes.csv'
  FIELDS ENCLOSED BY '"' TERMINATED BY ';'
  LINES TERMINATED BY '\n');

  (SELECT 'groupID', 'categoryID','groupName','iconID','useBasePrice','anchored','anchorable','fittableNonSingleton','published')
  union
  (SELECT * FROM frostline.invGroups
  INTO OUTFILE '/Users/torlivar/dbdata/invGroups.csv'
  FIELDS ENCLOSED BY '"' TERMINATED BY ';'
  LINES TERMINATED BY '\n');


Fix null values:
sed -i -- 's/\N;/"";/g' invTypes.csv
sed -i -- 's/\N;/"";/g' invGroups.csv

to import csv to mongo (drop the collections first)
mongoimport -d boldsite -c invTypes --type csv --file invTypes.csv --headerline
mongoimport -d boldsite -c invGroups --type csv --file invGroups.csv --headerline
