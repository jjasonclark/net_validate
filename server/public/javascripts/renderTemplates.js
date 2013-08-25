;function renderTemplates(templateData, loadedCallback) {
    var inner = {
            render: render,
        },
        templates = templateData;

    function render (name, data) {
        var template = getTemplate(name),
            $output = $("#" + template.outputId);

        $output.empty();
        if(data.length > 0) {
            _.each(data, function(model) {
                if (template.template) $output.append(template.template(model));
            });
        } else {
            $output.append("<h2>No data yet</h2>");
        }
    }

    function loadTemplates (callback) {
        var templateCount = templates.length,
            callbackCalled = false;

        _.each(templates, function (value) {
            $.get(value.url, function (data) {
                value.template = _.template(data, null, {variable : "model"});
                templateCount -= 1;
                if(!callbackCalled && templateCount <= 0) {
                    callback(inner);
                }
            });
        });
    }

    function getTemplate(name) {
        var template = _.find(templates, function (value) {
            return value.name === name;
        });
        if(_.isUndefined(template) || _.isNull(template)) {
            throw "Unknown template: " + name;
        } else {
            return template;
        }
    }

    loadTemplates(loadedCallback);
    return inner;
};