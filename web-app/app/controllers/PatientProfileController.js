/* Controller for the Bot Profile Page */
module.exports = function($rootScope, $scope, $sessionStorage, $css, $routeParams, $location) {

    $css.bind({ href: 'css/bot-profile.css'}, $scope);
    $rootScope.header = "Patient Profile Page";

    /*if (!$rootScope.rootCodebot) {
        $location.path('/login');
    } else {
        $scope.codebot = $rootScope.rootCodebot;
    }*/
};