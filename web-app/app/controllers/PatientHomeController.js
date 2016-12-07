/* Controller for the Patient Profile Page */
module.exports = function($rootScope, $scope, $css, patientService, $location, $timeout, socket) {

    $css.bind({ href: 'css/home-profile.css'}, $scope);
    $rootScope.header = "Patient's Dashboard";

    socket.on('connect', function() {
        console.log("Connected to socketIO");
    });

    socket.on('MotionSensor', function (message) {
        var data = message.data;
        $scope.activity = data.Activity;
        $scope.bodyTemp = data.BodyTemperature;
        $scope.outsideTemp = data.AmbientTemperature;
        $scope.humidity = data.Humidity;
        $scope.light = data.Light;
        $scope.dateTemp = new Date();//data.Timestamp;
        $scope.data[2].values.push({"x":$scope.dateTemp * 1000 ,"y":data.BodyTemperature})
        $scope.data[3].values.push({"x":$scope.dateTemp * 1000 ,"y":data.AmbientTemperature})
    });

    socket.on('EcgSensor', function (message) {
        //var ecgArr = [];
        $scope.data[1].values = [];
        for(var i=0; i < message.data.heart.length; i++){
            $scope.data[1].values.push({"x":message.data.timestamp[i], "y": message.data.heart[i] / 1000})
        };
    });

    socket.on('BottleSensor', function (message) {
        var data = message.data;
        $scope.dateTemp = new Date();
        $scope.data[0].values.push({"x":data.timestamp,"y":data.pillTaken})
    });

    socket.on('HeartRate', function (message) {
        $scope.heartrate = parseInt(message.data);
    });

    socket.on('Prediction', function (message) {
        //$scope.prediction = message.data.prediction;
        $scope.prediction = 'Normal';
    });

    /* Chart options */
            $scope.options = {
            chart: {
                type: 'linePlusBarChart',
                height: 520,
                margin: {
                    top: 30,
                    right: 75,
                    bottom: 10,
                    left: 75
                },
                bars: {
                    forceY: [0]
                },
                bars2: {
                    forceY: [0]
                },
                color: ['#48A36D', '#7FB1CF', '#B681BE', '#DC647E'],
                x: function(d,i) { return i },
                xAxis: {
                    axisLabel: 'Time',
                    tickFormat: function(d) {
                        var dx = $scope.data[0].values[d] && $scope.data[0].values[d].x || 0;
                        if (dx > 0) {
                            console.log(d3.time.format('%x')(new Date()))
                            return d3.time.format('%x')(new Date())//dx
                        }
                        return null;
                    }
                },
                x2Axis: {
                    tickFormat: function(d) {
                        //var dx = $scope.data[0].values[d] && $scope.data[0].values[d].x || 0;
                        return d3.time.format('%H:%M:%S')(new Date(d))//%b-%Y
                    },
                    showMaxMin: false
                },
                y1Axis: {
                    axisLabel: 'No. of Pills',
                    tickFormat: function(d){
                        return d3.format(',f')(d);
                    },
                    axisLabelDistance: 12
                },
                y2Axis: {
                    axisLabel: 'C',
                    tickFormat: function(d) {
                        return d3.format(',.2f')(d)
                    }
                },
            }
        };

    /* Chart data */
    $scope.data = [
            {
                "key" : "Pills Taken" ,
                "bar": true,
                "values" : [ ]
            },
            {
                "key" : "ECG" ,
                "values" : [ ]
            },
            {
                "key" : "Body Temp" ,
                "values" : [ ]
            },
            {
                "key" : "Outside Temp" ,
                "values" : [ ]
            }
        ].map(function(series) {
                series.values = series.values.map(function(d) { return {x: d[0], y: d[1] } });
                return series;
            });

};
