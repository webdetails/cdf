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
  '../../../Logger',
  '../../../lib/jquery',
  '../../../lib/CCC/protovis-compat!',
  'amd!../../../lib/datatables'
], function (AddIn, Dashboard, Logger, $, pv) {

  var pvSparkline = new AddIn({
    name: "pvSparkline",
    label: "Protovis Sparkline",
    defaults: {
      height: 10,
      strokeStyle: "#000",
      lineWidth: 1,
      width: undefined,
      canvasMargin: 2
    },
    init: function() {

      // Register this for datatables sort
      var myself = this;
      $.fn.dataTableExt.oSort[this.name + '-asc'] = function(a, b) {
        return myself.sort(a, b);
      };
      $.fn.dataTableExt.oSort[this.name + '-desc'] = function(a, b) {
        return myself.sort(b, a);
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
      var ph = $(tgt),
          sparklineData = st.value,
          data = sparklineData.split(",");

      // Trim values
      if(opt.trim) {
        if(opt.trim.type == "both" || opt.trim.type == "right") {
          for(var i = data.length - 1; i >= 0; i--) {
            if($.inArray(data[i].trim(), opt.trim.values) !=-1 ) {
              data.splice(i, 1);
            }
          }

        }
        if(opt.trim.type == "both" || opt.trim.type == "left") {
          for(var i = 0; i < data.length; i++) {
            if($.inArray(data[i].trim(), opt.trim.values) != -1) {
              data.splice(i, 1);
            }
          }
        }
      }

      var n = data.length,
          w = opt.width || ph.width() - opt.canvasMargin * 2,
          h = opt.height,
          min = pv.min.index(data),
          max = pv.max.index(data);

      ph.empty();

      var container = $("<div></div>").appendTo(ph);

      var vis = new pv.Panel().canvas(container.get(0))
                              .width(w)
                              .height(h)
                              .margin(opt.canvasMargin);

      vis.add(pv.Line)
         .data(data)
         .left(pv.Scale.linear(0, n - 1).range(0, w).by(pv.index))
         .bottom(pv.Scale.linear(data).range(0, h))
         .strokeStyle(opt.strokeStyle)
         .lineWidth(opt.lineWidth)
         .render();
    }
  });

  Dashboard.registerGlobalAddIn("Table", "colType", pvSparkline);

  return pvSparkline;

});
