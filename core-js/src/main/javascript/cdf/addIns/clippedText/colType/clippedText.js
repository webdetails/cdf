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
  '../clippedTextBase',
  '../../../Dashboard',
  '../../../lib/jquery',
  'amd!../../../lib/datatables',
  'css!./theme/clippedText'
], function(AddIn, clippedTextBase, Dashboard, $) {

  var clippedText = new AddIn($.extend(true, {}, clippedTextBase, {
    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    }
  }));

  Dashboard.registerGlobalAddIn("Table", "colType", clippedText);

  return clippedText;

});
