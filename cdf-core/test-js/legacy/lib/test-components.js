/*!
* Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
* 
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

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
