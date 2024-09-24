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
  '../trendArrowBase',
  '../../../Dashboard',
  '../../../dashboard/Sprintf',
  '../../../lib/jquery',
  'amd!../../../lib/datatables',
  'css!./theme/trendArrow'
], function(AddIn, trendArrowBase, Dashboard, sprintf, $) {

  var trendArrow = new AddIn($.extend(true, {}, trendArrowBase, {

    defaults: {
      valueFormat: function(v,format,st, opt) {
        return sprintf(format || "%.1f",v);
      },
      cssClass: 'trend',
      layout: '<div class="trend">&nbsp;</div>'
    },

    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['numeric-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['numeric-desc'];
    }
  }));

  Dashboard.registerGlobalAddIn("Table", "colType", trendArrow);

  return trendArrow;

});
