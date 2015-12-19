(function(window){
var app = angular.module('bold');

app.controller('RosterCtrl', ['$scope', '$http', function ($scope, $http) {
    var roster = $scope.roster=[];
    var displayedRoster = [];  
   
    $http.get('/roster/roster.json').success(function(rosterData) {
       for(var member in rosterData) {
           var data = rosterData[member];
           data.missingKey = !data.isOk && !data.exempt;
           roster.push(data);
       } 
    });
    
    
}]);

})(window);