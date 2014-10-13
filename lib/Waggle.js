var config          = require('../config');
var co              = require('co');
var _               = require('underscore');
var redisClient     = require('redis').createClient();
var redisCo         = require('co-redis');
var redis           = redisCo(redisClient);
var log             = require('./Log')( process.env.NODE_ENV, config.logfile );

/**
 * A real time communication and message sending service
 * @requires co
 * @requires underscore
 * @requires redis
 * @requires co-redis
 * @requires log
 * @requires config
 * @class Waggle
 * @param {Socket} io - The instance of Socket.io
 */
var Waggle = function(io) {
    this.services   = config.services;
    this.io         = io;

    this.startServices();
};

/**
 * Creates Socket.io rooms and namespaces from the services configuration
 * @memberOf Waggle
 */
Waggle.prototype.startServices = function () {
    // Set up the namespaces for each configured service
    this.services.forEach(function(service) {
        service.resources.forEach(function(resource) {
            this.io.of("/" + service.name + resource.namespace)
                   .on("connection", this.onSocketConnect.bind(this))
                   .configuration = resource;
        }, this);
    }, this);

    log("[Waggle] Services enabled", "debug");
};

/**
 * Event handler for Socket.io connection
 * @memberOf Waggle
 * @callback
 * @param {object} socket - The Socket.io instance
 */
Waggle.prototype.onSocketConnect = function (socket) {
    socket.emit('defaults', _.pick( socket.nsp.configuration, "required", "unique" ) );

    socket.on('disconnect', this.onSocketDisconnect.bind(this, socket));
    socket.on('subscribe', this.onSocketSubscribe.bind(this, socket));
    socket.on('error', this.onError.bind(this));
};

/**
 * Event handler for any errors
 * @memberOf Waggle
 * @callback
 * @param {string|error} err - The error that triggered the event
 */
Waggle.prototype.onError = function(err) {
    log("[Waggle] Socket error: " + err, "error");
};

/**
 * Event handler for Socket.io disconnection
 * @memberOf Waggle
 * @callback
 * @param {object} socket - The Socket.io instance
 */
Waggle.prototype.onSocketDisconnect = co(function * (socket) {
    var unique = yield redis.get("socket:" + socket.id);

    redisClient.del("socket:" + socket.id);

    yield redis.srem("resource:" + unique, socket.id);

    var sockets = yield redis.smembers("resource:" + unique);

    if (sockets.length === 0) {
        log("[Waggle] User left resource", "debug");
        socket.broadcast.emit("leave", socket.unique);
        redisClient.del("info:" + unique);
    }
});

/**
 * Event handler for Socket.io channel subscribe
 * @memberOf Waggle
 * @callback
 * @param {object} socket - The Socket.io instance
 */
Waggle.prototype.onSocketSubscribe = co(function * (socket, room, info) {
    var service_config = socket.nsp.configuration;
    var scope = this;

    // Check that the required information is provided
    if (!this.arrayContains(service_config.required, _.keys(info))) {
        socket.emit("err", "Failed to connect: required fields not supplied");
        log("[Waggle] User failed to connect: missing required fields", "error");
        return;
    }

    // Create the clients resource info if needed
    var client_resource = socket.nsp.name + ":" + room + "#" + info[service_config.unique];
    var stored_info = yield redis.hgetall("info:" + client_resource);

    if (!stored_info) stored_info = info;

    if ( service_config.add_keys ) {
        _.each( service_config.add_keys, function ( key ) {
            key = key.substr(1);

            if (
                _.isFunction( scope[key] ) &&
                !stored_info[key]
            ) {
                stored_info[key] = scope[key]();
            }
        });
    }

    // Set the client information hash
    yield redis.hmset("info:" + client_resource, stored_info);

    // Create an entry for the socket id referenced to the client
    yield redis.set("socket:" + socket.id, client_resource);

    // Create an entry for the client with it's asociated sockets
    yield redis.sadd("resource:" + client_resource, socket.id);

    // Join the room
    socket.join(room);

    // Set the unique on the socket object
    socket.unique = info[service_config.unique];

    var uniques_in_room = yield redis.keys("resource:" + socket.nsp.name + ":" + room + "*");

    _.each(uniques_in_room, co(function * (unique) {
        // If the unique in question is this client then exit this iteration
        if (unique.indexOf(info[service_config.unique]) !== -1) return;

        var data = yield redis.hgetall(unique.replace("resource:", "info:"));

        socket.emit("join", data);

        var sockets = yield redis.smembers(unique);

        _.each(sockets, function(sid) {
            // If the socket doesn't exist then delete it
            if (!socket.nsp.connected[sid]) {
                // Do not yield as we don't care if these operations have any problems
                redisClient.srem(unique, sid);
                redisClient.del("socket:" + sid);
                return;
            }

            // Broadcast to the sockets
            socket.nsp.connected[sid].emit("join", stored_info);
            log("[Waggle] [Join] User has connected to resource", "debug");
        });
    }));

    this.timestamp = function () {
        return socket.handshake.issued;
    };

});

/**
 * Check if the values in arr_2 exist in arr_1
 * @memberOf Waggle
 * @param {array} arr_1 - The source array
 * @param {array} arr_2 - The array you are testing
 * @return {bool}
 */
Waggle.prototype.arrayContains = function(arr_1, arr_2) {
    var isSame = true;

    _.each(arr_1, function(val) {
        if (arr_2.indexOf(val) === -1) {
            isSame = false;
        }
    });

    return isSame;
};


module.exports = Waggle;
