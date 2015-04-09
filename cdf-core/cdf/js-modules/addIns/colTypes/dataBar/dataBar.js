/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define([
  '../../../AddIn',
  '../../../Dashboard',
  '../../../dashboard/Sprintf',
  '../../../lib/raphael',
  'amd!../../../lib/underscore',
  '../../../lib/jquery',
  '../../../lib/CCC/protovis',
  '../../../lib/CCC/protovis-msie',
  'amd!../../../lib/datatables',
  'css!./dataBar'],
  function(AddIn, Dashboard, sprintf, Raphael, _, $, pv) {
  
  var dataBar = new AddIn({
    name: "dataBar",
    label: "Data Bar",
    defaults: {
      width: undefined,
      widthRatio: 1,
      height: undefined,
      startColor: "#55A4D6",
      endColor: "#448FC8",
      backgroundImage: undefined,
      stroke: null,
      max: undefined,
      min: undefined,
      includeValue: false,
      absValue: true,
      valueFormat: function(v, format, st, opt) {
        return "" + sprintf(format || "%.1f", v);
      }
    },
    init: function() {
      $.fn.dataTableExt.oSort[this.name+'-asc'] = $.fn.dataTableExt.oSort['numeric-asc'];
      $.fn.dataTableExt.oSort[this.name+'-desc'] = $.fn.dataTableExt.oSort['numeric-desc'];
    },
    implementation: function(tgt, st, opt) {
      var tblMax = Math.max.apply(Math,st.tableData.map(function(e){
                               return e[st.colIdx];
                             })),
          tblMin = Math.min.apply(Math,st.tableData.map(function(e){
                               return e[st.colIdx];
                             }));

      var optMax = parseFloat(opt.max);
      var optMin = parseFloat(opt.min);

      var isValidNumber = function(nr) {
        return _.isNumber(nr) && isFinite(nr);
      };

      var validMaxValue = isValidNumber(optMax);
      var validMinValue = isValidNumber(optMin);

      if(opt.absValue) {
        var max = (validMaxValue == true) ? optMax : Math.max(Math.abs(tblMax), Math.abs(tblMin)),
            min = (validMinValue == true) ? optMin : 0,
            val = Math.abs(parseFloat(st.value));
            min = Math.max(min,0);
      } else {
        var max = (validMaxValue == true) ? optMax : Math.max(0, tblMax),
            min = (validMinValue == true) ? optMin : Math.min(0, tblMin),
            val = parseFloat(st.value);
      }

      var cell = $(tgt);
      cell.empty(); 
      var ph = $("<div>&nbsp;</div>").addClass('dataBarContainer').appendTo(cell);
      var wtmp = opt.width || ph.width();
      wtmp *= opt.widthRatio;
      var htmp = opt.height || ph.height();       
    
      var leftVal = Math.min(val,0),
        rightVal = Math.max(val,0);

      // xx = x axis
      var xx = pv.Scale.linear(min,max).range(0, wtmp); 
      
      var paperSize = xx(Math.min(rightVal,max)) - xx(min);
      paperSize = (paperSize > 1) ? paperSize : 1;
      var paper = Raphael(ph.get(0), paperSize , htmp);
      var c = paper.rect(xx(leftVal), 0, xx(rightVal) - xx(leftVal), htmp);
    
      c.attr({
        fill: opt.backgroundImage ? "url('" + opt.backgroundImage + "')" : "90-" + opt.startColor + "-" + opt.endColor,
        stroke: opt.stroke,
        title: "Value: " + st.value
      });

      if(opt.includeValue) {
        var valph = $("<span></span>").addClass('value').append(opt.valueFormat(st.value, st.colFormat, st, opt));
        valph.appendTo(ph);
      }
    }
  });

  Dashboard.registerGlobalAddIn("Table", "colType", dataBar);

  return dataBar;

});
