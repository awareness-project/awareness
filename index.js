
var SerialModbusMaster = require('serial-modbus-master');
var SerialM230Master = require('serial-m230-master');
var SerialLis200Master = require('serial-lis200-master');
var TcpResource = require('tcp-resource');

var Neuron = require('./neurons/prototype/neuron.js');
var CSD = require('./neurons/csd/neuron.js');
var Link = require('./neurons/link/neuron.js');
var Mv110_32dn = require('./neurons/mv110_32dn/neuron.js');
var Mv110_16d = require('./neurons/mv110_16d/neuron.js');
var Mu110_8 = require('./neurons/mu110_8/neuron.js');
var M230 = require('./neurons/m230/neuron.js');
var Dkg307 = require('./neurons/dkg307/neuron.js');
var Kvg = require('./neurons/kvg/neuron.js');
var Weather = require('./neurons/weather/neuron.js');
var TCurve = require('./neurons/t-curve/neuron.js');
var UpsDelta = require('./neurons/upsDelta/neuron.js');
var Ts220 = require('./neurons/ts220/neuron.js');

var Web = require('./awareness-web.js');
var MbTcpServer = require('./awareness-modbus-tcp-server.js');


function reportError(id){
    return function(err) {
        if (err) {
            console.log(new Date().toISOString() + '  ' + id + ' opening error: ' + err);
        } else {
            console.log(new Date().toISOString() + '  ' + id + ' open success');
        }
    }
}
