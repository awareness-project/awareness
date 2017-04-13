'use strict';

var Neuron = require('./../prototype/neuron.js');

class Di extends Neuron {

    constructor(options) {
        options.children = {
            phys:new Neuron({name:'Значение на физическом входе'}),
            inv:new Neuron({name:'Инверсия', value:0, rw: true, retentive: true, setValueHandler: Neuron.setValueBinaryHandler})
        };

        super(options);

        //this.children.phys.onChange = this.children.inv.onChange = this.onInputsChange.bind(this);
        this.children.phys.onChange = this.children.inv.onChange = this.newHandler(function(callers){
            if(this.children.phys.quality === 'good') {
                this.value = this.children.phys.value ^ this.children.inv.value;
            } else {
                this.quality = 'bad';
            }
        });
    }

    get dirname(){return __dirname}

    //onInputsChange(){
    //    if(this.children.phys.quality === 'good') {
    //        this.value = this.children.phys.value ^ this.children.inv.value;
    //    } else {
    //        this.quality = 'bad';
    //    }
    //}

}

module.exports = Di;