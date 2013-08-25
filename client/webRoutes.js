var spawn = require('child_process').spawn,
    fs = require('fs')
    ejs = require('ejs');

module.exports = (function() {
    var webRoutes = {
        networks: [],
        setupRoutes: function(app) {
            app.get('/', indexPage);
            app.get('/network[iI]nfo', networkInfo);
            app.post('/ping/start[tT]esting', startTesting);
        }
    };

    function indexPage(req, res) {
        console.log("rendering index page");
        res.render("index", { title: "NET_Validate", networks: webRoutes.networks });
    }

    function networkInfo(req, res) {
        console.log("Sending network info");
        res.send(webRoutes.networks);
    }

    function createScript(sourceIp, targets, bashURI) {
        console.log('Creating ping script');
        var model = {
            targetIps: targets,
            baseUri: bashURI,
            sourceIp: sourceIp
        };

        var file = fs.readFileSync(__dirname+'/views/pingScript.sh.ejs', 'ascii');
        return ejs.render(file, { locals: model});
    }

    function startTesting (req, res) {
        var bashURI = req.param('bashURI', ""),
            targets = req.param('targets', []),
            sourceIp = req.param('sourceIp', ""),
            bash = spawn('/bin/bash', []);

        console.log("Starting ping tests for " + bashURI);
        
        bash.stdout.on('data', function(data) { 
            console.log('out: ' + data);
        });
        bash.stderr.on('data', function(data) { 
            console.log('err: ' + data);
        });
        bash.on('exit', function(code) { 
            console.log('exit: ' + code);
        });
        bash.stdin.write(createScript(sourceIp, targets, bashURI));
        bash.stdin.end();

        res.send(204, null);
    }

    return webRoutes;
})();
