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
  '../../lib/jquery',
  '../../lib/CCC/tipsy'
], function($) {

  return {
    name: "clippedText",
    label: "Clipped Text",
    defaults: {
      showTooltip: true,
      useTipsy: false,
      applyFormat: function(value) { return value; },
      tipsyOptions: {gravity: 's', html: false},
      cssClass: 'clippedTextContainer',
      layout: '<div></div>'
    },

    init: function() {
      // override
    },

    implementation: function(tgt, st, opt) {
      var data = typeof opt.applyFormat === "function"
            ? opt.applyFormat(st.value)
            : st.value,
          $html = $(opt.layout)
            .addClass(opt.cssClass)
            .append(data)
            .attr('title', opt.showTooltip ? data : "");

      if(opt.useTipsy) {
        $html.tipsy(opt.tipsyOptions);
      }
      $(tgt).empty().html($html);

    }
  };
});
