'use strict';

var Neuron = require('./../prototype/neuron.js');
var Di = require('./../di/neuron.js');

class Mv110_16d extends Neuron {

    constructor(options) {

        if (!options.address) options.address = 1;

        options.children = {};

        var di = [];

        for(var i = 0; i < 16; i++){
            var strNum = ('0' + i).slice(-2);
            di.push((options.children['di'+strNum] = new Di({name:'DI '+strNum})).children.phys);
        }

        super(options);

        this.di = di;

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
    context.options.master.readHoldings(context.options.address, 51, schema, function (error, data) {
        if (error) {
            context.log(error, data);

            for(var di of context.di){
                di.quality = 'bad';
            }

        } else {
            for(var i = 0; i < 16; i++){
                context.di[i].value = data[0][i];
            }
        }

        setTimeout(function () {readLoop(context)}, 0);
    });
}


module.exports = Mv110_16d;

var schema = [
    {itemType: 'B', count: 1},//[0]
];