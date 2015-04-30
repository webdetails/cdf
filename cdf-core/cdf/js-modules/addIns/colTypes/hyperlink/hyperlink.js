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

define([
  '../../../AddIn',
  '../../../Dashboard',
  '../../../lib/jquery',
  'amd!../../../lib/datatables',
  'css!./hyperlink'],
  function(AddIn, Dashboard, $) {
  
  var link = new AddIn({
    name: "hyperlink",
    label: "Hyperlink",
    defaults: {
      openInNewTab: true,
      prependHttpIfNeeded: true,
      regexp: null,
      pattern: null,
      urlReference: 2,
      labelReference: 1
    },
    
    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },
    
    implementation: function(tgt, st, opt) {
      
      var ph = $(tgt);
      var link, label;
      if(opt.pattern) {
        var re = new RegExp(opt.pattern),
          results = re.exec(st.value);
        link = results[opt.urlReference];
        label = results[opt.labelReference];
      } else {
        link = st.value;
        label = st.value;
      }
      if(opt.prependHttpIfNeeded && !/^https?:\/\//.test(link)) {
        link = "http://" + link;
      }
      // is this text an hyperlink? 
      if(opt.regexp == null || (new RegExp(opt.regexp).test(st.value))) {
        var a = $("<a></a>").attr("href", link).addClass("hyperlinkAddIn");
        a.text(label);
        if(opt.openInNewTab) {
          a.attr("target", "_blank");
        }
        ph.empty().append(a);
      }
    }
    
  });

  Dashboard.registerGlobalAddIn("Table", "colType", link);

  return link;

});
