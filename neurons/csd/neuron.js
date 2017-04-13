'use strict';

var Neuron = require('./../prototype/neuron.js');

class CSD extends Neuron {

    constructor(options) {
        options.children = {
            ring:new Neuron({name:'Звонок', value:0}),
            lampY:new Neuron({name:'Лампа "Неисправность"', value:0}),
            lampR:new Neuron({name:'Лампа "Авария"', value:0}),
            acknowledge: (typeof options.linkAck === 'string' )? new Link({name:'Квитировать', link: options.linkAck}) :
                new Neuron({name:'Квитировать', value: 0, rw:true, retentive: true, setValueHandler: Neuron.setValueBinaryHandler}),
        };

        super(options);

        var context = this;

        Neuron.csd
            .on('sound', function(state) {
                context.children.ring.value = (state === 'on') ? 1 : 0;
            })
            .on('lamp', function(level, state) {
                switch(level){
                    case 2:
                        var lamp = context.children.lampY;
                        break;
                    case 3:
                        var lamp = context.children.lampR;
                        break;
                }
                if(lamp){
                    clearInterval(lamp.data.timeout);
                    switch(state){
                        case 'new':
                            lamp.value = 1;
                            lamp.data.timeout = setInterval(function() {
                                lamp.value = (lamp.value === 1) ? 0 : 1;
                            }, 1000);
                            break;
                        case 'pending':
                            lamp.value = 1;
                            break;
                        case 'off':
                            lamp.value = 0;
                            break;
                    }
                }
            });

        //this.children.phys.onChange = this.children.inv.onChange = this.onInputsChange.bind(this);
        this.children.acknowledge.onChange = function(caller){
            if(caller.quality !== 'bad' && caller.value === 1) {
                caller.value = 0;
                Neuron.csd.acknowledge();
            }
        };
    }

    get dirname(){return __dirname}

}

module.exports = CSD;