var environment = process.env['NODE_ENV'] || 'development';
var config      = require('./config');
var httpHandler = require('./lib/httpHandler');
var http        = require('http').createServer( httpHandler );
var log         = require('./lib/log')( environment, "waggle.log" );

var io = require('socket.io')(http);
var io_redis = require('socket.io-redis');
var redis = require('redis').createClient();
var _ = require('underscore');

// redis.flushdb();

io.adapter(io_redis({ host: config.redis_host, port: config.redis_port, key: config.redis_key }));

config.services.forEach( function ( service ) {
    service.resources.forEach( function ( resource ) {
        io.of( "/" + service.name + resource.namespace )
          .on( "connection", onSocketConnection )
          .configuration = resource;
    });
});

http.listen( config.http_port, function () {
    log("HTTP server started on port " + config.http_port, "debug" )
});

function onSocketConnection ( socket ) {
    var nsp_config = socket.nsp.configuration;
    var scope = this;

    this.onSocketDisconnection = function () {
        redis.get( "socket:" + socket.id, function ( err, nsp_res ) {
            // if (err || nsp_res === null) { return; }
            nsp_arr = nsp_res.split("#");
            log( nsp_arr[1] + ":" + socket.id + " unsubscribed from " + nsp_arr[0], "debug" )
            redis.smembers( nsp_res, function ( err, sockets ) {
                if (err) { return; }
                console.log(sockets);
                redis.srem( nsp_res, socket.id );
                if (sockets.length === 1) {
                    redis.del( nsp_res );
                    redis.del( "/info" + nsp_res );
                    socket.broadcast.emit("leave", nsp_arr[1]);
                }
            });
        });
    };

    this.onSocketSubscribe = function ( room, info ) {
        var valid_info;

        // _.each( nsp_config.required, function ( required ) {
        //     if ( !_.has( info, required ) ) {
        //         valid_info = false;
        //     }
        // });
        //
        // if (!valid_info) {
        //     socket.emit("err", { msg: "Unable to join room, please provide all required keys." });
        //     return;
        // }

        var client_resource = socket.nsp.name + ":" + room + "#" + info[nsp_config.unique];

        redis.hgetall( client_resource + "/info", function ( err, value ) {
            if (value) {
                info = value;
                return;
            }
            if ( nsp_config.add_keys ) {
                _.each( nsp_config.add_keys, function ( key ) {
                    key = key.substr(1);

                    if ( _.isFunction( scope[key] ) ) {
                        info[key] = scope[key]();
                    }
                });
            }
            _.each( info, function ( value, key ) {
                redis.hset( "/info" + client_resource, key, value );
            });
        });

        redis.sadd( client_resource, socket.id );
        redis.set( "socket:" + socket.id, client_resource );

        socket.join( room );

        redis.keys( socket.nsp.name + ":" + room + "*", function ( err, keys ) {

            _.each( keys, function (key) {
                if ( key.indexOf(info[nsp_config.unique]) !== -1 ) {
                    return;
                }

                redis.smembers( key, function ( err, members ) {
                    _.each( members, function ( member ) {
                        _.each( socket.nsp.sockets, function (sock) {
                            if (sock.id === member) {
                                sock.emit("join", info);
                            }
                        });
                    });
                    console.log("smembers", arguments);
                });
            });
        });

        redis.keys( "/info" + socket.nsp.name + ":" + room + "*", function ( err, uniques ) {
            _.each( uniques, function ( unique ) {
                if ( unique.indexOf(info[nsp_config.unique]) !== -1 ) {
                    return;
                }

                redis.hgetall( unique, function ( err, data ) {
                    socket.emit("join", data);
                });
            });
        });

        log( info.username + ":" + socket.id + " subscribed   to   " + socket.nsp.name + ":" + room, "debug" );
    };

    this.timestamp = function () {
        return socket.handshake.issued;
    };

    socket.on( "disconnect", this.onSocketDisconnection.bind(this) );
    socket.on( "subscribe", this.onSocketSubscribe.bind(this) );
}
