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
  '../../../lib/jquery',
  'css!./theme/trendArrow'
], function(AddIn, trendArrowBase, Dashboard, $) {

  var trendArrow = new AddIn($.extend(true, {}, trendArrowBase, {

    defaults: {
      cssClass: 'arrow',
      layout: '<div><div class="arrow"></div></div>'
    }
  }));

  Dashboard.registerGlobalAddIn("Template", "templateType", trendArrow);

  return trendArrow;

});
