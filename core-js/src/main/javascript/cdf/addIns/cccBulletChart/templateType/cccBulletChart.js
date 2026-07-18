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
  '../../../lib/jquery'
], function(AddIn, cccBulletChartBase, Dashboard, $) {

  var cccBulletChart = new AddIn($.extend(true, {}, cccBulletChartBase, {
    defaults: {
      chartOptions: {
        compatVersion: 2,
        height: 60,
        bulletTitle: "",
        extensionPoints: {
          "bulletMarker_shape": "circle",
          "bulletTitle_textStyle": "#fff",
          "bulletMeasure_fillStyle": "#666"
        }
      }
    }
  }));

  Dashboard.registerGlobalAddIn("Template", "templateType", cccBulletChart);

  return cccBulletChart;
});
