/* jshint devel:true */

define([
  'cdf/lib/jquery',
  'amd!cdf/lib/backbone',
  'cdf/lib/mustache',
  './baseevents'],
  function( $, Backbone, Mustache, BaseEvents ) {

     var BaseView = BaseEvents.convertClass( Backbone.View, {
          initialize: function(config) {
            // Create model bindings.
            // TODO: Create smarter bindings to bind only to used properties.
            this.setModel(config.model);
            this.setElement($(config.target));
          },
          getModel: function() {
            return this.model;
          },
          setModel: function(model) {
            this.stopListening();
            this.model = model;
            this.bindToModel();
          },
          bindToModel: function() {
            this.listenTo(this.getModel(), 'change', this.render);
          },
          render: function() {
            return this.$el.html( Mustache.render(this.template, this.model.toJSON()) );
          }

     });

    //--------------------------------//

    return BaseView;
 });

