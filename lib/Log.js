var fs          = require('fs');

/**
 * File and console logging for node applications
 * @param {string} environment - The environment that your node app is running in
 * @param {string} location - the location of the file you wish to log to
 * @return {function} - The log function
 * @requires {module} fs - Nodejs Filesystem API
 */
module.exports = function logger ( environment, location ) {
    var logfile;
    if (!location) location = "waggle.log";
    logfile = fs.createWriteStream( location, {'flags': 'a'} );

    function log ( msg, level ) {
        var output;
        var timestamp = (new Date()).toISOString();

        if ( !level ) level = "info";

        output = "[" + timestamp + "] [" + level + "] " + msg;

        console.log( output );

        if ( level && level === "debug" && environment !== "development" ) {
            return;
        }

        logfile.write( output + "\n" );
    };

    return log;
};
