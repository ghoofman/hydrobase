const { Client } = require('tplink-smarthome-api');
var CronJob = require('cron').CronJob;

const pH = require('./pHhandler');


const client = new Client();
const toggleDevices = [];
let silenceState = false;

var gpiop = require('rpi-gpio').promise;
const express = require('express')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = 3000;

io.on('connection', (socket) => {
	console.log('a user connected');
});

function setupPin(pin) {
	gpiop.setup(pin, gpiop.DIR_OUT).then(() => {
		gpiop.write(pin, true); // Start Off
	});
}
setupPin(11);
setupPin(13);
setupPin(15);
setupPin(16);
setupPin(18);

app.use(express.static('public'));

var pHReader = new pH();
pHReader.start();
pHReader.hook(app);

app.post('/toggle/:pin/:state', (req, res) => {
	console.log(req.params.pin, req.params.state, req.params.state == "0");
	gpiop.write(req.params.pin, req.params.state == "0" ? true : false);
	res.send(true);
});

app.post('/feed/:pin', (req, res) => {
	
	gpiop.write(req.params.pin, false);
	setTimeout(() => {
		gpiop.write(req.params.pin, true );
	}, 1000 * 10);

	res.send(true);
});

app.get('/silence/:time', (req, res) => {
	toggleDevices.map((obj) => {
		clearTimeout(obj.timer);
		obj.state = false;
		SetPowerState(obj);
	});

	silenceState = true;
	setTimeout(() => {
		silenceState = false;		
		toggleDevices.map((obj) => {
			obj.state = obj.initialState;
			Toggle(obj);
		});
	}, 1000 * 60 * parseInt(req.params.time));

	res.send(true);
});

// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`)
// });


function SetPowerState(obj) {
	obj.device.setPowerState(obj.state);
	const d = new Date();
	var msg = `Toggling ${obj.device.alias} ${obj.state ? 'on' : 'off'} at ${d.toDateString()} ${d.toLocaleTimeString()}`;
	console.log(msg);
	io.emit('message', msg);
}

function Toggle(obj) {
	if (silenceState) {
		return;
	}
	obj.state = !obj.state;
	SetPowerState(obj);
	let delayTime = obj.state ? (obj.delayOn || obj.delay) : (obj.delayOff || obj.delay);
	obj.timer = setTimeout(() => Toggle(obj), 1000 * 60 * delayTime);
}

function OnOff(obj) {
	new CronJob(obj.on, () => {
		obj.state = true;
		SetPowerState(obj);
	}, null, true);
	new CronJob(obj.off, () => {
		obj.state = false;
		SetPowerState(obj);
	}, null, true);
}

client.startDiscovery().on('device-new', (device) => {
   	// device.getSysInfo().then(console.log);

  	if (device.alias == 'SmallFan1' || device.alias == 'SmallFan2' || device.alias == 'SmallFan3' || device.alias == 'LargeFan') {
		let obj = {
			initialState: true,
			state: true,
			device: device,
			delayOn: 15,
			delayOff: 45
		};
		Toggle(obj);
		toggleDevices.push(obj);
	}

	if (device.alias == 'HydroTowerPump') {
		let obj = {
			initialState: false,
			state: false,
			device: device,
			delay: 15
		};
		Toggle(obj);
		toggleDevices.push(obj);
	}

	if (device.alias == 'HydroTubPump') {
		let obj = {
			initialState: false,
			state: false,
			device: device,
			delayOn: 2,
			delayOff: 8
		};
		Toggle(obj);
		toggleDevices.push(obj);
	}

	if (device.alias == 'LemonBucket') {
		let obj = {
			initialState: false,
			state: false,
			device: device,
			delayOn: 1,
			delayOff: 9
		};
		Toggle(obj);
		toggleDevices.push(obj);
	}

	if (device.alias == 'HydroTubLight' || device.alias == 'GrowLight' || device.alias == 'HydroTowerLight') {
		let obj = {
			initialState: false,
			state: false,
			device: device,
			on: '0 8 * * *',
			off: '0 0 * * *'
		};
		var d = new Date();
		if (d.getHours() >= 8) {
			obj.state = true;
			SetPowerState(obj);
		}
		OnOff(obj);
	}
});

http.listen(port, () => {
	console.log('listening on *:3000');
});