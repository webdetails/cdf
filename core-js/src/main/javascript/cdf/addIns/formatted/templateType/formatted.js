/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

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
