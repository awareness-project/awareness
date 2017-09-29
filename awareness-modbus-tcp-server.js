'use strict';
/*
each neuron could have hl option which is the object with following properties:

skip: //string "all" - exclude from modbus protocol neuron and all its children
                "me" - exclude the neuron itself, but leave its children if they exist
*/

var Net = require('net');

class ModbusServer {

    constructor(options) {
        this.map = [];
        loopNeuron(options.neuron, {addr: 0, map: this.map});


        var context = this;
        context.port = options.port ? options.port : 502;

        Net.createServer(function (socket) {

            socket.namePad = ('                          ' + socket.remoteAddress + ":" + socket.remotePort).slice(-26);

            console.log(new Date().toISOString() + socket.namePad + ' client connected');

            socket.on('data', function (request) {
                console.log(new Date().toISOString() + socket.namePad + '->' + request.toString('hex'));
                var tcpHeader = request.slice(0, 6);
                var reply = context.handleRequest(request.slice(6, request.length));
                if(reply) {
                    var buf = Buffer.concat([tcpHeader, reply]);
                    buf.writeUInt16BE(reply.length, 4);
                    socket.write(buf);
                    console.log(new Date().toISOString() + socket.namePad + '<-' + buf.toString('hex'));
                }
            });

            socket.on('end', function () {
                console.log(new Date().toISOString() + socket.namePad + ' client disconnected');
            });

            socket.on('close', function () {
                console.log(new Date().toISOString() + socket.namePad + ' connection closed');
            });

            socket.on('error', function () {
                console.log(new Date().toISOString() + socket.namePad + ' cocket error');
            });

            socket.on('timeout', function () {
                console.log(new Date().toISOString() + socket.namePad + ' connection timeout');
                socket.destroy();
            });

            socket.setTimeout(10000);

        }).listen(context.port);

        console.log(new Date().toISOString() + ' Modbus TCP server is waiting for connections at 502 port');

    }

    get dirname() {
        return __dirname
    }

    handleRequest(data) {
        var context = this;

        if(data.length < 2){
            console.log(new Date().toISOString() + ' unsupported request format');
            return;
        }

        switch (data[1]) { //Function code
            case 3://Read holding regs
                if(data.length < 6){
                    console.log(new Date().toISOString() + ' illegal data address');
                    return returnException(data, 2);//Return exception ILLEGAL DATA ADDRESS
                }

                var startReg = data.readUInt16BE(2);
                var numReg = data.readUInt16BE(4);
                if((startReg % 2 != 0)
                || (numReg % 2 != 0)
                || (numReg > 125)
                || ((startReg / 2 + numReg / 2) >= context.map.length)
                )return returnException(data, 2);//Return exception ILLEGAL DATA ADDRESS
                var buf = new Buffer(3 + numReg * 2);
                buf[0] = data[0];
                buf[1] = data[1];
                buf[2] = numReg * 2;
                var mapIndex = Math.floor(startReg / 2);
                for(var i = 0; i < numReg / 2; i++){
                    buf.writeFloatBE(context.map[mapIndex].value, 3 + i * 4);
                    mapIndex++;
                }
                return buf;
                break;
            case 16://Write holding regs
                if(data.length < 7){
                    console.log(new Date().toISOString() + ' illegal data address');
                    return returnException(data, 2);//Return exception ILLEGAL DATA ADDRESS
                }

                var startReg = data.readUInt16BE(2);
                var numReg = data.readUInt16BE(4);
                if((startReg % 2 != 0)
                    || (numReg % 2 != 0)
                    || (numReg > 125)
                    || ((startReg / 2 + numReg / 2) >= context.map.length)
                )return returnException(data, 2);//Return exception ILLEGAL DATA ADDRESS
                var buf = data.slice(0, 6); //the response is the same as the part of the request, 6 are not inclusive (0...5)

                var mapIndex = Math.floor(startReg / 2);
                for(var i = 0; i < numReg / 2; i++){
                    context.map[mapIndex].setValue(data.readFloatBE(7 + i * 4));
                    mapIndex++;
                }
                return buf;
                break;
            default:
                console.log(new Date().toISOString() + ' unsupported function code: ' + data[1]);
                return returnException(data, 1);//Return exception ILLEGAL FUNCTION
        }

    }

}

function returnException(data, exNum){
    return new Buffer([data[0], data[1] + 0x80, exNum]);
}

var statusLabels = ['Без статуса', 'Информация', 'Предупреждение', 'Авария'];

function loopNeuron(neuron, obj, offset){
    if(!offset)offset = '';
    if(!obj)obj = {addr:0, map:[]};

    var skipMe = false;

    if(typeof neuron.options.hl === 'object'){
        if(neuron.options.hl.skip === 'all') return;

        if(neuron.options.hl.skip === 'me'){
            skipMe = true;
        }
    }

    if(skipMe){
        console.log('       ' + offset + neuron.name);
    } else {
        obj.map.push(neuron);
        console.log((400001 + obj.addr) + ':' + offset + neuron.name + (neuron.unit?('('+ neuron.unit +')'):'') + ' (чтение' + (neuron.options.rw?'/запись':'') + ')');
        obj.addr += 2;

        if(neuron.options.states){
            for( var i = 0; i < neuron.options.states.length; i++){
                console.log('       ' + offset.replace('├', '│').replace('└', String.fromCharCode(0x3000)) + ' '    //0x3000 = wide space
                    + neuron.options.states[i].condition.toString() + ': ('
                    + statusLabels[neuron.options.states[i].level] + ')'
                    + (neuron.options.states[i].text?' ' + neuron.options.states[i].text:''));
            }
        }
    }


    var children = Object.keys(neuron.children),
        len = children.length,
        i = 0,
        id,
        child;
    while (i < len) {
        id = children[i];
        child = neuron.children[id];
        i += 1;
        //loopNeuron(child, (offset.length?(offset.slice(0,-1) + ((i===len)?'░':'│')):('')) + ((i===len)?'└':'├'));
        loopNeuron(child, obj, offset.replace('├', '│').replace('└', ' ') + ((i===len)?'└ ':'├ '));
    }
}

module.exports = ModbusServer;