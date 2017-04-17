'use strict';

var Neuron = require('./../prototype/neuron.js');
var Link = require('./../link/neuron.js');
var FSM = require('fsm');

class Valve extends Neuron {

    constructor(options) {

        options.showState = true;
        options.value = 0;
        options.states = [
            {condition:0, level:0, text: 'Исходное'},
            {condition:1, level:1, text: 'Открывается'},
            {condition:2, level:1, text: 'Закрывается'},
            {condition:3, level:2, text: 'Не открылся'},
            {condition:4, level:2, text: 'Не закрылся'},
            {condition:5, level:1, text: 'Открыт'},
            {condition:6, level:1, text: 'Закрыт'},
            {condition:7, level:2, text: 'Самосход'},
            {condition:8, level:1, text: 'Остановлен'}];

        var phOpn = typeof options.linkOpn === 'string' ? new Link({name:'Открыт', link: options.linkOpn}) :
            new Neuron({name:'Открыт', value: 0, rw:true, retentive: true, setValueHandler: Neuron.setValueBinaryHandler});
        var phCls = typeof options.linkCls === 'string' ? new Link({name:'Закрыт', link: options.linkCls}) :
            new Neuron({name:'Закрыт', value: 0, rw:true, retentive: true, setValueHandler: Neuron.setValueBinaryHandler});

        options.children = {
            pos: new Neuron({name:'Положение',setValueHandler: Valve.setValvePosHandler, states:[
                {condition:0, level:0, text: 'Промежуточное'},
                {condition:1, level:1, text: 'Открыт'},
                {condition:2, level:1, text: 'Закрыт'},
                {condition:3, level:2, text: 'Недопустимое'}], showState: true,
                children:{
                    phOpn: phOpn,
                    phCls: phCls
                }
            }),
            cmd: new Neuron({name:'Команда', rw:true, setValueHandler: Valve.setValveCmdHandler, states:[
                {condition:0, level:0, text: 'Отсутствует'},
                {condition:1, level:1, text: 'Открыть'},
                {condition:2, level:1, text: 'Закрыть'}], showState: true,
                children:{
                    phOpn: new Neuron({name:'Открыть', value: 0, rw:true, setValueHandler: Valve.setValveCmdBinHandler}),
                    phCls: new Neuron({name:'Закрыть', value: 0, rw:true, setValueHandler: Valve.setValveCmdBinHandler}),
                }}),

            par: new Neuron({name:'Параметры', children: {
                tSw: new Neuron({name: 'Время перестановки', unit: 'с',retentive: true, value: 0, rw: true, min: 0, max: 600, setValueHandler: Neuron.setValueFloatHandler}),
            }}),
        };


        super(options);

        var context = this;

        var fsm = context.data.fsm = new FSM({
            init: {
                event: function (event) {
                    switch(event){
                        case 'posOpn': return 'opened';
                        case 'posCls': return 'closed';
                        case 'cmdOpn':
                            return 'opening';
                        case 'cmdCls':
                            return 'closing';
                    }
                }
            },
            opened: {
                enter: function () {
                    context.value = 5;//Открыт
                },
                event: function (event) {
                    switch(event) {
                        case 'cmdCls':
                            return 'closing';
                        case 'posCls':
                        case 'posMid':
                        case 'posErr':
                            return 'selfMove';
                    }
                }
            },
            closed: {
                enter: function () {
                    context.value = 6;//Закрыт
                },
                event: function (event) {
                    switch(event) {
                        case 'cmdOpn':
                            return 'opening';
                        case 'posOpn':
                        case 'posMid':
                        case 'posErr':
                            return 'selfMove';
                    }
                }
            },
            stopped: {
                enter: function () {
                    context.value = 8;//Остановлен
                    if(context.children.pos.value === 1) return 'opened';
                    if(context.children.pos.value === 2) return 'closed';
                },
                event: function (event) {
                    switch(event) {
                        case 'cmdOpn':
                            return 'opening';
                        case 'cmdCls':
                            return 'closing';
                    }
                }
            },
            opening: {
                enter: function () {
                    context.value = 1;//Открывается
                    if(context.children.pos.value === 1) return 'opened';
                    context.children.cmd.children.phOpn.value = 1;//Открыть
                    if (context.children.par.children.tSw.value > 0) {
                        this.timeout = setTimeout(function () {
                                fsm.event('timeout');
                            }, context.children.par.children.tSw.value * 1000)
                    }
                },
                event: function (event) {
                    switch(event) {
                        case 'posOpn': return 'opened';
                        case 'cmdStop': return 'stopped';
                        case 'cmdStopOpn': return 'stopped';
                        case 'cmdCls': return 'closing';//TODO:add stage for pause before reverse
                        case 'timeout': return 'openError';
                    }
                },
                exit: function () {
                    context.children.cmd.children.phOpn.value = 0;//Открыть
                    clearTimeout(this.timeout);
                }
            },
            closing: {
                enter: function () {
                    context.value = 2;//Закрывается
                    if(context.children.pos.value === 2) return 'closed';
                    context.children.cmd.children.phCls.value = 1;//Закрыть

                    if (context.children.par.children.tSw.value > 0) {
                        this.timeout = setTimeout(function () {
                            fsm.event('timeout');
                        }, context.children.par.children.tSw.value * 1000)
                    }
                },
                event: function (event) {
                    switch(event) {
                        case 'posCls': return 'closed';
                        case 'cmdStop': return 'stopped';
                        case 'cmdStopCls': return 'stopped';
                        case 'cmdOpn': return 'opening';//TODO:add stage for pause before reverse
                        case 'timeout': return 'closeError';
                    }
                },
                exit: function () {
                    context.children.cmd.children.phCls.value = 0;//Закрыть
                    clearTimeout(this.timeout);
                }
            },
            openError: {
                enter: function () {
                    context.value = 3;//Не открылся
                },
                event: function (event) {
                    switch(event) {
                        case 'posOpn': return 'opened';
                        case 'cmdOpn': return 'opening';
                        case 'cmdCls':
                            return 'closing';
                    }
                }
            },
            closeError: {
                enter: function () {
                    context.value = 4;//Не закрылся
                },
                event: function (event) {
                    switch(event) {
                        case 'posCls': return 'closed';
                        case 'cmdCls': return 'closing';
                        case 'cmdOpn':
                            return 'opening';
                    }
                }
            },
            selfMove: {
                enter: function () {
                    context.value = 7;//Самосход
                },
                event: function (event) {
                    switch(event) {
                        case 'cmdOpn':
                            return 'opening';
                        case 'cmdCls':
                            return 'closing';
                    }
                }
            }

        });

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


