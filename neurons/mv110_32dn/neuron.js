'use strict';

var Neuron = require('./../prototype/neuron.js');
var Di = require('./../di/neuron.js');

class Mv110_32dn extends Neuron {

    constructor(options) {
        options.children = {};

        for(var i = 0; i < 32; i++){
            var strNum = ('0' + i).slice(-2);
            options.children['di'+strNum] = new Di({name:'DI '+strNum});
        }

        super(options);

    }

    init(initVal){
        super.init(initVal);

        setInterval(function(context){
            for (var id in context.children) {
                var child = context.children[id];
                child.children.phys.value = Math.round(Math.random());
            }
        }, 1000, this);
    }

    get dirname(){return __dirname}

}

module.exports = Mv110_32dn;