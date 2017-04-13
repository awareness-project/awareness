'use strict';

var Neuron = require('./../prototype/neuron.js');
var Http = require('http');
var Crypto = require('crypto');
var xml2js = require('xml2js');
var parser = new xml2js.Parser({explicitArray:false});
var parseString = parser.parseString;

class UpsDelta extends Neuron {

    constructor(options) {

        options.children = {
            webConn:new Neuron({name:'Соединение c UPSentry 2012', value:0, showState:true, states:[
                {condition:0, level:2, text: 'Отсутствует'},
                {condition:1, level:1, text: 'Норма'},
            ]}),
            upsConn:new Neuron({name:'Соединение c ИБП', value:0, showState:true, states:[
                {condition:0, level:2, text: 'Отсутствует'},
                {condition:1, level:1, text: 'Норма'},
            ]}),
            id:new Neuron({name:'Идентификация', children: {
                model:new Neuron({name:'Модель'}),
                type:new Neuron({name:'Тип', showState:true, states:[
                    {condition:0, level:0, text: 'On line'},
                    {condition:1, level:0, text: 'Off line'},
                ]}),
                firmware:new Neuron({name:'Версия прошивки'}),
                software:new Neuron({name:'Версия Web приложения'}),
                sn:new Neuron({name:'Серийный номер'}),
            }}),
            rating:new Neuron({name:'Рейтинг', children: {
                va:new Neuron({name:'Полная мощность', unit: 'В·А'}),
                power:new Neuron({name:'Активная мощность', unit: 'Вт'}),
                inputV:new Neuron({name:'Входное напряжение', unit: 'В'}),
                outputV:new Neuron({name:'Выходное напряжение', unit: 'В'}),
                frequency:new Neuron({name:'Частота', unit: 'Гц'}),
                batteryV:new Neuron({name:'Напряжение батареи', unit: 'В'}),
                hiTransV:new Neuron({name:'Верхний порог напряжения', unit: 'В'}),
                loTransV:new Neuron({name:'Нижний порог напряжения', unit: 'В'}),
            }}),
            battery:new Neuron({name:'Батарея', children: {
                status:new Neuron({name:'Состояние', showState:true, states:[
                    {condition:0, level:1, text: 'Норма'},
                    {condition:1, level:1, text: 'Не полный заряд'},
                    {condition:2, level:2, text: 'Низкий заряд'},
                    {condition:3, level:3, text: 'Разряжена'},
                    {condition:4, level:3, text: 'Неисправна'},
                ]}),
                charger:new Neuron({name:'Зарядное устройство', showState:true, states:[
                    {condition:0, level:0, text: 'Отдых'},
                    {condition:1, level:0, text: 'Заряд'},
                    {condition:3, level:0, text: 'Разряд'},
                ]}),
                test:new Neuron({name:'Тестирование', showState:true, states:[
                    {condition:0, level:0, text: 'Не проводилось'},
                    {condition:1, level:1, text: 'Пройдено'},
                    {condition:2, level:1, text: 'Проводится'},
                    {condition:3, level:2, text: 'Не пройдено'},
                    {condition:4, level:2, text: 'Не пройдено'},
                    {condition:5, level:2, text: 'Не пройдено'},
                    {condition:6, level:0, text: 'Отменено'},
                ]}),
                onBatt:new Neuron({name:'Время работы от батареи', unit: 'с'}),
                level:new Neuron({name:'Уровень заряда', unit: '%'}),
                voltage:new Neuron({name:'Напряжение', unit: 'В'}),
                temperature:new Neuron({name:'Температура', unit: '°C'}),
            }}),
            input:new Neuron({name:'Вход', children: {
                frequency:new Neuron({name:'Частота', unit: 'Гц'}),
                voltage:new Neuron({name:'Напряжение', unit: 'В'}),
            }}),
            bypass:new Neuron({name:'Байпас', children: {
                frequency:new Neuron({name:'Частота', unit: 'Гц'}),
                voltage:new Neuron({name:'Напряжение', unit: 'В'}),
                current:new Neuron({name:'Ток', unit: 'А'}),
                power:new Neuron({name:'Мощность', unit: 'Вт'}),
            }}),
            output:new Neuron({name:'Выход', children: {
                source:new Neuron({name:'Режим работы', showState:true, states:[
                    {condition:0, level:1, text: 'Норма'},
                    {condition:1, level:2, text: 'От батареи'},
                    {condition:2, level:2, text: 'Байпас/резерв'},
                    {condition:3, level:1, text: 'Понижение'},
                    {condition:4, level:1, text: 'Повышение'},
                    {condition:5, level:2, text: 'Ручной байпас'},
                    {condition:6, level:2, text: 'Другой'},
                    {condition:7, level:3, text: 'Отключен'},
                ]}),
                frequency:new Neuron({name:'Частота', unit: 'Гц'}),
                voltage:new Neuron({name:'Напряжение', unit: 'В'}),
                current:new Neuron({name:'Ток', unit: 'А'}),
                power:new Neuron({name:'Мощность', unit: 'Вт'}),
                load:new Neuron({name:'Нагрузка', unit: '%'}),
            }}),
            status:new Neuron({name:'Состояние', children: {
                inputOutOfRange:new Neuron({name:'Входное напряжение не в норме', states:[{condition:1, level:2}]}),
                batteryLow:new Neuron({name:'Заряд батареи низкий', states:[{condition:1, level:2}]}),
                batteryDepleted:new Neuron({name:'Заряд батареи исчерпан', states:[{condition:1, level:3}]}),
                batteryNeedReplace:new Neuron({name:'Требуется замена батареи', states:[{condition:1, level:3}]}),
                batteryGroundFault:new Neuron({name:'Замыкание батареи на землю', states:[{condition:1, level:3}]}),
                testInProgress:new Neuron({name:'Тест выполняется', states:[{condition:1, level:1}]}),
                testFail:new Neuron({name:'Тест не пройден', states:[{condition:1, level:2}]}),
                outputOff:new Neuron({name:'Выход отключен', states:[{condition:1, level:2}]}),
                onBypass:new Neuron({name:'Байпас включен', states:[{condition:1, level:2}]}),
                upsSystemOff:new Neuron({name:'Система ИБП отключена', states:[{condition:1, level:2}]}),
                upsShutdown:new Neuron({name:'ИБП завершает работу', states:[{condition:1, level:2}]}),
                outputBreaker:new Neuron({name:'Сработал выходной разъединитель', states:[{condition:1, level:3}]}),
                outputOverVoltage:new Neuron({name:'Перенапряжение на выходе', states:[{condition:1, level:3}]}),
                outputUnderVoltage:new Neuron({name:'Недонапряжение на выходе', states:[{condition:1, level:3}]}),
                overload:new Neuron({name:'Перегрузка', states:[{condition:1, level:3}]}),
                overtemp:new Neuron({name:'Перегрев', states:[{condition:1, level:3}]}),
                upsFail:new Neuron({name:'Неисправность ИБП', states:[{condition:1, level:3}]}),
                fanAbnormal:new Neuron({name:'Неисправность вентилятора', states:[{condition:1, level:3}]}),
                fuseAbnormal:new Neuron({name:'Неисправность предохранителя', states:[{condition:1, level:3}]}),
                inverterAbnormal:new Neuron({name:'Неисправность инвертора', states:[{condition:1, level:3}]}),
                chargerAbnormal:new Neuron({name:'Неисправность зарядного устройства', states:[{condition:1, level:3}]}),
                bypassOutOfRange:new Neuron({name:'Напряжение на байпасе не в норме', states:[{condition:1, level:2}]}),
                emergencyPowerOff:new Neuron({name:'Аварийное отключение', states:[{condition:1, level:3}]}),
                phaseAsync:new Neuron({name:'Рассинхронизация фаз', states:[{condition:1, level:2}]}),
                rectifierAbnormal:new Neuron({name:'Неисправность выпрямителя', states:[{condition:1, level:3}]}),
            }}),
        };

        super(options);

        var context = this;

        context.webData = {};

        context.reqOpts = {
            host: context.options.host,
            port: context.options.port,
            path: '/login.asp',
            headers: {
            }
        };

        //setTimeout(function(){context.request()},0);
    }

