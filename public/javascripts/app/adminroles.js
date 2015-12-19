(function(){
    
var app = angular.module('bold');

app.controller('RolesCtrl', ['$scope', '$http', function ($scope, $http) {

    $http.get("/admin/roles.json").success(function(result) {
        $scope.roles = result;    
    });
    
    $http.get('/admin/usernames.json').success(function(result) {
        $scope.usernames = result;
    })
    
}]);

var inList = function() {
    return {
        require: "ngModel",
        scope: {
            list: "=inList"
        },
        link: function(scope, element, attributes, ngModel) {
             
            ngModel.$validators.compareTo = function(modelValue) {
                return scope.list.indexOf(modelValue) >= 0;
            };
 
            scope.$watch("list", function() {
                ngModel.$validate();
            });
        }
    };
};

app.controller('RoleCtrl', ['$scope', '$http', function ($scope, $http) {
    var refreshList = function() {
        $http.get('/admin/roles/' + $scope.role).success(function(result) {
            $scope.users = result;
        });
    }
    refreshList();
    
    $scope.toggle = function(role, user, grant) {        
        $http.post("/admin/togglerole", {user: user, role: role, grant: grant})
            .success(function(result) {
                refreshList();
                if (grant) $scope.newUser = "";
            });
    }
}]);

app.directive("inList", inList);
 
    
})();