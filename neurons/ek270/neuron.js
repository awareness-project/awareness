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
            pA: new Neuron({name: "Абсолютное давление", unit: 'бар'}),
            p: new Neuron({name: "Измеренное давление", unit: 'бар'}),
            t: new Neuron({name: "Измеренная температура", unit: '°C'}),
            n2: new Neuron({name: "Содержание азота", unit: '%', rw: true, setValueHandler: setFloatHandler, address: 318, min:0, max: 100}),
            h2: new Neuron({name: "Содержание водорода", unit: '%', rw: true, setValueHandler: setFloatHandler, address: 320, min:0, max: 100}),
            co2: new Neuron({name: "Содержание двуокиси углерода", unit: '%', rw: true, setValueHandler: setFloatHandler, address: 322, min:0, max: 100}),
            dens: new Neuron({name: "Плотность газа при н. у.", unit: 'кг/м³', rw: true, setValueHandler: setFloatHandler, address: 324, min:0.1, max: 10}),
            dt: new Neuron({name: "Дата и время", children:{
                d: new Neuron({name: "Дата", children: {
                    y: new Neuron({name: "Год"}),
                    m: new Neuron({name: "Месяц"}),
                    d: new Neuron({name: "Число"}),
                }}),
                t: new Neuron({name: "Время", children: {
                    h: new Neuron({name: "Час"}),
                    m: new Neuron({name: "Минута"}),
                    s: new Neuron({name: "Секунда"}),
                }}),
            }}),
            gD: new Neuron({name: "Начало газового дня", unit: 'ч', rw: true, setValueHandler: setContractHourHandler}),
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
    context.options.master.readHoldings(context.options.address, 304, schema2, function (error, data) {
        if (error) {
            context.log(error, data);

            context.children.pA.quality = 'bad';
            context.children.p.quality = 'bad';
            context.children.t.quality = 'bad';

            context.children.n2.quality = 'bad';
            context.children.h2.quality = 'bad';
            context.children.co2.quality = 'bad';
            context.children.dens.quality = 'bad';

            context.children.q.quality = 'bad';
            context.children.qS.quality = 'bad';
            context.children.w.quality = 'bad';

        } else {
            context.children.pA.value = data[0];
            context.children.p.value = data[1];
            context.children.t.value = data[2];

            context.children.n2.value = data[3];
            context.children.h2.value = data[4];
            context.children.co2.value = data[5];
            context.children.dens.value = data[6];

            context.children.q.value = data[7];
            context.children.qS.value = data[8];
            context.children.w.value = data[9];
        }

        setTimeout(function () {readLoop2(context)}, 0);
    });
}

function readLoop2(context) {
    context.options.master.readHoldings(context.options.address, 812, schema3, function (error, data) {
        let tCh = context.children.dt.children.t.children;
        let dCh = context.children.dt.children.d.children;
        if (error) {
            context.log(error, data);
            dCh.y.quality = 'bad';
            dCh.m.quality = 'bad';
            dCh.d.quality = 'bad';
            tCh.h.quality = 'bad';
            tCh.m.quality = 'bad';
            tCh.s.quality = 'bad';
            context.children.gD.quality = 'bad';
        } else {
            dCh.y.value = parseInt(data[0].toString(16));
            dCh.m.value = parseInt((data[1] >>> 8).toString(16));;
            dCh.d.value = parseInt((data[1] & 0xFF).toString(16));;
            tCh.h.value = parseInt((data[2] >>> 8).toString(16));
            tCh.m.value = parseInt((data[2] & 0xFF).toString(16));
            tCh.s.value = parseInt((data[3] >>> 8).toString(16));
            context.children.gD.value = parseInt((data[7] >>> 8).toString(16));
        }

        setTimeout(function () {readLoop(context)}, 0);
    });
}


module.exports = Ek270;

var schema1 = [
    {itemType: 'DW', count: 3}, //101..106 v, vS, e
];
var schema2 = [
    {itemType: 'F', count: 3},  //305..310  p.Abs, p, t
    {itemType: 'E', count: 8}, //311..318
    {itemType: 'F', count: 7}, //319..332   n2, h2, co2, dens, q, qS, w
];

var schema3 = [
    {itemType: 'W', count: 8},  //813..816 date time, 817..819 serial number, 820 contract hour
];

function setFloatHandler(value, callback){
    var val = parseFloat(value);

    if (isNaN(val)) {
        if(typeof callback === 'function')setTimeout(callback, 0, {code: 406, text: 'Incorrect value, should be a floating point number'});
        return;
    }

    if (this.options) {
        if ((typeof this.options.max == "number") && (value > this.options.max)) {
            if(typeof callback === 'function')setTimeout(callback, 0, {
                code: 406,
                text: 'Incorrect value, should be not more than ' + this.options.max
            });
            return;
        }
        if ((typeof this.options.min == "number") && (value < this.options.min)) {
            if(typeof callback === 'function')setTimeout(callback, 0, {
                code: 406,
                text: 'Incorrect value, should be not less than ' + this.options.min
            });
            return;
        }
        if (typeof this.options.precision === "number") {
            val = Number(Math.round(val+'e'+this.options.precision)+'e-'+this.options.precision);
        }
    }

    var root = this.parent;

    root.options.master.writeHoldings(root.options.address, this.options.address, [{itemType: 'F', count: 1}], [val], function (error, data) {
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

    if(typeof callback === 'function')setTimeout(callback, 0);
}

function setContractHourHandler(value, callback) {
    var val = parseInt(value, 10);
    if (val >= 0 && val < 24) {

        var root = this.parent;

        val = parseInt(val.toString(), 16) << 8;

        root.options.master.writeHoldings(root.options.address, 819, [{itemType: 'W', count: 1}], [val], function (error, data) {
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
        return;
    }
    if(typeof callback === 'function')setTimeout(callback, 0, {code: 406, text: 'Недопустимое значение, должно быть целое число от 0 до 23'});
}
