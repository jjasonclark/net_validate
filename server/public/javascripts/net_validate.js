;function netValidate() {
    var inner = {
            discovery: [],
            updateBladeIp: _.throttle(updateBladeIp, 1000),
            updateResourceIp: _.throttle(updateResourceIp, 1000),
            resetBlades: resetBladePingStatuses,
            fetchData: fetchData,
            saveData: saveData,
            pingResources: pingResources,
            collectResources: collectResources,
            setupTemplates: setupTemplates,
            downloadData: downloadData,
            verifyBlades: verifyBlades,
            pingBlades: pingBlades,
            addResource: addResource
        },
        templates = {
            render: function() {
                console.log("no render templates yet");
            }
        };

    function verifyBlades() {
        console.log("Verifing blades");
        $.ajax({
            url:"/blades/verify",
            type: "POST",
            dataType: "json",
            data: {},
            success: function() {
                alert("Blade verification started");
            },
            error: function() {
                console.log("got error while starting blade verification");
            }
        });
    }

    function pingBlades() {
        console.log("ping blades");
        $.ajax({
            url:"/ping/start",
            type: "POST",
            dataType: "json",
            data: {},
            success: function() {
                console.log("success from ping blades");
            },
            error: function() {
                console.log("got error while starting blade ping tests");
            }
        });
    }

    function downloadData() {
        window.open("/data?asFile=true", '_blank');
    }
    
    function collectResources() {
        $.ajax({
            url:"/discovery/startLogons",
            type: "POST",
            dataType: "json",
            data: {},
            success: renderAccessData,
            error: function() {
                console.log("got error while starting logons of resources");
            }
        });
    }

    function addResource(resourceName) {
        console.log("going to add new resource named " + resourceName);
    }

    function pingResources() {
        $.ajax({
            url:"/discovery/pingResources",
            type: "POST",
            dataType: "json",
            success: renderData,
            error: function() {
                console.log("got error while starting to ping resources");
            }
        });
    }

    function resetBladePingStatuses() {
        $.ajax({
            url:"/blades/resetPingStatus",
            type: "POST",
            dataType: "json",
            success: renderData
        });
    }

    function saveData(data) {
        inner.discovery = data;
        renderData();
    }

    function fetchData (success) {
        $.ajax({
            url: "/data",
            type: "GET",
            dataType: "json",
            success: function(data) {
                inner.discovery = data;
                if(success) {
                    success(inner.discovery);
                } else {
                    renderData();
                }
            },
            error: function() {
                console.log("got error while fetching data");
            }
        });
    }

    function setupTemplates(templatePlugin) {
        templates = templatePlugin;
        fetchData();
    }

    function renderData() {
        renderDiscoveryData();
        renderAccessData();
        renderBladesData();
    }

    function renderBladesData() {
        var connected = _.filter(inner.discovery, function(discovery) { 
            return discovery.collectionStatus === "connected" && discovery.type === "bladeServer";
        });
        templates.render('blade', connected);
    }

    function renderDiscoveryData() {
        templates.render('discovery', inner.discovery);
    }

    function renderAccessData() {
        var connected = _.filter(inner.discovery, function(discover) { 
            return discover.pingStatus === "connected";
        });
        templates.render('access', connected);
    }

    function updateBladeIp() {
        var $this = $(this),
            ip = $this.val(),
            mac = $this.data('mac');

        _.each(inner.discovery, function(bladeServer) {
            if(!_.isUndefined(bladeServer.blades)) {
                _.each(bladeServer.blades, function(blade){
                    _.each(blade.networks, function(network){
                        if(network.mac === mac) {
                            network.ipv4 = ip;
                            postDiscoveryData(bladeServer);
                        }
                    });
                });
            }
        });
    }

    function postDiscoveryData(item) {
        $.ajax({
            url:"/data/" + escape(item.name),
            type: "POST",
            dataType: "json",
            data: { data: item },
            success: function (data) {
                console.log("success discovery post");
            },
            error: function (errors) {
                console.log("Got error while trying to update discovery data");
            }
        });
    }

    function updateResourceIp(e) {
        var $this = $(this),
            ip = $this.val(),
            name = $this.prev().text();

        var item = _.find(inner.discovery, function(discover) {
            return discover.name === name;
        });
        if(item) {
            console.log("Updating IP for " + item.name + " to " + ip);
            item.ipv4 = ip;
            postDiscoveryData(item);
        }
    }

    return inner;
};
