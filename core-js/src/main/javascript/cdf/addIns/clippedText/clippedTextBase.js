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
