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
        $scope.dateTemp = data.Timestamp;
        $scope.data[2].values.push({"x":data.Timestamp,"y":data.BodyTemperature})
        $scope.data[3].values.push({"x":data.Timestamp,"y":data.AmbientTemperature})
    });

    socket.on('EcgSensor', function (message) {
        var ecgArr = [];
        angular.forEach(message.data, function(d) {
            ecgArr.push({"x":d.timestamp, "y": d.filteredEcgData})
        });
        $scope.data[1].values = message.data;
    });

    socket.on('BottleSensor', function (message) {
        console.log("Pill bottle data : " + message.data);
        //var data = message.data;
        //$scope.data[0].values.push({"x":data.Timestamp,"y":data.PillTaken})
    });

    socket.on('HeartRate', function (message) {
        $scope.heartrate = message.data.heartrate
    });

    socket.on('Prediction', function (message) {
        $scope.prediction = message.data.prediction;
    });


    /* Chart options */
            $scope.options = {
            chart: {
                type: 'linePlusBarChart',
                height: 500,
                margin: {
                    top: 30,
                    right: 75,
                    bottom: 50,
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
                            return d3.time.format('%x')(new Date(dx))
                        }
                        return null;
                    }
                },
                x2Axis: {
                    tickFormat: function(d) {
                        var dx = $scope.data[0].values[d] && $scope.data[0].values[d].x || 0;
                        return d3.time.format('%b-%Y')(new Date(dx))
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
                //"values" : [ [ 1136005200000 , 1271000.0] , [ 1143781200000 , 0] , [ 1146369600000 , 0] , [ 1149048000000 , 0] , [ 1180584000000 , 2648493.0] , [ 1183176000000 , 2522993.0] , [ 1185854400000 , 2522993.0] , [ 1188532800000 , 2522993.0] , [ 1191124800000 , 2906501.0] , [ 1193803200000 , 2906501.0] , [ 1196398800000 , 2906501.0] , [ 1199077200000 , 2206761.0] , [ 1201755600000 , 2206761.0] , [ 1204261200000 , 2206761.0] , [ 1206936000000 , 2287726.0] , [ 1209528000000 , 2287726.0] , [ 1212206400000 , 2287726.0] , [ 1214798400000 , 2732646.0] , [ 1217476800000 , 2732646.0] , [ 1220155200000 , 2732646.0] , [ 1222747200000 , 2599196.0] , [ 1225425600000 , 2599196.0] , [ 1228021200000 , 2599196.0] , [ 1230699600000 , 1924387.0] , [ 1233378000000 , 1924387.0] , [ 1235797200000 , 1924387.0] , [ 1238472000000 , 1756311.0] , [ 1241064000000 , 1756311.0] , [ 1243742400000 , 1756311.0] , [ 1246334400000 , 1743470.0] , [ 1249012800000 , 1743470.0] , [ 1251691200000 , 1743470.0] , [ 1254283200000 , 1519010.0] , [ 1256961600000 , 1519010.0] , [ 1259557200000 , 1519010.0] , [ 1262235600000 , 1591444.0] , [ 1264914000000 , 1591444.0] , [ 1267333200000 , 1591444.0] , [ 1270008000000 , 1543784.0] , [ 1272600000000 , 1543784.0] , [ 1275278400000 , 1543784.0] , [ 1277870400000 , 1309915.0] , [ 1280548800000 , 1309915.0] , [ 1283227200000 , 1309915.0] , [ 1285819200000 , 1331875.0] , [ 1288497600000 , 1331875.0] , [ 1291093200000 , 1331875.0] , [ 1293771600000 , 1331875.0] , [ 1296450000000 , 1154695.0] , [ 1298869200000 , 1154695.0] , [ 1301544000000 , 1194025.0] , [ 1304136000000 , 1194025.0] , [ 1306814400000 , 1194025.0] , [ 1309406400000 , 1194025.0] , [ 1312084800000 , 1194025.0] , [ 1314763200000 , 1244525.0] , [ 1317355200000 , 475000.0] , [ 1320033600000 , 475000.0] , [ 1322629200000 , 475000.0] , [ 1325307600000 , 690033.0] , [ 1327986000000 , 690033.0] , [ 1330491600000 , 690033.0] , [ 1333166400000 , 514733.0] , [ 1335758400000 , 514733.0]]
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
