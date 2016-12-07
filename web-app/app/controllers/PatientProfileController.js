/* Controller for the Bot Profile Page */
module.exports = function($rootScope, $scope, $sessionStorage, $css, $routeParams, $location) {
	$css.bind({ href: 'css/index.css'}, $scope);
    $rootScope.header = "Patient Dashboard";

};