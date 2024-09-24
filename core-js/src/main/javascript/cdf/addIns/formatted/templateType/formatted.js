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
  '../../../Dashboard',
  '../../../dashboard/Utils',
  '../../../lib/jquery'
], function(AddIn, Dashboard, Utils, $) {

  var formatted = new AddIn({
    name: "formatted",
    label: "Formatted Value",

    defaults: {
      formatFunction: 'numberFormat',
      formatMask: '#,#.#',
      applyFormat: function(value) {
        return typeof Utils[this.formatFunction] === "function"
          ? Utils[this.formatFunction](value, this.formatMask)
          : value;
      },
      cssClass: 'formatterContainer',
      layout: '<div></div>'
    },

    init: function() { },

    implementation: function(tgt, st, opt) {
      var data = typeof opt.applyFormat === "function"
        ? opt.applyFormat(st.value)
        : st.value;

      $(tgt).empty().html($(opt.layout).append(data).addClass(opt.cssClass));
    }
  });

  Dashboard.registerGlobalAddIn("Template", "templateType", formatted);

  return formatted;
});
