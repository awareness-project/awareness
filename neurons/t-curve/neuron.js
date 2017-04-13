'use strict';

var Neuron = require('./../prototype/neuron.js');
var Link = require('./../link/neuron.js');
var Curve = require('./../curve/neuron.js');

class TCurve extends Neuron {

    constructor(options) {

        if (!(options.curve instanceof Array) || (options.curve.length < 1)) options.curve = [[-30,70],[-20,60],[-10,54],[0,43],[10,29]];

        options.unit = '°C';
        options.children = {};
        options.children.source = options.source;

        options.children.curve = new Curve({name: "Температурный график", curve:options.curve});

        super(options);

        var context = this;

        //options.children.source.onChange = context.onLinkChange.bind(context);
        //var handler = context.onCurveChange.bind(context);

        var handler = options.children.source.onChange = context.newHandler(function(callers){
            this.quality = this.children.source.quality;
            if(this.quality === 'good'){
                this.value = Math.round(this.children.curve.interpol(this.children.source.value) * 10) / 10;
            }
        });

        for (var id in options.children.curve.children) {
            var child = options.children.curve.children[id];
            child.children.y.onChange = handler;
        }


    }

    get dirname(){return __dirname}

    //onLinkChange(target){
    //    this.quality = target.quality;
    //    if(target.quality === 'good'){
    //        this.value = Math.round(this.children.curve.interpol(target.value) * 10) / 10;
    //    }
    //}
    //
    //onCurveChange(target){
    //    if(this.children.source.quality === 'good'){
    //        this.value = Math.round(this.children.curve.interpol(this.children.source.value) * 10) / 10;
    //    }
    //}

}

module.exports = TCurve;

