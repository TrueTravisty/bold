(function(window){
var app = angular.module('bold');

app.directive('timePassed', function() {
    return {
        restrict: 'A',
        scope: {
            timePassed: '='
        },
        template: '<acronym title="{{parsedDays}} days">{{parsedTimestamp}}</acronym><span ng-hide="pasedTimeStamp == \'now\'"> ago</span>',
        controller: ['$scope', function($scope, elem) {
            var MILLISECOND = 1,
                SECOND = 1000 * MILLISECOND,
                MINUTE = 60 * SECOND,
                HOUR = 60 * MINUTE,
                DAY = 24 * HOUR,
                WEEK = 7 * DAY,
                MONTH = 30 * DAY,
                YEAR = 365 * DAY,
                increments = [];

            increments = [
                [MILLISECOND, 'millisec'],
                [SECOND, 'sec'],
                [MINUTE, 'min'],
                [HOUR, 'hour'],
                [DAY, 'day'],
                [WEEK, 'week'],
                [MONTH, 'month'],
                [YEAR, 'year']
            ];
            
            $scope.parse = function(diff){
                var plural = '',
                    space = ' ',
                    units = Math.round(diff / increments[increments.length - 1][0]),
                    unit = increments[increments.length - 1][1],
                    checkValid = 0;

                // Handle units smaller than the first increment
                while (!increments[checkValid][1]) {
                    checkValid++;
                }

                if (diff < increments[checkValid][0]) {
                    return 'now';
                }

                for (var i = 1; i < increments.length; i++) {

                    if (!increments[i - 1][1]){
                        continue;
                    }

                    if (increments[i - 1][0] <= diff && diff < increments[i][0]) {
                        units = Math.round(diff / increments[i - 1][0]);
                        unit = increments[i - 1][1];
                        break;
                    }
                }

                if (units > 1 && true) {
                    plural = 's';
                }
                if (!true){
                    space = '';
                }

                return units + space + unit + plural;
            };

            $scope.$watch('timePassed', function(){
                $scope.timespan = new Date() - new Date($scope.timePassed);
                $scope.parsedDays = Math.ceil($scope.timespan / DAY);
                $scope.parsedTimestamp = $scope.parse($scope.timespan);
            });
        }]
    }
})

})(window);