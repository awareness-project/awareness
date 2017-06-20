'use strict';

var http = require('http');
var https = require('https');

class Telegram {

    constructor(options) {
        this.options = options;
    }

    push(messages){
        var context = this;
        var body = JSON.stringify({user:context.options.user, pass:context.options.pass, to:context.options.to, mess:messages});

        function arrangeRequest(res, socket, head) {
            // should check res.statusCode here
            var req = https.request(
                {
                    host: context.options.service,
                    port: '443',
                    socket: socket?socket:undefined,
                    agent: socket?false:https.globalAgent,
                    path: 'https://' + context.options.service + '/incoming',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(body)
                    }

                },
                (res) => {
                    if (res.statusCode === 200) {
                        //successful posting
                    } else {
                        console.error(`Problem sending to telegramm: ${res.statusCode}`);
                    }
                });
            req.on('error', (e) => {
                console.error(`Problem sending to telegramm: ${e.message}`);
            });
            req.write(body);
            req.end();

        }

        if(context.options.proxy){
            var connectReq = http.request({ // establishing a tunnel
                host: context.options.proxy.host,
                port: context.options.proxy.port,
                method: 'CONNECT',
                path: context.options.service + ':443',
            })
                .on('connect', arrangeRequest)
                .on('error', (e) => {console.error(`Problem sending to telegramm: ${e.message}`);})
                .end();
        } else {
            arrangeRequest();
        }


    }
}

module.exports = Telegram;
