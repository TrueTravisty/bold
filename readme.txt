Website for BO-LD

To run, a Mongodb installation is required.

The following collections should be pre-populated from the Eve Static Data drops:

 * invTypes
 * invGroups
 * mapSolarSystems

to export:
  mongodump --collection invTypes --db boldsite
  mongodump --collection invGroups --db boldsite
  mongodump --collection mapSolarSystems -- db boldsite

to import:
  mongorestore --collection invTypes --db boldsite invTypes.bson
  mongorestore --collection invGroups --db boldsite invGroups.bson
  mongorestore --collection mapSolarSystems -- db boldsite mapSolarSystems.bson
