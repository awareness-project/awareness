'use strict';

var Neuron = require('./../prototype/neuron.js');

class Dkg307 extends Neuron {

    constructor(options) {

        if (!options.address) options.address = 1;

        options.children = {
            stage:new Neuron({name:'Стадия работы', showState:true, states:[
                {condition:0, level: 1, text: "Работа нагрузки от основного питания"},
                {condition:1, level: 1, text: "Ожидание подачи топлива"},
                {condition:2, level: 1, text: "Пауза перед запуском двигателя"},
                {condition:3, level: 1, text: "Запуск двигателя"},
                {condition:4, level: 1, text: "Прогрев двигателя"},
                {condition:5, level: 1, text: "Пауза перед включением контактора генератора"},
                {condition:6, level: 1, text: "Питание нагрузки от генератора"},
                {condition:7, level: 1, text: "Пауза перед включением контактора основного питания"},
                {condition:8, level: 1, text: "Охлаждение"},
                {condition:9, level: 1, text: "Останов двигателя"},
            ]}),
            mains: new Neuron({name: 'Параметры основного электропитания', children:{
                vL1: new Neuron({name:'Напряжение L1', unit: 'В'}),
                vL2: new Neuron({name:'Напряжение L2', unit: 'В'}),
                vL3: new Neuron({name:'Напряжение L3', unit: 'В'}),
                vL12: new Neuron({name:'Напряжение L12', unit: 'В'}),
                vL23: new Neuron({name:'Напряжение L23', unit: 'В'}),
                vL31: new Neuron({name:'Напряжение L31', unit: 'В'}),
                f: new Neuron({name:'Частота', unit: 'Гц'}),
                c: new Neuron({name:'Контактор включен', states:[{condition:1, level: 1}]}),
                fail: new Neuron({name:'Напряжение основного питания не в норме', states:[{condition:1, level: 2}]}),
            }}),
            genset: new Neuron({name: 'Параметры резервного электропитания', children:{
                vL1: new Neuron({name:'Напряжение L1', unit: 'В'}),
                iL1: new Neuron({name:'Ток L1', unit: 'А'}),
                vL2: new Neuron({name:'Напряжение L2', unit: 'В'}),
                iL2: new Neuron({name:'Ток L2', unit: 'А'}),
                vL3: new Neuron({name:'Напряжение L3', unit: 'В'}),
                iL3: new Neuron({name:'Ток L3', unit: 'А'}),
                vL12: new Neuron({name:'Напряжение L12', unit: 'В'}),
                vL23: new Neuron({name:'Напряжение L23', unit: 'В'}),
                vL31: new Neuron({name:'Напряжение L31', unit: 'В'}),
                f: new Neuron({name:'Частота', unit: 'Гц'}),
                p: new Neuron({name:'Активная мощность', unit: 'Вт'}),
                pf: new Neuron({name:'Коэффициент мощности'}),
                c: new Neuron({name:'Контактор включен', states:[{condition:1, level: 1}]}),
                vW: new Neuron({name:'Напряжение резервного питания не в норме', states:[{condition:1, level: 2}]}),
                vA: new Neuron({name:'Напряжение резервного питания - аварийный уровень', states:[{condition:1, level: 3}]}),
            }}),
            engine: new Neuron({name: 'Параметры двигателя', children:{
                f: new Neuron({name:'Обороты двигателя', unit: 'об/мин.'}),
                pressure: new Neuron({name:'Давление масла', unit: 'бар'}),
                temp: new Neuron({name:'Температура охлаждающей жидкости', unit: '°C'}),
                fuel: new Neuron({name:'Уровень топлива', unit: '%'}),
                bat: new Neuron({name:'Напряжение аккумулятора', unit: 'В'}),
            }}),
            mode: new Neuron({name: 'Параметры двигателя', children:{
                manMode: new Neuron({name:'Ручной режим', states:[{condition:1, level: 1}]}),
                autoMode: new Neuron({name:'Автоматический режим', states:[{condition:1, level: 1}]}),
                offMode: new Neuron({name:'Отключено', states:[{condition:1, level: 1}]}),
                testMode: new Neuron({name:'Режим тестирования', states:[{condition:1, level: 1}]}),
                loadTestMode: new Neuron({name:'Тестирование нагрузки', states:[{condition:1, level: 1}]}),
            }}),
            warning: new Neuron({name:'Неисправность генератора', rw: true, states:[{condition:1, level: 2}]}),
            alarm: new Neuron({name:'Авария генератора', rw: true, states:[{condition:1, level: 3}]}),
        };


        super(options);
    }

