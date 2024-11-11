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


HelloBaseComponent = BaseComponent.extend({
  update: function() {
    $("#" + this.htmlObject).text("Hello World!");
    this.myFunction();
  }
});

HelloUnmanagedComponent = UnmanagedComponent.extend({
  update: function() {
    var render = _.bind(this.render, this);
    this.synchronous(render);
  },

  render: function() {
    $("#" + this.htmlObject).text("Hello World!");
    this.myFunction();
  }
});

HelloQueryBaseComponent = BaseComponent.extend({
  update: function() {
    var myself = this;
    var query = new Query(myself.queryDefinition);
    query.fetchData(myself.parameters, function(values) {
      var changedValues = undefined;
      if((typeof(myself.postFetch)=='function')){
        changedValues = myself.postFetch(values);
      }
      if (changedValues !== undefined) {
        values = changedValues;
      }
      myself.render(values);
    });
  },

  render: function(data) {
    $("#" + this.htmlObject).text(JSON.stringify(data));
  }
});

HelloQueryUnmanagedComponent = UnmanagedComponent.extend({
  update: function() {
    var render = _.bind(this.render,this);
    this.triggerQuery(this.queryDefinition, render);
  },

  render: function(data) {
    $("#" + this.htmlObject).text(JSON.stringify(data));
  }
});
