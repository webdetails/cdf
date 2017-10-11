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
  '../../lib/jquery'
], function($) {

  return {

    name: "trendArrow",
    label: "Trend Arrows",

    defaults: {
      good: true,
      thresholds: {up: 0, down: 0},
      includeValue: false,
      valueFormat: function(v, format, st, opt) {
        return v || "";
      }
    },

    init: function() { },

    implementation: function(tgt, st, opt) {
      var qualityClass = opt.good ? "good" : "bad",
          /* Anything that's not numeric is an invalid value.
           * We consider "numeric" to mean either a number,
           * or a string that is a fixed point for conversion
           * to number and back to string.
           */
          isNumeric = typeof st.value === "number"
            || (typeof st.value === "string" && Number(st.value).toString() !== 'NaN'),
          trendClass = !isNumeric
            ? "invalid"
            : st.value > opt.thresholds.up
              ? "up"
              : st.value < opt.thresholds.down
                ? "down"
                : "neutral",
          $html = $(opt.layout),
          $tgt = $(tgt).empty();

      if(opt.includeValue) {
        $tgt.append($("<div class='value'></div>").append(opt.valueFormat(st.value, st.colFormat, st, opt)));
      }
      $tgt.append($(opt.layout)).find('.' + opt.cssClass).addClass(trendClass).addClass(qualityClass);
    }
  };

});
