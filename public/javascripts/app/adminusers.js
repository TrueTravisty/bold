(function(){
    
var app = angular.module('bold');

app.controller('UsersCtrl', ['$scope', '$http', function ($scope, $http) {

    $http.get('/admin/usernames.json').success(function(result) {
        $scope.usernames = result;
    })
    
}]);
    
})();