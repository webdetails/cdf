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
  '../../../lib/jquery',
  'amd!../../../lib/underscore',
  '../../../lib/CCC/tipsy'
], function(AddIn, Dashboard, $, _) {
  var bubble = new AddIn({
    name: "bubble",
    label: "bubble",

    defaults: {
      containerSize: 30,
      radius: function(st) {
        var colNames = _.map(st.data.metadata, function(elem) {
          return elem.colName;
        });
        var colIdx = _.indexOf(colNames, st.id);
        var values = st.data.resultset.map(function(e) {
          return Number(e[colIdx]);
        });

        var tblMax = _.max(values),
            tblMin = _.min(values);
        return ((Number(st.value) - tblMin) / (tblMax - tblMin)) * 100;

      },
      color: function(st) {
        return "rgba(200, 200, 200, 0.6)";
      },
      title: function(st, opt) {
        return "Value: " + st.value;
      },
      cssClass: "bubbleContainer",
      layout: '<div></div>'
    },

    init: function() { },

    implementation: function(tgt, st, opt) {
      var data = st.value,
          options = {},
          key,
          op;

      for(key in opt) if(opt.hasOwnProperty(key)) {
        op = opt[key];
        options[key] = typeof op === 'function' ? op.call(this, st, opt) : op;
      }

      $(tgt)
        .empty()
        .html($(options.layout)
          .addClass(options.cssClass)
          .append($(opt.layout)
            .attr('title', options.title)
            .css({'width': options.radius + "%",
                  'height': options.radius + "%",
                  'border-radius': '100%',
                  'background-color': options.color,
                  'display': 'inline-block',
                  'text-align': 'center',
                  'vertical-align': 'middle'}))
          .css({'width': options.containerSize, 'height': options.containerSize}));
    }
  });

  Dashboard.registerGlobalAddIn("Template", "templateType", bubble);

  return bubble;
});
