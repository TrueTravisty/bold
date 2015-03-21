'use strict';

/* Controllers */

var srpmanagementControllers = angular.module('srpmanagementControllers', []);

srpmanagementControllers.controller('SrpRequestCtrl', ['$scope', '$http',
  function($scope, $http){

  }]);

  srpmanagementControllers.controller('ShipListCtrl', ['$scope', '$http',
  function($scope, $http){
    $http.get('/admin/srp/insurance/all').success(function(data) {
      $scope.ships = data;
      for (var i = 0, l = $scope.ships.length; i < l; ++i) {
        var ship = $scope.ships[i];
        if (!ship.srpFactor) ship.srpFactor = 0.9;
        ship.insuranceIsk = numeral()
      }
    });
  }]);
