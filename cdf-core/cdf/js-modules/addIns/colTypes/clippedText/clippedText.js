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
  '../../../AddIn',
  '../../../Dashboard',
  '../../../lib/jquery',
  '../../../lib/CCC/tipsy',
  'amd!../../../lib/datatables',
  'css!./clippedText'],
  function(AddIn, Dashboard, $) {
  
  var clippedText = new AddIn({
    name: "clippedText",
    label: "Clipped Text",
    defaults: {
      showTooltip: true,
      useTipsy: false,
      style: {}
    },

    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },
    
    implementation: function(tgt, st, opt) {
      var $tgt = $(tgt),
        $container = $("<div>");

      $tgt.empty().append($container);
      $container.text(st.value).addClass("clippedText").attr("title", opt.showTooltip ? st.value : "");
      $container.css(opt.style);
      if(opt.useTipsy) {
        $container.tipsy({
          gravity: 's', 
          html: false
        });
      }
    }
  });

  Dashboard.registerGlobalAddIn("Table", "colType", clippedText);

  return clippedText;

});
