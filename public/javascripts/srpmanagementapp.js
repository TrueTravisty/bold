'use strict';

/* App Module */

var srpmanagementApp = angular.module('srpmanagementApp', [
  'ngRoute',
  'srpmanagementControllers'
]);

srpmanagementApp.config(['$routeProvider',
  function($routeProvider) {
      $routeProvider.
        when('/requests', {
          templateUrl : 'partials/requests.html',
          controller: 'SrpRequestCtrl'
        }).
        when('/ships', {
          templateUrl: 'partials/ships.html',
          controller: 'ShipListCtrl'
        }).
        when('/ship/:shipid', {
          templateUrl: 'partials/ship.html',
          controller: 'ShipInfoCtrl'
        }).
        otherwise({
          redirectTo: '/requests'
        });
  }]);
