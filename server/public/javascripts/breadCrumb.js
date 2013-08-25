;
(function($) {
  var defaults = {
      panelInitialize: function(panel) {
        panel.panel.hide();
      },
      panelChoose: function(panels, index, e) {
        e.preventDefault();
        $.each(panels, function(i) {
          if(i != index) {
            panels[i].panel.hide();
          }
        });
        panels[index].panel.show();
      }
  };

  function initialize($element, self, opts) {
    self.panels = createPanels($element);
    $.each(self.panels, function(index) {
      var panel = self.panels[index];
      panel.source.on('click', function(e){ 
        opts.panelChoose(self.panels, index, e);
      });
      opts.panelInitialize(panel);
    });
  }

  function createPanels($element) {
    return $element
      .find('> li[data-target != ""]')
      .map(function(index, value) {
        var li = $(this),
            targets = li.data('target'),
            displayPanel = $(targets);

        return { source: li, panel: displayPanel };
      })
      .get();
  }

  $.fn.breadCrumb = function(options) {       
    var opts = $.extend({}, defaults, options);

    return this.each(function() {
      if (this.breadCrumb) { return false; }
      this.breadCrumb = { panels: [] };
      initialize($(this), this.breadCrumb, opts);
    });
  };
})(jQuery);
