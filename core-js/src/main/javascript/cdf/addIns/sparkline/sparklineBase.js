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
  '../../lib/jquery',
  'amd!../../lib/jquery.sparkline'
], function($) {

  return {

    name: "sparkline",
    label: "Sparkline",
    defaults: {
      type: 'line',
      cssClass: 'sparklineContainer',
      layout: '<div></div>'
    },

    init: function() { },

    implementation: function(tgt, st, opt) {
      $(tgt).sparkline(this.getData(st, opt), opt)
            .removeClass("sparkline")
            .addClass(opt.cssClass);
    },

    getData: function(st, opt) {
      return st.value;
    }
  };
});
