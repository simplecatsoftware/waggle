var fs = require('fs');

function getServiceConfigs () {
    var services = [];
    var files    = fs.readdirSync("config/services");

    files.forEach(function (file) {
        if (file.indexOf("json") !== -1) {
            services.push(require("./services/" + file));
        }
    });

    return services;
}

function getProcessPort () {
    var argv = process.argv;
    var port = argv.indexOf("--port");

    if ( port === -1 ) return 8080;

    return argv[port + 1];
}

module.exports = {
    http_port           : getProcessPort(),
    http_host           : "localhost",
    redis_port          : 6379,
    redis_host          : "localhost",
    socketio_redis_key  : "waggle",
    services            : getServiceConfigs(),
    logfile             : "waggle.log"
};
