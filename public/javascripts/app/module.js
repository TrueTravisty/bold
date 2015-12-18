(function() {

var app = angular.module('bold', ['ui.bootstrap', 'ngTouch', 'ngNumeraljs']);


app.controller('MainCtrl', ['$scope', function($scope) {
    
}]);

app.config(['$numeraljsConfigProvider', function ($numeraljsConfigProvider) {
    $numeraljsConfigProvider.setFormat('iska', '0.0a');
    $numeraljsConfigProvider.setFormat('isk', '0,0.00 ISK');
    
}]);


})();