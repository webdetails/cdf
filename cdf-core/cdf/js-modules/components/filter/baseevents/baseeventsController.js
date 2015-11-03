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
          return this.views.push.apply(this.views, arguments);
        },
        removeView: function() {
          return this.views.pop.apply(this.views, arguments);
        },
        addModel: function() {
          return this.models.push.apply(this.models, arguments);
        },
        removeModel: function() {
          return this.models.pop.apply(this.models, arguments);
        }
      });

      return BaseController;
});
