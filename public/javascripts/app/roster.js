(function(window){
var app = angular.module('bold');

app.config(function($locationProvider){
    $locationProvider.html5Mode(true).hashPrefix('!');
});

app.controller('RosterCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
    var roster = $scope.roster=[];
    var displayedRoster = [];      
    
    $scope.membersPerPage = 20;
    $scope.characterId = null;
    
    var p = $location.path().toString();
    if (p){        
        $scope.characterId = p.replace('/', '');
    }
    
    $scope.show = function(characterID) {
        $location.path(characterID);
        $scope.characterId = characterID;
    }
   
    $http.get('/roster/roster.json').then(function(response) {
       var rosterData = response.data;
       for(var member in rosterData) {
           var data = rosterData[member];
           data.missingKey = !data.isOk && !data.exempt;           
           roster.push(data);
           
           if (data.comments) {
               (function(data) {$http.get('toon/' + member + '/comments').then(function(response) {
                   data.commentData = response.data;
               })})(data);
           }
       } 
    });
    
    
}]);

 app.directive('characterInfo', ['$http', function($http) {
    return {
        restrict: 'C',
        templateUrl: 'character-info',
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
                
                $http.get('toon/' + scope.characterId).then(function(response) {
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

app.directive('characterComments', ['$http', function($http) {
    return {
        restrict: 'C', 
        templateUrl: 'character-comments',
        scope: {
            characterId: "=",
        },
        link: function(scope, elm, attrs) {
            var updateComments = function() {
                scope.newComment = "";
                if (!scope.characterId) return;
                $http.get('toon/' + scope.characterId + '/comments').then(function(response){
                    scope.comments = response.data;
                });
            }
            
            updateComments();
            
            scope.registerComment = function() {
                $http.post('toon/' + scope.characterId + '/comments', {text: scope.newComment}).then(function(res) {
                    updateComments();    
                }, function(res) {
                    updateComments();
                });                
            }
            
            scope.deleteComment = function(id) {
                $http.delete('toon/' + scope.characterId + '/comments/' + id).then(
                    function(res) { updateComments()},
                    function(res) { updateComments()}
                );
            }
            
            scope.editComment = function(comment) {
                comment.editing = !comment.editing;
            }
            
            scope.updateComment = function(comment) {
                $http.put('toon/' + scope.characterId + '/comments/' + comment.id, {text: comment.text}).then(
                    function(result) { updateComments()},
                    function(result) { updateComments()}
                )
            }
            
            scope.$watch(attrs.characterId, function(value) {
                updateComments();
            })
        }
    }
}])

app.directive('apiExemptStatus', ['$http', function($http) {
    return {
        restrict: 'C',
        templateUrl: '/templates/exemption.html',
        scope: {
            characterId: "="
        },
        link: function(scope, elm, attrs) {
            var updateExemptionStatus = function() {
                scope.exempt = false;
                if (!scope.characterId){
                    return;
                }
                
                $http.get('toon/' + scope.characterId + '/exemption').then(function(response) {
                    if (response.data) scope.exempt = true;
                    scope.exemptReason = response.data ? response.data : '';
                })                    
            }
            
            updateExemptionStatus();
            
            scope.removeExemption = function() {
                $http.delete('toon/' + scope.characterId + '/exemption').then(function(response){
                    updateExemptionStatus();
                }, function(response) {
                    updateExemptionStatus();
                })
            }
            
            scope.registerExemption = function() {
                $http.post('toon/' + scope.characterId + '/exemption', {reason: scope.exemptReason}).then(function(response) {
                    updateExemptionStatus();
                }, function(response) {
                    updateExemptionStatus();
                })
            }
            
            scope.$watch(attrs.characterId, function(value) {
                updateExemptionStatus();
            });
        }
    }
}])

})(window);