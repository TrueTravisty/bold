(function() {

var app = angular.module('bold', ['ui.bootstrap', 'ngMessages', 'ngTouch', 'ngNumeraljs', 'smart-table']);


app.controller('MainCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.alerts = [];
    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };
    $scope.keyStatus = "";
    $scope.keyok = false;
    
    $http.get('/userinfo.json').then(function(result) {
        if (result.data) { 
            if (!result.data.isOk) {
                $http.get('/exemption.json').then(function(result) {
                    if (!result.data) {
                        $scope.alerts.push({msg: "NOTE: BO-LD requires a full, valid key for all accounts of all members. We don't seem to have this for you. Please contact Yaldo Asanari ASAP to resolve.", type: "danger"});
                    }
                    $scope.keyStatus = result.data ? "API Key OK" : "API Key MISSING";
                    $scope.keyok = result.data ? true : false;
                })
            } else {
                $scope.keyStatus = result.data.isOk ? "API Key OK" : "API Key MISSING";
                $scope.keyok = result.data.isOk ? true : false;
            }
        }
    })
    
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