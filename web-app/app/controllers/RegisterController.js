/* Controller for the Register Page */
module.exports = function($rootScope, $scope, $sessionStorage, $css, loginService, $location) {

    $css.bind({ href: 'css/login-form.css'}, $scope);
    $rootScope.header = "Registration";
    $rootScope.rootUser = {};
    $rootScope.rootCodebot = {};
    $scope.isSuccess = true;
    $scope.user = {};

    $scope.xhr = false;
    $scope.redirect = false;

    $scope.registerObj = {
        role: 'user'
    };

    $scope.submit = function (formInstance) {
        
        $scope.xhr = true;
        patientService.registerUser($scope.registerObj)
        .then(function (data, status, headers, config) {
          console.log('post success - ', data);
          $scope.xhr = false;
          $scope.redirect = true;
          $timeout(function () {
            $state.go('app.home');
          }, 2000);
        })
        .error(function (data, status, headers, config) {
          data.errors.forEach(function (error, index, array) {
            formInstance[error.field].$error[error.name] = true;
          });
          formInstance.$setPristine();
          console.info('post error - ', data);
          $scope.xhr = false;
        });
    };
};