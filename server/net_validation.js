var _ = require("underscore")._,
    http = require('http'),
    querystring = require('querystring'),
    ping = require("./pingService");

exports.netValidation = function(netDb) {
    var net_validation = {
            getBaseURI: getBaseURI,
            setupNetworks: setupNetworks,
            getBladeIps: getBladeIps,
            completePingResult: completePingResult,
            setupRoutes: function(app) {
                app.post('/blades/resetPingStatus', resetPingStatus);
                app.post('/blades/verify', verifyBlades);
                app.post("/discovery/pingResources", startPinging);
                app.post("/discovery/startLogons", startLogons);
            }
        },
        serverIPs = [],
        serverPort = 3000,
        serverNetworks = [],
        typeHandler = {
            "bladeServer": nop,
            "managementServer": nop,
            "svp": nop,
            "fiberSwitch": nop,
            "ethernetSwitch": nop
        },
        ipMatcher = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;

    function nop (discovery) {
        console.log("Doing nothing to collect from " + discovery.name);
    }

    function setupNetworks(port, networks) {
        serverPort = port;
        serverNetworks = networks;
        serverIPs = _.chain(networks)
            .map(function (network) { return network.ipv4; })
            .filter(function (ipv4) { return ipv4 !== ""; })
            .value();

        console.log("Using server URL of " + getBaseURI());
    }

    function getBaseURI () {
        return 'http://' + _.first(serverIPs) + ":" + serverPort;
    }

    function startLogons (req, res) {
        console.log("Starting data collection for resources");

        _.each(netDb.db, function (discovery) {
            if(_.has(typeHandler, discovery.type)) {
                typeHandler[discovery.type](discovery);
            } else {
                console.log("Unknown type handler: " + discovery.type);
            }
        });
        res.send(204, null);
    }

    function verifyBladeNetworks(blade, networks) {
        _.each(blade.networks, function(network) {
            console.log("Trying to verify blade client at " + network.ipv4);
            var hasMac = _.find(networks, function(result) {
                return result.mac == network.mac;
            });
            if(hasMac)
            {
                console.log("Verified blade at " + network.ipv4);
                blade.verified = 1;
                netDb.triggerUpdate();
            }
        });
    }

    function verifyBladeClient(blade) {
        _.each(blade.networks, function(network) {
            console.log("Posting to " + network.ipv4);
            getClientData(network.ipv4, function(results) {
                verifyBladeNetworks(blade, results);
            }, function(error) {
                if(blade.verified != 1) {
                    blade.verified = 0;
                    netDb.triggerUpdate();
                }
            });
        });
    }

    function verifyBlades (req, res) {
        console.log("Starting blade verification");
        _.each(netDb.db, function(discovery) {
            if(_.has(discovery, 'blades')) {
                _.each(discovery.blades, function (blade) {
                    blade.verified = -1;
                    verifyBladeClient(blade);
                });
            }
        });
        res.send(netDb.db);
    }

    function resetPingStatus (req, res) {
        _.each(netDb.db, function(discovery) {
            _.each(discovery.blades, function (blade) {
                blade.status = "unknown";
            });
        });
        netDb.triggerUpdate();
        res.send(netDb.db);
    }

    function convertStatus (value) {
        switch(value) {
        case 1:
            return "connected";
        case 0:
            return "cannot-reach";
        default:
            return "unknown";
        }
    }

    function findDiscovery (targetIP) {
        return _.find(netDb.db, function (value) {
            return value.ipv4 == targetIP;
        });
    }

    function getDiscoveryIps () {
        return _.chain(netDb.db)
            .map(function(value) { return value.ipv4; })
            .filter(function(value) { return "" !== value; })
            .value();
    }

    function startPinging (req, res) {
        console.log("starting pinging of resources");
        var targetIPs = getDiscoveryIps();
        ping.pingMany(targetIPs, function(targetIP, result) {
            var discovery = findDiscovery(targetIP),
                newStatus = convertStatus(result.status);
            console.log("Updating discovery ping result for " + discovery.name + "\tnew status: " + newStatus);
            discovery.pingStatus = newStatus;
            netDb.triggerUpdate();
        });
        res.send(netDb.db);
    }

    function getBladeIps() {
        return _.chain(netDb.db)
            .filter(function (discovery) { return !_.isUndefined(discovery.blades); })
            .map(function (discovery) { return discovery.blades; })
            .flatten()
            .map(function (blade) { return blade.networks; })
            .flatten()
            .map(function (network) { return network.ipv4; })
            .map(function (val){
                var matches = ipMatcher.exec(val);
                return matches && matches.length > 0 ? matches[1] : "";
            })
            .filter(function (val) { return val !== ""; })
            .value();
    }
    
    function getClientData(targetIp, successCallback, errorCallback) {
        var textResult = "",
            options = {
                host: targetIp,
                port: 3000,
                path: '/networkInfo',
                method: "get",
                agent: false
            };

        var request = http.request(options, function(res) {
            res.on('data', function(chunk) { textResult += chunk; });
            res.on('end', function() { successCallback(JSON.parse(textResult)); });
        });
        request.on('error', function(error) {
            console.log("Got errors while trying to contact to " + targetIp);
            console.log("Error = " + JSON.stringify(error, null, 4));
            errorCallback(error);
        });
        request.end();
    }

    function completePingResult(from, errors) {
        console.log("updating ping results for " + from);
        _.each(netDb.db, function(discovery) {
            if(_.has(discovery, 'blades')) {
                _.each(discovery.blades, function(blade) {
                    var item = _.find(blade.networks, function(network) {
                        return network.ipv4 === from;
                    });
                    if(item) {
                        console.log("Found blade to update status for");
                        item.pingVerified = errors.length == 0 ? 1 : 0;
                        item.errors = errors;
                        netDb.triggerUpdate();
                    }
                })
            }
        });
    }

    return net_validation;
};
