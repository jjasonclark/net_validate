;function netAdmin(netDb) {
    var bladeData = [
            { verified: false, networks: [{ mac: "76:c0:a5:da:a6:02", ipv4: "10.20.86.159" }] },
            { verified: false, networks: [{ mac: "2e:45:dd:7a:0a:53", ipv4: "10.20.86.91" }] }
        ],
        bladeDefaults = {
            networks: [],
            verified: -1
        }
        networkDefaults = {
            mac: "",
            ipv4: "",
            pingVerified: -1
        },
        macStart = 0
        ;

    function setTestBladeData() {
        console.log("setting test blade data");
        var index = 0;
        changeData(function(data) {
            _.each(data, function(discovery) {
                if(discovery.type === "bladeServer") {
                    if(index < bladeData.length) {
                        discovery.blades = [bladeData[index++]];
                    } else {
                        if(_.has(discovery, 'blades')) {
                            delete discovery.blades;
                        }
                    }
                }
            });
        });
    }

    function addFakeSVPData (discovery) {
        console.log("Adding fake data to " + discovery.name);
        discovery.WWNs = [
            'first', 'second'
        ];
    }

    function addFakeBladeData (discovery) {
        console.log("Adding fake data to " + discovery.name);
        discovery.blades = [
            createDefaultBlade(), createDefaultBlade(),
            createDefaultBlade(), createDefaultBlade(),
            createDefaultBlade(), createDefaultBlade(),
            createDefaultBlade(), createDefaultBlade()
        ];
    }

    function createDefaultBlade () {
        return _.defaults({
            networks: [
                _.defaults({ mac: ++macStart, ipv4: "10.30." + macStart + ".2" }, networkDefaults),
                _.defaults({ mac: ++macStart, ipv4: "10.30." + macStart + ".2" }, networkDefaults)
            ]
        }, bladeDefaults);
    }

    function postTo (url, data) {
        var sendData = _.isUndefined(data) ? {} : data;
        $.ajax({
            url: url,
            type: "post",
            data: sendData,
            dataType: "JSON",
            success: function () { alert('Completed'); }
        });
    }

    function failPingTest() {
        postTo('/ping/failPendingTests');
    }

    function setBladeData() {
        changeData(function(data) {
            _.each(data, function(discovery) {
                if(discovery.type === "bladeServer") {
                    addFakeBladeData(discovery);
                }
            });
        });
    }

    function changeData(changeMethod) {
        netDb.fetchData(function() {
            console.log("Got most recent update of data back from server")
            var data = netDb.discovery;

            changeMethod(data)
            updateDb(data);
        });
    }

    function setWWNData() {
        changeData(function(data) {
            _.each(data, function(discovery) {
                if(discovery.type === "svp") {
                    addFakeSVPData(discovery);
                }
            });
        });
    }

    function updateDb(data) {
        postTo("/data", { data: data });
    }

    function startPingTesting() {
        var target = $("#pingTestInput").val();
        
        postTo("/ping/start", { target: target });
    }

    function finishPingDiscovery() {
        changeData(function(data) {
            _.each(data, function(discovery) {
                discovery.pingStatus = "connected";
            });
        });
    }

    function finishDataCollection() {
        changeData(function(data) {
            _.each(data, function(discovery) {
                discovery.collectionStatus = "connected";
            });
        });
    }

    function finishBladeVerification() {
        changeData(function(data) {
            _.each(data, function(discovery) {
                if(discovery.type === "bladeServer" && discovery.blades) {
                    _.each(discovery.blades, function(blade) {
                        blade.verified = true;
                    });
                }
            });
        });
    }

    return {
        failPingTest: failPingTest,
        setBladeData: setBladeData,
        setWWNData: setWWNData,
        startPingTesting: startPingTesting,
        finishPingDiscovery: finishPingDiscovery,
        finishDataCollection: finishDataCollection,
        setTestBladeData: setTestBladeData,
        finishBladeVerification: finishBladeVerification
    };
};
