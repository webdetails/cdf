/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define([
  '../../../AddIn',
  '../../../Dashboard',
  '../../../dashboard/Sprintf',
  '../../../lib/jquery',
  'amd!../../../lib/datatables'
], function(AddIn, Dashboard, sprintf, $) {

  var formattedText = new AddIn({
    name: "formattedText",
    label: "Formatted Text",
    defaults: {
      textFormat: function(v, st, opt) {
        return st.colFormat ? sprintf(st.colFormat,v) : v;
      }
    },

    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },

    implementation: function(tgt, st, opt) {
      $(tgt).empty().append(opt.textFormat.call(this, st.value, st, opt));
    }

  });

  Dashboard.registerGlobalAddIn("Table", "colType", formattedText);

  return formattedText;

});
