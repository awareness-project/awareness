'use strict';
/*
 ELSTER ek270,260 via modbus protocol

 usage:
 new a.Ek270({name: "A1 модуль аналогового ввода", master: serialModbusMaster2, address: 64})

 */
var Neuron = require('./../prototype/neuron.js');

class Ek270 extends Neuron {

    constructor(options) {

        console.assert(options.master
            , "Modbus master object wasn't set");

        if (!options.address) options.address = 1;

        options.children = {
            v: new Neuron({name: "Рабочий объем", unit: 'м³'}),
            vS: new Neuron({name: "Стандартный объем", unit: 'м³'}),
            e: new Neuron({name: "Энергия", unit: 'кВт·ч'}),
            q: new Neuron({name: "Рабочий расход", unit: 'м³/ч'}),
            qS: new Neuron({name: "Стандартный расход", unit: 'м³/ч'}),
            w: new Neuron({name: "Мощность", unit: 'кВт'}),
            p: new Neuron({name: "Измеренное давление", unit: 'бар'}),
            t: new Neuron({name: "Измеренная температура", unit: '°C'}),
        };

        super(options);


    }

    init(initVal){
        super.init(initVal);

        readLoop(this);
    }

    get dirname(){return __dirname}

}

function readLoop(context) {
    context.options.master.readHoldings(context.options.address, 100, schema1, function (error, data) {
        if (error) {
            context.log(error, data);

            context.children.v.quality = 'bad';
            context.children.vS.quality = 'bad';
            context.children.e.quality = 'bad';

        } else {
            context.children.v.value = data[0];
            context.children.vS.value = data[1];
            context.children.e.value = data[2];
        }

        setTimeout(function () {readLoop1(context)}, 0);
    });
}

function readLoop1(context) {
    context.options.master.readHoldings(context.options.address, 306, schema2, function (error, data) {
        if (error) {
            context.log(error, data);

            context.children.p.quality = 'bad';
            context.children.t.quality = 'bad';
            context.children.q.quality = 'bad';
            context.children.qS.quality = 'bad';
            context.children.w.quality = 'bad';

        } else {
            context.children.p.value = data[0];
            context.children.t.value = data[1];
            context.children.q.value = data[2];
            context.children.qS.value = data[3];
            context.children.w.value = data[4];
        }

        setTimeout(function () {readLoop(context)}, 0);
    });
}


module.exports = Ek270;

var schema1 = [
    {itemType: 'DW', count: 3}, //101..106 v, vS, e
];
var schema2 = [
    {itemType: 'F', count: 2},  //307..310  p, t
    {itemType: 'E', count: 16}, //311..326
    {itemType: 'F', count: 3}, //327..332   q, qS, w
];