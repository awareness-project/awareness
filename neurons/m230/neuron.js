'use strict';

var Neuron = require('./../prototype/neuron.js');

class M230 extends Neuron {

    constructor(options) {

        var energyChildren = {};

        [
            {id: 'Forward', name: 'прямая '},
            {id: 'Backward', name: 'обратная '}
        ]
            .forEach(function (fb) {
                [
                    {id: 'Summ', name: 'по сумме тарифов'},
                    {id: 'T1', name: 'по тарифу 1'},
                    {id: 'T2', name: 'по тарифу 2'},
                    {id: 'T3', name: 'по тарифу 3'},
                    {id: 'T4', name: 'по тарифу 4'},
                    {id: 'Loss', name: 'технических потерь'}
                ]
                    .forEach(function (t) {
                        [
                            {id: 'energyActive', name: 'Энергия активная ', unit: 'Вт·ч'},
                            {id: 'energyReactive', name: 'Энергия реактивная ', unit: 'ВАр·ч'}
                        ]
                            .forEach(function (ar) {
                                energyChildren[ar.id + fb.id + t.id] = new Neuron({
                                    name: ar.name + fb.name + t.name,
                                    unit: ar.unit
                                });

                            });
                    });
            });

        var powerChildren = {};

        powerNames
            .forEach(function (ars) {
                var subChildren = {};
                [
                    {id: 'summ', name: 'Суммарная'},
                    {id: 'l1', name: 'Фаза 1'},
                    {id: 'l2', name: 'Фаза 2'},
                    {id: 'l3', name: 'Фаза 3'},
                ]
                    .forEach(function (phase) {
                        subChildren[phase.id] = new Neuron({
                            name: phase.name,
                            unit: ars.unit
                        });

                    });
                powerChildren[ars.id] = new Neuron({
                    name: ars.name,
                    unit: ars.unit,
                    children:subChildren
                });

            });




        options.children = {
            energyFromReset:new Neuron({name:'Накопленная энергия от сброса', unit: 'Вт·ч', children:energyChildren}),
            p:new Neuron({name:'Мощность', unit: 'Вт', children:powerChildren}),
            i:new Neuron({name:'Ток', unit: 'А', children:{
                l1:new Neuron({name:'Фаза 1', unit: 'А'}),
                l2:new Neuron({name:'Фаза 2', unit: 'А'}),
                l3:new Neuron({name:'Фаза 3', unit: 'А'}),
            }}),
            kP:new Neuron({name:'Cos(φ)', children:{
                summ:new Neuron({name:'По сумме фаз'}),
                l1:new Neuron({name:'Фаза 1'}),
                l2:new Neuron({name:'Фаза 2'}),
                l3:new Neuron({name:'Фаза 3'}),
            }}),
            f:new Neuron({name:'Частота сети', unit: 'Гц'}),
            v:new Neuron({name:'Фазное напряжение', children:{
                l1:new Neuron({name:'Фаза 1', unit: 'В'}),
                l2:new Neuron({name:'Фаза 2', unit: 'В'}),
                l3:new Neuron({name:'Фаза 3', unit: 'В'}),
            }}),
            alpha:new Neuron({name:'Углы между фазными напряжениями', children:{
                l12:new Neuron({name:'Фаза 1-2', unit: '°'}),
                l13:new Neuron({name:'Фаза 1-3', unit: '°'}),
                l23:new Neuron({name:'Фаза 2-3', unit: '°'}),
            }}),
        };


        super(options);


        //this.children.phys.onChange = this.children.inv.onChange = this.onInputsChange.bind(this);
        //this.children.phys.onChange = this.onInputsChange.bind(this);

        if (!options.address) options.address = 0;
        if (!options.accessLevel) options.accessLevel = 1;
        if (!options.pasword) options.pasword = '111111';

    }

    init(initVal){
        super.init(initVal);

        if (this.options.master) {
            readLoopEnergy(this);
        }
    }

    get dirname(){return __dirname}

}

