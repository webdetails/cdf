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
  '../../../AddIn',
  '../../../Dashboard',
  '../../../lib/raphael',
  '../../../lib/jquery'
], function(AddIn, Dashboard, Raphael, $) {

  var circle = new AddIn({
    name: "circle",
    label: "Circle",
    defaults: {
      canvasSize: 10,
      radius: 4,
      color: 'black',
      title: function(st, opt) { return "Value: " + st.value; }
    },

    implementation: function(tgt, st, opt) {
      $(tgt).empty();
      var key,
          op,
          options = {},
          w;

      for(key in opt) if(opt.hasOwnProperty(key)) {
        op = opt[key];
        options[key] = typeof op === 'function'
          ? op.call(this, st, opt)
          : op;
      }
      w = options.canvasSize;

      Raphael(tgt, options.canvasSize, options.canvasSize)
        .circle(w / 2, w / 2, options.radius)
        .attr({
          fill: options.color,
          opacity: 1,
          "stroke": "none",
          "title": options.title
        });
    }
  });

  Dashboard.registerGlobalAddIn("Table", "colType", circle);

  return circle;

});
