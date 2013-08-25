var http = require('http'),
    querystring = require('querystring'),
    _ = require('underscore')._;

exports.routesPing = function(net_validation) {
    var pingRoutes = {
        baseUri: '/ping',
        pingResults: {},
        setupRoutes: function(app) {
            app.post('/ping/[rR]esult', resultsPost);
            app.post('/ping/[sS]tart[tT]esting', startTesting);
            app.post('/ping/[eE]nd[tT]esting', endTesting);
            app.get('/ping/results', getResults);
            app.post('/ping/[rR]esults/reset', resetResultsPost);
            app.post('/ping/start', kickOffTesting);
            app.post('/ping/failPendingTests', failRemainingPings);
        },
    };

    function kickOffTesting(req, res) {
        var defaultData = {
                bashURI: net_validation.getBaseURI() + pingRoutes.baseUri, 
                targets: net_validation.getBladeIps()
            };
        console.log("Using blade Ips of [" + defaultData.targets.join(", ") + "]");

        _.each(defaultData.targets, function(sourceIP) {
            var actionData = _.defaults({sourceIp: sourceIP}, defaultData);
    
            console.log("Trying to start ping testing on " + sourceIP);
            resetPingResultFor(sourceIP, actionData.targets);
            PostTo({
                host: sourceIP,
                port: 3000,
                path: "/ping/startTesting",
                data: actionData,
                success: function() {
                    console.log("Started ping testing on " + sourceIP);
                },
                error: function(error) {
                    console.log("Could not start ping testing on " + sourceIP);
                    console.log("Error = " + JSON.stringify(error, null, 4));
                    net_validation.completePingResult(sourceIP, [sourceIP]);
                }
            });
        });
        res.send(204, null);
    }

    function resultsPost (req, res) {
        var from = req.param('from', req.connection.remoteAddress),
            to = req.param('to', ""),
            success = req.param('success', "false") == 'true',
            current = pingRoutes.pingResults[to];

        console.log("result post\tfrom: "+ from + "\tto: " + to + "\tSuccess: " + success);
        if(_.isUndefined(current)) {
            console.log("Ping results not found");
            res.send(404, null);
            return;
        }
        if(_.has(current, from)) {
            current[from] = success ? 1 : 0;
        }
        var summary = GetPingTestSummary(current);
        if(summary.isDone) {
            net_validation.completePingResult(from, summary.errors);
        }
        res.send(pingRoutes.pingResults);
    }

    function GetPingTestSummary(results) {
        var errors = [];
        _.each(results, function(from, success) {
            if(success == -1) { return { isDone: false, errors: [] } };
            if(success == 0) { errors.push(from); }
        })
        return { isDone: true, errors: errors };
    }

    function startTesting (req, res) {
        console.log("Blade at " + req.connection.remoteAddress + " has started ping testing");
        res.send(204, null);
    }

    function endTesting (req, res) {
        console.log("Blade at " + req.connection.remoteAddress + " has stopped ping testing");
        res.send(204, null);
    }

    function getResults (req, res) {
        console.log("Sending ping results");
        res.send(pingRoutes.pingResults);
    }

    function resetResultsPost (req, res) {
        console.log("Resetting all ping results")
        resetPingResults();
        res.send(pingRoutes.pingResults);
    }

    function resetPingResults() {
        _.each(pingRoutes.pingResults, function(results) {
            _.each(results, function(result) {
                _.each(result, function(item) {
                    item = -1;
                });
            });
        });
    }

    function resetPingResultFor(source, targets) {
        pingRoutes.pingResults[source] = createPingResult(targets);
    }

    function createPingResult(targets) {
        var current = {};
        _.each(targets, function(target) {
            current[target] = -1;
        });
        return current;
    }

    function failRemainingPings(req, res) {
        console.log("completeing ping test");
        for (var i = 0, max = pingRoutes.targetIps.length; i < max; ++i) {
            var current = pingRoutes.pingResults[pingRoutes.targetIps[i]];
            for(var j = 0; j < max; ++j) {
                if(current[pingRoutes.targetIps[j]] == -1) {
                    current[pingRoutes.targetIps[j]] = 0;
                }
            }
        }
        res.send(204, null);
    }

    function PostTo(options){
        var data = querystring.stringify(options.data),
            requestOptions = {
                host: options.host,
                port: options.port,
                path: options.path,
                method: "post",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': data.length
                }
            },
            request = http.request(requestOptions, options.success);

        if(options.error) request.on('error', options.error);
        request.write(data);
        request.end();
    }

    return pingRoutes;
};
