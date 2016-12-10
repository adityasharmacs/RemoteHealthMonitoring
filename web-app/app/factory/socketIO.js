/* Factory for the SocketIO */
module.exports = function ($rootScope) {
	var socket = io.connect('ws://54.153.58.201:5000');
	//var socket = io.connect('ws://localhost:5000');
	socket.connect
	return {
	    on: function (eventName, callback) {
	      socket.on(eventName, function () {
	        var args = arguments;
	        $rootScope.$apply(function () {
	          callback.apply(socket, args);
	        });
	      });
		},
	    emit: function (eventName, data, callback) {
	      socket.emit(eventName, data, function () {
	        var args = arguments;
	        $rootScope.$apply(function () {
	          if (callback) {
	            callback.apply(socket, args);
	          }
	        });
	      })
	  	}
	};

};