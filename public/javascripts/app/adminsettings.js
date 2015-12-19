(function(){
 
var app = angular.module('bold');

app.controller('SettingsCtrl', ['$scope', '$http', function ($scope, $http) {

    $http.get("/admin/settings.json").success(function(result) {
        $scope.settings = result;    
    });
    
    $scope.updateSetting = function(setting) {
        if (!setting) return;
        $http.post('/admin/settings/' + setting.name, setting).success(function(result) {
            if (result == 'OK') {
                $scope.alerts.push({
                    type: 'success',
                    msg: 'Changed ' + setting.name + ' to ' + setting.value
                })
            }
            else if (result == 'Failed') {
                $scope.alerts.push({
                    type: 'danger',
                    msg: 'Could not change value of ' + setting.name
                });                
            }
        });
    }
    
    
    
}]);
     
})();