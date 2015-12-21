(function(window){
var app = angular.module('bold');

app.controller('RosterCtrl', ['$scope', '$http', function ($scope, $http) {
    var roster = $scope.roster=[];
    var displayedRoster = [];  
    
    $scope.membersPerPage = 20;
    
    $scope.show = function(member) {
        
    }
   
    $http.get('/roster/roster.json').then(function(response) {
       var rosterData = response.data;
       for(var member in rosterData) {
           var data = rosterData[member];
           data.missingKey = !data.isOk && !data.exempt;           
           roster.push(data);
           
           if (data.comments) {
               (function(data) {$http.get('/roster/' + member + '/comments').then(function(response) {
                   data.commentData = response.data;
               })})(data);
           }
       } 
    });
    
    
}]);


})(window);