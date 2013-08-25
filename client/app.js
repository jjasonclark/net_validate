
/**
 * Module dependencies.
 */

var express = require('express'),
    webRoutes = require('./webRoutes'),
    utils = require('./utils');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Setup 

utils.getNetworks(function(error, networks){
  console.log("Getting local networks");
  if(error) {
    console.log('Errors:\n' + error);
  } else {
    var ips = [];
    for(var i = 0, max = networks.length; i < max; ++i){
      var current = networks[i];
      if(current.ipv4 !== "") {
        ips.push(current.ipv4);
      }
    }

    webRoutes.networks = networks;

    console.log('Local IPs: [' + ips.join(", ") + "]");
    console.log("Local networks: ");
    for(var j = 0, maxj = networks.length; j < maxj; ++j) {
      console.log("Adapter: " + networks[j].name + "\tMac: " + networks[j].mac + "\tIPv4: " + networks[j].ipv4);
    }
  }
})

// Routes

webRoutes.setupRoutes(app);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
