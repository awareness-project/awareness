'use strict';

/*
OWEN Analog/Discrete 8/16/32 output module

usage:
new a.Mu110({name: "A4 модуль дискретного вывода", master: serialModbusMaster2, address: 64, channels:8})

channels: number of output channels, possible values: 8, 16, 32

*/
var Neuron = require('./../prototype/neuron.js');

class Mu110 extends Neuron {

    constructor(options) {
        console.assert((options.channels === 8)||(options.channels === 16)||(options.channels === 32)
            , 'Wrong channel number is set');

        console.assert(options.master
            , "Modbus master object wasn't set");

        if (!options.address) options.address = 1;

        options.children = {};

        var o = [];
        var outs = [];

        for(var i = 0; i < options.channels; i++){
            var strNum = ('0' + i).slice(-2);
            var phys = new Neuron({name:'Значение на физическом выходе', value: 0, unit:'%'});
            o.push(phys);
            outs.push(0);
            var out = options.children['o'+strNum] = new Neuron({name:'O '+strNum, value: 0, unit:'%', rw: true, setValueHandler: Neuron.setValueFloatHandler, min: 0, max: 100, children: {phys: phys}});
            out.data.outs = outs;
            out.data.index = i;

            //out.onChange = onInputsChange.bind(out);
            out.onChange = out.newHandler(function(callers){
                if(this.value >= 100){
                    this.data.outs[this.data.index] = 1000;
                    return;
                }

                if(this.value > 0){
                    this.data.outs[this.data.index] = this.value * 10;
                    return;
                }

                this.data.outs[this.data.index] = 0;
            });
        }

        super(options);

        this.data.o = o;

        this.data.outs = outs;

        this.data.schema = [
            {itemType: 'W', count: options.channels}
        ];

    }

    init(initVal){
        super.init(initVal);
        writeLoop(this);
    }

    get dirname(){return __dirname}

}

function writeLoop(context) {
    context.options.master.writeHoldings(context.options.address, 0, context.data.schema, context.data.outs, function (error, data) {
        if (error) {
            context.log(error, data);

            for(var o of context.data.o){
                o.quality = 'bad';
            }

        } else {
            for(var i = 0; i < context.options.channels; i++){
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


module.exports = Mu110;

