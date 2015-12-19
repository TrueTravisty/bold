(function() {

var app = angular.module('bold', ['ui.bootstrap', 'ngMessages', 'ngTouch', 'ngNumeraljs', 'smart-table']);


app.controller('MainCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.alerts = [];
    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };
    
    $http.get('/flashmessages').success(function(flash) {
        if (!flash) return;
        ['danger', 'warning', 'success', 'info'].forEach(function(cat){
            flash[cat].forEach(function(msg){
                $scope.alerts.push({msg:msg, type: cat});    
            })    
        })        
    });
    
}]);

app.config(['$numeraljsConfigProvider', function ($numeraljsConfigProvider) {
    $numeraljsConfigProvider.setFormat('iska', '0.0a');
    $numeraljsConfigProvider.setFormat('isk', '0,0.00 ISK');
    
}]);


})();