(function(){
   
var app = angular.module('bold');
    
app.controller('FrontPageCarouselCtrl', ['$scope', '$http', function ($scope, $http) {
  $scope.myInterval = 5000;
  $scope.noWrapSlides = false;

  var slides= $scope.slides = [];
 
  $http.get('frontslides.json').success(function(response) {
        for (var i = 0 ; i < response.length; i++)
            slides.push(response[i]);
    });
 
}]);
    
})();