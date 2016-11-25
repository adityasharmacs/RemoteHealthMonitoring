//require('angular')

// Importing Routes
var appRoutes = require('./app-routes');

// Importing Controller functions
var MainController = require('./controllers/MainController');
var RegisterController = require('./controllers/RegisterController');
var LoginController = require('./controllers/LoginController');
var PatientAppointmentController = require('./controllers/PatientAppointmentController');
var PatientHomeController = require('./controllers/PatientHomeController');
var PatientProfileController = require('./controllers/PatientProfileController');
var PatientMedicationController = require('./controllers/PatientMedicationController');

// Importing Service functions
var patientService = require('./services/patientService');
var loginService = require('./services/loginService');

// Importing Directive functions
var statusPopover = require('./directives/statusPopover');
var modal = require('./directives/modal');
var socketIO = require('./factory/socketIO');


// Initializing Codenet App
var app = angular.module('codenet-app', [require('angular-route'), require('angular-css'), 'Service', 'angularMoment', 'ngStorage', 'angular.backtop', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ui.bootstrap.datetimepicker', 'nvd3', 'kendo.directives']);

// Configuring Codenet Routes
app.config(appRoutes);

// Adding Codenet Controllers
app.controller('MainController', ['$scope', '$sessionStorage', '$location', MainController])
app.controller('RegisterController', ['$rootScope', '$scope', '$sessionStorage', '$css', 'loginService', '$location', RegisterController])
app.controller('LoginController', ['$rootScope', '$scope', '$sessionStorage', '$css', 'patientService', 'loginService', '$location', LoginController])
app.controller('PatientAppointmentController', ['$scope','$css', 'patientService', '$location', '$timeout', 'socket', PatientAppointmentController])
app.controller('PatientProfileController', ['$rootScope', '$scope', '$sessionStorage','$css', 'patientService', '$location', '$timeout', PatientProfileController])
app.controller('PatientHomeController', ['$rootScope', '$scope', '$css', 'patientService', '$location', '$timeout', 'socket', PatientHomeController])
app.controller('PatientMedicationController', ['$rootScope', '$scope','$css', 'patientService', '$location', '$timeout', 'socket', PatientMedicationController])

// Adding Codenet Services
app.service('patientService', ['$http', 'BASE_URL', patientService]);
app.service('loginService', ['$http', 'BASE_URL', loginService]);

// Adding Codenet Directives
app.directive('statusPopover', [ '$compile', statusPopover]);
app.directive('modal', [ modal]);
app.factory('socket', ['$rootScope', socketIO]);



angular.module("Service", [])
.constant("BASE_URL", "http://localhost:5000");
