/**
 * A Javascript client for waggle
 * @class WaggleClient
 * @param {string} namespace - The namespace / room you wish to connect to
 * @param {string} resource - The resource you are subscribing to
 * @param {string} [url] - The url of the socket.io server
 */
var WaggleClient = function ( namespace, resource, url ) {
    this.namespace              = namespace;
    this.resource               = resource || "";
    this.events                 = {};
    this.connectionString       = (url) ? url + "/" : "" + namespace;
    this.sendingQueue           = [];
    this.connected              = false;
    this.sendingQueueInterval   = null;
    this.socket                 = io(connectionString);

    this.socket.on( "connect", this.trigger.bind(this) );
    this.socket.on( "disconnect", this.trigger.bind(this) );
    this.socket.on( "anything", this.trigger.bind(this) );
    this.socket.on( "error", this.trigger.bind(this) );

    this.on( "connect", function () { this.connected = true; }, this );
    this.on( "disconnect", function () { this.connected = false; }, this );
};

/**
 * Listen for an event to be fired and run callback
 * @memberOf WaggleClient
 * @param {string} event - The event to listen for
 * @param {function} callback - The function to be called on event
 * @param {object} scope - The scope the callback should be called with
 * @return {object} - Return this for chaining
 */
WaggleClient.prototype.on = function ( event, callback, scope ) {
    if ( !this.events[event] ) {
        this.events[event] = [];
    }

    this.events[event].push({
        callback: callback,
        scope: scope
    });

    return this;
};

/**
 * Trigger an event with data
 * @memberOf WaggleClient
 * @param {string} event - The event to trigger
 * @param {string|array|object} data - The data to pass into the callback
 * @return {object} - Return this for chaining
 */
WaggleClient.prototype.trigger = function ( event ) {
    var callbacks = this.events[event];
    var data      = Array.slice.call( arguments, 1 );

    if ( callbacks ) {
        callbacks.forEach(function ( cb ) {
            cb.callback.bind(cb.scope || this, data);
        }, this);
    }

    return this;
};

/**
 * Send a message to the server
 * @memberOf WaggleClient
 * @param {string} event - The event to send
 * @param {string|object|array} message - The data to send along with the event
 * @return {object} - Return this for chaining
 */
WaggleClient.prototype.send = function ( event, message ) {
    if ( !this.connected ) {
        this.addToQueue( event, message );
        return this;
    }

    this.socket.send( event, message );

    return this;
};

/**
 * Adds an item to the sending queue for when the connection comes back
 * @memberOf WaggleClient
 * @param {string} event - The event
 * @param {string|obejct|array} message - The data
 */
WaggleClient.prototype.addToQueue = function ( event, mmessage ) {
    this.sendingQueue.push({ event: event, message: message });
};

/**
 * Starts processing the queue
 * @memberOf WaggleClient
 */
WaggleClient.prototype.startQueue = function () {
    var scope = this;
    if ( this.sendingQueue.length === 0 ) return;

    this.sendingQueueInterval = window.setInterval( function () {
        var job;

        if ( scope.sendingQueue.length === 0 ) return;

        job = scope.sendingQueue.pop();

        scope.socket.send( job.event, job.message );
    }, 100);
};

/**
 * Starts processing the queue
 * @memberOf WaggleClient
 */
WaggleClient.prototype.stopQueue = function () {
    if ( !this.sendingQueueInterval ) return;

    clearInterval(this.sendingQueueInterval);
    this.sendingQueueInterval = null;
};
