/* Controller for the Home Page */
module.exports = function($rootScope, $scope, $css, patientService, $location, $timeout, socket, calendarConfig) {

	$css.bind({ href: 'css/home-profile.css'}, $scope);
    $rootScope.header = "Patient Appointment Page";

    var vm = this;

    //These variables MUST be set as a minimum for the calendar to work
    vm.calendarView = 'month';
    vm.viewDate = new Date();
    var actions = [/*{
      label: '<i class=\'glyphicon glyphicon-pencil\'></i>',
      onClick: function(args) {
        console.log('Edited', args.calendarEvent);
      }
    }, */{
      label: '<i class=\'glyphicon glyphicon-remove\'></i>',
      onClick: function(args) {
      	patientService.deleteAppointments(args.calendarEvent)
      	.then(function(response) {
                console.log("Post deleted successfully");
                vm.getAppointment();
        }, function(error) {
                console.log("Error: " + JSON.stringify(error));
        }); 
        //console.log('Deleted', args.calendarEvent);
      }
    }];

    vm.events = [];
    vm.getAppointment = function() {
    	patientService.getAppointments()
            .then(function(response) {
            	vm.events = [];
            	for(var i=0; i < response.data.length; i++){
            	response.data[i].startsAt = new Date(response.data[i].startsAt);
            	response.data[i].endsAt = new Date(response.data[i].endsAt);
            	response.data[i].actions = actions;
            	response.data[i].color = calendarConfig.colorTypes.important;
            	vm.events.push(response.data[i])
        		};

            }, function(error) {
                console.log("Error: " + JSON.stringify(error));
        });
    }

    vm.getAppointment()

    vm.cellIsOpen = true;

    $scope.appointmentModal = false;
    $scope.modalHeader;
    $scope.newEvent;
    $scope.openNew = function () {
    	$scope.newEvent = {
        	title: 'New event',
        	startsAt: moment().startOf('day').toDate(),
        	endsAt: moment().endOf('day').toDate(),
        	draggable: true,
        	resizable: true
      	};
        $scope.appointmentModal =!$scope.appointmentModal;
    }

    vm.addEvent = function(event) {
      $scope.appointmentModal = false;
      patientService.postAppointments(event)
            .then(function(response) {
                console.log("Post saved successfully");
                vm.getAppointment();
            }, function(error) {
                console.log("Error: " + JSON.stringify(error));
        });
    };

    vm.eventClicked = function(event) {
      console.log('Clicked', event);
    };

    vm.eventEdited = function(event) {
      alert('Edited', event);
    };

    vm.eventDeleted = function(event) {
      patientService.deleteAppointments(event)
      	.then(function(response) {
                console.log("Post deleted successfully");
                vm.getAppointment();
        }, function(error) {
                console.log("Error: " + JSON.stringify(error));
        }); 
    };

    vm.eventTimesChanged = function(event) {
      alert('Dropped or resized', event);
    };

    vm.toggle = function($event, field, event) {
      $event.preventDefault();
      $event.stopPropagation();
      event[field] = !event[field];
    };

    vm.timespanClicked = function(date, cell) {

      if (vm.calendarView === 'month') {
        if ((vm.cellIsOpen && moment(date).startOf('day').isSame(moment(vm.viewDate).startOf('day'))) || cell.events.length === 0 || !cell.inMonth) {
          vm.cellIsOpen = false;
        } else {
          vm.cellIsOpen = true;
          vm.viewDate = date;
        }
      } else if (vm.calendarView === 'year') {
        if ((vm.cellIsOpen && moment(date).startOf('month').isSame(moment(vm.viewDate).startOf('month'))) || cell.events.length === 0) {
          vm.cellIsOpen = false;
        } else {
          vm.cellIsOpen = true;
          vm.viewDate = date;
        }
      }

    };


};