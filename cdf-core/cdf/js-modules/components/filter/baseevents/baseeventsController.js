/* jshint devel:true */

define([
  './baseevents',
  './baseeventsCollection'],
  function( BaseEvents, BaseCollection ) {

      function SeedController(views, models) {
        this.views = new BaseCollection(views);
        this.models = new BaseCollection(models);
      }

      var BaseController = BaseEvents.convertClass( SeedController, {
        addView: function() {
          var ret = this.views.push.apply(this.views, arguments);
          return ret;
        },
        removeView: function() {
          var ret = this.views.pop.apply(this.views, arguments);
          return ret;
        },
        addModel: function() {
          var ret = this.models.push.apply(this.models, arguments);
          return ret;
        },
        removeModel: function() {
          var ret = this.models.pop.apply(this.models, arguments);
          return ret;
        }
      });

      return BaseController;
});
