'use strict';
var Influx = require('influx');
var fs = require("fs");
var CSD = require('./csd.js');

class Neuron {

    constructor(options) {
        var context = this;
        //context.options = options;

        Object.defineProperty(context, 'options', {value: options});
        Object.defineProperty(context, 'data', {value: {}});

        Object.defineProperty(context, '_onChangeHandlers', { //this definition makes property not enumerable by default
            value: []
        });

        Object.defineProperty(context, '_quality', {writable: true});
        Object.defineProperty(context, '_value', {writable: true});

        context.name = options.name;
        //context.path = '';
        this.data.path = '';
        this.data.pathReadable = '';//context.name;

        if (options.showState) {
            context.showState = true;
        }

        //if (options.value != null) { //now this is done later in init procedure
        //    context.value = options.value;
        //}
        //context.quality = 'good';

        if (options.unit != null) {
            context.unit = options.unit;
        }
        if (options.rw == true) {
            context.rw = true;
        }
        if (typeof options.setValueHandler === 'function') {
            context.setValueHandler = options.setValueHandler;
        }

        if (!(options.children instanceof Object)) {
            options.children = {};
        }

        for (var id in options.children) {
            var child = options.children[id];
            Object.defineProperty(child, 'parent', { //this definition makes property not enumerable by default
                value: context
            });
            //child.path = context.name + child.path;
            child.pushPath(id, child.name);
        }

        //process.nextTick(function(){    //Write empty value to db on start, to break the lines on trends
        //    Neuron.queueToDb(context.data.path, null);
        //});

        //setImmediate()
        Neuron.queueToInit(this);
    }

    init(initVal){  // may be overriden by ancestors, but don't forget to call super.init(initVal)
        this.setPubPath();
        this.value = initVal; //this also triggers writing to db and value change handlers
    }

    log(level, message) {
        var context = this;
        console.log(new Date().toISOString() + ' ' + context.data.path + ' ' + level + ' ' + message);
    }

    getPubPath() {
        return this.options.pubPath;
    }

    setPubPath() {
        var context = this;
        if(typeof this.options.pubPath === 'string') return;
        var testPath = Neuron.projectPath + '/npub/' + this.data.path + (this.data.path?'/':'') + 'public';
        fs.access(testPath, fs.constants.R_OK, function(err){
            if(err){
                //console.log(err);
                context.options.pubPath =  context.dirname + '/public';
            } else {
                context.options.pubPath = testPath;
            }
        });
    }

    pushPath(path, pathReadable){
        this.data.path = path + (this.data.path.length?('/' + this.data.path):'');
        this.data.pathReadable = pathReadable + (this.data.pathReadable.length?('/' + this.data.pathReadable):'');
        for (var id in this.options.children) {
            this.options.children[id].pushPath(path, pathReadable);
        }
    }

    /*getPath() {
        var parent = this.parent;
        if (parent) {
            var parPath = parent.getPath();
            parPath.push({id: this.id, name: this.name});
            return parPath;
        } else {
            return [{id: this.id, name: this.name}];
        }
    }*/

    getNeuron(path) { //path should be always relative to root neuron (node) excluding root id
        if (!path) return this;

        if (typeof path === 'string') {
            var spltPath = path.split('/');
            var child = this.children[spltPath.shift()];
            if (child) {
                return child.getNeuron(spltPath.join('/'));
            }
        }
    }

    setValue(value, callback) {

        if (this.rw) {
            if (typeof this.setValueHandler === 'function') {
                this.setValueHandler(value, callback);                          ////setValueHandler - this handler may be set for instance to override default behaviour
            } else {
                this.setValueDefaultHandler(value, callback);
            }
        } else {
            if(typeof callback === 'function')
                setTimeout(callback, 0, {code: 403, text: 'Value is read-only'});
        }
    }

    setValueDefaultHandler(value, callback) {                                   ////setValueDefaultHandler - this handler may be overriden by ancestor classes
        this.value = value;
        if(typeof callback === 'function')
            setTimeout(callback, 0);
    }

    newHandler(callback){ // this returns function binded to this context to be used as an argument of onCange method of other neurons
        var context = this;
        var handlerObj = {
            context: context,
            callback: callback
        };

        return function( caller ) {// this will be called each time handled neuron change it's value, caller is the calling neuron
            if(!handlerObj.callers){
                handlerObj.callers = [];
                setImmediate(function () {// this will be called once, in next event loop cycle after all simultaneous calls are made
                    callback.call(handlerObj.context, handlerObj.callers.slice()); //slice() makes a shallow copy of the array, we need this cause handlerObj.callers will be destroyed after a call, but we may need callers in postponed callbacks
                    handlerObj.callers = null;
                });
            }
            handlerObj.callers.push(caller);
        }
    }

