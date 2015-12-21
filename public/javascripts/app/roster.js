(function(window){
var app = angular.module('bold');

app.controller('RosterCtrl', ['$scope', '$http', function ($scope, $http) {
    var roster = $scope.roster=[];
    var displayedRoster = [];  
    
    $scope.membersPerPage = 20;
    $scope.characterId = null;
    
    $scope.show = function(characterID) {
        $scope.characterId = characterID;
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

 app.directive('characterInfo', ['$http', function($http) {
    return {
        restrict: 'C',
        templateUrl: '/roster/character-info',
        scope: {
            characterId: "=",
            setCharacter: "&"            
        },
        link: function(scope, elm, attrs) {
            var updateCharacterInfo = function() {
                if (!scope.characterId) {
                    scope.characterInfo = null;
                    return;
                }
                
                $http.get('/roster/' + scope.characterId).then(function(response) {
                    scope.characterInfo = response.data;
                    if (!scope.characterInfo.name && scope.characterInfo.characterName)
                        scope.characterInfo.name = scope.characterInfo.characterName;
                })
            }
            
            updateCharacterInfo();
            
            scope.$watch(attrs.characterId, function(value) {
                updateCharacterInfo();
            })
        }
    }
}]);

})(window);