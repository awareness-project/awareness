'use strict';

var Neuron = require('./../prototype/neuron.js');

class Kvg extends Neuron {

    constructor(options) {

        if (!options.address) options.address = 1;

        options.children = {
            extControlMB: new Neuron({name:'Дистанционный запуск по Modbus', rw: true, setValueHandler: setValueStartHandler, master: options.master, address: options.address}),
            tempOutSetpoint :new Neuron({name:'Температура на выходе заданная', unit: '°C', rw: true, setValueHandler: setValueTempHandler, master: options.master, address: options.address}),
            cmnError:new Neuron({name:'Обобщенная неисправность'}),
            inWork:new Neuron({name:'В работе'}),
            heating:new Neuron({name:'Нагрев'}),
            configError:new Neuron({name:'Ошибка конфигурации'}),
            pGazMax:new Neuron({name:'Давление газа высокое'}),
            pGazMin:new Neuron({name:'Давление газа низкое'}),
            pGas:new Neuron({name:'Есть давление газа между V1 и V2'}),
            pWaterMax:new Neuron({name:'Давление воды высокое'}),
            tWaterMax:new Neuron({name:'Температура воды высокая'}),
            flow:new Neuron({name:'Проток'}),
            extControl:new Neuron({name:'Дистанционный запуск (разрешение) с. к.'}),
            fire:new Neuron({name:'Пламя'}),
            wire:new Neuron({name:'Неисправность цепи контроля пламени'}),
            tempOutErr:new Neuron({name:'Неисправность датчика температуры воды на выходе'}),
            tempInErr:new Neuron({name:'Неисправность датчика температуры воды на входе'}),
            tempOutGasErr:new Neuron({name:'Неисправность датчика температуры уходящих газов'}),
            tempAirErr:new Neuron({name:'Неисправность датчика температуры воздуха'}),
            stage:new Neuron({name:'Стадия работы котла', showState:true, states:[
                {condition:0, level: 1, text: "Останов"},
                {condition:1, level: 1, text: "Пауза"},
                {condition:2, level: 1, text: "Продувка перед запуском"},
                {condition:3, level: 1, text: "Контроль герметичности, открытие V2"},
                {condition:4, level: 1, text: "Контроль герметичности, проверка V1"},
                {condition:5, level: 1, text: "Контроль герметичности, открытие V1"},
                {condition:6, level: 1, text: "Контроль герметичности, проверка V2"},
                {condition:7, level: 1, text: "Завершение продувки перед запуском"},
                {condition:8, level: 1, text: "Выход на обороты розжига"},
                {condition:9, level: 1, text: "Нагрев электрода розжига"},
                {condition:10, level: 1, text: "Ожидание пламени"},
                {condition:11, level: 1, text: "Задержка отключения электрода розжига"},
                {condition:12, level: 1, text: "Нагрев теплоносителя"},
                {condition:13, level: 1, text: "Продувка перед остановом"},
                {condition:14, level: 3, text: "Ошибка"},
            ]}),
            tempOut:new Neuron({name:'Температура воды на выходе', unit: '°C'}),
            tempIn:new Neuron({name:'Температура воды на входе', unit: '°C'}),
            tempOutGas:new Neuron({name:'Температура уходящих газов', unit: '°C'}),
            tempAir:new Neuron({name:'Температура воздуха', unit: '°C'}),
            currentPower:new Neuron({name:'Мощность нагрева', unit: '%'}),
            ionCurrent:new Neuron({name:'Ток ионизации', unit: 'мкА'}),
            hsiCurrent:new Neuron({name:'Ток электрода розжига', unit: 'мА'}),
        };


        super(options);
    }

    init(initVal){
        super.init(initVal);

        if (this.options.master) {
            readLoop(this);
        }
    }

    get dirname(){return __dirname}

}

function readLoop(context) {
    context.options.master.readHoldings(context.options.address, 0, schema, function (error, data) {
            if (error) {
                context.log(error, data);
                for (var id in context.children) {
                    var child = context.children[id];
                    child.quality = 'bad';
                }
            } else {
                context.children.extControlMB.value = data[0];
                context.children.tempOutSetpoint.value = data[1];
                context.children.cmnError.value = data[2][0];
                context.children.inWork.value = data[2][1];
                context.children.heating.value = data[2][2];
                context.children.configError.value = data[2][3];
                context.children.pGazMax.value = data[3][0];
                context.children.pGazMin.value = data[3][1];
                context.children.pGas.value = data[3][2];
                context.children.pWaterMax.value = data[3][3];
                context.children.tWaterMax.value = data[3][4];
                context.children.flow.value = data[3][5];
                context.children.extControl.value = data[3][6];
                context.children.fire.value = data[3][7];
                context.children.wire.value = data[3][8];
                context.children.tempOutErr.value = data[3][9];
                context.children.tempInErr.value = data[3][10];
                context.children.tempOutGasErr.value = data[3][11];
                context.children.tempAirErr.value = data[3][12];
                context.children.stage.value = data[4];
                context.children.tempOut.value = Math.round(data[5]*10)/10;
                context.children.tempIn.value = Math.round(data[6]*10)/10;
                context.children.tempOutGas.value = Math.round(data[7]*10)/10;
                context.children.tempAir.value = Math.round(data[8]*10)/10;
                context.children.currentPower.value = data[9];
                context.children.ionCurrent.value = data[10];
                context.children.hsiCurrent.value = data[11];
            }
            setTimeout(function () {readLoop(context)}, 0);
        });
}




module.exports = Kvg;

var schema = [
    {itemType: 'W', count: 1},//[0]
    {itemType: 'E', count: 3},
    {itemType: 'F', count: 1},//[1]
    {itemType: 'E', count: 4},
    {itemType: 'B', count: 2},//[2],[3]
    {itemType: 'W', count: 1},//[4]
    {itemType: 'E', count: 7},
    {itemType: 'F', count: 7} //[5]...[11]
];

function setValueTempHandler(value, callback) {
    var val = parseFloat(value);

    if (isNaN(val)) {
        setTimeout(callback, 0, {code: 406, text: 'Incorrect value, should be a floating point number'});
        return;
    }

    if (this.options) {
        if ((typeof this.options.max == "number") && (value > this.options.max)) {
            setTimeout(callback, 0, {
                code: 406,
                text: 'Incorrect value, should be not more than ' + this.options.max
            });
            return;
        }
        if ((typeof this.options.min == "number") && (value < this.options.min)) {
            setTimeout(callback, 0, {
                code: 406,
                text: 'Incorrect value, should be not less than ' + this.options.min
            });
            return;
        }
    }

    //this.value = val;
    var context = this;

    context.options.master.writeHoldings(context.options.address, 4, [{itemType: 'F', count: 1}], [val], function (error, data) {
        if (error) {
            context.log(error, data);
            setTimeout(callback, 0, {
                code: 502,
                text: error
            });
        } else {
            setTimeout(callback, 0);
        }
    });
}

function setValueStartHandler(value, callback) {
    var context = this;

    function writeValue(value){
        context.options.master.writeHoldings(context.options.address, 0, [{itemType: 'W', count: 1}], [value], function (error, data) {
            if (error) {
                context.log(error, data);
                setTimeout(callback, 0, {
                    code: 502,
                    text: error
                });
            } else {
                setTimeout(callback, 0);
            }
        });
    }

    if (value == 0 && value != 1) {
        writeValue(0);
        return;
    } else if (value == 1 && value != 0) {
        writeValue(1);
        return;
    }
    setTimeout(callback, 0, {code: 406, text: 'Incorrect value, should be 0 or 1'});
}
