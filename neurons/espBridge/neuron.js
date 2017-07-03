'use strict';

var Neuron = require('./../prototype/neuron.js');
var TcpResource = require('tcp-resource');

class EspBridge extends Neuron {

    constructor(options) {

        options.children = {};

        var inputs = [];
        var outputs = [];

        if(Array.isArray(options.inputs)){
            for(let number of options.inputs){
                if(typeof number === 'number'){
                    var strNum = ('0' + number).slice(-2);
                    let newNeuron = new Neuron({name: 'Вход ' + strNum, ch: number});
                    options.children['i'+strNum] = newNeuron;
                    inputs.push(newNeuron);
                    newNeuron.go = goI;
                    newNeuron.onData = onDataI;
                    newNeuron.onError = onError;
                }
            }
        }

        if(Array.isArray(options.outputs)){
            for(let number of options.outputs){
                if(typeof number === 'number'){
                    var strNum = ('0' + number).slice(-2);
                    let newNeuron = new Neuron({name: 'Выход ' + strNum, ch: number, value: 0, rw: true, setValueHandler: setValueBinaryHandler});
                    options.children['o'+strNum] = newNeuron;
                    outputs.push(newNeuron);
                    newNeuron.go = goO;
                    newNeuron.onData = onDataO;
                    newNeuron.onError = onError;
                }
            }
        }

        super(options);

        var context = this;

        context.data.resource = new TcpResource(context.options.ip, 24, function (err) {
            if (err) {
                context.log(0, err);
            } else {
                context.log(0, 'Connection success');
            }
        }).addUser(this);

        for (var id in context.children) {
            var child = context.children[id];
            child.data.resource = context.data.resource;
            child.data.resource.addUser(child);
        }


    }

    init(initVal) {
        super.init(initVal);

        var context = this;

        context.data.resource.startQueue();
    }

    go() {
        var context = this;
        setTimeout(function(){context.data.resource.userFinished();}, 100, context);
    }

    onData(data) {
    }

    onError(error) {
        var context = this;
        context.log(0, error);
    }

    get dirname() {
        return __dirname
    }

}

module.exports = EspBridge;

function setValueBinaryHandler(value, callback) {
    if ((value == 0 && value != 1) || value === 'false') {
        this.value = 0;
        if(typeof callback === 'function')setTimeout(callback, 0);
        return;
    } else if ((value == 1 && value != 0) || value === 'true') {
        this.value = 1;
        if(typeof callback === 'function')setTimeout(callback, 0);
        return;
    }
    if(typeof callback === 'function')setTimeout(callback, 0, {code: 406, text: 'Incorrect value, should be 0 or 1, true or false'});
}

function goO() {
    var context = this;

    context.data.resource.write('iw 0 ' + this.options.ch + ' ' + context.value, function (err, results) {
        if (err) {
            context.log(0, err);
            context.data.resource.userFinished();
        } else {
            context.data.responseTimer = setTimeout(function(){context.data.resource.userFinished();}, 1000, context);
        }
    });
}

function onDataO(data) {
    var context = this;
    clearTimeout(context.data.responseTimer);
    context.data.resource.userFinished();
}

function goI() {
    var context = this;

    context.data.resource.write('ir 0 ' + this.options.ch, function (err, results) {
        if (err) {
            context.log(0, err);
            context.data.resource.userFinished();
            context.quality = 'bad';
        } else {
            context.data.responseTimer = setTimeout(function(){
                context.data.resource.userFinished();
                context.quality = 'bad';
            }, 1000);
        }
    });
}

function onDataI(data) {
    var context = this;
    clearTimeout(context.data.responseTimer);

    let str = data.toString();

    if(str === 'inputd: [0]\n'){
        context.value = 0;
    } else if(str === 'inputd: [1]\n') {
        context.value = 1;
    } else {
        context.quality = 'bad';
    }

    context.data.resource.userFinished();
}

function onError(error) {
    var context = this;
    context.log(0, error);
    //clearTimeout(context.data.responseTimer);

    //setTimeout(function(){context.data.resource.userFinished();}, 5000);
}
