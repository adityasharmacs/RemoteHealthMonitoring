// Node Server for running the web client

var express = require('express')
var serveStatic = require('serve-static')
var mqtt = require('mqtt');
var url = require('url');
var bodyParser = require('body-parser');
var app = express();
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var twilio = require('twilio');
var Agenda = require('agenda');
var elasticsearch = require('elasticsearch');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://healthmonitoring295%40gmail.com:project295@smtp.gmail.com');
var twilio_client = twilio('ACfefad1895f88022fdbf51116f86454cc', 'b541243b2c242b0a34481a3a2fd06be5');
var elastic_client = new elasticsearch.Client({
            host: '54.67.110.169:9200',
            log: 'trace'
    });

var db = mongoose.connect('mongodb://admin:admin@ds053216.mlab.com:53216/healthmonitoring');

var prescriptionSchema = new mongoose.Schema({
  name: String
, startTime: Date
, note: String
, endTime: Date
, recurrence: String
, hours: Number
, minutes: Number
, period: String
});

var appointmentSchema = new mongoose.Schema({
    title: String
,   startsAt: Date
,   endsAt: Date
,   draggable: Boolean
,   resizable: Boolean
})

var missedDosageSchema = new mongoose.Schema({
  pillName: String
, timestamp: Date
, pillNumber: Number
});

var Collection = db.model('prescriptions', prescriptionSchema);
var AppointmentsCollection = db.model('appointments', appointmentSchema);
var MissedPillCollection = db.model('missedDosage', missedDosageSchema);
var lastPillName, lastPillTime = 0;
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
                    //console.log("ecg data" + JSON.parse(message));
	            }
	            else if(topic == "pill-bottle-readings")
	            {
                    var msg = JSON.parse(message)
	                lastPillName = message.pillName;
                    lastPillTime = message.timestamp;
                    //console.log("Pill data " + msg)
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


/* Save missed dosage */
var saveMissedDosage = function(name, quantity) {
    var newEntry = new MissedPillCollection({
        pillName: name,
        timestamp: new Date().getTime() - 3600000,
        pillNumber: quantity,
    });
    newEntry.save(function(err, newEntry) {
        if (err) return console.error(err);
        console.dir(newEntry);
    });
}
/* Send email */
var sendEmail = function(type, message) {

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"HealthMonitor 👥" <healthmonitoring295@.com>', // sender address
        to: 'sayalee.agashe@sjsu.edu', // list of receivers
        subject: type, // Subject line
        text: message, // plaintext body
        html: '<b>' + message + '</b>' // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });

    // Send the text message.
    twilio_client.sendMessage({
      to: '+14152617478',
      from: '+14159657103',
      body: message
    });
}


var sendReminders = function(events) {
    if(events.length > 0) {
    for(var i=0; i < events.length; i++) {
        (function (i) {
        if(events[i].name!=undefined || events[i].name!= null) {
        var name = events[i].name;
        var start = new Date(events[i].startTime).getTime();
        var end = new Date(events[i].endTime).getTime();
        var currentDate = new Date().getTime();
        var alertName = "alert-" + name;
        var hours;
        if(events[i].period == 'PM') {
            hours = events[i].hours + 12;
            if(hours == 24) { hours = 0;}
        }
        else {
            hours = events[i].hours;
        }
        var minutes = events[i].minutes;
        var alerthours = hours + 1;
        if(alerthours == 24) { alerthours = 0;}

        //if(currentDate > start && currentDate < end) {

            agenda.define(events[i].name, function(job, done) {
                var remind = "Reminder to take " + name + " at " + events[i].hours + ":" + events[i].minutes + " " + events[i].period;
                io.sockets.emit('PillReminder', {"data": remind});
                sendEmail('Medicine Reminder', remind)
                done();
            });

            agenda.define(alertName, function(job, done) {
                var alert = "Missed Dosage of " + name + " at " + events[i].hours + ":" + events[i].minutes + " " + events[i].period;
                console.log(alert);
                if((new Date().getTime() - lastPillTime) < 7200000)
                {//name == lastPillName &&
                    console.log("Pill taken")
                }
                else {
                    io.sockets.emit('PillAlert', {"data": alert});
                    sendEmail('Missed Dosage Alert', alert)
                    saveMissedDosage('Cozaar', 1)
                }
                done();
            });

            if(events[i].recurrence == 'Daily') {
                var reoccurReminder = '' + events[i].minutes + ' ' + hours + ' * * *';
                var reoccurAlert = '' + events[i].minutes + ' ' + alerthours + ' * * *';
                agenda.every(reoccurReminder, events[i].name);
                agenda.every(reoccurAlert, alertName);

            }
            else if(events[i].recurrence == 'Weekly') {
                var reoccurReminder = '' + events[i].minutes + ' ' + hours + ' * * 1';
                var reoccurAlert = '' + events[i].minutes + ' ' + alerthours + ' * * *';
                agenda.every(reoccurReminder, events[i].name);
                agenda.every(reoccurAlert, alertName);
            }
            else if(events[i].recurrence == 'Monthly') {
                var reoccurReminder = '' + events[i].minutes + ' ' + hours + ' 12 * *';
                var reoccurAlert = '' + events[i].minutes + ' ' + alerthours + ' 12 * *';
                agenda.every(reoccurReminder, events[i].name);
                agenda.every(reoccurAlert, alertName);
            }
            else if(events[i].recurrence == 'Never') {
                var reoccurReminder = '' + events[i].hours + ':' + events[i].minutes + events[i].period;
                var reoccurAlert = '' + (events[i].hours+1) + ':' + events[i].minutes + events[i].period;
                agenda.every(reoccurReminder, events[i].name);
                agenda.every(reoccurAlert, alertName);
            }

            console.log("Starting agenda job ...")
            agenda.start();
            }
            else {
                var cronTime = '' + new Date(events[i].startsAt).getMinutes() + ' ' + new Date(events[i].startsAt).getHours() + ' * * *';
                agenda.define(events[i].title, function(job, done) {
                    var remind = "Appointment Reminder for  " + events[i].title + " at " + events[i].startsAt;
                    io.sockets.emit('AppointmentReminder', {"data": remind});
                    sendEmail('Appointment Reminder', remind)
                    done();
                });

                agenda.every(cronTime, events[i].title);
                agenda.start();
           
            }
        }(i));
    }
    }
}


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
        var result=[];
        elastic_client.search({
            index: 'pill-bottle-readings',
            body: {
                query: {
                    "match_all" : {}
                }
                }
            }).then(function (resp) {
            var hits = resp.hits.hits;
            for(var i=0; i<hits.length; i++) {
                result.push({"x":hits[i]._source.timestamp,"y":hits[i]._source.pillTaken});

            }
            response.jsonp(result);

        }, function (err) {
            console.trace(err.message);
            response.send(err);
        });
    });


