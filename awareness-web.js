/**
 * Created by VK on 17.06.2016.
 */
var Express = require('express');
var Session = require('express-session');
var BodyParser = require("body-parser");
var Uuid = require('node-uuid');
var Influx = require('influx');
var fs = require("fs");
var https = require('https');

var HttpProxy = require('http-proxy');
var httpProxy = HttpProxy.createProxyServer();


var Neuron = require('./neurons/prototype/neuron.js');


httpProxy.on('error', function(e) {
    console.log('http-proxy error:' + e);
});

function Web(options, node) {
    var context = this;
    context.options = options;

    context.express = Express();

    if (context.options.secure) {
        context.https.createServer({
            key: fs.readFileSync(__dirname + '/../cert/server-key.pem'),
            cert: fs.readFileSync(__dirname + '/../cert/server-crt.pem'),
            ca: fs.readFileSync(__dirname + '/../cert/ca-crt.pem')
        }, context.express).listen(context.options.port);
    } else {
        context.express.listen(context.options.port);
    }

    if(typeof options.grafana === 'string') {
        context.express.use(function (req, res, next) {
            if (req.url.match(/\/grafana\/.*/)) {
                req.url = req.url.replace('/grafana', '');
                httpProxy.web(req, res, {target: options.grafana});
            } else {
                next();
            }

        });
    }

    context.express.use(BodyParser.urlencoded({extended: false}));
    context.express.use(BodyParser.json());

    context.express.use(Session({
        genid: function (req) {
            return Uuid.v4(); // use UUIDs for session IDs
        },
        secret: 'puper',
        resave: false,
        saveUninitialized: true,
        cookie: {maxAge: 60000 * 60},
        rolling: true
    }));

    context.express.use(Express.static(__dirname + '/public'));

    context.express.get('/neuron.json', function (req, res) {
        var neuron = node.getNeuron(req.query.path);
        if (neuron) {
            var txt = JSON.stringify(neuron);
            res.send(txt);
        } else {
            res.status(404)
                .send('Neuron ' + req.query.path + '  was not found');
        }
    });

    context.express.get('/values.json', function (req, res) {
        setTimeout(function() {
            var neuron = node.getNeuron(req.query.path);
            if (neuron) {
                var txt = JSON.stringify(neuron.values);
                res.send(txt);
            } else {
                res.status(404)
                    .send('Neuron ' + req.query.path + '  was not found');
            }
        },100);
    });

    context.express.post('/get-tags', function (req, res) {
        var neuron = node.getNeuron(req.body.path);
        if (neuron && neuron.tags) {
            res.send(JSON.stringify(neuron.tags));
        } else {
            res.status(404)
                .send('Neuron ' + req.body.path + ' was not found or has no tags');
        }
    });

    context.express.get('/npub/*', function (req, res) {
        var neuron = node.getNeuron(req.query.path);
        if (neuron) {
            res.sendFile(req.params[0],{root:neuron.getPubPath()}, function(err){
                if (err) {
                    res.status(err.status).end('Cannot get /' + req.params[0]);
                }
            });
        } else {
            res.status(404)
                .send('Neuron ' + req.query.path + '  was not found');
        }
    });

    context.express.get('/set-value', function (req, res) {
        var neuron = node.getNeuron(req.query.path);
        if (neuron) {
            neuron.setValue(req.query.value, function(err){
                if(err){
                    res.status(err.code)
                        .send(err.text);
                }else{
                    res.send('OK');
                }
            });
        } else {
            res.status(404)
                .send('Neuron ' + req.query.path + "  doesn't exist");
        }
    });

    context.express.post('/login',function(req,res) {
        if(context.authUser(req.body.username, req.body.password, req, res)){
            //res.set('uName', new Buffer(req.session.user.name).toString('base64'));
            res.set('uName', encodeURIComponent(req.session.user.name));

            res.send('OK');
        } else {
            req.session.destroy();
            res.set('WWW-Authenticate', 'Custom realm=Unauthorized');
            res.status(401).send('Unauthorized');
        }
    });

    context.express.get('/session.json', function (req, res) {
        var obj = {};
        if(req.session.user){
            obj.user = {name: req.session.user.name, permissions: req.session.user.permissions};
        }

        res.send(JSON.stringify(obj));
    });

    context.express.get('/mess_active', function(req, res) {
        Neuron.dbEndpoint.query("SELECT time, come FROM events WHERE path =~ /" + ".*" + "/ AND time > '" + Neuron.startTime.toISOString()+ "'"
            +" GROUP BY path, class, text ORDER BY time DESC LIMIT 1", function(err, results) {
            var rows = [];
            if(results && results.length && results[0].length){
                results[0].forEach(function(entry) {
                    //console.log(entry);
                    let neuron = Neuron.list[entry.path];
                    if (entry.come) {
                        rows.unshift({
                            time: entry.time,//.replace('T', ' ').substr(0, 26),
                            location:neuron?neuron.data.pathReadable:entry.path,
                            class:entry.class,
                            state: entry.come ? "+" : "-",
                            mess: entry.text
                        });
                    }
                });
            }
            res.send({rows:rows});
        });
    });

    context.express.get('/mess_archive', function(req, res) {
        var reqRows = parseInt(req.query.rows);
        var reqPage = parseInt(req.query.page);

        Neuron.dbEndpoint.query("SELECT * FROM events WHERE path =~ /" + ".*" + "/ "
            + " ORDER BY time DESC"
            + " LIMIT " + reqRows
            + " OFFSET " + (reqPage - 1) * reqRows
            + ";SELECT COUNT(come) FROM events WHERE path =~ /" + ".*" + "/ "
            , function(err, results) {
                var rows = [];
                var totalRows = 0;
                if(results && results.length == 2 && results[0].length){
                    results[0].forEach(function(entry) {
                        //console.log(entry);
                        let neuron = Neuron.list[entry.path];
                        rows.push({
                            time:entry.time,//(new Date(entry.time)).toISOString(),//String().replace('T', ' ').substr(0, 23),
                            location:neuron?neuron.data.pathReadable:entry.path,
                            class:entry.class,
                            state:entry.come?"+":"-",
                            mess:entry.text
                        });
                    });
                    if(results[1].length) {
                        totalRows = results[1][0].count;
                    }
                }
                res.send({total:Math.ceil(totalRows/reqRows),page:reqPage,records:totalRows,rows:rows});
            });
    });

}

Web.prototype.log = function(level, message){
    var context = this;
    console.log(new Date().toISOString() + ' ' + WEB + ' ' + level + ' ' + message);
};

Web.prototype.authUser = function(username, password, req, res) {
    if(typeof this.options.users !== 'object') return false;
    var user = this.options.users[username];
    if (user && user.pass === password) {
        if(req.session){
            req.session.user = user;
        }
        return true;
    } else {
        delete req.session.user;
        return false;
    }
}

module.exports = Web;

