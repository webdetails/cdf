/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/



define([
  '../../../AddIn',
  '../cccBulletChartBase',
  '../../../Dashboard',
  '../../../lib/jquery',
  'amd!../../../lib/datatables'
], function(AddIn, cccBulletChartBase, Dashboard, $) {

  var cccBulletChart = new AddIn($.extend(true, {}, cccBulletChartBase, {

    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    }
  }));

  Dashboard.registerGlobalAddIn("Table", "colType", cccBulletChart);

  return cccBulletChart;
});
