/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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

/* TODO requirejs: Review usage of dashboard.i18nSupport in localizedText addin
   (reference to component or dashboard needs to be passed as a parameter to localizedText's implementation function) */

define([
  '../../../AddIn',
  '../../../Dashboard',
  '../../../lib/jquery',
  'amd!../../../lib/datatables'],
  function(AddIn, Dashboard, $) {
  
  var localizedText = new AddIn({
    name: "localizedText",
    label: "Localized Text",
    defaults: {
      localize: function(v, st, opt) { return dashboard.i18nSupport.prop(v); }
    },

    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },
    
    implementation: function(tgt, st, opt) {
      if(typeof dashboard.i18nSupport !== "undefined" && dashboard.i18nSupport != null) {
        var text = this.defaults.localize(st.value, st, opt) ;
        $(tgt).empty().append(text);
        //change data, too, in order for search and sorting to work correctly on the localized text
        st.tableData[st.rowIdx][st.colIdx] = text;
      }
    }
  });

  Dashboard.registerGlobalAddIn("Table", "colType", localizedText);

  return localizedText;

});
