/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


/* jshint devel:true */

define([
  '../../../lib/jquery',
  'amd!../../../lib/backbone',
  '../../../lib/mustache',
  '../../../lib/BaseEvents'
], function($, Backbone, Mustache, BaseEvents) {

  return BaseEvents.convertClass(Backbone.View, {
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

});

