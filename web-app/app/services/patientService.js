/* Service for Codenet Users */

module.exports = function ($http, BASE_URL) {
    var headers = { 'Content-Type': 'application/json'};
    //var urlBase =  'http://54.218.239.42:5000/api';
    var urlBase = BASE_URL + '/api';

    this.getEcgData = function (id) {
        return $http.get(urlBase + '/' + id);
    };

    this.getPillData = function () {
        return $http.get(urlBase + '/getPillData', { headers: headers});
    };

    this.getPrescriptions = function () {
        return $http.get(urlBase + '/getPrescriptions', { headers: headers});
    };

    this.getMissedPillData = function () {
        return $http.get(urlBase + '/getMissedPillData', { headers: headers});
    };

    this.postPrescription = function (data) {
        return $http.post(urlBase + '/postPrescription', data, { headers: headers});
    }

    this.getAppointments = function () {
        return $http.get(urlBase + '/getAppointments', { headers: headers});
    };

    this.postAppointments = function (data) {
        return $http.post(urlBase + '/postAppointments', data, { headers: headers});
    }

    this.deleteAppointments = function (data) {
        return $http.post(urlBase + '/deleteAppointments', data, { headers: headers});
    }

    this.loginUser = function (user) {
        return $http.post(urlBase + '/login', { params: user });
    };
 };
