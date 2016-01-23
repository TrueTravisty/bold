(function() {
    
var app = angular.module('bold');

app.controller('InsuranceCtrl', ['$scope','$http', function($scope, $http) {
    var ships = $scope.ships = [];
    var displayedShips = [];
    
    $http.get('/corpsrp/ships.json').then(function(response) {
        var shipsData = response.data;
        for (var shipInd in shipsData) {
            var ship = shipsData[shipInd];
            ship.insuranceValue = ship.insurancePayout - ship.insurancePrice;
            ships.push(ship);
        }
    })
}]);

app.directive('contenteditable', function($sce, $http) {
    return {
        require: 'ngModel',
        scope: {
            ship: "=",
            field: "@"
        },
        link: function(scope, elm, attrs, ctrl) {
            elm.bind('blur', function() {
                // want to cancel when clicking outside
                ctrl.$rollbackViewValue();                
            });
            
            //ctrl.$commitViewValue = function() {
            //    console.log("Setting ship " + scope.ship.typeName + " field " + scope.field + " to " + ctrl.$viewValue)
           // }
            
 
            // model -> view
            ctrl.$render = function(value) {
                elm.html(ctrl.$viewValue);
            };
            
            var formatFunction = function(value) {
                if (attrs.allowtext) return value;
                if (!value) return '';
                var format = '0,0.00';
                if (attrs.format) format = attrs.format;
                var v = numeral(value).format(format);
                return v;
            }
            
            var parseFunction = function(value) {
                if (attrs.allowtext) return value;
                var a = numeral().unformat(value);
                return a;
            }
            
            ctrl.$parsers.push(parseFunction);
            ctrl.$formatters.push(formatFunction);            
        
            
            ctrl.$viewChangeListeners.push(function() {
                if (!scope.ship || !scope.field) return;
                
                scope.ship[scope.field] = ctrl.$modelValue;
                var id = scope.ship.typeID;
                $http.put('/corpsrp/ship/' + id, {ship: scope.ship}).then(function(result) {                    
                    scope.ship = result.data;
                    ctrl.$modelValue = 'foo'; // triggers format pipeline
                }, function(result) {
                    // error code - read ship again to get the real value updated
                    $http.get('/corpsrp/ship/' + id).then(function(result) {
                        scope.ship = result.data;
                    });
                });
            })
            
            elm.bind('keydown', function(event) {
                console.log("keydown " + event.which);
                var esc = event.which == 27,
                    el = event.target,
                    enterOrTab = event.which == 13 || event.which == 9;
                    
                if (!attrs.allowtext && !(
                    (event.which >= 48 && event.which <= 57) ||  // digit 
                    event.which == 8 || // backspace
                    event.which == 46 || // delete
                    (event.which >= 37 && event.which <= 40) ||  // arrows
                    event.which == 9 || // tab
                    event.which == 190 || event.which == 188 || event.which == 110))  // . or , 
                    {
                        event.preventDefault();
                    }
                    
                if (enterOrTab) {
                    console.log("enter");
                    ctrl.$setViewValue(elm.html());
                    el.blur();
                    event.preventDefault();        
                }

                if (esc) {
                        console.log("esc");
                        ctrl.$rollbackViewValue();
                        el.blur();
                        event.preventDefault();                        
                    }
                    
            });
            
        }
    };
});

})();