    init(initVal){
        super.init(initVal);

        if (this.options.master) {
            readLoop(this);
        }
    }

    get dirname(){return __dirname}

}

function readLoop(context) { // !!!!!!!!!!! acc to manual it can reply with 16 regs max, so probably will need to rework this
    context.options.master.readHoldings(context.options.address, 0, schema, function (error, data) {
            if (error) {
                context.log(error, data);
                var badEnds = function badEnds(context) {
                    var hasChildren = false;
                    for (var id in context.children) {
                        var child = context.children[id];
                        badEnds(child);
                        hasChildren = true;
                    }
                    if(!hasChildren) {
                        context.quality = 'bad';
                    }
                };
                badEnds(context);
            } else {
                context.children.mains.children.vL1.value = data[0x00];
                context.children.mains.children.vL2.value = data[0x01];
                context.children.mains.children.vL3.value = data[0x02];
                context.children.genset.children.vL1.value = data[0x03];
                context.children.genset.children.vL2.value = data[0x04];
                context.children.genset.children.vL3.value = data[0x05];
                context.children.genset.children.iL1.value = data[0x06];
                context.children.genset.children.iL2.value = data[0x07];
                context.children.genset.children.iL3.value = data[0x08];
                context.children.mains.children.vL12.value = data[0x0C];
                context.children.mains.children.vL23.value = data[0x0D];
                context.children.mains.children.vL31.value = data[0x0E];
                context.children.genset.children.vL12.value = data[0x0F];
                context.children.genset.children.vL23.value = data[0x10];
                context.children.genset.children.vL31.value = data[0x11];
                context.children.mains.children.f.value = data[0x12] / 10;
                context.children.genset.children.f.value = data[0x13] / 10;
                context.children.genset.children.p.value = (data[0x17] << 8) | ((data[0x16] >>> 8));// at last we got whole part of power, fractional part is dropped
                context.children.genset.children.pf.value = ((data[0x18] << 24) >> 24) / 100;// according to manual, 0x18 register holds signed byte, not sure about sign bits in higher byte though..
                context.children.engine.children.f.value = data[0x2A];
                context.children.engine.children.pressure.value = data[0x2B] / 10;
                context.children.engine.children.temp.value = data[0x2C];
                context.children.engine.children.fuel.value = data[0x2D];
                context.children.engine.children.bat.value = data[0x2F] / 10;

                context.children.genset.children.vA.value = (data[0x32] >> 6) & 1;
                context.children.genset.children.vW.value = (data[0x34] >> 6) & 1;

                context.children.mains.children.c.value = (data[0x39] >> 4) & 1;
                context.children.genset.children.c.value = (data[0x39] >> 0) & 1;

                context.children.alarm.value = (data[0x3B] >> 8) & 1;
                context.children.warning.value = (data[0x3B] >> 9) & 1;

                context.children.mains.children.fail.value = (data[0x3C] >> 0) & 1;

                context.children.mode.children.manMode.value = (data[0x3D] >> 3) & 1;
                context.children.mode.children.autoMode.value = (data[0x3D] >> 4) & 1;
                context.children.mode.children.offMode.value = (data[0x3D] >> 5) & 1;
                context.children.mode.children.testMode.value = (data[0x3D] >> 6) & 1;
                context.children.mode.children.loadTestMode.value = (data[0x3D] >> 7) & 1;

                context.children.stage.value = data[0x3F];
            }
            setTimeout(function () {readLoop(context)}, 0);
        });
}


module.exports = Dkg307;

var schema = [
    {itemType: 'W', count: 64},//[0]
];
