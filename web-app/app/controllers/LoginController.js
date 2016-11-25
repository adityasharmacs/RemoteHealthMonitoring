/* Controller for the Login Page */
module.exports = function($rootScope, $scope, $sessionStorage, $css, patientService, loginService, $location) {

    $css.bind({ href: 'css/login-form.css'}, $scope);
    $rootScope.header = "Login to Codenet";
    $rootScope.rootUser = {};
    $rootScope.rootCodebot = {};
    $scope.isSuccess = true;
    $scope.user = {};

    $scope.submitForm = function(user) {
    {
       /*loginService.getUser(user.id, user.password)
    		.then(function(response) {
                $rootScope.rootUser = response;
                $sessionStorage.rootUser = response.data;
                $scope.user = {};
    			$location.path('/user-home');
    		}, function(error) {
                console.log("Error is : " + JSON.stringify(error));
                $sessionStorage.rootUser = {"sAMAccountName": user.id, "mail": user.id + "@cisco.com", "displayName": user.id };
                $location.path('/user-home');
    			//$scope.user = {};
    			//$scope.isSuccess = false;
    	});*/
        $location.path('/patient-home');
      }
    }
};