
const { parse } = require('path');
var Run = require('./run');

var phValues = [];

const ph13 = 130;
const ph10 = 236;
const ph7 = 348;
const ph4 = 440;
const ph1 = 550;

const phData = [ ph1, ph4, ph7, ph10, ph13];
const phVals = [ 13.0, 10.0, 7.0, 4.0, 1.0];

Run('python3', ['read_ph.py'], (data) => {
    var ph = parseInt(data);
    phValues.push(ph);
    if (phValues.length > 60) {
        phValues.splice(0, 1);
    }
    var num = 0;
    phValues.forEach((v) => num += v);
    var phAverage = (num / phValues.length);

    var phActual = 0;

    for(var i = 0; i < phData.length; i++) {
        if (phAverage > phData[i]) {
            // between
            var range = phData[i - 1] - phData[i];
            // console.log(range, phData[i - 1], phData[i]);
            var diff = phAverage - phData[i];
            // console.log(diff);
            var percent = diff / range;
            // console.log(percent);
            var phDiff = phVals[i] - phVals[i + 1];
            // console.log(phDiff, phVals[i], phVals[i + 1]);
            phActual = phVals[i] - (percent * phDiff);
            break;
        }
    }

	console.log('pH: ' + ph + ' | ' + phAverage.toFixed(2) + ' | ' + phActual.toFixed(2));
});