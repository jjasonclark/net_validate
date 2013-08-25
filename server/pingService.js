var exec = require('child_process').exec,
    _ = require("underscore")._;

module.exports = (function() {
    var pingService = {
            pingMany: pingMany
        },
        environment,
        win32Environment = {
            command: function(targetIP) {
                return 'ping -4 -n 3 ' + targetIP +' | findstr /c:"TTL=" > NUL';
            },
            timeout: 60000
        },
        unixEnvironment = {
            command: function(targetIP) {
                return 'ping -c 3 ' + targetIP;
            },
            timeout: 60000
        };

    switch (process.platform) {
    case 'win32':
    //case 'win64':
        environment = win32Environment;
        break;
    case 'darwin':
        environment = unixEnvironment;
        break;
    default:
        environment = unixEnvironment;
        break;
    }


    function runPing(targetIP, callback) {
        console.log("Pinging " + targetIP);
        var pingCommand = environment.command(targetIP),
            options = { timeout: environment.timeout };

        exec(pingCommand, options, function (error, stdout, stderr){
            var status = (error && error.code != 0) ? 0 : 1;
            callback(targetIP, { status: status });
        });
    }

    function pingMany(targetIPs, callback) {
        _.each(targetIPs, function(targetIP) {
            runPing(targetIP, callback);
        });
    }

    return pingService;
})();
