/**
 * A Javascript client for waggle
 * @class WaggleClient
 * @param {string} namespace - The namespace / room you wish to connect to
 * @param {string} resource - The resource you are subscribing to
 * @param {object} info - The subscription information
 * @param {string} [url] - The url of the socket.io server
 */
var WaggleClient = function ( namespace, resource, info, url ) {
    if ( !namespace )
        throw Error("A namespace must be provided.");

    if ( !resource )
        throw Error("A resource must be provided.");

    if ( !info )
        throw Error("An information object must be supplied.");

    if ( !io )
        throw Error("Socket.io-client needs to be defined in global namespace.");

    this.namespace              = namespace;
    this.resource               = resource;
    this.info                   = info;
    this.url                    = url || "";
    this.events                 = {};
    this.connectionString       = this.url + this.namespace;
    this.sendingQueue           = [];
    this.connected              = false;
    this.sendingQueueInterval   = null;
    this.socket                 = io(this.connectionString);
    this.debug                  = window.debug || false;
    this.fields                 = null;

    this.socket.on( "connect", this.trigger.bind(this, "connect") );
    this.socket.on( "disconnect", this.trigger.bind(this, "disconnect") );
    this.socket.on( "error", this.trigger.bind(this, "error") );

    this.socket.on( "anything", this.trigger.bind(this) );
    this.socket.on( "message", this.trigger.bind(this) );

    this.on( "connect", this.onSocketConnect.bind(this) );
    this.on( "disconnect", this.onSocketDisconnect.bind(this) );
    this.on( "fields", this.onFieldsReceived.bind(this) );
};

/**
 * Triggered on socket connect
 * @memberOf WaggleClient
 * @callback
 */
WaggleClient.prototype.onSocketConnect = function () {
    this.log("Connection with server established.");

    this.connected = true;
    this.startQueue();
};

/**
 * Triggered on socket disconnect
 * @memberOf WaggleClient
 * @callback
 */
WaggleClient.prototype.onSocketDisconnect = function () {
    this.log("Connection with server lost.");

    this.connected = false;
    this.stopQueue();
};

/**
 * Sets the defaults for the connection
 * @memberOf WaggleClient
 * @callback
 */
WaggleClient.prototype.onFieldsReceived = function ( envelope ) {
    var scope = this;

    if (
        !envelope ||
        !envelope[0] ||
        !envelope[0].required ||
        !envelope[0].unique
    ) {
        throw Error("Invalid fields supplied by server.");
    }

    this.fields = envelope[0];

    this.log("Received field descriptors:");
    this.log( this.fields );

    this.fields.required.forEach(function ( name ) {
        if ( !scope.info[name] ) {
            throw Error( "Required field not provided: " + name );
        }
    });

    this.send( "subscribe", {
        resource: this.resource,
        info: this.info
    });
};

/**
 * Listen for an event to be fired and run callback
 * @memberOf WaggleClient
 * @param {string} event - The event to listen for
 * @param {function} callback - The function to be called on event
 * @return {object} - Return this for chaining
 */
WaggleClient.prototype.on = function ( event, callback ) {
    if ( !this.events[event] )
        this.events[event] = [];

    this.log("Added trigger for " + event);

    this.events[event].push(callback);

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
    var data      = Array.prototype.slice.call( arguments, 1 );

    console.log(this.events);

    if ( callbacks ) {
        callbacks.forEach(function ( callback ) {
            callback(data);
        });
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

    this.log("Sending '" + event + "' with: " + JSON.stringify(message) );
    this.socket.emit( event, message );

    return this;
};

/**
 * Adds an item to the sending queue for when the connection comes back
 * @memberOf WaggleClient
 * @param {string} event - The event
 * @param {string|obejct|array} message - The data
 */
WaggleClient.prototype.addToQueue = function ( event, message ) {
    this.log("Added item to queue for " + event).log(message);

    this.sendingQueue.push({ event: event, message: message });
};

/**
 * Starts processing the queue
 * @memberOf WaggleClient
 */
WaggleClient.prototype.startQueue = function () {
    var scope = this;

    if ( this.sendingQueue.length === 0 ) return;

    this.log("Started processing the queue");

    this.sendingQueueInterval = window.setInterval( function () {
        var job;

        if ( scope.sendingQueue.length === 0 ) return;

        job = scope.sendingQueue.pop();

        scope.log("Sending on " + job.event).log(job.message);

        scope.socket.send( job.event, job.message );
    }, 100);
};

/**
 * Starts processing the message queue
 * @memberOf WaggleClient
 */
WaggleClient.prototype.stopQueue = function () {
    if ( !this.sendingQueueInterval ) return;

    this.log("Stopped processing the queue");

    clearInterval(this.sendingQueueInterval);
    this.sendingQueueInterval = null;
};

/**
 * Internal console log abstraction for debug logs
 * @memberOf WaggleClient
 * @param {string|object|array|bool} msg - The message to send to the console
 * @return {object} - Returns this for chaining
 */
WaggleClient.prototype.log = function ( msg ) {
    if ( !this.debug ) return;

    if ( typeof msg !== "string" )
        msg = JSON.stringify(msg);

    msg = "[WaggleClient] " + msg;

    console.debug( msg );

    return this;
};
