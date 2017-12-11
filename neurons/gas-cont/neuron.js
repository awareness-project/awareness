'use strict';
//gas contamination neuron

//options:
//l1 - link to I level di
//l2 - link to II level di

var Neuron = require('./../prototype/neuron.js');

class GasCont extends Neuron {

    constructor(options) {

        options.showState = true;
        options.states = [
            {condition:0, level:1, text: 'Норма'},
            {condition:1, level:2, text: 'I порог'},
            {condition:2, level:3, text: 'II порог'},
            {condition:3, level:2, text: 'Неисправность'}
        ];

        super(options);

        var context = this;

        if(context.options.l1 && context.options.l2) {
            process.nextTick(function () {
                var l1 = context.root.getNeuron(context.options.l1);
                var l2 = context.root.getNeuron(context.options.l2);
                //target.onChange = context.onLinkChange.bind(context);
                l1.onChange = l2.onChange = context.newHandler(function(callers){
                    if(l1.quality === 'good' && l2.quality === 'good'){
                        this.value = l2.value?2:(l1.value?1:0);
                    } else {
                        this.quality = 'bad';
                    }
                });
            });
        }

    }

    init(initVal){
        super.init(initVal);
    }

    get dirname(){return __dirname}

}

module.exports = GasCont;