(function() {
 
 var app = angular.module('bold');
 
 app.directive('killList', function() {
    return {
        restrict: 'EA',
        templateUrl: '/templates/killlist.html',
        scope: {
            kills: "=",
            showSrp: "=",
            requestSrp: "&"
        }
    }
})

app.directive('killMail', function() {
    return {
        restrict: 'A',        
        templateUrl: '/templates/killmail.html',
        scope: {
            kill: "=",
            showSrp: "=",
            requestSrp: "&"
        }
        
    }
})

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
    
    $scope.requestSrp = function(kill) {
        if (!kill) return;
        
        var name = kill.victim.name.replace(" ", "+");
        var zkill = 'https://zkillboard.com/kill/' + kill.id;
        var ship = kill.victim.ship;
        var sclass = kill.victim.sclass;
        var isk = kill.value;
        var system = kill.system;
        
        var url="https://docs.google.com/forms/d/1mCuTFEOlPEV0bVrGllzvdoHMGVbu2rm89YTQTEVQgGQ/viewform?entry.9614536="+kill.victim.name+
            "&entry.1850675988="+zkill+
            "&entry.884950497="+ship+
            "&entry.334392335="+sclass+
            "&entry.808596200="+isk+
            "&entry.1843731024="+system;
    
        window.open(url, '_blank');
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
                ship: k.victim.shipType,
                sclass: k.victim.shipClass 
            }
            kills.push(kill);            
    }
}
     
})();