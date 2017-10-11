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

define([
  './ChartComponent',
  '../lib/jquery',
  '../lib/CCC/protovis-compat!'
], function(ChartComponent, $, pv) {

  return ChartComponent.extend({

    update: function() {
      if(this.parameters == undefined) {
        this.parameters = [];
      }

      this.renderChart();
    },

    render: function(values) {
      $("#" + this.htmlObject).html('<div id="' + this.htmlObject + 'protovis"></div>');

      this.vis = new pv.Panel()
        .canvas(this.htmlObject + "protovis")
        .width(this.width)
        .height(this.height);
      this.customfunction(this.vis, values);
      this.vis.root.render();
    },

    processdata: function(values) {
      this.render(values);
    }
  });

});
