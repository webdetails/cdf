//define([CONTEXT_PATH + 'plugin/pentaho-cdf/api/resources/js/components/UnmanagedComponent.js', 'amd!cdf/lib/underscore'],
define(['cdf/components/UnmanagedComponent', 'amd!cdf/lib/underscore'],
  function(UnmanagedComponent, _) {
    HelloWorldComponent = UnmanagedComponent.extend({
      update: function() {
        var render = _.bind(this.render, this);
        this.synchronous(render);
      },
      render: function(data) {
        this.placeholder().text("Hello World from Custom Component!");
      }
    });
    return HelloWorldComponent;
  });
