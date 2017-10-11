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
  '../trendArrowBase',
  '../../../Dashboard',
  '../../../dashboard/Sprintf',
  '../../../lib/jquery',
  'amd!../../../lib/datatables',
  'css!./trendArrow'
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
