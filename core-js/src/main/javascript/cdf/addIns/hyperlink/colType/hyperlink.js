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
  '../hyperlinkBase',
  '../../../Dashboard',
  '../../../lib/jquery',
  'amd!../../../lib/datatables',
  'css!./theme/hyperlink'
], function(AddIn, hyperlinkBase, Dashboard, $) {

  var hyperlink = new AddIn($.extend(true, {}, hyperlinkBase, {
    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    }
  }));

  Dashboard.registerGlobalAddIn("Table", "colType", hyperlink);

  return hyperlink;
});
