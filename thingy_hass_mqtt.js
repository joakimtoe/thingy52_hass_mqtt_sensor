/*
MIT License

Copyright (c) 2017 joakimtoe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
 
var Thingy = require('thingy52');
var mqtt = require('mqtt');
var config = require('./config.json');

var mqtt_options = {
    username: "",
    password: "",
    rejectUnauthorized: true
};
var enabled = {}
var payload = {
    //temp    : 0,
    //press   : 0,
    //humid   : 0,
    //eco2    : 0,
    //tvoc    : 0,
    //batt    : 0 
}

function mqtt_publish (ble_addr, payload) {
    var topic = '/thingy/' + ble_addr + '/environment';
    console.log(topic + ' payload: ' + JSON.stringify(payload) );
    client.publish(topic, JSON.stringify(payload), mqtt_options);
};

function onTemperatureData(temperature) {
    console.log(this.uuid + ' Temperature sensor: ' + temperature);
    payload[this.uuid].temp = temperature;
    mqtt_publish(this.uuid, payload[this.uuid]);
}

function onPressureData(pressure) {
    console.log(this.uuid + ' Pressure sensor: ' + pressure);
    payload[this.uuid].press = pressure;
    mqtt_publish(this.uuid, payload[this.uuid]);

}

function onHumidityData(humidity) {
    console.log(this.uuid + ' Humidity sensor: ' + humidity);
    payload[this.uuid].humid = humidity;
    mqtt_publish(this.uuid, payload[this.uuid]);

}

function onGasData(gas) {
    console.log(this.uuid + ' Gas sensor: eCO2 ' + gas.eco2 + ' - TVOC ' + gas.tvoc );
    if (gas.eco2 != 0 && gas.eco2 != 400 && gas.tvoc != 0)
    {
        payload[this.uuid].eco2 = gas.eco2;
        payload[this.uuid].tvoc = gas.tvoc;
        mqtt_publish(this.uuid, payload[this.uuid]);
    }
}

function onBatteryChange(battery_level) {
    console.log(this.uuid + ' Battery level: ' + battery_level + '%');
    payload[this.uuid].batt = battery_level;
    mqtt_publish(this.uuid, payload[this.uuid]);    
}

function onButtonChange(state) {
    if (state == 'Pressed') {
        if (enabled[this.uuid]) {
            enabled[this.uuid] = false;
            console.log(this.uuid + ' Stopping sensors!');
            sensors_stop(this);
        }
        else {
            enabled[this.uuid] = true;
            console.log(this.uuid + ' Starting sensors!');
            sensors_start(this);
        }
    }
}

function sensors_stop(thingy) {
    thingy.temperature_disable(function(error) {
        if (error) {
            console.log(thingy.uuid + ' temperature_disable ' + error);
        }
    });
    thingy.pressure_disable(function(error) {
        if (error) {
            console.log(thingy.uuid + ' pressure_disable ' + error);
        }
    });
    thingy.humidity_disable(function(error) {
        if (error) {
            console.log(thingy.uuid + ' humidity_disable ' + error);
        }
    });
    thingy.gas_disable(function(error) {
        if (error) {
            console.log(thingy.uuid + ' gas_disable ' + error);
        }
    });
}

function sensors_start(thingy) {
    thingy.temperature_enable(function(error) {
        if (error) {
            console.log(thingy.uuid + ' temperature_enable ' + error);
        }
    });
    thingy.pressure_enable(function(error) {
        if (error) {
            console.log(thingy.uuid + ' pressure_enable ' + error);
        }
    });
    thingy.humidity_enable(function(error) {
        if (error) {
            console.log(thingy.uuid + ' humidity_enable ' + error);
        }
    });
    thingy.gas_enable(function(error) {
        if (error) {
            console.log(thingy.uuid + ' gas_enable ' + error);
        }
    });
}

function sensors_configure(thingy) {
    thingy.temperature_interval_set(60000, function(error) {
        if (error) {
            console.log(thingy.uuid + ' temperature_interval_set ' + error);
        }
    });
    thingy.pressure_interval_set(60000, function(error) {
        if (error) {
            console.log(thingy.uuid + ' pressure_interval_set ' + error);
        }
    });
    thingy.humidity_interval_set(60000, function(error) {
        if (error) {
            console.log(thingy.uuid + ' humidity_interval_set ' + error);
        }
    });
    thingy.gas_mode_set(3, function(error) {
        if (error) {
            console.log(thingy.uuid + ' gas_mode_set ' + error);
        }
    });
}

function connectAndStart(thingy) {
  thingy.connectAndSetUp(function(error) {
    console.log(thingy.uuid + ' Connected! ' + ((error) ? error : ''));

    if (!error) {
        sensors_configure(thingy);

        enabled[thingy.uuid] = true;
        payload[thingy.uuid] = {};
        console.log(enabled);
        console.log(thingy.uuid + ' Starting!');
        sensors_start(thingy);

        thingy.button_enable(function(error) {
            if (error) {
                console.log(thingy.uuid + ' button_enable ' + error);
            }
        });

        thingy.notifyBatteryLevel(function(error) {
            if (error) {
                console.log(thingy.uuid + ' notifyBatteryLevel ' + error);
            }
          });        
    }

    // Discover more thingys
    thingyDiscoverStart();    

  });
}

function onDiscover(thingy) {
    console.log(thingy.uuid + ' Discovered');

    thingy.on('disconnect', function() {
        console.log(this.uuid + ' Disconnected!');
    });

    thingy.on('temperatureNotif', onTemperatureData);
    thingy.on('pressureNotif', onPressureData);
    thingy.on('humidityNotif', onHumidityData);
    thingy.on('gasNotif', onGasData);
    thingy.on('buttonNotif', onButtonChange);
    thingy.on('batteryLevelChange', onBatteryChange);

    connectAndStart(thingy);
}

function thingyDiscoverStart() {
    if (config.hasOwnProperty("thingy_white_list")) {
        Thingy.discoverWithFilter(function(device) {
            if (config.thingy_white_list.includes(device.uuid))
            {
                return true;
            }
            else
            {
                return false;
            }
        }, onDiscover);
    }
    else
    {
        Thingy.discover(onDiscover);
    }
}

console.log('Reading the Nordic Thingy:52 environment sensors and sending the data to Home-Assistant using MQTT');

if (!config.hasOwnProperty('mqtt_url') || 
    !config.hasOwnProperty('mqtt_username') || 
    !config.hasOwnProperty('mqtt_password') ||
    config.mqtt_url == "mqtt://mqtt_url"    ||
    config.mqtt_username == "User name"     ||
    config.mqtt_password == "Password") 
{
    console.log('Please setup the config.json file');
    //process.exit(1);
}

mqtt_options.username = config.mqtt_username;
mqtt_options.password = config.mqtt_password;

var client = mqtt.connect(config.mqtt_url, mqtt_options);
console.log('Connected to MQTT server');

thingyDiscoverStart();
