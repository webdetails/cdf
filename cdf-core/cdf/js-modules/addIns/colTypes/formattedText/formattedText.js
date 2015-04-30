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
  '../../../dashboard/Sprintf',
  '../../../lib/jquery',
  'amd!../../../lib/datatables'],
  function(AddIn, Dashboard, sprintf, $) {
  
  var formattedText = new AddIn({
    name: "formattedText",
    label: "Formatted Text",
    defaults: {
      textFormat: function(v, st, opt) { return st.colFormat ? sprintf(st.colFormat,v) : v; }
    },

    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },
    
    implementation: function(tgt, st, opt) {
      var text = opt.textFormat.call(this, st.value, st, opt);
      $(tgt).empty().append(text);
    }
    
  });

  Dashboard.registerGlobalAddIn("Table", "colType", formattedText);

  return formattedText;

});
