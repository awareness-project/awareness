'use strict';

var Neuron = require('./../prototype/neuron.js');
var Http = require('http');

class Weather extends Neuron {

    constructor(options) {

        options.unit = '°C';

        super(options);

        var context = this;

        if(!context.options.locationId)context.options.locationId = 295863;
        context.data.attempts = 3;

        //setTimeout(function(){context.request()},0);
    }

    init(initVal){
        super.init(initVal);

        this.request();
    }

    request(){
        var context = this;

        var opts = {
            host: 'www.accuweather.com',
            path: 'http://www.accuweather.com/ajax-service/oap/current?locationkey='+ context.options.locationId +'&unit=c',
            headers: {
                Host: 'www.accuweather.com'
            }
        };

        if(context.options.proxy){
            opts.host = context.options.proxy.host;
            opts.port = context.options.proxy.port;
        }

        var getRequest = Http.request(opts, function(res) {
            var str = '';
            res.on('data', function (chunk) {
                if(chunk) {
                    if (str.length + chunk.length > 5000){
                        context.log(0, 'Too heavy response from server, aborting');
                        context.quality = 'bad';
                        res.req.abort(); // end event will fire
                    } else {
                        str += chunk;
                    }
                }
            });

            res.on('end', function () {
                var match = str.match(/<span class=\"aw-temperature-today\"><b>(-?\d+)<sup>/);
                if (match && (match.length == 2)) {
                    context.value = parseInt(match[1]);
                    //context.quality = 'good';                     //quality gets good automatically on entering good value
                    context.log(2, 'Got ' + context.value + '°C');
                    context.data.attempts = 3;
                    setTimeout(function(){context.request()},10000);
                } else {
                    context.log(0, 'Server answer could not be parsed');
                    if(context.data.attempts){
                        context.data.attempts --;
                        setTimeout(function(){context.request()},1000);
                    } else {
                        context.quality = 'bad';
                        setTimeout(function(){context.request()},10000);
                    }
                }
            });

            res.on('error', function(e) {
                context.log(0, "Error: " + e.message);
                if(context.data.attempts){
                    context.data.attempts --;
                    setTimeout(function(){context.request()},1000);
                } else {
                    context.quality = 'bad';
                    setTimeout(function(){context.request()},10000);
                }

            });
        });

        getRequest.on('error', function (err) {
            context.log(0,err);
            context.quality = 'bad';
            setTimeout(function(){context.request()},10000);
        });

        getRequest.end();
    }

    get dirname(){return __dirname}

}

module.exports = Weather;