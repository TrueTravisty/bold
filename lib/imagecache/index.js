var https = require('https');

var cacheTimeoutMs = 1000 * 60 * 60 * 6;

var imageCache = {};

function getImage(id, res) {
  var cached = imageCache[id];
  if (cached && cached.expires > Date.now()){
    sendImage(cached, res);
  } else {
    var buffers = [];
    https.get('https://image.eveonline.com/Character/'+ id + '_128.jpg', function(eveRes) {
      ;
      cached = { 
        expires: Date.now() + cacheTimeoutMs
      }
      eveRes.on('data', function(chunk){
        buffers.push(chunk);
      });
      eveRes.on('end', function() {
        cached.data = Buffer.concat(buffers);
        imageCache[id] = cached;
        sendImage(cached, res);
      });
      eveRes.on('error', function() {
        res.status = 404;
        res.end('Image not found');
      });
    });
  }
}

function sendImage(cached, res) {
  res.type('jpg');
  res.end(cached.data);
}

module.exports = getImage;