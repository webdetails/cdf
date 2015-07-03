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
  '../../../Logger',
  '../../../lib/jquery',
  'amd!../../../lib/datatables',
  'amd!../../../lib/jquery.sparkline',
  'css!./sparkline'],
  function (AddIn, Dashboard, Logger, $) {
  
  var sparkline = new AddIn({

    name: "sparkline",
    label: "Sparkline",
    defaults: {
      type: 'line'
    },    
    init: function() {

      // Register this for datatables sort
      var myself = this;
      $.fn.dataTableExt.oSort[this.name + '-asc'] = function(a, b) {
        return myself.sort(a, b)
      };
      $.fn.dataTableExt.oSort[this.name + '-desc'] = function(a, b) {
        return myself.sort(b, a)
      };
        
    },
    
    sort: function(a, b) {
      return this.sumStrArray(a) - this.sumStrArray(b);
    },
    
    sumStrArray: function(arr) {
      return arr.split(',').reduce(function(prev, curr, index, array) {  
        Logger.log("Current " + curr + "; prev " +  prev); 
        return parseFloat(curr) + (typeof(prev) === 'number' ? prev : parseFloat(prev));
      });
    },
    
    implementation: function(tgt, st, opt) {
      var t = $(tgt);
      var data = st.value.split(/,/);

      // Trim values
      if(opt.trim) {
        if(opt.trim.type == "both" || opt.trim.type == "right") {
          for(var i = data.length - 1; i >= 0; i--) {
            if($.inArray(data[i].trim(), opt.trim.values) !=- 1) {
              data.splice(i, 1);
            }
          }

        }
        if(opt.trim.type=="both"||opt.trim.type=="left") {
          for(var i = 0; i < data.length; i++) {
            if($.inArray(data[i].trim(), opt.trim.values) !=- 1) {
              data.splice(i, 1);
            }
          }
        }
      }
      
      t.sparkline(data, opt);
      t.removeClass("sparkline");
    }
  });

  Dashboard.registerGlobalAddIn("Table", "colType", sparkline);

  return sparkline;

});
