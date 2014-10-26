var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MapSolarSystem = new Schema({
  regionID: Number,
  constellationID: Number,
  solarSystemID: Number,
  solarSystemName: String,
  x: Number,
  y: Number,
  z: Number,
  xMin: Number,
  xMax: Number,
  yMin: Number,
  yMax: Number,
  zMin: Number,
  zMax: Number,
  luminosity: Number,
  border: Number,
  fringe: Number,
  corridor: Number,
  hub: Number,
  international: Number,
  regional: Number,
  constellation: Number,
  security: Number,
  factionID: Number,
  radius: Number,
  sunTypeID: Number,
  securityClass: String
}, { collection : 'mapSolarSystems' });

module.exports = mongoose.model('mapSolarSystem', MapSolarSystem);
