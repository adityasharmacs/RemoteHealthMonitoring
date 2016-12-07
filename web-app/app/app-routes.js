// public/js/appRoutes.js
module.exports = function($routeProvider, $locationProvider) {

    $routeProvider

        // patient home page
        .when('/', {
            templateUrl: '/partials/entry.html',
            controller: 'PatientProfileController'
        })
        // patient home page
        .when('/patient-home', {
            templateUrl: '/partials/patient-home.html',
            controller: 'PatientHomeController'
        })
        // login page
        .when('/login', {
            templateUrl: '/partials/login.html',
            controller: 'LoginController'
        })
        // register page
        .when('/signup', {
            templateUrl: '/partials/register.html',
            controller: 'RegisterController'
        })
        // patient profile page
        /*.when('/patient-profile',{
            templateUrl:'/partials/patient-profile.html',
            controller: 'PatientProfileController'
        })*/
        // patient appointments page
        .when('/patient-appointments',{
            templateUrl:'/partials/patient-appointments.html',
            controller: 'PatientAppointmentController as vm'
        })
        // patient medication page
        .when('/patient-medication',{
            templateUrl:'/partials/patient-medication.html',
            controller: 'PatientMedicationController'
        })

        .otherwise({
            redirectTo: '/'
        });

    $locationProvider.html5Mode(true);
};