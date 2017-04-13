'use strict';

var Neuron = require('./../prototype/neuron.js');

class Ts220 extends Neuron {

    constructor(options) {

        options.children = {
            vC: new Neuron({name: "Стандартный объем", unit: 'м³'}),
            v: new Neuron({name: "Рабочий объем", unit: 'м³'}),
            t: new Neuron({name: "Температура газа", unit: '°C'}),
            pN: new Neuron({name: "Подстановочное значение давления", unit: 'кПа'}),
        };


        super(options);

        this.data.comErrors = 0;

        if (!options.address) options.address = '';
    }

    init(initVal){
        super.init(initVal);

        if (this.options.master) {
            readLoop(this);
        }
    }

    get dirname(){return __dirname}

}

function readLoop(context){
    context.options.master.readData(context.options.address, context.options.accessLevel, context.options.pasword,
        ['2:302.0(1)','4:302.0(1)','6:310_1.0(1)','7:310.0(1)'], function(error,data){
        if(error){
            context.log(error , data);
            if(context.data.comErrors > 2) {
                for (let id in context.options.children) {
                    context.options.children[id].quality = 'bad';
                }
            }
            context.data.comErrors++;
        } else {
            for(let id in context.options.children){
                context.options.children[id].value = data.shift();
            }
            context.data.comErrors = 0;
        }
        readLoop(context);
    });
}


module.exports = Ts220;