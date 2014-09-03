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

module.exports = {
    http_port           : 3050,
    http_host           : "localhost",
    redis_port          : 6379,
    redis_host          : "localhost",
    socketio_redis_key  : "waggle",
    services            : getServiceConfigs()
};
