/**
 * Created by shellus on 2016-03-16.
 */
angular.module('ngMQTT', [])
    .config(['$provide', function($provide){
        $provide.provider('MQTT', function(){

            var settings = {
                href: ""
            };

            this.setHref = function(href){
                settings.href = href;
            };
            this.$get = function() {
                return settings;
            };
        });
    }])

    .service('MQTTService',
        ['$q', '$rootScope', 'MQTT', function($q, $rootScope, MQTT) {
            var Service = {};
            var callbacks = {};

            var client = mqtt.connect(MQTT.href); // you add a ws:// url here

            client.on("message", function(topic, payload) {
                try {
                    var data = JSON.parse(payload.toString());
                }catch (e){
                    throw new Error("received data can not parse for JSON !");
                }
                angular.forEach(callbacks,function(callback, name){
                    var regexpStr = name.replace(new RegExp('(#)|(\\*)'),function(str){
                        if(str=="#"){
                            return ".*?"
                        }else if(str=="*"){
                            return ".*?"
                        }
                    });
                    if(topic.match(regexpStr)){
                        $rootScope.$apply(function() {
                            callback(data);
                        });
                    }
                })
            });

            client.publish("time", (new Date()).getDate());

            Service.on = function(name, callback){
                callbacks[name] = callback;
                client.subscribe(name);
            };
            Service.send = function(name, data){
                client.publish(name, JSON.stringify(data));
            };
            return Service;
        }]);