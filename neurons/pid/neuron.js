/*
options:
pV: optional, string, link to process value neuron
t: optional, number, pid call interval in ms; if omitted or less than 50, 1000 ms will be used
n: optional, number, error signal filtering cycles number, used for linear approximation; if omitted or less than 2, 2 will be used (no filter)
*/


'use strict';

var Neuron = require('./../prototype/neuron.js');
var Link = require('./../link/neuron.js');

class Pid extends Neuron {

    constructor(options) {

        options.showState = true;

        var pV = typeof options.pV === 'string' ? new Link({name:'Значение процесса', link: options.pV}) :
            new Neuron({name:'Значение процесса', value: 0, rw:true, retentive: true, setValueHandler: Neuron.setValueFloatHandler});

        var sP = new Neuron({name:'Задание', value: 0, rw:true, retentive: true, setValueHandler: Neuron.setValueFloatHandler});

        options.children = {
            pV: pV,
            sP: sP,
            e: new Neuron({name:'Рассогласование'}),
            eS: new Neuron({name:'Рассогласование фильтрованное'}),
            components: new Neuron({name:'Составляющие', children: {
                p: new Neuron({name: 'Пропорциональная'}),
                i: new Neuron({name: 'Интегральная'}),
                d: new Neuron({name: 'Дифференциальная'}),
            }}),
            par: new Neuron({name:'Параметры', children: {
                lH: new Neuron({name: 'Верхний предел выхода',retentive: true, value: 100, rw: true, setValueHandler: Neuron.setValueFloatHandler}),
                lL: new Neuron({name: 'Нижний предел выхода',retentive: true, value: -100, rw: true, setValueHandler: Neuron.setValueFloatHandler}),
                kP: new Neuron({name: 'Коэффициент пропорциональной части',retentive: true, value: 1, rw: true, setValueHandler: Neuron.setValueFloatHandler}),
                tI: new Neuron({name: 'Постоянная времени интегральной части',retentive: true, value: 0, unit: 'с', rw: true, setValueHandler: Neuron.setValueFloatHandler}),
                tD: new Neuron({name: 'Постоянная времени дифференциальной части',retentive: true, value: 0, unit: 'с', rw: true, setValueHandler: Neuron.setValueFloatHandler}),
                dZ: new Neuron({name: 'Зона нечувствительности',retentive: true, value: 0, rw: true, setValueHandler: Neuron.setValueFloatHandler}),
            }}),
        };

        super(options);
    }

    init(initVal){
        super.init(initVal);

        var context = this;
        var components = this.options.children.components.children;

        var t = (this.options.t >= 50)?this.options.t:1000;
        var n = (this.options.n >= 2)?this.options.n:2;;

        pid.lastTime = Date.now();
        pid.lastDiff = 0;
        pid.i = 0;
        pid.lastVal = 0;
        pid.d = 0;
        pid.vals = [];



        function pid(callers){

            if (context.children.pV.quality !== 'good' || !(context.children.pV.value <= Number.POSITIVE_INFINITY )) {
                context.quality = 'bad';
            } else {
                var now = Date.now();

                var diff = (context.children.sP.value - context.children.pV.value);

                var dZ = context.children.par.children.dZ.value;

                var lH = context.children.par.children.lH.value;
                var lL = context.children.par.children.lL.value;

                context.children.e.value = diff;

                let vals = {
                    x: now,
                    y: diff//,
                    //xy: now * diff,
                    //xx: now * now
                };

                let summs = {
                    x: 0,
                    y: 0,
                    xy: 0,
                    xx: 0
                };

                pid.vals.push(vals);

                var a = 0;

                if(pid.vals.length > n){
                    pid.vals.shift();
                    for(let i = 0; i < n; i++){
                        let x = pid.vals[i].x - now;
                        summs.x += x;//pid.vals[i].x;
                        summs.y += pid.vals[i].y;
                        summs.xx += x*x;//pid.vals[i].xx;
                        summs.xy += x * pid.vals[i].y;//pid.vals[i].xy;
                    }

                    a = (n * summs.xy - summs.x * summs.y) / (n * summs.xx - summs.x * summs.x);

                    var b = (summs.y - a * summs.x) / n;

                    //diff = a * now + b;
                    //diff = a * (- t) + b;
                    diff = b;
                }

                pid.d = a * context.children.par.children.tD.value * 1000 * context.children.par.children.kP.value;

                if(diff > dZ)
                    diff -= dZ;
                else if(diff < -dZ)
                    diff += dZ;
                else {
                    diff = 0;
                    pid.d = 0;
                }

                context.children.eS.value = diff;

                diff *=  context.children.par.children.kP.value;
                var p = diff;

                //pid.d = a * context.children.par.children.tD.value * 1000 * context.children.par.children.kP.value;
                //pid.d = (diff - pid.lastDiff) / Math.min(t, now - pid.lastTime) * context.children.par.children.tD.value * 1000;
                //pid.d = (diff - pid.lastDiff) / Math.min(t, now - pid.lastTime) * context.children.par.children.tD.value * 1000;

                var di = 0;
                if(context.children.par.children.tI.value > 0) {
                    di = pid.lastDiff * (now - pid.lastTime) / 1000 / context.children.par.children.tI.value;
                }

                pid.lastTime = now;
                pid.lastDiff = diff;

                var newVal = p + pid.i + di + pid.d;
                if(newVal > lH) newVal = lH;
                else if(newVal < lL) newVal = lL;
                else pid.i += di;

                context.value = newVal;

                components.p.value = p;
                components.i.value = pid.i;
                components.d.value = pid.d;
            }
        }

        setInterval(pid, t);
    }


    get dirname(){return __dirname}

}

module.exports = Pid;


