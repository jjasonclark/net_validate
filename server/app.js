
/**
 * Module dependencies.
 */

var express = require('express'),
    routesPing = require('./routesPing'),
    netValidation = require('./net_validation'),
    database = require('./database'),
    utils = require('./utils'),
    serverPort = 3000;
    app = module.exports = express.createServer(),
    io = require('socket.io').listen(app),
    netDb = database.netDb(io),
    net_validation = netValidation.netValidation(netDb),
    pingRoutes = routesPing.routesPing(net_validation);

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
  app.use(express.logger());
});

// Setup

utils.getNetworks(function(error, networks){
  console.log("Getting local networks");
  if(error) {
    console.log('Errors:\n' + error);
  } else {
    net_validation.setupNetworks(serverPort, networks);
  }
})

// Default data

netDb.createData([
  { type: "managementServer", name: "Management Exsi #1",             ipv4: "10.30.01.10" },
  { type: "managementServer", name: "Management Exsi #2",             ipv4: "10.30.02.10" },
  { type: "svp",              name: "SVP",                            ipv4: "10.30.03.10" },
  { type: "fiberSwitch",      name: "FC swtich #1",                   ipv4: "10.30.04.10" },
  { type: "fiberSwitch",      name: "FC swtich #2",                   ipv4: "10.30.05.10" },
  { type: "ethernetSwitch",   name: "Top of rack ethernet switch #1", ipv4: "10.30.06.10" },
  { type: "ethernetSwitch",   name: "Top of rack ethernet switch #2", ipv4: "10.30.07.10" },
  { type: "bladeServer",      name: "Blade server #1",                ipv4: "10.30.08.10" },
  { type: "bladeServer",      name: "Blade server #2",                ipv4: "10.30.09.10" },
  { type: "bladeServer",      name: "Blade server #3",                ipv4: "10.30.10.10" },
  { type: "bladeServer",      name: "Blade server #4",                ipv4: "10.30.11.10" },
  { type: "bladeServer",      name: "Blade server #5",                ipv4: "10.30.12.10" },
  { type: "bladeServer",      name: "Blade server #6",                ipv4: "10.30.13.10" },
  { type: "bladeServer",      name: "Blade server #7",                ipv4: "10.30.14.10" },
  { type: "bladeServer",      name: "Blade server #8",                ipv4: "10.30.15.10" }
]);

// Routes

pingRoutes.setupRoutes(app);
net_validation.setupRoutes(app);
netDb.setupRoutes(app);

app.get('/', function (req, res) { res.render("index"); });
app.listen(serverPort, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
