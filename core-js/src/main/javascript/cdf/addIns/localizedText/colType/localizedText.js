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
  '../localizedTextBase',
  '../../../Dashboard',
  '../../../lib/jquery',
  'amd!../../../lib/datatables'
], function(AddIn, localizedTextBase, Dashboard, $) {

  var localizedText = new AddIn($.extend(true, {}, localizedTextBase, {

    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },

    // set text and related content
    setText: function(text, tgt, opts) {
      $(tgt).empty().append(text);
      //change data, too, in order for search and sorting to work correctly on the localized text
      st.tableData[st.rowIdx][st.colIdx] = text;
    }
  }));

  Dashboard.registerGlobalAddIn("Table", "colType", localizedText);

  return localizedText;

});
