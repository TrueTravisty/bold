(function() {
    
var app = angular.module('bold');

app.controller('InsuranceCtrl', ['$scope','$http', function($scope, $http) {
    var ships = $scope.ships = [];
    var displayedShips = [];
    
    $http.get('/corpsrp/ships.json').then(function(response) {
        var shipsData = response.data;
        for (var shipInd in shipsData) {
            var ship = shipsData[shipInd];
            ship.insuranceValue = ship.insurancePayout - ship.insurancePrice;
            ships.push(ship);
        }
    })
}]);

})();