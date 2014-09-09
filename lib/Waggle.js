var fs = require('fs');
var EventEmitter = require('eventemitter2').EventEmitter2;
var redis = require('redis').createClient();

// var test = require('socket.io')(require('http').createServer( function (req,res) { res.end("ok"); } ));
//
// console.log(test);

/**
 * Implements a stateless communication interface via socket.io
 * @constructor
 * @param {object} options - Static internal options
 * @param {module} options.redis - A connected instance of redis client (npm install redis)
 * @param {module} options.socketio - Socket.io instance after http has been passed into it
 * @param {module} [options.eventEmitter=EventEmitter2] - An implementation of the node event emitter, will default to EventEmitter2
 */
function Waggle ( options ) {
    this.options = options;

    this.events = [ "socket.connect", "socket.disconnect", "socket.subscribe", "redis.error", "error" ];
    this.eventEmitter = this.options.eventEmitter || new EventEmitter();

    /**
     * Event listener callback setup
     * @param {string} event - The name of the event you are listening for
     * @param {function} callback - The callback function, triggered on event
     */
    this.on = function ( event, callback ) {
        if ( this.events.indexOf(event) === -1 ) {
            throw new Error( "The event you are binding to does not exist: " + event);
        }

        if ( event === "*" ) {
            this.eventEmitter.onAny( callback );
        } else {
            this.eventEmitter.on( event, callback );
        }
    };

    /**
     * Emit an event
     * @param {string} event - The name of the event you are listening for
     * @param {...*} args - The arguments for the event callback
     */
    this.emit = this.eventEmitter.emit;

    /**
     * Make a thread function that has access to yield
     * @param {function} fn - The function to thread
     */
    this.thread = function (fn) {
        var gen = fn();

        function next ( err, res ) {
            var ret = gen.next( res );
            if ( ret.done ) return;
            ret.value(next);
        }

        next();
    };

    this.init();
};

/**
 * Validates the internal static state of the function, throwing an error if not
 * @throws If no options are defined when instantiating the class
 * @throws If a valid socket.io object is not supplied
 * @throws If a valid redis client is not provided
 */
Waggle.prototype.isValid = function () {
    if ( !this.options ) {
        throw new Error( "No options are defined." );
    };

    if ( !this.options.socketio ) {
        throw new Error( "No Socket.io found in options." );
    }

    if ( !this.options.redis ) {
        throw new Error( "No Redis client found in options." );
    }
};

/**
 * Handles socket connect events
 * @event
 * @param {object} socket - The socket.io socket instance
 */
Waggle.prototype.onSocketConnect = function ( socket ) {
    socket.on('disconnect', this.emit('socket.disconnect', socket));
    socket.on('subscribe', this.emit('socket.subscribe', socket));
};

/**
 * Handles socket disconnect events
 * @event
 * @param {object} socket - The socket.io socket instance
 */
Waggle.prototype.onSocketDisconnect = function ( socket ) {

};

/**
 * Handles socket subscribe events
 * @event
 * @param {object} socket - The socket.io socket instance
 */
Waggle.prototype.onSocketSubscribe = function ( socket ) {

};

/**
 * Handles error events
 * @event
 * @param {string} err - The error string to be displayed
 * @param {bool} [crash=false] - Should the application crash on error
 * @throws {Error} Throws an error if crash param is true
 */
Waggle.prototype.onError = function ( err, crash ) {
    if ( crash ) {
        throw Error(err);
    } else {
        console.log(Error(err));
    }
};


var thread = function (fn) {
    var gen = fn();

    function next ( err, res ) {
        var ret = gen.next( res );
        if ( ret.done ) return;
        ret.value(next);
    }

    next();
}

function RedisSMembers ( key ) {
    return function (done) {
        redis.smembers( key, done );
    }
};

/**
 * Get an array of socket.io ids from a unique string, room and namespace
 * @param {string} nsp - The socket.io namespace
 * @param {string} room - The room that the unique resides in
 * @param {string} unique - The unique string for a specific client
 * @returns {string[]} The socket.io id
 */
Waggle.prototype.getSidsFromUnique = function ( key ) {
    return function (done) {
        redis.smembers( key, done );
    }
};

function (nsp, room, unique) {
    thread( function *() {
        var key = nsp + ":" + room + "#" + unique;
        console.log(key);
        var test = yield RedisSMembers( key );
        console.log("indies", test);
    });
};

//function ( nsp, room, unique ) {









    // sync.fiber(function () {
    //     var result = scope.options.redis.smembers( nsp + ":" + room + "#" + unique );
    //     return result;
    //     // sync.await( scope.options.redis.smembers( nsp + ":" + room + "#" + unique, function ( err, result ) {
    //     //     if ( err ) {
    //     //         this.emit( "redis.error", err );
    //     //     }
    //     //
    //     //     if ( result.length === 0 ) {
    //     //         result = null;
    //     //     }
    //     //
    //     //     response = result;
    //     //     console.log("in", response);
    //     // }));
    // });
    // console.log("out", response);
    //
    // do {
    //     if (response !== undefined) {
    //         console.log(response);
    //         done = true;
    //     }
    // } while ( done === false ) { console.log(response) };
// };

/**
 * Get a unique from a socket.io id
 * @param {string} sid - The socket.io id
 * @returns {string} The unique
 */
Waggle.prototype.getUniqueFromSid = function ( sid ) {

};

/**
 * Get data asociated with a namespace and unique
 * @param {string} nsp - The socket.io namespace
 * @param {string} unique - The unique string for a specific client
 * @return {object} The data
 */
Waggle.prototype.getDataFromUnique = function ( nsp, unique ) {

};

/**
 * Initialise events
 */
Waggle.prototype.init = function () {
    this.isValid();

    this.on( "socket.connect", this.onSocketConnect.bind(this) );
    this.on( "socket.disconnect", this.onSocketDisconnect.bind(this) );
    this.on( "socket.subscribe", this.onSocketSubscribe.bind(this) );
    this.on( "redis.error", this.onError.bind(this) );
    this.on( "error", this.onError.bind(this) );

};

module.exports = waggle = new Waggle({
    socketio: require('socket.io')(require('http')),
    redis   : require('redis').createClient()
});

// console.log(waggle.getSidsFromUnique( "test", "test", "test" ));
