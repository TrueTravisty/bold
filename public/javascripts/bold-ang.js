
(function() {
var app = angular.module('bold', ['ui.bootstrap', 'ngTouch', 'ngNumeraljs']);

app.controller('MainCtrl', ['$scope', function($scope) {
    
}]);


app.directive('killList', function() {
    return {
        restrict: 'EA',
        templateUrl: '/templates/killlist.html',
        scope: {
            kills: "=",
            showSrp: "="
        }
    }
})

app.directive('killMail', function() {
    return {
        restrict: 'A',        
        templateUrl: '/templates/killmail.html',
        scope: {
            kill: "=",
            showSrp: "="
        }
        
    }
})

app.config(['$numeraljsConfigProvider', function ($numeraljsConfigProvider) {
    $numeraljsConfigProvider.setFormat('iska', '0.0a');
    $numeraljsConfigProvider.setFormat('isk', '0,0.00 ISK');
    
}]);

app.controller('FrontPageCarouselCtrl', ['$scope', '$http', function ($scope, $http) {
  $scope.myInterval = 5000;
  $scope.noWrapSlides = false;

  var slides= $scope.slides = [];
 
  $http.get('frontslides.json').success(function(response) {
        for (var i = 0 ; i < response.length; i++)
            slides.push(response[i]);
    });
 
}]);

app.controller('LatestKillsCtrl', ['$scope', '$http', function ($scope, $http) {
    var kills = $scope.kills = [];    
    $http.get('/corpkills/5').success(function(response) {
        addKills(response, kills);    
    });    
}]);

app.controller('LatestLossesCtrl', ['$scope', '$http', function ($scope, $http) {
    var kills = $scope.kills = [];
    $http.get('/corplosses/5').success(function(response) {
        addKills(response, kills);    
    });    
}]);

app.controller('LargestKillsCtrl', ['$scope', '$http', function ($scope, $http) {
    var kills = $scope.kills = [];    
    $http.get('/corpkills/top/14/5').success(function(response) {
        addKills(response, kills);    
    });    
}]);

app.controller('LargestLossesCtrl', ['$scope', '$http', function ($scope, $http) {
    var kills = $scope.kills = [];
    $http.get('/corplosses/top/14/5').success(function(response) {
        addKills(response, kills);    
    });    
}]);

app.controller('SrpLossListCtrl',  ['$scope', '$http', function ($scope, $http) {
    var kills = $scope.kills = [];
    $scope.page = 1;
    
    $scope.addLosses = function() { 
        $http.get('/charloss/5/' + $scope.page++).success(function(response) {
            addKills(response, kills);
        });
    }
    
    $scope.addLosses();    
}]);

app.controller('BuybackCtrl', ['$scope', '$http', function ($scope, $http) {
    $scope.items='';
    $scope.value = 0;
    
    $scope.checkValue = function(items) {
        $http.post('/buyback', {raw_paste: items}).success(function(response){
            $scope.value=response;
        });
    }    
    
}]);


function addKills(response, kills) {
    var curdate;
    if (kills.length > 0) {
        var k = kills[kills.length - 1];
        curdate = k.curdate;
    }
    for (var i = 0; i < response.length; i++) {
            var k = response[i];
            var kill = {};
            kill.id = k.killID;
            var kd = new Date(k.killTime);
            var d = new Date(kd.getUTCFullYear(), kd.getUTCMonth(), kd.getUTCDate(), 0, 0, 0, 0)
            if (!curdate || d.getDate() != curdate.getDate() || d.getMonth() != curdate.getMonth()) {
                curdate = d;
                kill.newdate = curdate;
            }
            kill.curdate = curdate;
            var h = kd.getHours()
            if (h < 10) h = "0" + h;
            var m = kd.getMinutes();
            if (m < 10) m = "0" + m;
            kill.time = h + ":" + m;
            kill.value = k.zkb.totalValue;
            kill.shipId = k.victim.shipTypeID;
            kill.system = k.solarSystemName;
            kill.victim = {
                id: k.victim.characterID,
                name: k.victim.characterName,
                ship: k.victim.shipType 
            }
            kills.push(kill);            
    }
}

})();

