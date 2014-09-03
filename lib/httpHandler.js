var environment = process.env['node_environment'] || 'development';
var fs          = require('fs');
var log         = require('./log')( environment, "waggle.log" );

module.exports = function httpHandler ( req, res ) {
    var statusCode = 200;

    fs.readFile('public/index.html', function( err, data ) {
        if ( err ) {
            statusCode = 500;

            if ( err.code === "ENOENT" )
                statusCode = 404;
        }

        res.writeHead( statusCode , {
            'Content-Type': 'text/html',
            'Content-Length': data.length
        });

        // log( "[" + statusCode + "] " + req.url, "access" );

        res.end( data );
    });
};
