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

define(['./BaseComponent', '../lib/jquery'], function(BaseComponent, $) {

  return BaseComponent.extend({

    ph: undefined,
    completionCallback: undefined,

    update: function() {
      var myself = this;
      if(myself.ph == undefined) {
        myself.ph = $("#" + myself.htmlObject).empty();
        myself.input = $("<input type='text'>").appendTo(myself.ph);
        myself.query = myself.dashboard.getQuery(myself.queryDefinition);
        myself.input.autocomplete({
          source: function(obj, callback) { return myself.triggerQuery(obj.term, callback); }
        });

        myself.input.change(function() {
          myself.dashboard.processChange(myself.name);
        }).keyup(function(event) {
          if(event.keyCode == 13) {
            myself.dashboard.processChange(myself.name);
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
    },

    /** @inheritDoc */
    _unlink: function () {
      this.base();
      this.ph = this.input = null;
    }

  });

});
