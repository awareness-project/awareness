'use strict';

var Neuron = require('./../prototype/neuron.js');
var TcpResource = require('tcp-resource');

class EspBridge extends Neuron {

    constructor(options) {

        options.children = {
            o2: new Neuron({name: 'Выход 2', value: 0, rw: true, setValueHandler: setValueBinaryHandler})
        };

        super(options);

        var context = this;
    }

    init(initVal) {
        super.init(initVal);

        var context = this;

        context.data.resource = new TcpResource('192.168.0.133', 24, function (err) {
            if (err) {
                context.log(0, err);
            } else {
                context.log(0, 'Connection success');
            }
        }).addUser(this);

        for (var id in context.children) {
            var child = context.children[id];
            child.go = go;
            child.onData = onData;
            child.onError = onError;
            child.data.resource = context.data.resource;
            child.data.resource.addUser(child);
        }


        this.data.resource.startQueue();
    }

    go() {
        var context = this;
        setTimeout(function(){context.data.resource.userFinished();}, 50, context);
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

function go() {
    var context = this;

    context.data.resource.write('iw 0 2 ' + context.value, function (err, results) {
        if (err) {
            context.log(0, err);
            context.data.resource.userFinished();
        } else {
            context.data.responseTimer = setTimeout(function(){context.data.resource.userFinished();}, 1000, context);
        }
    });    }

function onData(data) {
    var context = this;
    clearTimeout(context.data.responseTimer);
    context.data.resource.userFinished();
}

function onError(error) {
    var context = this;
    context.log(0, error);
    clearTimeout(context.data.responseTimer);
    setTimeout(function(){context.data.resource.userFinished();}, 5000);
}
