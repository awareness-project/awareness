//Central Signalling Device
//options:
//soundTimeout: switch sound to pulse mode after this timeout

//events:
//sound(state) //state: 'on'/'off'
//lamp(level, state) //state: 'new'/'pending'/'off'

//methods:
//push(name, level, object) //inform CSD about new event come
//pull(name, level) //inform CSD about event go
//acknowledge() //acknowledge all events


const EventEmitter = require('events');

class CSD extends EventEmitter{
    constructor(options){

        super();

        this.options = (typeof options === 'object') ? options : {};
        this._eventContainer = {};
    }

    _sound(state){
        if(this.sound !== state){
            this.sound = state;
            this.emit('sound', state);
        }
    }

    _lamp(level, state) {
        if(this._eventContainer[level].lamp !== state){
            this._eventContainer[level].lamp = state;
            this.emit('lamp', level, state);
        }
    }

    push(name, level, object){
        if(typeof this.options.levelFilter === 'function' && !this.options.levelFilter(level)) return; //do nothing if filter function is assigned and returns false;
        if(typeof this._eventContainer[level] !== 'object') this._eventContainer[level] = {list:{}};
        this._eventContainer[level].list[name] = object;
        this._sound('on');
        this._lamp(level, 'new');
    }

    pull(name, level){
        if(typeof this._eventContainer[level] !== 'object') return; //no events of this level ever exist
        delete this._eventContainer[level].list[name];
        if(isEmpty(this._eventContainer[level].list) && this._eventContainer[level].lamp === 'pending'){ //if list empty, and all events were acknowledged
            this._lamp(level, 'off');
        }
    }

    acknowledge(){
        this._sound('off');

        for(let level in this._eventContainer){
            if(isEmpty(this._eventContainer[level].list)){
                this._lamp(Number(level), 'off');
            } else {
                this._lamp(Number(level), 'pending');
            }
        }
    }
}

module.exports = CSD;

function isEmpty(obj) {
    for (var x in obj) { return false; }
    return true;
}