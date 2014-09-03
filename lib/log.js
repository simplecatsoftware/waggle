var fs          = require('fs');

module.exports = function logger ( environment, location ) {
    var logfile = fs.createWriteStream( location, {'flags': 'a'} );

    return function ( msg, level ) {
        var output;
        var timestamp = (new Date()).toISOString();

        if ( level && level === "debug" && environment !== "development" ) {
            return;
        }

        if ( !level ) {
            level = 'warn';
        }

        output = "[" + timestamp + "] [" + level + "] " + msg + "\n";

        logfile.write( output );
    };
};
