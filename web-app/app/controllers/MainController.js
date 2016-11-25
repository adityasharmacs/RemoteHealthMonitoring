module.exports = function($scope, $sessionStorage, $location) {
	$scope.$storage = $sessionStorage;

	$scope.resetStorage = function(){
		$sessionStorage.$reset();
	}
}