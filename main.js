var config          = require('./config');
var http            = require('http').createServer();
var io              = require('socket.io')( http );
var io_redis        = require('socket.io-redis');
var log             = require('./lib/Log')( process.env.NODE_ENV, config.logfile );
var Waggle          = require('./lib/Waggle');

io.adapter(io_redis({
    host: config.redis_host,
    port: config.redis_port,
    key : config.redis_key
}));

new Waggle(io);

http.listen(config.http_port, function() {
    log("[HTTP] Started on port " + config.http_port);
});
