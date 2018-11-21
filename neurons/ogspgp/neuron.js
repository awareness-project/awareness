'use strict';

var Neuron = require('./../prototype/neuron.js');

class Ogspgp extends Neuron {

    constructor(options) {

        if (!options.address) options.address = 1;

        options.showState = true;
        options.states = [
            {condition:0, level:1, text: 'Норма'},
            {condition:1, level:2, text: 'I порог'},
            {condition:2, level:3, text: 'II порог'},
            {condition:3, level:2, text: 'Неисправность'},
            {condition:-1, level:2, text: 'Отсутствует связь с прибором'},
        ];

        options.children = {
            link: new Neuron({name:'Связь установлена', showState:true, states:[
                {condition:0, level: 2, text: "Нет"},
                {condition:1, level: 1, text: "Да"},
            ]}),
            type:new Neuron({name:'Тип газоанализатора', showState:true, states:[
                {condition:1, text: "Метан"},
                {condition:2, text: "Пропан"},
                {condition:3, text: "Гексан"},
                {condition:4, text: "Бутан"},
                {condition:5, text: "Изобутан"},
                {condition:6, text: "Пентан"},
                {condition:7, text: "Циклопентан"},
                {condition:8, text: "Пропилен"},
            ]}),
            //operational: new Neuron({name:'Прибор работоспособен', showState:true, states:[
            //    {condition:0, level: 2, text: "Нет"},
            //    {condition:1, level: 1, text: "Да"},
            //]}),
            state: new Neuron({name:'Состояние прибора', showState:true, states:[
                {condition:0, level: 2, text: "Неисправность"},
                {condition:1, level: 1, text: "Норма"},
            ]}),
            concentration: new Neuron({name: "Концентрация", unit: '% НКПР'}),
            l1: new Neuron({name:'Порог 1', showState:true, states:[
                {condition:0, level: 1, text: "Нет"},
                {condition:1, level: 2, text: "Да"},
            ]}),
            l1val: new Neuron({name: "Концентрация порога 1", unit: '% НКПР'}),
            l2: new Neuron({name:'Порог 2', showState:true, states:[
                {condition:0, level: 1, text: "Нет"},
                {condition:1, level: 3, text: "Да"},
            ]}),
            l2val: new Neuron({name: "Концентрация порога 2", unit: '% НКПР'}),
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

function readLoop(context) {
    context.options.master.readHoldings(context.options.address, 0, schema, function (error, data) {
            if (error) {
                context.log(error, data);

                context.children.link.value = 0;
                context.value = -1;

                context.children.type.quality = 'bad';
                context.children.state.quality = 'bad';
                context.children.l1.quality = 'bad';
                context.children.l2.quality = 'bad';
                //context.children.operational.quality = 'bad';
                context.children.concentration.quality = 'bad';
                context.children.l1val.quality = 'bad';
                context.children.l2val.quality = 'bad';

            } else {
                context.children.link.value = 1;

                context.children.type.value = (data[0x01] >> 8) & 0xFF;

                context.children.state.value = (data[0x01] >> 0) & 0x01;
                context.children.l1.value = (data[0x01] >> 1) & 0x01;
                context.children.l2.value = (data[0x01] >> 2) & 0x01;
                //context.children.operational.value = (data[0x01] >> 3) & 0x01;

                context.children.concentration.value = data[0x0A]/10;

                context.children.l1val.value = (data[0x03] >> 8) & 0xFF;
                context.children.l2val.value = data[0x03] & 0xFF;

                context.value = (/*context.children.operational.value &&*/ context.children.state.value) ? (context.children.l2.value ? 2 : (context.children.l1.value ? 1 : 0)) : 3;
            }
            setTimeout(function () {readLoop(context)}, 0);
        });
}


module.exports = Ogspgp;

var schema = [
    {itemType: 'W', count: 2},//[0]
    {itemType: 'I', count: 1},//[0]
    {itemType: 'W', count: 8},//[0]
];
