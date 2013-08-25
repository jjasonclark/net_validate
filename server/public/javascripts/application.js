$(document).ready(function() {
    var templateData = [
            { url: "/templates/bladeServer.html", name: "blade", outputId: "bladesDisplay" },
            { url: "/templates/discovery.html", name: "discovery", outputId: "discoveryDisplay" },
            { url: "/templates/access.html", name: "access", outputId: "accessDisplay" }
        ],
        net_validate = netValidate(),
        net_admin = netAdmin(net_validate);
    
    window.net_admin = net_admin;
    window.net_validate = net_validate;

    renderTemplates(templateData, function (plugin) {
        net_validate.setupTemplates(plugin);
    });

    $('ul#bladesDisplay').on('change keypress', 'div.network input.ipv4', null, net_validate.updateBladeIp);
    $('ul#discoveryDisplay').on('change keypress', 'li div.resourceItem input[type=text]', null, net_validate.updateResourceIp);

    $('#topNav').breadCrumb({
        panelInitialize: function() {},
        panelChoose: function(panels, index) {
            $.each(panels, function(i) {
                if(index != i) {
                    panels[i].panel.addClass('hide');
                    panels[i].source.removeClass('current');
                }
            });
            panels[index].panel.removeClass('hide');
            panels[index].source.addClass('current');
        }
    });
    $('#topNav li[data-target != ""]').first().click();

    $('#adminButton').overlay({
        load: false,
        mask: "#000",
        effect: 'apple',
        target: "#admin",
        fixed: true,
        closeOnClick: false,
        top: "10%",
        left: "center",
        absolute: false
    });

    $('#uploadButton').overlay({
        load: false,
        mask: "#000",
        effect: 'apple',
        target: "#fileUpload",
        fixed: true,
        closeOnClick: false,
        top: "10%",
        left: "center",
        absolute: false
    });

    $('#addResourceButton').overlay({
        load: false,
        mask: "#000",
        effect: 'apple',
        target: "#addResourcePanel",
        fixed: true,
        closeOnClick: false,
        top: "10%",
        left: "center",
        absolute: false
    });
    $("#addResourceForm").on('submit', function(event) {
        event.preventDefault();
        var nameInput = $(this).find('input[name=name]');
        net_validate.addResource(nameInput.val());
        nameInput.val('');
    });

    var socket = io.connect(document.location.href);
    socket.on('dbUpdate', function(data) {
        net_validate.saveData(data);
    });
});
