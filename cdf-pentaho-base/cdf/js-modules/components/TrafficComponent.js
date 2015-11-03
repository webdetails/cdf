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
  '../dashboard/Utils',
  '../Logger',
  'amd!../lib/underscore',
  './UnmanagedComponent',
  '../lib/jquery',
  'css!./TrafficComponent'
], function(Utils, Logger, _, UnmanagedComponent, $) {

  var TrafficComponent = UnmanagedComponent.extend({
    trafficLight: function(result, xaction) {
      var cd = this.trafficDefinition;
      var value; 
      if(xaction) {
        value = $(result).find("VALUE").text();
      } else {
        value = result[0][0];
      }
      var greenClass = "img trafficGreen", yellowClass = "img trafficYellow", redClass = "img trafficRed";
      var i = $("<div>").attr("class", (value <= cd.intervals[0] ? redClass : (value >= cd.intervals[1] ? greenClass : yellowClass)));
      var $htmlObject = $('#' + this.htmlObject);
      $htmlObject.html(i);
      if(cd.showValue != undefined && cd.showValue == true) {
        var tooltip = "Value: " + value + " <br />" +
          "<div align='middle' class='" + redClass + "'/> &le; "  + cd.intervals[0] + " &lt; " +
          "<div align='middle' class='" + yellowClass + "'/> &lt; " + cd.intervals[1] + " &le; " +
          "<div align='middle' class='" + greenClass + "'/>" +
          (tooltip != undefined ? "<br/>" + tooltip : "");

        if ($htmlObject.tooltip.Constructor) { //hack to know if we should use bootstrap's tooltip or jquery's
          $htmlObject.tooltip({
            delay: 0,
            html: true,
            title: tooltip,
            placement: "auto top"
          });
        } else {
          $htmlObject.tooltip({
            delay: 0,
            track: true,
            fade: 250,
            content: tooltip
          });
          $htmlObject.attr("title", tooltip);
        }
      }
    },
    doQuery: function() {
      var myself = this;
      var cd = myself.trafficDefinition;

      // check if we should use a data source
      if(_.isString(cd.dataSource) && !_.isEmpty(cd.dataSource)) {
        // merge options, query definition options override options duplicated in the data source
        cd = _.extend({}, myself.dashboard.getDataSource(cd.dataSource), cd);
        // remove the data source name from the query definition
        delete cd.dataSource;
      }

      if(cd.path && cd.dataAccessId) {
        var handler = _.bind(function(data) {
          var filtered;
          if(myself.valueAsId) {
            filtered = data.resultset.map(function(e) {
              return [e[0], e[0]];
            });
          } else {
            filtered = data.resultset;
          }
          myself.trafficLight(filtered);
        }, myself);
        myself.triggerQuery(cd, handler);
      } else {
         // go through parameter array and update values
        var parameters = [];
        for(var p in cd) if(cd.hasOwnProperty(p)) {
          parameters.push([p, Utils.ev(cd[p])]);
        }
        
        var handler = _.bind(function() {
          myself.dashboard.callPentahoAction(
            myself,
            "system",
            "pentaho-cdf/actions",
            "traffic.xaction",
            parameters,
            function(result) {
              myself.trafficLight(result, true);
            });
        }, myself);
        myself.synchronous(handler);
      }
    },
    update: function() {
      var cd = this.trafficDefinition;
      if(cd == undefined) {
        Logger.error("Fatal - No trafficDefinition passed");
        return;
      }
      var intervals = cd.intervals;
      if(intervals == undefined) {
        cd.intervals = [-1, 1];
      }
      this.doQuery();
    }
  });

  return TrafficComponent;
});
