# Nordic Thingy:52 Node.js Home-Assistant MQTT Sensor Script

This script will connect to [Nordic's Thingy:52 IoT Sensor Kit](https://www.nordicsemi.com/eng/Products/Nordic-Thingy-52) using Bluetooth, and send the environment sensor data to [Home-Assistant](https://home-assistant.io/) set up with the [MQTT Sensor](https://home-assistant.io/components/sensor.mqtt/) component.

## Raspberry Pi
### Prerequisites
1. A Raspberry Pi with built in Bluetooth or a Raspberry Pi and a Bluetooth USB dongle.
2. The [Raspbian Jessie](https://www.raspberrypi.org/downloads/raspbian/) operating system image.
3. A [Nordic Thingy:52 IoT Sensor Kit](https://www.nordicsemi.com/eng/Products/Nordic-Thingy-52)
4. [Home-Assistant](https://home-assistant.io/) with [MQTT Sensor component](https://home-assistant.io/components/sensor.mqtt/)
5. Git, Node.js, npm and thingy52 lib.

### Install
1. Update the package manager: `sudo apt-get update`.
2. Add the latest version of Node.js to package manager: `curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -`
3. Install Node.js and [thingy52](https://github.com/NordicPlayground/Nordic-Thingy52-Nodejs) lib dependencies: `sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev git nodejs`
4. Clone the repository: `git clone https://github.com/joakimtoe/thingy52_hass_mqtt_sensor.git`
5. Go into the thingy52_hass_mqtt_sensor folder. `cd thingy52_hass_mqtt_sensor`
6. Install the [thingy52](https://github.com/NordicPlayground/Nordic-Thingy52-Nodejs) lib: `npm install thingy52`

### Configure script
1. Find your Thingy:52's bluetooth device address using. `hcitool`
```bash
pi@raspberrypi:~ $ sudo hcitool lescan
LE Scan ...
E2:16:3A:FD:67:46 Thingy
```
2. Remove ':' and add `e2163afd6746` to the `config.json` parameter `thingy_white_list`. Or remove `thingy_white_list` completly to connect to all discovered Thingy:52's.
3. Change `mqtt_url`, `mqtt_username` and `mqtt_password` according to your MQTT Broker. See Home-Assitant configuration chapter if in doubt. If you are using Home-Assitant's embedded MQTT broker see [this page](https://home-assistant.io/docs/mqtt/broker/#embedded-broker).

### Run
To run the script: `sudo node thingy_hass_mqtt.js`.

### Autorun
1. Create a new systemd service `sudo nano /etc/systemd/system/thingy-hass-mqtt.service`.
2. Then copy/paste the following into the service file: 
```
[Unit]
Description=Thingy Environment MQTT service
After=network.target ntpdate.service

[Service]
Environment=PATH=/usr/bin:/usr/local/sbin:/usr/local
ExecStart=/usr/bin/node /[path to thingy52_hass_mqtt_sensor]/thingy_hass_mqtt.js
StandardOutput=inherit
StandardError=inherit
Restart=always
User=root

[Install]
WantedBy=multi-user.target
Alias=thingy-hass-mqtt.service
```
3. Change the path to your thingy52_hass_mqtt_sensor folder and save.
4. Reload systemd: `sudo systemctl --system daemon-reload`.
5. To start automatically at boot, enable the service: `sudo systemctl enable thingy-hass-mqtt`. Use `disable` to turn off.
6. To start it now use: `sudo systemctl start thingy-hass-mqtt`. Also supports `stop`, `restart` and `status`.
7. To get the log use: `sudo journalctl -f -u thingy-hass-mqtt`

## Home-Assistant
### Configuration
1. Setup MQTT and select MQTT Broker according to [this page](https://home-assistant.io/components/mqtt/).
2. Availible data are:
```
{
  "temp": "25",    // Temperature in Celsius
  "press": "1000", // Air Pressure in hPa
  "humid": "30",   // Relative Humidity in %
  "eco2": "500",   // Estimated CO2 in ppm
  "tvoc": "20",    // Total Volatile Organic Compound in ppb
  "batt": "85"     // Battery level in %
}
```
3. Add sensors like in the following example.
```yaml
# Example configuration.yaml entry
sensor:
  - platform: mqtt
    state_topic: "thingy/[bluetooth device address without :]/environment"
    name: "Temperature"
    unit_of_measurement: "C"
    value_template: '{{ value_json.temp }}'
```
To find your Thingy:52's bluetooth device address. `hcitool lescan`
4. Restart Home-Assitant and the added sensors will appear in the States view.