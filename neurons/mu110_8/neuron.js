'use strict';

var Neuron = require('./../prototype/neuron.js');

class Mu110_8 extends Neuron {

    constructor(options) {

        if (!options.address) options.address = 1;

        options.children = {};

        var o = [];
        var outs = [0, 0, 0, 0, 0, 0, 0, 0];

        for(var i = 0; i < 8; i++){
            var strNum = ('0' + i).slice(-2);
            var phys = new Neuron({name:'Значение на физическом выходе', value: 0, unit:'%'});
            o.push(phys);
            var out = options.children['o'+strNum] = new Neuron({name:'O '+strNum, value: 0, unit:'%', rw: true, setValueHandler: Neuron.setValueFloatHandler, min: 0, max: 1, children: {phys: phys}});
            out.data.outs = outs;
            out.data.index = i;

            //out.onChange = onInputsChange.bind(out);
            out.onChange = out.newHandler(function(callers){
                if(this.value >= 1){
                    this.data.outs[this.data.index] = 1000;
                    return;
                }

                if(this.value > 0){
                    this.data.outs[this.data.index] = this.value * 1000;
                    return;
                }

                this.data.outs[this.data.index] = 0;
            });
        }

        super(options);

        this.data.o = o;

        this.data.outs = outs;

    }

    init(initVal){
        super.init(initVal);

        if (this.options.master) {
            writeLoop(this);
        }
    }

    get dirname(){return __dirname}

}

function writeLoop(context) {
    //for(var i = 0; i < 8; i++){
    //    context.data.outs[i] = 0;
    //}

    context.options.master.writeHoldings(context.options.address, 0, schema, context.data.outs, function (error, data) {
        if (error) {
            context.log(error, data);

            for(var o of context.data.o){
                o.quality = 'bad';
            }

        } else {
            for(var i = 0; i < 8; i++){
                context.data.o[i].value = context.data.outs[i] / 1000;
            }
        }

        setTimeout(function () {writeLoop(context)}, 0);
    });
}

//function onInputsChange(){
//    if(this.value >= 1){
//        this.data.outs[this.data.index] = 1000;
//        return;
//    }
//
//    if(this.value > 0){
//        this.data.outs[this.data.index] = this.value * 1000;
//        return;
//    }
//
//    this.data.outs[this.data.index] = 0;
//}


module.exports = Mu110_8;

var schema = [
    {itemType: 'W', count: 8},//[0]
];