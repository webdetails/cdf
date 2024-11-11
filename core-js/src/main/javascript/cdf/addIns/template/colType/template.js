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
  '../templateBase',
  '../../../Dashboard',
  'amd!../../../lib/datatables'
], function(AddIn, templateBase, Dashboard, $) {

  var template = new AddIn($.extend(true, {}, templateBase, {

    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    }
  }));

  Dashboard.registerGlobalAddIn("Table", "colType", template);

  return template;

});
