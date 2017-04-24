'use strict';

var Neuron = require('./../prototype/neuron.js');
var Link = require('./../link/neuron.js');

class Valve extends Neuron {

    constructor(options) {

        options.showState = true;

        var pV = typeof options.pV === 'string' ? new Link({name:'Значение процесса', link: options.pV}) :
            new Neuron({name:'Значение процесса', value: 0, rw:true, retentive: true, setValueHandler: Neuron.setValueFloatHandler});

        var sP = new Neuron({name:'Задание', value: 0, rw:true, retentive: true, setValueHandler: Neuron.setValueFloatHandler});

        options.children = {
            pV: pV,
            sP: sP,
            par: new Neuron({name:'Параметры', children: {
                kP: new Neuron({name: 'Коэффициент пропорциональной части',retentive: true, value: 1, rw: true, setValueHandler: Neuron.setValueFloatHandler}),
            }}),
        };


        super(options);

        var context = this;

        options.children.pos.children.phOpn.onChange =
            options.children.pos.children.phCls.onChange =
                options.children.pos.newHandler(function(callers) {
                    if (this.children.phOpn.quality === 'bad' || this.children.phCls.quality === 'bad') {
                        this.quality = 'bad';
                    } else {
                        this.value = this.children.phOpn.value + 2 * this.children.phCls.value;
                    }
                });

        options.children.pos.onChange = function(caller) {
                if(caller.quality !== 'bad' && caller.value >= 0 && caller.value <= 4){
                    fsm.event(['posMid','posOpn','posCls','posErr'][caller.value]);
                }
            };

        options.children.cmd.children.phOpn.onChange =
            options.children.cmd.children.phCls.onChange =
                options.children.cmd.newHandler(function(callers) {
                    this.value = this.children.phOpn.value + 2 * this.children.phCls.value;
                });
    }

    get dirname(){return __dirname}

    static setValveCmdBinHandler(value, callback) {
        var valueToSet;
        if ((value == 0 && value != 1) || value === 'false') {
            valueToSet = 0;
        } else if ((value == 1 && value != 0) || value === 'true') {
            valueToSet = 1;
        }
        if(typeof valueToSet != 'number') {
            if (typeof callback === 'function')setTimeout(callback, 0, {code: 406,text: 'Incorrect value, should be 0 or 1, true or false'});
            return;
        }

        var fsm = this.parent.parent.data.fsm;

        switch (this){
            case this.parent.children.phOpn:
                fsm.event(valueToSet?'cmdOpn':'cmdStopOpn');
                break;
            case this.parent.children.phCls:
                fsm.event(valueToSet?'cmdCls':'cmdStopCls');
                break;
            default:
                if(typeof callback === 'function')setTimeout(callback, 0, {code: 500, text: 'Server error'});
                return;
        }

        if(typeof callback === 'function')setTimeout(callback, 0);
    }

    static setValveCmdHandler(value, callback) {
        var valueToSet;
        if (value == 0 || value === 'Стоп') {
            valueToSet = 0;
        } else if (value == 1 || value === 'Открыть') {
            valueToSet = 1;
        } else if (value == 2 || value === 'Закрыть') {
            valueToSet = 2;
        }
        if(typeof valueToSet != 'number') {
            if (typeof callback === 'function')setTimeout(callback, 0, {code: 406,text: 'Incorrect value, should be 0,1,2, Стоп, Открыть, Закрыть'});
            return;
        }

        var fsm = this.parent.data.fsm;

        fsm.event(['cmdStop','cmdOpn','cmdCls'][valueToSet]);

        if(typeof callback === 'function')setTimeout(callback, 0);
    }
}

module.exports = Valve;


