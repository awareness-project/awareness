'use strict';
// kvg boiler with ebm papst controller

var Neuron = require('./../prototype/neuron.js');

class kvg5 extends Neuron {

    constructor(options) {

        if (!options.address) options.address = 1;

        options.showState = true;
        options.states = [
            {condition:0, level:1, text: 'Инициализация'},
            {condition:2, level:1, text: 'Ожидание/Останов'},
            {condition:4, level:1, text: 'Предварительная продувка'},
            {condition:5, level:1, text: 'Предварительное зажигание'},
            {condition:6, level:1, text: 'Зажигание'},
            {condition:7, level:1, text: 'Проверка пламени'},
            {condition:8, level:1, text: 'Работа'},
            {condition:11, level:1, text: 'Продувка перед остановом'},
            {condition:13, level:3, text: 'Авария'},
            {condition:-1, level:2, text: 'Отсутствует связь с котлом'},
        ];

        options.children = {
            t: new Neuron({name: "Температура на выходе", unit: '°C'}),
            tSet :new Neuron({name:'Температура на выходе заданная', unit: '°C', rw: true, min:0, max: 115, setValueHandler: setValueTempHandler, master: options.master, address: options.address}),
            p: new Neuron({name: "Мощность", unit: '%'}),
            i: new Neuron({name: "Ток ионизации", unit: 'мкА'}),
        };


        super(options);
    }

    init(initVal){
        super.init(initVal);

        if (this.options.master) {
            readLoop1(this);
        }
    }

    get dirname(){return __dirname}

}


function readLoop1(context) {
    context.options.master.readHoldings(context.options.address, 100, schema1, function (error, data) {
        if (error) {
            context.log(error, data);

            context.value = -1;

            context.children.t.quality = 'bad';
            context.children.tSet.quality = 'bad';
            context.children.p.quality = 'bad';
            context.children.i.quality = 'bad';

            setTimeout(function () {readLoop1(context)}, 0);
        } else {
            context.value = data[0];

            setTimeout(function () {readLoop2(context)}, 0);
        }
    });
}

function readLoop2(context) {
    context.options.master.readHoldings(context.options.address, 120, schema2, function (error, data) {
        if (error) {
            context.log(error, data);

            context.value = -1;

            context.children.t.quality = 'bad';
            context.children.tSet.quality = 'bad';
            context.children.p.quality = 'bad';
            context.children.i.quality = 'bad';

            setTimeout(function () {readLoop1(context)}, 0);
        } else {
            context.children.t.value = data[0]/10;
            context.children.p.value = data[1]/10;
            context.children.i.value = data[2]/10;

            setTimeout(function () {readLoop3(context)}, 0);
        }
    });
}

function readLoop3(context) {
    context.options.master.readHoldings(context.options.address, 120, schema2, function (error, data) {
        if (error) {
            context.log(error, data);

            context.value = -1;

            context.children.t.quality = 'bad';
            context.children.tSet.quality = 'bad';
            context.children.p.quality = 'bad';
            context.children.i.quality = 'bad';
        } else {
            context.children.tSet.value = data[0]/10;
        }

        setTimeout(function () {readLoop1(context)}, 0);
    });
}

module.exports = kvg5;

var schema1 = [
    {itemType: 'W', count: 2},//state
];
var schema2 = [
    {itemType: 'I', count: 1},//tOut
    {itemType: 'E', count: 19},//
    {itemType: 'I', count: 1},//power
    {itemType: 'E', count: 1},//
    {itemType: 'I', count: 1},//ionCurrent
];
var schema3 = [
    {itemType: 'I', count: 1},//tSet
];

function setValueTempHandler(value, callback) {
    var val = parseFloat(value);

    if (isNaN(val)) {
        setTimeout(callback, 0, {code: 406, text: 'Incorrect value, should be a floating point number'});
        return;
    }

    if (this.options) {
        if ((typeof this.options.max == "number") && (value > this.options.max)) {
            setTimeout(callback, 0, {
                code: 406,
                text: 'Incorrect value, should be not more than ' + this.options.max
            });
            return;
        }
        if ((typeof this.options.min == "number") && (value < this.options.min)) {
            setTimeout(callback, 0, {
                code: 406,
                text: 'Incorrect value, should be not less than ' + this.options.min
            });
            return;
        }
    }

    //this.value = val;
    val = Math.round(val * 10);

    var context = this;

    context.options.master.writeHoldings(context.options.address, 99, [{itemType: 'I', count: 1}], [1], function (error, data) {    //writing 1 to control register to allow writes
        if (error) {
            context.log(error, data);
            setTimeout(callback, 0, {
                code: 502,
                text: error
            });
        } else {
            context.options.master.writeHoldings(context.options.address, 502, [{itemType: 'I', count: 1}], [val], function (error, data) {   //writing temperature setpoint
                if (error) {
                    context.log(error, data);
                    setTimeout(callback, 0, {
                        code: 502,
                        text: error
                    });
                } else {
                    setTimeout(callback, 0);
                }
            });
        }
    });
}