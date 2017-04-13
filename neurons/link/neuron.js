'use strict';

var Neuron = require('./../prototype/neuron.js');
var Tag = require('./../../tags/prototype/tag.js');

class Link extends Neuron {

    constructor(options) {

        super(options);

        var context = this;

        if(this.options.link) {
            process.nextTick(function () {
                var target = context.root.getNeuron(context.options.link);
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