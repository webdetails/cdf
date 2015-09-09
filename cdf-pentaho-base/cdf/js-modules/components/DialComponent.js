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
  '../Logger',
  './JFreeChartComponent'
], function(Logger, JFreeChartComponent) {

  var DialComponent = JFreeChartComponent.extend({

    update: function() {

      var cd = this.chartDefinition;
      if(cd == undefined) {
        Logger.log("Fatal - No chartDefinition passed", "error");
        return;
      }
 
      cd.chartType = 'DialChart';

      var intervals = cd.intervals;

      var colors = cd.colors;
      if(colors != undefined && intervals.length != colors.length) {
        Logger.log("Fatal - Number of intervals differs from number of colors", "error");
        return;
      }

      this.callPentahoAction(this.dashboard.detectQueryType(cd) == 'cda' ? "jfreechartdial-cda.xaction" : "jfreechartdial.xaction");
    }
  });

  return DialComponent;

});
