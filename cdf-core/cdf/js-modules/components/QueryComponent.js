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

define([
  './UnmanagedComponent',
  '../Logger',
  'amd!../lib/underscore'
], function(UnmanagedComponent, Logger, _) {

  var QueryComponent = UnmanagedComponent.extend({
    visible: false,

    update: function() {
      var myself = this;
      if(myself.warnOnce) {
        myself.warnOnce();
      }

      var cd = myself.queryDefinition;
      var asyncMode = myself.asynchronousMode || false;
      var redraw = _.bind(myself.render, myself);
      if(cd == undefined) {
        Logger.error("Fatal - No query definition passed");
        return;
      }
      if(asyncMode) {
        myself.triggerQuery(cd, redraw);

      } else {
        QueryComponent.makeQuery(myself, function(values) {
          // We need to make sure we're getting data from the right place,
          // depending on whether we're using CDA

          var changedValues = undefined;
          if((typeof(myself.postFetch) == 'function')) {
            changedValues = myself.postFetch(values);
          }

          if(changedValues != undefined) {
            values = changedValues;
          }

          myself.result = values.resultset != undefined ? values.resultset : values;
          if(typeof values.resultset != "undefined") {
            myself.metadata = values.metadata;
            myself.queryInfo = values.queryInfo;
          }

          myself.synchronous(redraw, values);
        });
      }
    },

    render: function(data) {
      if(this.resultvar != null) {
        this.dashboard.setParameter(this.resultvar, data.resultset);
      }
    },

    warnOnce: function() {
      Logger.log("Warning: QueryComponent behaviour is due to change. See "
        + "http://www.webdetails.org/redmine/projects/cdf/wiki/QueryComponent"
        + " for more information");
      delete(this.warnOnce);
    }
  }, {

    /**
     * Generates a query object given a definition object and a success callback function.
     *
     * @method makeQuery
     * @static
     * @deprecated
     * @param object the object containing the query definition
     * @param successCallback the success callback function
     */
    makeQuery: function(object, successCallback) {

      if(this.warnOnce) { this.warnOnce(); }
      var cd = object.queryDefinition;
      if(cd == undefined) {
        Logger.error("Fatal - No query definition passed");
        return;
      }
      var query = object.dashboard.getQuery(cd);
      object.queryState = query;

      // Force synchronous queries
      query.setAjaxOptions({async: false});

      if(!successCallback) {
        successCallback = function(values) {
          // We need to make sure we're getting data from the right place,
          // depending on whether we're using CDA

          var changedValues;
          if((typeof(object.postFetch) == 'function')) {
            changedValues = object.postFetch(values);
          }

          if(changedValues != undefined) {
            values = changedValues;
          }

          if(object.resultvar != undefined) {
            object.dashboard.setParameter(object.resultvar, object.result);
          }
          
          if(typeof values.resultset != "undefined") {
            object.metadata = values.metadata;
            object.queryInfo = values.queryInfo;
            object.result = values.resultset;
          } else {
            object.result = values;
          }
        }
      }

      query.fetchData(object.parameters, successCallback);
    }
  });

  return QueryComponent;

});
