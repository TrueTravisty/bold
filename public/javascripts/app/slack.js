(function() {
    
var app = angular.module('bold');

app.controller('SlackCtrl', ['$scope', '$http', function ($scope, $http) {
    var getStatus = function() {
        $http.get('/slackinfo.json').success(function(response) {
            $scope.status = response.status;
            $scope.member = response.member;
        });
    };
    
    getStatus();
    
    $scope.register = function(email) {
        if (!email || !$scope.slackForm.$valid)
            return; 
        $http.post('/slack', {email:email}).success(function(result){
            switch(result) {
                case 'OK':
                    $scope.alerts.push({type: 'success', msg: 'Slack invite sent to ' + email + '. Check your email.'});
                    $scope.status = 'invite_sent';
                    break;
                case 'invalid_email':
                    $scope.alerts.push({type: 'warning', msg: 'Invalid email address. Please provide a proper address.'});
                    break;
                case 'already_in_team':
                    $scope.alerts.push({type: 'info', msg: 'There is already a user registered with that email.'});
                    break;
                case 'already_invited':
                    $scope.alerts.push({type: 'info', msg: 'An invitation has already been sent to that email. Contact Yaldo Asanari to get it resent.'});
                    break;
                case 'ERROR':
                    $scope.alerts.push({type: 'danger', msg: 'Something went wrong when trying to add the user to slack. If this persist, email Yaldo Asanari or the corp CEO for a Slack invite.'});
            }
            email = "";
               
        });  
        
    }
        
}]);

    
})();