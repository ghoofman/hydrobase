
const { parse } = require('path');
var Run = require('./run');

var phValues = [];

const ph13 = 130;
const ph10 = 236;
const ph7 = 348;
const ph4 = 440;
const ph1 = 550;

const phData = [ ph1, ph4, ph7, ph10, ph13];
const phVals = [ 1.0, 4.0, 7.0, 10.0, 13.0];

function pH() {
    this.lastRead = 0;
    this.lastAverage = 0;
    this.lastActual = 0;
    this.values = [];
}

pH.prototype = {
    hook: function(app) {
        app.get('/ph/hard', (req, res) => {
            res.send({ ph: this.lastRead });
        });
        app.get('/ph/average', (req, res) => {
            res.send({ ph: this.lastAverage });
        });
        app.get('/ph', (req, res) => {
            res.send({ ph: this.lastActual });
        });
    },

    start: function() {
        Run('python3', ['read_ph.py'], (data) => {

            this.lastRead = parseInt(data);
            this.values.push(this.lastRead);
            if (this.values.length > 60) {
                this.values.splice(0, 1);
            }

            var num = 0;
            this.values.forEach((v) => num += v);
            this.lastAverage = (num / this.values.length);
        
            for(var i = 0; i < phData.length; i++) {
                if (this.lastAverage > phData[i]) {
                    // between
                    var range = phData[i - 1] - phData[i];
                    // console.log(range, phData[i - 1], phData[i]);
                    var diff = this.lastAverage - phData[i];
                    // console.log(diff);
                    var percent = diff / range;
                    // console.log(percent);
                    var phDiff = phVals[i] - phVals[i - 1];
                    // console.log(phDiff, phVals[i], phVals[i + 1]);
                    this.lastActual = phVals[i] - (percent * phDiff);
                    break;
                }
            }
            console.log('pH: ' + this.lastRead);
        
            // console.log('pH: ' + this.lastRead + ' | ' + this.lastAverage.toFixed(2) + ' | ' + this.lastActual.toFixed(2));
        });
    }
}

module.exports = pH;