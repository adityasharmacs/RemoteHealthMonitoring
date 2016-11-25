/* Controller for the Bot Profile Page */
module.exports = function($rootScope, $scope, $css, patientService, $location, $timeout, socket) {

    $css.bind({ href: 'css/home-profile.css'}, $scope);
    $rootScope.header = "Patient Madication Page";

    /* Real-time data from socket.io */
    socket.on('BottleSensor', function (message) {
        var data = message.data;
        $scope.data[0].values.push({"x":data.Timestamp,"y":data.PillTaken})
    });

    /* Display prescriptions*/
    $scope.getPrescriptions = function (){
        patientService.getPrescriptions()
            .then(function (response) {
                console.log(JSON.stringify(response.data));
                $scope.prescriptions = response.data;
            }, function(error) {
                console.log("ERROR :" + error);
            });
    }

    $scope.getPrescriptions()


    /* Display Pill data*/
    $scope.getPillData = function (){
        patientService.getPillData()
            .then(function (response) {
                $scope.data[0].values = response.data;
            }, function(error) {
                console.log("ERROR :" + error);
            });
    }

    $scope.getPillData()

    /* Display Missed Dosage*/
    $scope.getMissedPillData = function (){
        patientService.getMissedPillData()
        .then(function (response) {
            $scope.data[1].values = response.data;
        }, function(error) {
            console.log("ERROR :" + error);
        });
    }

    $scope.getMissedPillData()

    /* Open model to create new prescription */
    $scope.prescriptionModal = false;
    $scope.modalHeader;
    $scope.openModal = function () {
        $scope.modalHeader = "New Prescription";
        $scope.prescriptionModal =!$scope.prescriptionModal;
    }

    /* Save new prescription*/
    $scope.postContent = {};
    $scope.savePrescription = function() {
        $scope.postContentCopy = angular.copy($scope.postContent);
        $scope.prescriptions.unshift($scope.postContent);
            patientService.postPrescription($scope.postContentCopy)
            .then(function(response) {
                console.log("Post saved successfully");
            }, function(error) {
                console.log("Error: " + JSON.stringify(error));
            });

        $scope.prescriptionModal = false;
        $scope.postContent = null;
    }


    /* MultiBar graph config */
    $scope.options = {
    	chart: {
                type: 'multiBarChart',
                height: 450,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 45,
                    left: 45
                },
                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: true,
                xAxis: {
                    axisLabel: 'Time (ms)',
                    showMaxMin: false,
                    tickFormat: function(d){
                        return d3.format(',f')(d);
                    }
                },
                yAxis: {
                    axisLabel: 'Y Axis',
                    axisLabelDistance: -20,
                    tickFormat: function(d){
                        return d3.format(',.1f')(d);
                    }
                }
            }
    };
    $scope.data = [
    	{
    		"key":"Pills Taken",
            "values": []
    		//"values":[{"x":0,"y":0.13666636608670263},{"x":1,"y":0.16579580570119906},{"x":2,"y":0.17562752497016257},{"x":3,"y":0.100014717991466},{"x":4,"y":0.14828593429097547},{"x":5,"y":0.18341089029720362},{"x":6,"y":0.19598953243603695},{"x":7,"y":0.17797249914314328}]
    	},{
    		"key":"Missed Dosage",
    		"values": []
    		//"values":[{"x":0,"y":0.13666636608670263},{"x":1,"y":0.16579580570119906},{"x":2,"y":0.17562752497016257},{"x":3,"y":0.100014717991466},{"x":4,"y":0.14828593429097547},{"x":5,"y":0.18341089029720362},{"x":6,"y":0.19598953243603695},{"x":7,"y":0.17797249914314328}]
    	}];


        /* Date config for model */
        //check date difference
        $scope.checkErr = function(startDate,endDate) {
            $scope.errMessage = '';
            var curDate = new Date();

            if(new Date(startDate) > new Date(endDate)){
              $scope.errMessage = 'End Date should be greater than start date';
              return false;
            }
        };

        $scope.today = function() {
            $scope.start = new Date();
            $scope.end = new Date();
        };
        $scope.today();

        $scope.clear = function() {
            $scope.start = null;
            $scope.end = null;
        };

        $scope.inlineOptions = {
          customClass: getDayClass,
          minDate: new Date(),
          showWeeks: true
        };

        $scope.dateOptions = {
          dateDisabled: disabled,
          formatYear: 'yy',
          maxDate: new Date(2020, 5, 22),
          minDate: new Date(),
          startingDay: 1
        };

        // Disable weekend selection
        function disabled(data) {
            var date = data.date,
            mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
        }

        $scope.openStart = function() {
            $scope.popupStart.opened = true;
        };

        $scope.openEnd = function() {
          $scope.popupEnd.opened = true;
        };
        $scope.format = 'dd-MMMM-yyyy';

        $scope.popupStart = {
          opened: false
        };

        $scope.popupEnd = {
          opened: false
        };

        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        var afterTomorrow = new Date();
        afterTomorrow.setDate(tomorrow.getDate() + 1);
        $scope.events = [
            {
              date: tomorrow,
              status: 'full'
            },
            {
              date: afterTomorrow,
              status: 'partially'
            }
          ];

          function getDayClass(data) {
            var date = data.date,
              mode = data.mode;
            if (mode === 'day') {
              var dayToCheck = new Date(date).setHours(0,0,0,0);

              for (var i = 0; i < $scope.events.length; i++) {
                var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

                if (dayToCheck === currentDay) {
                  return $scope.events[i].status;
                }
              }
            }

            return '';
          }
        /* End date config */
};