'use strict';
var assert = require('assert');
var Neuron = require('./../prototype/neuron.js');

class Link extends Neuron {

    constructor(options) {

        super(options);

        var context = this;

        if(this.options.link) {
            process.nextTick(function () {
                var target = context.root.getNeuron(context.options.link);
                assert(target, 'Failure link: ' + context.options.link + ' at: ' + context.data.path);
                //target.onChange = context.onLinkChange.bind(context);
                target.onChange = context.newHandler(function(callers){
                    this.value = target.value;
                    this.quality = target.quality;
                });
            });
        }
    }

    get dirname(){return __dirname}

    //onLinkChange(target){
    //    this.value = target.value;
    //    this.quality = target.quality;
    //}

}

module.exports = Link;