'use strict';
//нейрон для ЩУН-2 и ЩУН-3

//options:
//nP = 3 //означает число насосов - 3 иначе 2

var Neuron = require('./../prototype/neuron.js');

class PumpControl extends Neuron {

    constructor(options) {

        if (!options.address) options.address = 1;

        var kStates = [
            {condition:0, level: 1, text: "Отключен"},
            {condition:1, level: 1, text: "Включен"},
            {condition:2, level: 3, text: "Неисправен"},
        ];

        options.showState = true;
        options.states = kStates;
        options.rw = true;
        options.setValueHandler = setValueStartHandler;

        options.children = {
            alarmBt: new Neuron({name:'Кнопка аварийного останова', showState:true, states: [
                {condition:1, level: 3, text: "Нажата"},
            ]}),
            p: new Neuron({name:'Давление на входе', showState:true, states: [
                {condition:0, level: 1, text: "Норма"},
                {condition:1, level: 3, text: "Низкое"},
            ]}),
            pO: new Neuron({name:'Давление на выходе', showState:true, states: [
                {condition:0, level: 1, text: "Норма"},
                {condition:1, level: 3, text: "Высокое"},
                {condition:2, level: 2, text: "Низкое"},
            ]}),
            swT: new Neuron({name:'Интервал переключения насосов', unit: 'с', rw: true, setValueHandler: setIntervalHandler}),
            manBlk: new Neuron({name:'Блокировки в ручном режиме', showState:true, states: [
                {condition:0, level: 2, text: "Не применяются"},
                {condition:1, level: 0, text: "Применяются"},
            ]}),
            p1: new Neuron({
                name: 'Насос 1', showState: true, states: kStates, children: {
                    k: new Neuron({name: 'Контактор', showState: true, states: kStates}),
                    a: new Neuron({
                        name: 'Автомат', showState: true, states: [
                            {condition: 0, level: 3, text: "Отключен"},
                            {condition: 1, level: 1, text: "Включен"},
                        ]
                    }),
                    w: new Neuron({
                        name: 'Наработка', unit: 'ч', rw: true, setValueHandler: rstWHHandler, children: {
                            rT: new Neuron({name: 'Дата сброса'}),
                        }
                    }),
                    noP: new Neuron({
                        name: 'Насос не создает давление', states: [
                            {condition: 1, level: 3},
                        ]
                    }),
                }
            }),
            p2: new Neuron({
                name: 'Насос 2', showState: true, states: kStates, children: {
                    k: new Neuron({name: 'Контактор', showState: true, states: kStates}),
                    a: new Neuron({
                        name: 'Автомат', showState: true, states: [
                            {condition: 0, level: 3, text: "Отключен"},
                            {condition: 1, level: 1, text: "Включен"},
                        ]
                    }),
                    w: new Neuron({
                        name: 'Наработка', unit: 'ч', rw: true, setValueHandler: rstWHHandler, children: {
                            rT: new Neuron({name: 'Дата сброса'}),
                        }
                    }),
                    noP: new Neuron({
                        name: 'Насос не создает давление', states: [
                            {condition: 1, level: 3},
                        ]
                    }),
                }
            })
        };

        if(options.nP === 3){
            options.children.p3 = new Neuron({name:'Насос 3', showState:true, states: kStates, children:{
                k: new Neuron({name:'Контактор', showState:true, states: kStates}),
                a: new Neuron({name:'Автомат', showState:true, states: [
                    {condition:0, level: 3, text: "Отключен"},
                    {condition:1, level: 1, text: "Включен"},
                ]}),
                w: new Neuron({name:'Наработка', unit: 'ч', rw: true, setValueHandler: rstWHHandler, children:{
                    rT: new Neuron({name:'Дата сброса'}),
                }}),
                noP: new Neuron({name:'Насос не создает давление', states: [
                    {condition:1, level: 3},
                ]}),
            }});
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
    context.options.master.readHoldings(context.options.address, 4188, schema, function (error, data) {
            if (error) {
                context.each(function(neuron){
                    neuron.quality = 'bad';
                });
            } else {
                context.children.swT.value = data[0];

                context.children.manBlk.value = data[1];

                context.children.p1.children.k.value = data[3][0]?2:(data[2][0]?1:0);
                context.children.p2.children.k.value = data[3][1]?2:(data[2][1]?1:0);

                context.children.p1.children.a.value = data[2][3]?1:0;
                context.children.p2.children.a.value = data[2][4]?1:0;

                context.children.p1.children.noP.value = data[3][8]?1:0;
                context.children.p2.children.noP.value = data[3][9]?1:0;

                context.children.p1.value = data[3][12]?2:(data[2][0]?1:0);
                context.children.p2.value = data[3][13]?2:(data[2][1]?1:0);

                context.children.p1.children.w.value = Math.floor(data[7] / 3600);
                context.children.p2.children.w.value = Math.floor(data[8] / 3600);

                context.children.p1.children.w.children.rT.value = new Date(2000,1,1,0,0,data[4]).toLocaleString();
                context.children.p2.children.w.children.rT.value = new Date(2000,1,1,0,0,data[5]).toLocaleString();

                if(context.options.nP === 3) {
                    context.children.p3.children.k.value = data[3][2] ? 2 : (data[2][2] ? 1 : 0);
                    context.children.p3.children.a.value = data[2][5] ? 1 : 0;
                    context.children.p3.children.noP.value = data[3][10] ? 1 : 0;
                    context.children.p3.value = data[3][14] ? 2 : (data[2][2] ? 1 : 0);
                    context.children.p3.children.w.value = Math.floor(data[9] / 3600);
                    context.children.p3.children.w.children.rT.value = new Date(2000, 1, 1, 0, 0, data[6]).toLocaleString();
                    context.value = data[3][15]?2:((data[2][0]||data[2][1]||data[2][2])?1:0);
                } else{
                    context.value = data[3][15]?2:((data[2][0]||data[2][1])?1:0);
                }


                context.children.alarmBt.value = data[3][11]?1:0;

                context.children.p.value = (data[2][6]||data[3][6])?1:0;

                context.children.pO.value = (data[3][7])?1:((data[2][7]&&data[2][9]&&data[2][11])?2:0);

                context.children.manBlk.value = data[1];


            }
            setTimeout(function () {readLoop(context)}, 0);
        });
}




module.exports = PumpControl;

var schema = [
    {itemType: 'DW', count: 1, swapWords: true},//[0]
    {itemType: 'W', count: 1},//[1]
    {itemType: 'E', count: 3},
    {itemType: 'B', count: 2},//[2],[3]
    {itemType: 'DW', count: 6, swapWords: true},//[4]...[9]
];





function rstWHHandler(value, callback) {
    var context = this;

    var pump = context.parent;
    var root = pump.parent;

    switch (pump){
        case root.children.p1:
            var address = 345;
            break;
        case root.children.p2:
            var address = 346;
            break;
        case root.children.p3:
            var address = 347;
            break;
        default:
            setTimeout(callback, 0, {code: 500, text: 'Internal Server Error'});
            return;
    }

    if(value == 0){
        root.options.master.writeHoldings(root.options.address, address, [{itemType: 'W', count: 1}], [1], function (error, data) {
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
    } else {
        setTimeout(callback, 0, {code: 406, text: 'Incorrect value, should be 0'});
    }
}

function setIntervalHandler(value, callback) {
    var val = parseInt(value);

    if (!((val >= 10) && (val < 86400))) {
        setTimeout(callback, 0, {code: 406, text: 'Недопустимое значение, должно быть целое число от 10 до 86399'});
        return;
    }

    var root = this.parent;

    root.options.master.writeHoldings(root.options.address, 90, [{itemType: 'DW', count: 1, swapWords: true}], [val], function (error, data) {
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
        context.options.master.writeHoldings(context.options.address, 350 + value, [{itemType: 'W', count: 1}], [1], function (error, data) {
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
        writeValue(1);
        return;
    } else if (value == 1 && value != 0) {
        writeValue(0);
        return;
    }
    setTimeout(callback, 0, {code: 406, text: 'Недопустимое значение, должно быть 0 или 1'});
}