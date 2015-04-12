
function parseIndividual(result) {
  var character = {};

  for (prop in result) {
    if (Array.isArray(result[prop]) && result[prop].length == 1) {
      character[prop] = result[prop][0];
    }
  }

  // TODO: Add corp history when needed

  return character;

}


function parse(result) {
  var characters = [];
  for (var i = 0; i < result.length; i++) {
    characters.push(parseIndividual(result[i]));
  }
  return characters;
}

function first(result) {
  return parse(result)[0];
}

exports.parse = parse;
exports.first = first;
