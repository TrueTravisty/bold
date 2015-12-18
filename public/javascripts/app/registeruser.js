(function(window){
var app = angular.module('bold');

app.controller('UserRegistrationCtrl', ['$scope', '$http', function ($scope, $http) {
    $scope.registerUser = function() {
        alert("Submitting");
        $http.post('/register', {username: $scope.username, password: $scope.password}).
            success(function(response) {
                if (response == "OK") {
                    window.location.assign("/loginLocal");
                } else {
                    $scope.alerts.push({type:'warning', msg: 'Registration failed. Try a different username.'})
                }
            });
    }
}])

var compareTo = function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {
             
            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };
 
            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
};
 
app.directive("compareTo", compareTo);

})(window);