    init(initVal){
        super.init(initVal);

        this.request();
    }

    request(reqBody){
        var context = this;

        var getRequest = Http.request(context.reqOpts, function(res) {
            var str = '';
            res.on('data', function (chunk) {
                if(chunk) {
                    if (str.length + chunk.length > 15000){
                        context.log(0, 'Too heavy response from server, aborting');
                        context.badWebConn();
                        res.req.abort(); // end event will fire
                    } else {
                        str += chunk;
                    }
                }
            });

            res.on('end', function () {
                if(context.reqOpts.path === '/login.asp' && this.statusCode === 200){ //getting Challenge value to calculate 'Response' value and post login form
                    str = str.split('"Challenge" value="');
                    if (str.length === 2){
                        str = str[1].slice(0,8);
                        if (str.length === 8){
                            context.reqOpts.path = '/delta/login';
                            context.reqOpts.method = 'POST';
                            var data = 'Username=admin&Response=' + Crypto.createHash('md5').update('adminpassword'+str).digest("hex");
                            setTimeout(function(){context.request(data)},1000);
                            return;
                        }
                    }
                } else if (context.reqOpts.path === '/delta/login' && this.statusCode === 302) {
                    context.reqOpts.path = '/en/device/index.xml';
                    context.reqOpts.method = 'GET';
                    if(this.headers['set-cookie'] && this.headers['set-cookie'].length ){
                        context.reqOpts.headers.Cookie = this.headers['set-cookie'][0].split(';',1)[0];
                    }
                    setTimeout(function(){context.request()},1000);
                    return;
                } else if (context.reqOpts.path === '/en/device/index.xml' && this.statusCode === 200) {
                    parseString(str, function (err, result) {
                        if(err || (typeof result !== 'object') || (result === null)){
                            context.badWebConn();
                        } else {
                            context.webData.index = result.agent;

                            context.reqOpts.path = '/en/device/info_battery.xml';
                            context.reqOpts.method = 'GET';
                            setTimeout(function(){context.request()},0);
                        }
                    });
                    return;
                } else if (context.reqOpts.path === '/en/device/info_battery.xml' && this.statusCode === 200) {
                    parseString(str, function (err, result) {
                        if(err || (typeof result !== 'object') || (result === null)){
                            context.badWebConn();
                        } else {
                            context.webData.info_battery = result.agent;

                            context.reqOpts.path = '/en/device/info_iob.xml';
                            context.reqOpts.method = 'GET';
                            setTimeout(function(){context.request()},0);
                        }
                    });
                    return;
                } else if (context.reqOpts.path === '/en/device/info_iob.xml' && this.statusCode === 200) {
                    parseString(str, function (err, result) {
                        if(err || (typeof result !== 'object') || (result === null)){
                            context.badWebConn();
                        } else {
                            context.webData.info_iob = result.agent;

                            context.reqOpts.path = '/en/device/info_ident.asp';
                            context.reqOpts.method = 'GET';
                            setTimeout(function(){context.request()},0);
                        }
                    });
                    return;
                } else if (context.reqOpts.path === '/en/device/info_ident.asp' && this.statusCode === 200) {
                    var str1 = str.slice(str.indexOf('var val1', 5200), str.lastIndexOf('if(val1', 5400));
                    var str2 = str.slice(str.indexOf('var val1', 6300), str.lastIndexOf('if(val1 >= 0)', 6800));

                    //var vals1 = str1.match(/="?(.*?)\s*"?;/g);
                    var re = /(?<=="?)[^"]*?(?=\s*"?;)/g;
                    var vals1 = str1.match(re);
                    var vals2 = str2.match(re);
                    context.webData.info_ident = {
                        id: {
                            model: vals1[0],
                            type: parseInt(vals1[1], 10),
                            firmware: vals1[2],
                            software: vals1[3],
                            sn: vals1[4]
                        },
                        raiting: {
                            va: parseFloat(vals2[0]),
                            power: parseFloat(vals2[1]),
                            inputV: parseFloat(vals2[2]),
                            outputV: parseFloat(vals2[3]),
                            bypassV: parseFloat(vals2[4]),
                            frequency: parseFloat(vals2[5]),
                            batteryV: parseFloat(vals2[6]),
                            hiTransV: parseFloat(vals2[7]),
                            loTransV: parseFloat(vals2[8])
                        }
                    };

                    context.reqOpts.path = '/en/device/info_status.xml';
                    context.reqOpts.method = 'GET';
                    setTimeout(function(){context.request()},0);
                    return;
                } else if (context.reqOpts.path === '/en/device/info_status.xml' && this.statusCode === 200) {
                    parseString(str, function (err, result) {
                        if(err || (typeof result !== 'object') || (result === null)){
                            context.badWebConn();
                        } else {
                            context.webData.info_status = result.ups;

                            context.children.webConn.value = 1;

                            var upsConn = (context.webData.info_ident.id.model.length > 0)
                                && (context.webData.index.UPS_COMMSTS === "0")
                                && (context.webData.info_battery.UPS_COMMSTS === "0")
                                && (context.webData.info_status.IMG_STS_COMMERR === "0");

                            context.children.upsConn.value = upsConn?1:0;

                            if(upsConn){
                                context.children.id.children.model.value = context.webData.info_ident.id.model;
                                context.children.id.children.type.value = context.webData.info_ident.id.type;
                                context.children.id.children.firmware.value = context.webData.info_ident.id.firmware;
                                context.children.id.children.software.value = context.webData.info_ident.id.software;
                                context.children.id.children.sn.value = context.webData.info_ident.id.sn;

                                context.children.rating.children.va.value = context.webData.info_ident.raiting.va;
                                context.children.rating.children.power.value = context.webData.info_ident.raiting.power;
                                context.children.rating.children.inputV.value = context.webData.info_ident.raiting.inputV;
                                context.children.rating.children.outputV.value = context.webData.info_ident.raiting.outputV;
                                context.children.rating.children.frequency.value = context.webData.info_ident.raiting.frequency;
                                context.children.rating.children.batteryV.value = context.webData.info_ident.raiting.batteryV;
                                context.children.rating.children.hiTransV.value = context.webData.info_ident.raiting.hiTransV;
                                context.children.rating.children.loTransV.value = context.webData.info_ident.raiting.loTransV;

                                context.children.battery.children.status.value = parseInt(context.webData.info_battery.UPS_BATTSTS, 10);
                                context.children.battery.children.charger.value = parseInt(context.webData.info_battery.UPS_BATTCHARGE, 10);
                                context.children.battery.children.test.value = parseInt(context.webData.info_battery.UPS_TESTRESULT, 10);
                                context.children.battery.children.onBatt.value = parseInt(context.webData.info_battery.UPS_ONBATTTIME, 10);
                                context.children.battery.children.level.value = parseInt(context.webData.info_battery.UPS_BATTLEVEL, 10);
                                context.children.battery.children.voltage.value = parseFloat(context.webData.info_battery.UPS_BATTVOLT);
                                context.children.battery.children.temperature.value = parseInt(context.webData.info_battery.UPS_TEMP, 10);

                                context.children.input.children.frequency.value = parseFloat(context.webData.info_iob.UPS_INFREQ1);
                                context.children.input.children.voltage.value = parseFloat(context.webData.info_iob.UPS_INVOLT1);

                                context.children.bypass.children.frequency.value = parseFloat(context.webData.info_iob.UPS_BYFREQ1);
                                context.children.bypass.children.voltage.value = parseFloat(context.webData.info_iob.UPS_BYVOLT1);
                                context.children.bypass.children.current.value = parseFloat(context.webData.info_iob.UPS_BYAMP1);
                                context.children.bypass.children.power.value = parseFloat(context.webData.info_iob.UPS_BYPOWER1);

                                context.children.output.children.source.value = parseFloat(context.webData.info_iob.UPS_OUTSRC);
                                context.children.output.children.frequency.value = parseFloat(context.webData.info_iob.UPS_OUTFREQ);
                                context.children.output.children.voltage.value = parseFloat(context.webData.info_iob.UPS_OUTVOLT1);
                                context.children.output.children.current.value = parseFloat(context.webData.info_iob.UPS_OUTAMP1);
                                context.children.output.children.power.value = parseFloat(context.webData.info_iob.UPS_OUTPOWER1);
                                context.children.output.children.load.value = parseFloat(context.webData.info_iob.UPS_OUTLOAD1);

                                context.children.status.children.inputOutOfRange.value = context.webData.info_status.IMG_STS_ACFAIL==="0"?0:1;
                                context.children.status.children.batteryLow.value = context.webData.info_status.IMG_STS_BATTLOW==="0"?0:1;
                                context.children.status.children.batteryDepleted.value = context.webData.info_status.IMG_STS_BATTDEPLETED==="0"?0:1;
                                context.children.status.children.batteryNeedReplace.value = context.webData.info_status.IMG_STS_BATTREPLACE==="0"?0:1;
                                context.children.status.children.batteryGroundFault.value = context.webData.info_status.IMG_STS_BATTGROUND==="0"?0:1;
                                context.children.status.children.testInProgress.value = context.webData.info_status.IMG_STS_TESTING==="0"?0:1;
                                context.children.status.children.testFail.value = context.webData.info_status.IMG_STS_TESTFAIL==="0"?0:1;
                                context.children.status.children.outputOff.value = context.webData.info_status.IMG_STS_OUTPUTOFF==="0"?0:1;
                                context.children.status.children.onBypass.value = context.webData.info_status.IMG_STS_ONBYPASS==="0"?0:1;
                                context.children.status.children.upsSystemOff.value = context.webData.info_status.IMG_STS_SYSTEMOFF==="0"?0:1;
                                context.children.status.children.upsShutdown.value = context.webData.info_status.IMG_STS_SHUTDOWN==="0"?0:1;
                                context.children.status.children.outputBreaker.value = context.webData.info_status.IMG_STS_OUTBREAKER==="0"?0:1;
                                context.children.status.children.outputOverVoltage.value = context.webData.info_status.IMG_STS_OUTPUTOVERVOLT==="0"?0:1;
                                context.children.status.children.outputUnderVoltage.value = context.webData.info_status.IMG_STS_OUTPUTUNDERVOLT==="0"?0:1;
                                context.children.status.children.overload.value = context.webData.info_status.IMG_STS_OVERLOAD==="0"?0:1;
                                context.children.status.children.overtemp.value = context.webData.info_status.IMG_STS_OVERTEMP==="0"?0:1;
                                context.children.status.children.upsFail.value = context.webData.info_status.IMG_STS_UPSFAIL==="0"?0:1;
                                context.children.status.children.fanAbnormal.value = context.webData.info_status.IMG_STS_FANFAIL==="0"?0:1;
                                context.children.status.children.fuseAbnormal.value = context.webData.info_status.IMG_STS_FUSEFAIL==="0"?0:1;
                                context.children.status.children.inverterAbnormal.value = context.webData.info_status.IMG_STS_INVERTER==="0"?0:1;
                                context.children.status.children.chargerAbnormal.value = context.webData.info_status.IMG_STS_CHARGER==="0"?0:1;
                                context.children.status.children.bypassOutOfRange.value = context.webData.info_status.IMG_STS_BYPASS==="0"?0:1;
                                context.children.status.children.emergencyPowerOff.value = context.webData.info_status.IMG_STS_EPO==="0"?0:1;
                                context.children.status.children.phaseAsync.value = context.webData.info_status.IMG_STS_ASYNC==="0"?0:1;
                                context.children.status.children.rectifierAbnormal.value = context.webData.info_status.IMG_STS_RECTIFIER==="0"?0:1;
                            } else {
                                badEnds(context);
                            }

                            context.reqOpts.path = '/en/device/index.xml';
                            context.reqOpts.method = 'GET';
                            setTimeout(function(){context.request()},1000);
                        }
                    });
                    return;
                }
                // on different response - back to login
                context.badWebConn();
            });

            res.on('error', function(e) {
                context.log(0, "Error: " + e.message);
                context.badWebConn();
            });
        });

        getRequest.on('error', function (err) {
            context.log(0,err);
            context.badWebConn();
        });

        if(reqBody)
            getRequest.end(reqBody);
        else
            getRequest.end();
    }

    badWebConn(){
        var context = this;

        context.reqOpts.path = '/login.asp';
        context.reqOpts.method = 'GET';

        context.children.webConn.value = 0;
        context.children.upsConn.quality = 'bad';

        badEnds(context);

        setTimeout(function(){context.request()},10000);
    }

    get dirname(){return __dirname}

}

module.exports = UpsDelta;

function badEnds(neuron) {
    var hasChildren = false;
    for (var id in neuron.options.children) {
        if (id !== 'webConn' && id !== 'upsConn')badEnds(neuron.children[id]);
        hasChildren = true;
    }

    if (!hasChildren)neuron.quality = 'bad';
}