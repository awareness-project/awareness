'use strict';
/*
 Boiler control cabinet Entromatic 111

 usage:
 new a.Entromatic111({name: "K1", master: serialModbusMaster2, address: 64})

 */
var Neuron = require('./../prototype/neuron.js');

class Entromatic111 extends Neuron {

    constructor(options) {

        console.assert(options.master
            , "Modbus master object wasn't set");

        if (!options.address) options.address = 1;

        options.showState = true;
        options.states = [
            {condition:0, level: 0, text: "Выключен"},
            {condition:1, level: 1, text: "Работа"},
            {condition:2, level: 3, text: "Авария"},
        ];

        options.children = {
            t: new Neuron({name: "Температура котла", unit: '°C', showState:true, states: [{condition:function(val){return Number.isNaN(val);}, level: 2, text: "Обрыв"}]}),
            tI: new Neuron({name: "Температура на входе", unit: '°C', showState:true, states: [{condition:function(val){return Number.isNaN(val);}, level: 2, text: "Обрыв"}]}),
            wH: new Neuron({name: "Время наработки", unit: 'ч'}),
            b: new Neuron({name: "Горелка", showState:true, states: [
                {condition:0, level: 0, text: "Останов"},
                {condition:1, level: 1, text: "Работа"},
                {condition:2, level: 3, text: "Авария"},
            ], children: {
                s: new Neuron({name: "Ступень горелки"}),
            }}),
            tS: new Neuron({name: "Термостат", states: [
                {condition:0, level: 0, text: "Норма"},
                {condition:1, level: 2, text: "Холодный"},
                {condition:2, level: 3, text: "Перегрев"},
                {condition:3, level: 3, text: "Неисправен"},
            ]}),
            eOn: new Neuron({name: "Внешний сигнал включения", states: [
                {condition:0, level: 0, text: "Нет"},
                {condition:1, level: 1, text: "Вкл."},
            ]}),
            p: new Neuron({name: "Циркуляционный насос", showState:true, states: [
                {condition:0, level: 0, text: "Останов"},
                {condition:1, level: 1, text: "Работа"},
                {condition:2, level: 2, text: "Авария"},
            ]}),
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
    context.options.master.readHoldings(context.options.address, 1936, schema, function (error, data) {
        if (error) {
            context.log(error, data);

            context.children.t.quality = 'bad';
            context.children.tI.quality = 'bad';
            context.children.wH.quality = 'bad';

        } else {
            context.data.t = data[0];
            context.data.tI = data[1];
            context.children.wH.value = data[2];
        }

        setTimeout(function () {readLoop1(context)}, 0);
    });
}

function readLoop1(context) {
    context.options.master.readCoils(context.options.address, 2, 90, function (error, data) {
        if (error) {
            context.log(error, data);

            context.quality = 'bad';
            context.children.b.quality = 'bad';
            context.children.p.quality = 'bad';
            context.children.tS.quality = 'bad';
            context.children.eOn.quality = 'bad';
        } else {
            context.value = data[0]?2:(data[13]?0:1);
            context.children.b.value = data[1]?2:(data[2]?1:0);
            context.children.p.value = data[3]?2:(data[8]?1:0);
            context.children.tS.value = data[83] * 2 + data[84];
            context.children.eOn.value = data[9];

            context.children.t.value = data[81]?NaN:context.data.t;
            context.children.tI.value = data[82]?NaN:context.data.tI;
        }

        setTimeout(function () {readLoop2(context)}, 0);
    });
}

function readLoop2(context) {
    context.options.master.readCoils(context.options.address, 5000, 2, function (error, data) {
        if (error) {
            context.log(error, data);

            context.children.b.children.s.quality = 'bad';
        } else {
            context.children.b.children.s.value = (data[1]||data[2])?2:(data[0]?1:0);
        }

        setTimeout(function () {readLoop(context)}, 0);
    });
}
module.exports = Entromatic111;

var schema = [
    {itemType: 'I', count: 3}, //1937, 1938, 1939, t, tI
];
