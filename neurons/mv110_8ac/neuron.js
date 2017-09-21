'use strict';
/*
 OWEN Analog input module

 usage:
 new a.Mv110_8ac({name: "A1 модуль аналогового ввода", master: serialModbusMaster2, address: 64})

 */
var Neuron = require('./../prototype/neuron.js');

class Mv110_8ac extends Neuron {

    constructor(options) {

        if (!options.address) options.address = 1;

        options.children = {};

        var ai = [];

        for(var i = 0; i < 8; i++){
            var strNum = ('0' + i).slice(-2);
            ai.push(options.children['ai'+strNum] = new Neuron({name:'AI '+strNum}));
        }

        super(options);

        this.ai = ai;

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

            for(var ai of context.ai){
                ai.quality = 'bad';
            }

        } else {
            for(var i = 0; i < 8; i++){
                context.ai[i].value = data[i];
            }
        }

        setTimeout(function () {readLoop(context)}, 0);
    });
}


module.exports = Mv110_8ac;

var schema = [
    {itemType: 'F', count: 1},
    {itemType: 'E', count: 1},
    {itemType: 'F', count: 1},
    {itemType: 'E', count: 1},
    {itemType: 'F', count: 1},
    {itemType: 'E', count: 1},
    {itemType: 'F', count: 1},
    {itemType: 'E', count: 1},
    {itemType: 'F', count: 1},
    {itemType: 'E', count: 1},
    {itemType: 'F', count: 1},
    {itemType: 'E', count: 1},
    {itemType: 'F', count: 1},
    {itemType: 'E', count: 1},
    {itemType: 'F', count: 1},
];