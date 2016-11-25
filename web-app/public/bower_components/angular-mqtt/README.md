
## USE

```bash
bower install angular-mqtt
```


```html
<script src="bower_components/angular/angular.js"></script>
<script src="bower_components/angular-mqtt/src/browserMqtt.js"></script>
<script src="bower_components/angular-mqtt/src/angular-MQTT.js"></script>

```


```javascript
    var app = angular.module('app', [
        'ngMQTT'
    ]);

    app.config(['MQTTProvider',function(MQTTProvider){
        MQTTProvider.setHref('ws://cv.endaosi.com:18585');
    }]);

    app.controller('indexCtrl', ['$scope', 'MQTTService', function ($scope, MQTTService) {
        MQTTService.on('hello', function(data){
            alert(data)
        });


        MQTTService.send('hello','word');
        MQTTService.send('hello','word1');
        MQTTService.send('hello','word2');
    }]);

```



##TODO

- add auth

---
MQTT server install mothod see: http://blog.csdn.net/qhdcsj/article/details/45042515
