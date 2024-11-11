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
