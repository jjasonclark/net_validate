var _ = require("underscore")._
    fs = require("fs");

exports.netDb = function(socketIo) {
    var net_database = {
            db: [],
            createData: createData,
            triggerUpdate: triggerUpdate,
            setupRoutes: function(app) {
                app.get("/data", getAllData);
                app.post("/data", setAllData);
                app.post("/data/:name", setDataItem);
                socketIo.sockets.on('connection', function(socket) {
                  console.log("Client connected to socket.io update channel");
                  sockets.push(socket);
                });
                socketIo.sockets.on('disconnect', function(socket) {
                  console.log("Client disconnect from socket.io update channel");
                  sockets = _.reject(sockets, function(current) {
                    return current === socket;
                  });
                });
            }
        },
        dataDefaults = {
            name: "",
            ipv4: "",
            pingStatus: "unknown",
            collectionStatus: "unknown",
            type: "unknown",
            userName: "",
            password: ""
        },
        sockets = [];

    function getAllData (req, res) {
        console.log("sending data");
        if(req.param("asFile", false)) {
            res.setHeader("content-disposition", 'attachment; filename="net_validate.json"');
        }
        res.send(net_database.db);
    }

    function setAllData (req, res) {
        console.log("Seting data");
        if(req.files && req.files.dataFile) {
            var fileContents = fs.readFileSync(req.files.dataFile.path, "utf-8"),
                data = JSON.parse(fileContents);
            net_database.db = data;
            triggerUpdate();
            res.redirect("/");
        } else {
            net_database.db = req.param("data", []);
            triggerUpdate();
            res.send(net_database.db);
        }
    }

    function setDataItem (req, res) {
        console.log("Setting data to new value");
        var name = req.param("name", ""),
        	data = req.param("data", {}),
            ipv4 = data.ipv4,
            item = findDiscoveryItem(name);

        if(item) {
            if(item.ipv4 !== ipv4) {
                item.ipv4 = ipv4;
                item.status = "unknown";
                console.log("Updated " + name + " ip: " + ipv4);
            }
            if(data.blades) {
                item.blades = data.blades;
                console.log("Updated blades");
            }
            triggerUpdate();
            res.send(204, null);
        } else {
            res.send(404, null);
        }
    }

    function findDiscoveryItem (name) {
        return _.find(net_database.db, function (value) {
            return value.name === name;
        });
    }

    function createData (items) {
        net_database.db = _.map(items, function(item) {
            return _.defaults(item, dataDefaults);
        });
    }

    function triggerUpdate() {
        socketIo.sockets.emit("dbUpdate", net_database.db);
        // _.each(sockets, function(socket) {
        //     socket.emit("dbUpdate", net_database.db);
        // });
    }
    
    return net_database;
};