function readLoopOpn(context){
    context.options.master.openChannel(context.options.address, context.options.accessLevel, context.options.pasword, function(error,data){
        if(error){
            context.log(error , data);
        }
        readLoopEnergy(context);
    });
}

function readLoopEnergy(context){
    context.options.master.readEnergy(context.options.address, function(error,data){
        if(error){
            context.log(error , data);
            if(data === 5){// 5 means channel is not open
                readLoopOpn(context);
            } else{

                for (var id in context.children.energyFromReset.children) {
                    var child = context.children.energyFromReset.children[id];
                    child.quality = 'bad';
                }
                context.children.energyFromReset.quality = 'bad';
                context.quality = 'bad';

                readLoopPower(context, 0);
            }
        } else {
            for (var id in data) {
                var child = context.children.energyFromReset.children[id];
                if(child){
                    child.value = data[id];
                    child.quality = 'good';
                }
            }
            if(data.energyActiveForwardSumm != undefined) context.children.energyFromReset.value = data.energyActiveForwardSumm;
            context.children.energyFromReset.quality = 'good';
            context.quality = 'good';

            readLoopPower(context, 0);
        }
    });
}

function readLoopPower(context, num){
    context.options.master.readPower(context.options.address, num, function(error,data){
        if(error){
            context.log(error , data);
            if(data === 5){// 5 means channel is not open
                readLoopOpn(context);
            } else{ //on other error - proceed

                var child = context.children.p.children[powerNames[num].id];
                if(child) {
                    for (var id in child.children) {
                        var subChild = child.children[id];
                        subChild.quality = 'bad';
                    }
                    child.quality = 'bad';
                }
                if(num === 0)context.children.p.quality = 'bad';

                if(num === 2){
                    readLoopParam(context, 1);
                } else {
                    readLoopPower(context, num + 1);
                }
            }
        } else {
            var child = context.children.p.children[powerNames[num].id];
            if(child) {
                for (var id in data) {
                    var subChild = child.children[id];
                    if (subChild){
                        subChild.value = data[id];
                        subChild.quality = 'good';
                    }
                }
                child.value = data.summ;
            }
            if(num === 0){
                context.children.p.value = data.summ;
                context.children.p.quality = 'good';
            }

            if(num === 2){
                readLoopParam(context, 1);
            } else {
                readLoopPower(context, num + 1);
            }

        }
    });
}

function readLoopParam(context, num){
    context.options.master.readParam(context.options.address, num, 0,function(error,data){
        if(error){
            context.log(error , data);
            if(data === 5){// 5 means channel is not open
                readLoopOpn(context);
            } else { //on other error - proceed
                var child = context.children[paramNames[num]];
                if (child) {
                    for (var id in child.children) {
                        var subChild = child.children[id];
                        subChild.quality = 'bad';
                    }
                    child.quality = 'bad';
                }

                if (num === 5) {
                    readLoopEnergy(context);
                } else {
                    readLoopParam(context, num + 1);
                }
            }
        } else {
            var child = context.children[paramNames[num]];
            if(child) {
                if(num === 4){ //frequency has only one value
                    child.value = data;
                } else {
                    for (var id in data) {
                        var subChild = child.children[id];
                        if (subChild){
                            subChild.value = data[id];
                            subChild.quality = 'good';
                        }
                    }
                    switch(num){
                        case 2: //current
                            child.value = data.l1 + data.l2 + data.l3; //summary
                            break;
                        case 3: //cos phi
                            child.value = data.summ;
                            break;
                        default:
                    }
                }
                child.quality = 'good';
            }
            if(num === 5){
                readLoopEnergy(context);
            } else {
                readLoopParam(context, num + 1);
            }

        }
    });
}

module.exports = M230;

var powerNames = [
    {id:'p', name: 'Активная', unit: 'Вт'},
    {id:'q', name: 'Рективная', unit: 'ВАр'},
    {id:'s', name: 'Полная', unit: 'ВА'},
];

var paramNames = [
    'p',
    'v',
    'i',
    'kP',
    'f',
    'alpha',
];