    static setValueBinaryHandler(value, callback) {
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

    static setValueFloatHandler(value, callback) {
        var val = parseFloat(value);

        if (isNaN(val)) {
            if(typeof callback === 'function')setTimeout(callback, 0, {code: 406, text: 'Incorrect value, should be a floating point number'});
            return;
        }

        if (this.options) {
            if ((typeof this.options.max == "number") && (value > this.options.max)) {
                if(typeof callback === 'function')setTimeout(callback, 0, {
                    code: 406,
                    text: 'Incorrect value, should be not more than ' + this.options.max
                });
                return;
            }
            if ((typeof this.options.min == "number") && (value < this.options.min)) {
                if(typeof callback === 'function')setTimeout(callback, 0, {
                    code: 406,
                    text: 'Incorrect value, should be not less than ' + this.options.min
                });
                return;
            }
            if (typeof this.options.precision === "number") {
                val = Number(Math.round(val+'e'+this.options.precision)+'e-'+this.options.precision);
            }
        }

        this.value = val;
        if(typeof callback === 'function')setTimeout(callback, 0);
    }

    static setValuePortNumberHandler(value, callback) {
        var val = parseInt(value, 10);
        if (val > 0 && val <= 65535) {
            this.value = val;
            if(typeof callback === 'function')setTimeout(callback, 0);
            return;
        }
        if(typeof callback === 'function')setTimeout(callback, 0, {code: 406, text: 'Incorrect value, should be a number between 1 and 65535'});
    }


    get dirname() {
        return __dirname;
    }

    get children() {
        return this.options.children;
    }

    set onChange(value) {
        if (typeof value === 'function')
            this._onChangeHandlers.push(value);
    }

    get value() {
        return this._value;
    }

    set value(value) {
        var changed = this._value !== value;
        if (changed && Number.isNaN(this._value) && Number.isNaN(value)) changed = false; //fix for NaN !== NaN

        if (this._quality == 'bad') changed = true; // even the same value are changed if the quality was bad, to inform all subscribers

        if (changed) {

            if(Array.isArray(this.options.states)){
                var states = [];

                for(var state of this.options.states){
                    let newCondition;
                    let oldCondition;
                    if(typeof state.condition === 'function') {
                        newCondition = state.condition(value);
                        oldCondition = state.condition(this._value);
                    } else {
                        newCondition = state.condition == value;
                        oldCondition = state.condition == this._value;
                    }
                    if(newCondition) states.push({level:state.level, text: state.text});

                    if(newCondition != oldCondition){
                        let name = (typeof state.text == 'string')?state.text:this.name;
                        if((state.level > 0) && (state.level < 4)){
                            Neuron.queueToDbEvents(this.data.path, {come: newCondition, text:name, class: ['i','i','w','a'][state.level]});
                            if(newCondition)
                                Neuron.csd.push(this.data.path, state.level, this);
                            else
                                Neuron.csd.pull(this.data.path, state.level);
                        }
                    }
                }
                if(states.length){
                    states.sort(function(a, b){return b.level - a.level});
                    this.state = states;
                } else {
                    delete this.state;
                }
            }

            this._value = value;
            this._quality = 'good';

            Neuron.queueToDb(this.data.path, this.value);
            for (var cb of this._onChangeHandlers) {
                cb(this);
            }
        }
    }

    get quality() {
        return this._quality;
    }

    set quality(value) {
        var changed = this._quality !== value;

        if (changed) {
            //this._quality = value;
            if(value === 'bad') {
                this._quality = value;
                Neuron.queueToDb(this.data.path, null);
                for (var cb of this._onChangeHandlers) {
                    cb(this);
                }
            }
        }
    }

    get values() {
        var v = {
            value: this.value,
            quality: this.quality,
            children: {}
        };

        for (var id in this.options.children) {
            var ch = this.children[id];

            v.children[id] = {
                value: ch.value,
                quality: ch.quality
            };
        }

        return v;
    }


    toJSON() { //json.stringify returns only own enumerable properties, so need this to populate some values from prototype
        var obj = Object.assign({
            value: (typeof this.options.fixed === 'number' && typeof this.value === 'number')?this.value.toFixed(this.options.fixed):this.value,
            quality: this.quality,
            children: this.children
        }, this);
        return obj;
    }

    get root() {
        if (this.parent) {
            return this.parent.root;
        }
        return this;
    }

    static setDB(options) {

        Neuron.dbEndpoint = Influx({
            host : options.host,
            port : 8086, // optional, default 8086
            protocol : 'http',
            username : 'root',
            password : 'root',
            timePrecision : 'u',
            database : 'awareness',
            failoverTimeout : 5000
        });
    }

    static flushToDb() {
        console.log(new Date().toISOString() + 'FLUSHING TO DB:');
        console.log(Neuron.dbQueue);
        Neuron.dbEndpoint.writeSeries(Neuron.dbQueue, { rp : 'rp_tick'}, function (err, response) {
            if(err)console.log(new Date().toISOString() + '  DB write error: ' + err);
        });
        Neuron.dbQueue = null;
    }

    static queueToDb(path, value) {
        if (!Neuron.dbQueue) {
            Neuron.dbQueue = {};//[];
            Neuron.dbTime = new Date() * 1000 + 1;//time returned later as string, and interpreted either, trailing zeroes are omitted, so adding small value to prevent zeroes from disappearing
            setImmediate(Neuron.flushToDb);
        }

        var val;

        switch(typeof value){
            case 'number':
                val = isNaN(value)?{quality:0}:{value};
                break;
            case 'string':
                val = value.length?{value}:{};
                break;
            default:
                val = {quality:0};
        }

        Neuron.dbQueue[path.replace(/\//g,'.')] = [[val]];
    }

    static flushToDbEvents() {
        console.log(new Date().toISOString() + 'FLUSHING TO DB:');
        console.log(Neuron.dbQueueEvents);
        Neuron.dbEndpoint.writePoints('events', Neuron.dbQueueEvents, {}, function (err, response) {
            if(err)console.log(new Date().toISOString() + '  DB write error: ' + err);
        });
        Neuron.dbQueueEvents = null;
    }

    static queueToDbEvents(path, event) {
        if (!Neuron.dbQueueEvents) {
            Neuron.dbQueueEvents = [];
            setImmediate(Neuron.flushToDbEvents);
        }

        Neuron.dbQueueEvents.push([{come:event.come},{path: path, text:event.text, class:event.class}]);
    }


    static queueToInit(neuron) {
        if (!Neuron.initQueue) {
            // This section fire once first neuron was created
            console.log(new Date().toISOString() + '  Creating init queue...');
            Neuron.initQueue = [];
            setImmediate(function queryAndInit(){
                // This section fire once after last neuron was created
                console.log(new Date().toISOString() + '  Querying db for retentive values...');
                Neuron.dbEndpoint.queryRaw('SELECT last(value) AS value FROM awareness.rp_tick./.*/'
                    + '; SELECT last(value) AS value FROM awareness.rp_1m./.*/', function (err, results) {
                    var parsedResultsShort = {};
                    var parsedResultsLong = {};
                    if (!err && typeof results === 'object') {
                        console.log(new Date().toISOString() + '  Querying db successful:');

                        Neuron.dbEndpoint.writePoint('events', {come:true, time: new Date()},{text:'Запуск сервера', class:'s'}, {precision: 'ms'}, function (err, response) {
                            if(err)console.log(new Date().toISOString() + '  DB write error: ' + err);
                            Neuron.startTime = new Date();
                        });

                        if(results[0] && results[0].series) {
                            console.log(new Date().toISOString() + '  ' + results[0].series.length + ' records fetched from short term archive');
                            for (var i of results[0].series) {
                                if (i.values[0].length === 2)
                                    parsedResultsShort[i.name.replace(/\./g, '/')] = i.values[0][1];
                            }
                        } else {
                            console.log(new Date().toISOString() + '  no records fetched from short term archive');
                        }
                        if(results[1] && results[1].series) {
                            console.log(new Date().toISOString() + '  ' + results[1].series.length + ' records fetched from long term archive');
                            for (var i of results[1].series) {
                                if (i.values[0].length === 2)
                                    parsedResultsLong[i.name.replace(/\./g, '/')] = i.values[0][1];
                            }
                        } else {
                            console.log(new Date().toISOString() + '  no records fetched from long term archive');
                        }
                    } else {
                        console.log(new Date().toISOString() + '  Error querying db: ' + err);
                        //console.log(new Date().toISOString() + '  Retentive values will be re initiated');

                        setTimeout(queryAndInit, 1000);
                        return;
                    }

                    var neuronCount = 0;
                    var retCount = 0;
                    var retReadCount = 0;
                    var initWithStart = 0;
                    Neuron.list = {};

                    for(var i of Neuron.initQueue){
                        var initVal = undefined;
                        neuronCount++;
                        if(i.options.retentive){
                            retCount++;
                            if(parsedResultsShort.hasOwnProperty(i.data.path)){
                                retReadCount++;
                                initVal = parsedResultsShort[i.data.path];
                            } else if(parsedResultsLong.hasOwnProperty(i.data.path)){
                                retReadCount++;
                                initVal = parsedResultsLong[i.data.path];
                            }
                            else if(i.options.hasOwnProperty('value')){
                                initVal = i.options.value;
                                initWithStart++;
                            }
                        } else if(i.options.hasOwnProperty('value')){
                            initVal = i.options.value;
                            initWithStart++;
                        }

                        Neuron.list[i.data.path] = i;
                        i.init(initVal);
                    }

                    console.log(new Date().toISOString() + '  Initiating process finished, total neurons: ' + neuronCount + '; retentive: ' + retCount + '; read from db: ' + retReadCount + '; initiated with start value: ' + initWithStart);
                    Neuron.initQueue = null;

                    if(typeof Neuron.afterInit === 'function'){
                        Neuron.afterInit();
                    }
                });
            });
        }
        Neuron.initQueue.push(neuron);
    }
}

Neuron.csd = new CSD({levelFilter:function(level){return level==2 || level == 3 }});

module.exports = Neuron;



