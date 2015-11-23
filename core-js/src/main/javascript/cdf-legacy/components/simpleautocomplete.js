/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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

var SimpleAutoCompleteComponent = BaseComponent.extend({

  ph: undefined,
  completionCallback: undefined,

  update: function() {
    var myself = this;
    if(myself.ph == undefined) {
      myself.ph = $("#" + myself.htmlObject).empty();
      myself.input = $("<input type='text'>").appendTo(myself.ph);
      myself.query = Dashboards.getQuery(myself.queryDefinition);
      myself.input.autocomplete({
        source:function(obj, callback) { return myself.triggerQuery(obj.term,callback); }
      });
      myself.input
        .change(function() {
          Dashboards.processChange(myself.name);
        })
        .keyup(function(event) {
          if(event.keyCode == 13) {
            Dashboards.processChange(myself.name);
          }
        });
    }
  },

  getList: function(values) {
    if(typeof this.postFetch == "function") {
      var changedValues = this.postFetch(values);
      values = changedValues || values;
    }
    return values.resultset.map(function(e) { return e[0]; });
  },

  handleQuery: function(callback) {
    var myself = this;
    return function(values) {
      var list = myself.getList(values);
      callback(list);
    };
  },

  triggerQuery: function(term, callback) {
    var params = $.extend([], this.parameters);
    var searchParam = this.searchParam || "searchBox";

    if(searchParam == "searchBox") {
      this.query.setSearchPattern(term);
    } else {
      params.push([this.searchParam, term]);
    }

    if(term.length >= this.minTextLength) {
      this.query.fetchData(params, this.handleQuery(callback));
    } else {
      callback([]);
    }
  },

  getValue: function() {
    return this.input.val();
  }

});
