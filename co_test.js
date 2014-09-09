var config = require('./config');
var co = require('co');
var thunkify = require('thunkify');
var redisClient = require('redis').createClient();
var redisCo = require('co-redis');
var redis = redisCo(redisClient);
var http = require('http').createServer( function ( req, res ) {
    fs.readFile( './public/index.html', 'utf8', function ( err, data ) {
        res.end(data);
    });
}).listen( config.http_port );
var io = require('socket.io')(http);
var io_redis = require('socket.io-redis');
var eventEmitter = require('eventemitter2').EventEmitter;
var fs = require('fs');
var _ = require('underscore');


io.adapter(io_redis({ host: config.redis_host, port: config.redis_port, key: config.redis_key }));

var Waggle = function () {

    // Set up the namespaces for each configured service
    config.services.forEach( function ( service ) {
        service.resources.forEach( function ( resource ) {
            io.of( "/" + service.name + resource.namespace )
              .on( "connection", this.onSocketConnect.bind( this ) )
              .configuration = resource;
        }, this);
    }, this);
};

/**
 * Event handler for any errors
 * @event
 * @param {string|error} err - The error that triggered the event
 */
Waggle.prototype.onError = function ( err ) {

};

/**
 * Event handler for Socket.io connection
 * @event
 * @param {object} socket - The Socket.io instance
 */
Waggle.prototype.onSocketConnect = co( function *( socket ) {
    console.log('connect', socket.id);

    socket.on('disconnect', this.onSocketDisconnect.bind( this, socket ) );
    socket.on('subscribe', this.onSocketSubscribe.bind( this, socket ) );
});

/**
 * Event handler for Socket.io disconnection
 * @event
 * @param {object} socket - The Socket.io instance
 */
Waggle.prototype.onSocketDisconnect = co( function *( socket ) {
    console.log('disconnect', socket.id);

    var service_config  = socket.nsp.configuration;
    var namespace       = socket.nsp.name;

    var unique = yield redis.get( "socket:" + socket.id );

    redisClient.del( "socket:" + socket.id );

    yield redis.srem( "resource:" + unique, socket.id );

    var sockets = yield redis.smembers( "resource:" + unique );

    if ( sockets.length === 0 ) {
        var info = yield redis.hgetall( "info:" + unique );
        socket.broadcast.emit("leave", info[ service_config.unique ]);
        redisClient.del( "info:" + unique );
    }
});

/**
 * Event handler for Socket.io channel subscribe
 * @event
 * @param {object} socket - The Socket.io instance
 */
Waggle.prototype.onSocketSubscribe = co( function *( socket, room, info ) {
    console.log("subscribe", room, info);

    var service_config  = socket.nsp.configuration;
    var namespace       = socket.nsp.name;

    // Check that the required information is provided
    if ( !this.arrayContains( service_config.required, _.keys( info ) ) ) {
        socket.emit("err", "Failed to connect: required fields not supplied");
        return;
    };

    // Create the clients resource info if needed
    var client_resource = socket.nsp.name + ":" + room + "#" + info[service_config.unique];
    var stored_info = yield redis.hgetall( "info:" + client_resource );

    if ( !stored_info ) stored_info = _.extend( info, { timestamp: socket.handshake.issued } );

    // Set the client information hash
    yield redis.hmset( "info:" + client_resource, stored_info );

    // Create an entry for the socket id referenced to the client
    yield redis.set( "socket:" + socket.id, client_resource );

    // Create an entry for the client with it's asociated sockets
    yield redis.sadd( "resource:" + client_resource, socket.id );

    // Join the room
    socket.join( room );

    var uniques_in_room = yield redis.keys( "resource:" + socket.nsp.name + ":" + room + "*" );

    _.each( uniques_in_room, co( function *( unique ) {
        // If the unique in question is this client then exit this iteration
        if ( unique.indexOf( info[service_config.unique] ) !== -1 ) return;

        var data = yield redis.hgetall( unique.replace( "resource:", "info:" ) );

        socket.emit( "join", data );

        var sockets = yield redis.smembers( unique );

        _.each( sockets, function ( sid ) {
            // If the socket doesn't exist then delete it
            if ( !socket.nsp.connected[ sid ] ) {
                // Do not yield as we don't care if these operations have any problems
                redisClient.srem( unique, sid );
                redisClient.del( "socket:" + sid );
                return;
            }

            // Broadcast to the sockets
            socket.nsp.connected[ sid ].emit( "join", stored_info );
        });
    }));
});

/**
 * Check if the values in arr_2 exist in arr_1
 * @param {array} arr_1 - The source array
 * @param {array} arr_2 - The array you are testing
 * @return {bool}
 */
Waggle.prototype.arrayContains = function ( arr_1 , arr_2 ) {
    var isSame = true;

    _.each( arr_1, function (val) {
        if ( arr_2.indexOf(val) === -1 ) {
            isSame = false;
        }
    });

    return isSame;
}

new Waggle();
