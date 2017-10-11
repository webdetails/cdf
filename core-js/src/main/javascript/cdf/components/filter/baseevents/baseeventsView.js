/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

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