/* Missed dosage data HTTP from MongoDB */
    app.get('/api/getMissedPillData', function(request, response) {
        var result =[];
        MissedPillCollection.find(function(err, prescriptions) {
            if (err) return console.error(err);
            for(var i=0; i<prescriptions.length; i++) {
                result.push({"x":new Date(prescriptions[i].timestamp).getTime(),"y":prescriptions[i].pillNumber})
            }
            response.jsonp(result);
        });
    });

/* MongoDB HTTP to get all prescriptions */
    app.get('/api/getPrescriptions', function(request, response) {
        Collection.find(function(err, prescriptions) {
          if (err) return console.error(err);
          sendReminders(prescriptions);
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
            hours: request.body.hours,
            minutes: request.body.minutes,
            period: request.body.period,
            note: request.body.note,
            endTime: request.body.endTime,
            recurrence: request.body.recurrence,
          });
        newEntry.save(function(err, newEntry) {
          if (err) return console.error(err);
          console.dir(newEntry);
          response.jsonp([]);
        });
        sendReminders([request.body]);

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

/* MongoDB HTTP to get all prescriptions */
    app.get('/api/getAppointments', function(request, response) {
        AppointmentsCollection.find(function(err, appointments) {
          if (err) return console.error(err);
          sendReminders(appointments);
          response.jsonp(appointments);
        });
    });

/* MongoDB HTTP to add prescription */
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    app.post('/api/postAppointments', function(request, response) {
        var newEntry = new AppointmentsCollection({
            title: request.body.title,
            startsAt: request.body.startsAt,
            endsAt: request.body.endsAt,
            draggable: request.body.draggable,
            resizable: request.body.resizable
          });
        newEntry.save(function(err, newEntry) {
          if (err) return console.error(err);
          console.dir(newEntry);
          response.jsonp([]);
        });
        sendReminders([request.body]);
    });

/* MongoDB HTTP call to delete appointments */
app.post('/api/deleteAppointments', function(request, response) {
        AppointmentsCollection.remove({ _id: request.body._id }, function(err) {
            if (err) return console.error(err);
            response.jsonp([]);
        });
    });

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

//url rewriting for browser reload
/*app.get('*', function(req, res, next) {
 res.sendfile(__dirname + '/public/index.html');
});*/