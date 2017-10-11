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
