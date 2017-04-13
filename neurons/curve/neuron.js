'use strict';

var Neuron = require('./../prototype/neuron.js');
var Link = require('./../link/neuron.js');

class Curve extends Neuron {

    constructor(options) {

        if (!(options.curve instanceof Array) || (options.curve.length < 1)) options.curve = [[-30,70],[-20,60],[-10,54],[0,43],[10,29]];

        options.children = {};

        var pTable = [];

        for(var i = 0; i < options.curve.length; i++) {
            var strNum = ('0' + i).slice(-2);

            var children = {
                x: new Neuron({name: 'X', value: options.curve[i][0], unit: '°C'}),
                y: new Neuron({name: 'Y', value: options.curve[i][1], unit: '°C', rw: true, setValueHandler: Neuron.setValueFloatHandler, min:30, max: 95})

            };

            pTable.push(children);

            options.children['p' + strNum] = new Neuron({name: 'Точка ' + strNum, children});
        }


        super(options);

        var context = this;

        context.data.pTable = pTable;
    }

    get dirname(){return __dirname}

    interpol(value){
        var context = this;
        var pTable = context.data.pTable;
        if(value <= pTable[0].x.value) return pTable[0].y.value;
        for(var i = 1; i < pTable.length; i++){
            if(value < pTable[i].x.value) return (pTable[i-1].y.value + (value -  pTable[i-1].x.value)*(pTable[i].y.value - pTable[i-1].y.value)/(pTable[i].x.value - pTable[i-1].x.value));
        }
        return pTable[pTable.length - 1].y.value;
    }
}

module.exports = Curve;

