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
  '../sparklineBase',
  '../../../Dashboard',
  'amd!../../../lib/underscore',
  '../../../lib/jquery',
  'css!./theme/sparkline'
], function(AddIn, sparklineBase, Dashboard, _, $) {

  var sparkline = new AddIn($.extend(true, {}, sparklineBase, {

    defaults: {
      type: 'bar'
    },

    getData: function(st, opt) {
      return _.map(st.value.split(','), function(elem) {
        return elem.trim();
      })
    }
  }));

  Dashboard.registerGlobalAddIn("Template", "templateType", sparkline);

  return sparkline;
});
