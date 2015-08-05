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
  '../../../dashboard/Sprintf',
  '../../../lib/raphael',
  'amd!../../../lib/underscore',
  '../../../lib/jquery',
  '../../../lib/CCC/protovis-compat!',
  'amd!../../../lib/datatables',
  'css!./dataBar'],
  function(AddIn, Dashboard, sprintf, Raphael, _, $, pv) {

  var dataBar = new AddIn({
    name: "dataBar",
    label: "Data Bar",
    defaults: {
      width: '98%',
      widthRatio: 1,
      height: undefined,
      align: null,
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

      var hasSVG = !!(
         document.createElementNS &&
         document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
        );

      var cell = $(tgt);
      cell.empty();
      var ph = $("<div>&nbsp;</div>").addClass('dataBarContainer').appendTo(cell);
      var wtmp = opt.width || ph.width();
      if (typeof wtmp === 'string') {
        if(!hasSVG) {
          wtmp = ph.width() * opt.widthRatio;
        } else {
          var parsedWidth = parseFloat(wtmp);
          // if we have a widthRatio != 1, we want to apply it to a 100% width
          parsedWidth = ( (opt.widthRatio != 1 && parsedWidth >= 98) ? 100 : parsedWidth ) * opt.widthRatio;
          wtmp = parsedWidth + "%";
        }
      } else {
        wtmp *= opt.widthRatio;
      }
      var htmp = opt.height || ph.height();

      var leftVal = Math.min(val,0),
        rightVal = Math.max(val,0);
      var options = {
              scale: 100,
              wtmp: wtmp,
              htmp: htmp,
              align: opt.align,
              barHeight: 100,
              r: rightVal,
              l: leftVal,
              hasSVG: hasSVG,
              target: ph.get(0),
              processVal: function(val){return val + '%'}
          };
      var c;
      // if we have SVG, and wtmp is a string, so probably a percentage width, will use percentage calculations
      if (hasSVG && typeof wtmp === 'string') {
        c = this.drawPaper(min, max, options);
      } else {
        // falling back to the default
        options.processVal = function(val){return val};
        options.scale = wtmp;
        options.barHeight = htmp;
        c = this.drawPaper(min, max, options);
      }

      c.attr({
        fill: opt.backgroundImage ? "url('" + opt.backgroundImage + "')" : "90-" + opt.startColor + "-" + opt.endColor,
        stroke: opt.stroke,
        title: "Value: " + st.value
      });

      if(opt.includeValue) {
        var valueStr = opt.valueFormat(st.value, st.colFormat, st, opt);
        var valph = $("<span></span>").addClass('value');
        valph.append(valueStr);
        if ( hasSVG && opt.align == "right") {
          valph.addClass('alignRight').appendTo(ph);
          ph.find("svg").css('float', 'right');
        } else {
          valph.prependTo(ph);
        }
      }
    },
    drawPaper: function(min, max, opts) {
      // xx = x axis
      var xx = pv.Scale.linear(min,max).range(0, opts.scale);

      var paper = Raphael(opts.target, opts.wtmp , opts.htmp);
      if(opts.hasSVG && opts.align == "right") {
        return paper.rect( opts.processVal(xx(max) - xx(opts.r)), opts.processVal(0),
          opts.processVal(xx(opts.r) - xx(opts.l)), opts.processVal(opts.barHeight));
      }
      return paper.rect(opts.processVal(xx(opts.l)), opts.processVal(0),
        opts.processVal(xx(opts.r) - xx(opts.l)), opts.processVal(opts.barHeight));
    }
  });

  Dashboard.registerGlobalAddIn("Table", "colType", dataBar);

  return dataBar;

});
