(function() {

var app = angular.module('bold', ['ui.bootstrap', 'ngMessages', 'ngTouch', 'ngNumeraljs']);


app.controller('MainCtrl', ['$scope', function($scope) {
    $scope.alerts = [];
    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };
}]);

app.config(['$numeraljsConfigProvider', function ($numeraljsConfigProvider) {
    $numeraljsConfigProvider.setFormat('iska', '0.0a');
    $numeraljsConfigProvider.setFormat('isk', '0,0.00 ISK');
    
}]);


})();