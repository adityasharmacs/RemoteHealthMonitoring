// Node Server for running the web client

var express = require('express')
var serveStatic = require('serve-static')
var mqtt = require('mqtt');
var url = require('url');
var bodyParser = require('body-parser');
var app = express();
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var Agenda = require('agenda');
var transporter = nodemailer.createTransport('smtps://sayalee.agashe%40gmail.com:Password@smtp.gmail.com')
/*var elasticsearch = require('elasticsearch');
var elastic_client = new elasticsearch.Client({
            host: '54.153.13.72:9200',
            log: 'trace'
    });*/


var db = mongoose.connect('mongodb://admin:admin@ds053216.mlab.com:53216/healthmonitoring');

var prescriptionSchema = new mongoose.Schema({
  name: String
, startTime: Date
, note: String
, endTime: Date
, recurrence: String
});


var Collection = db.model('prescriptions', prescriptionSchema);

var lastPillName, lastPillTime;
var lastReminderName, lastPillReminderTime;



/* MQTT Config */
var client = mqtt.connect({ host: '54.244.148.72', port: 1883 });
client.subscribe('ecg-filtered-readings');
client.subscribe('pill-bottle-readings');
client.subscribe('motion-sensor-readings');
client.subscribe('heartrate-readings');
client.subscribe('ecg-prediction');


/* Socket-io connection */
app.use(serveStatic('./public'))
var io = require('socket.io').listen(app.listen(5000));

io.sockets.on('connection', function (socket) {
	client.on('message', function(topic, message, packet) {
	            if(topic == "ecg-filtered-readings")
	            {
	                socket.emit('EcgSensor', {"data": JSON.parse(message)});
	            }
	            else if(topic == "pill-bottle-readings")
	            {
	                socket.emit('BottleSensor', {"data": JSON.parse(message)});
	            }
	            else if(topic == "motion-sensor-readings")
	            {
	            	socket.emit('MotionSensor', {"data": JSON.parse(message)});
	            }
                else if(topic == "heartrate-readings")
                {
                    socket.emit('HeartRate', {"data": JSON.parse(message)});
                }
                else if(topic == "ecg-prediction")
                {
                    socket.emit('Prediction', {"data": JSON.parse(message)});
                }
	});
});

/* Agenda Job scheduler */
var agenda = new Agenda({db: {address: 'mongodb://admin:admin@ds053216.mlab.com:53216/healthmonitoring', collection: "jobs"}});

agenda.define('First1', function(job) {
    var d = new Date();
    console.log("Hello First Job at " + d );
});

agenda.on('ready', function() {
    agenda.every('5 seconds', 'First1');
    agenda.start();
});


/* CORS */
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


/* Pill bottle data HTTP from elasticsearch */

    app.get('/api/getPillData', function(request, response) {
        response.jsonp("I am working");
    });


/* Missed dosage data HTTP from MongoDB */

    app.get('/api/getMissedPillData', function(request, response) {
        /*Collection.find(function(err, prescriptions) {
          if (err) return console.error(err);
          response.jsonp(prescriptions);
        });*/
    });

/* MongoDB HTTP to get all prescriptions */

    app.get('/api/getPrescriptions', function(request, response) {
        Collection.find(function(err, prescriptions) {
          if (err) return console.error(err);
          console.dir(prescriptions);
          response.jsonp(prescriptions);
        });
    });

/* MongoDB HTTP to add prescription */

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    app.post('/api/postPrescription', function(request, response) {
        console.log(request.body)
        var newEntry = new Collection({
            name: request.body.name,
            startTime: request.body.startTime,
            note: request.body.note,
            endTime: request.body.endTime,
            recurrence: request.body.recurrence,
          });

        newEntry.save(function(err, newEntry) {
          if (err) return console.error(err);
          console.dir(newEntry);
          response.jsonp([]);
        });
    });

/* MongoDB HTTP call to update prescriptions */
    /*app.get('/api/update-prescription', function(request, response) {
            var url_parts = url.parse(request.url, true);
            var values = JSON.parse(url_parts.query.models);
            console.log("###########" + JSON.stringify(values))
            //var temp = '58327b50b2992b19effc82e0'

            var conditions = { _id: values[values.length - 1]._id }
              , update = {
                        IsAllDay: values[values.length - 1].IsAllDay,
                        End: values[values.length - 1].End,
                        Description: values[values.length - 1].Description,
                        StartTimezone: values[values.length - 1].StartTimezone,
                        Start: values[values.length - 1].Start,
                        RecurrenceException: values[values.length - 1].RecurrenceException,
                        TaskID: values[values.length - 1].TaskID,
                        OwnerID: values[values.length - 1].OwnerID,
                        RecurrenceID: values[values.length - 1].RecurrenceID,
                        EndTimezone: values[values.length - 1].EndTimezone,
                        RecurrenceRule: values[values.length - 1].RecurrenceRule,
                        Title: values[values.length - 1].Title
                      }
              , options = { multi: true };

            Collection.update(conditions, update, options, callback);

            function callback (err, numAffected) {
                if (err) return console.error(err);
                response.jsonp([]);
            }
        });*/

/* MongoDB HTTP call to delete prescription */

    /*app.delete('/api/delete-prescription', function(request, response) {
        console.log("I AM HERE IN DELETE")
        var url_parts = url.parse(request.url, true);
        var values = JSON.parse(url_parts.query.models);
        console.log("###########" + values)
        Collection.remove({ _id: values[values.length - 1]._id }, function(err) {//values[0]._id
            if (err) return console.error(err);
            response.jsonp([]);
        });

    });*/

/* Send Notification */


/* Send Alerts */
    app.get('/api/alert', function(req, res) {
        res.send({"AlertCount": countalert, "AlertVal": alertArr});
    });

/* Reset notifications and alerts */
    app.get('/api/notificationSet', function(req, res){
        counterui = 0;
        notificationArr = [];
        res.header("Access-Control-Allow-Origin", "*");
        res.send("OK");
    });


    app.get('/api/alertSet', function(req, res){
        countalert = 0;
        var alertArr = [];
        res.header("Access-Control-Allow-Origin", "*");
        res.send("OK");
    });


/* Generate Pill Reminders */
var reminders = function() {
    Collection.find(function(err, prescriptions) {
        if (err) return console.error(err);
        for(var i = 0; i < prescriptions.length; i++) {
            var rule;
            if(prescriptions[i].Recurrence == 'Daily') {
                rule = '30 2 * * *'
            }
            else if(prescriptions[i].Recurrence == 'Weekly') {
                rule = {hour: 2, minute: 30, dayOfWeek: 0}
            }
            else if(prescriptions[i].Recurrence == 'Monthly') {
                rule = '30 2 1 * *'
            }
            /*schedule.scheduleJob(prescriptions[i].Name, { start: prescriptions[i].Start, end: prescriptions[i].End, rule: rule }, function(){
              socket.emit('Reminder', {"data": "Pill Reminder"});
            });*/
        }
    });
}


/* Delete Reminder */
/* Update Reminder */

//url rewriting for browser reload
/*app.get('*', function(req, res, next) {
 res.sendfile(__dirname + '/public/index.html');
});*/