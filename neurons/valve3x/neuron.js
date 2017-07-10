'use strict';

var Neuron = require('./../prototype/neuron.js');
var Link = require('./../link/neuron.js');
var FSM = require('fsm');

class Valve3x extends Neuron {

    constructor(options) {

        options.showState = true;
        options.value = 0;

        options.children = {
            sP: typeof options.sP === 'string' ? new Link({name: 'Задание', link: options.sP}) :


            new Neuron({
                    name: 'Задание',
                    value: 0,
                    unit: '%',
                    rw: true,
                    retentive: true,
                    setValueHandler: Neuron.setValueFloatHandler
                })
        };

        if(typeof options.pos === 'string'){
            options.children.pos = new Link({name: 'Положение', unit: '%', link: options.pos});
        }


        super(options);
    }

    get dirname(){return __dirname}

}

module.exports = Valve3x;


