(function(){
    
var app = angular.module('bold');

app.controller('BuybackCtrl', ['$scope', '$http', function ($scope, $http) {
    $scope.items='';
    $scope.value = 0;
    
    $scope.checkValue = function(items) {
        $http.post('/buyback', {raw_paste: items}).success(function(response){
            $scope.value=response;
        });
    }    

    
}]);
    
})();