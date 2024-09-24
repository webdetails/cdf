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
    },

    /** @inheritDoc */
    _unlink: function () {
      this.base();
      if(this.vis) {
        this.vis.dispose();
      }
    }
  });

});
