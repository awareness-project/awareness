module.exports = {
    SerialModbusMaster: require('serial-modbus-master'),
    SerialM230Master: require('serial-m230-master'),
    SerialLis200Master: require('serial-lis200-master'),
    TcpResource: require('tcp-resource'),

    Neuron: require('./neurons/prototype/neuron.js'),
    CSD: require('./neurons/csd/neuron.js'),
    Link: require('./neurons/link/neuron.js'),
    Mv110_32dn: require('./neurons/mv110_32dn/neuron.js'),
    Mv110_16d: require('./neurons/mv110_16d/neuron.js'),
    Mv110_8ac: require('./neurons/mv110_8ac/neuron.js'),
    Mu110_8: require('./neurons/mu110_8/neuron.js'),
    Mu110: require('./neurons/mu110/neuron.js'),
    M230: require('./neurons/m230/neuron.js'),
    PumpsControl: require('./neurons/pumps-control/neuron.js'),
    Dkg307: require('./neurons/dkg307/neuron.js'),
    Kvg: require('./neurons/kvg/neuron.js'),
    Weather: require('./neurons/weather/neuron.js'),
    TCurve: require('./neurons/t-curve/neuron.js'),
    UpsDelta: require('./neurons/upsDelta/neuron.js'),
    Ts220: require('./neurons/ts220/neuron.js'),
    Ek270: require('./neurons/ek270/neuron.js'),
    Entromatic111: require('./neurons/entromatic111/neuron.js'),
    Valve: require('./neurons/valve/neuron.js'),
    Valve3x: require('./neurons/valve3x/neuron.js'),
    Pid: require('./neurons/pid/neuron.js'),
    EspBridge: require('./neurons/espBridge/neuron.js'),
    Web: require('./awareness-web.js'),
    Telegram: require('./awareness-telegram.js'),
    MbTcpServer: require('./awareness-modbus-tcp-server.js'),

    reportError: function (id) {
        return function (err) {
            if (err) {
                console.log(new Date().toISOString() + '  ' + id + ' opening error: ' + err);
            } else {
                console.log(new Date().toISOString() + '  ' + id + ' open success');
            }
        }
    }
};
