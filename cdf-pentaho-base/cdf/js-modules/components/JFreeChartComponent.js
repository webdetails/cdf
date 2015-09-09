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
  './JFreeChartComponent.ext',
  '../dashboard/Dashboard.ext',
  '../dashboard/Utils',
  '../Logger',
  '../lib/jquery',
  './BaseComponent',
  'amd!../lib/captify',
  'css!./JFreeChartComponent'
], function(JFreeChartComponentExt, DashboardExt, Utils, Logger, $, BaseComponent) {

  var JFreeChartComponent = BaseComponent.extend({
    update: function() {
      var xactionFile = (this.dashboard.detectQueryType(this.chartDefinition) == 'cda') ? "jfreechart-cda.xaction" : "jfreechart.xaction";
      this.callPentahoAction(xactionFile);
    },

    getParameters: function() {

      var cd = this.chartDefinition;
      // Merge the stuff with a chartOptions element
      if(cd == undefined) {
        Logger.log("Fatal - No chartDefinition passed","error");
        return;
      }

      // If the user filled titleKey get the title value from language files
      if(typeof cd.titleKey !== "undefined" && typeof this.dashboard.i18nSupport !== "undefined" && this.dashboard.i18nSupport != null) {
        cd.title = this.dashboard.i18nSupport.prop(cd.titleKey);
      }

      //set parameters string if using cda
      var cdaParameterString = null;
      if(this.dashboard.detectQueryType(cd) == "cda") {
        if($.isArray(this.parameters)) {
          var param;
          for(var i = 0; i < this.parameters.length; i++) {
            param = this.parameters[i];
            if($.isArray(param) && param.length >= 2) {
              var name = param[0];
              var value = param[1]; //TODO: in pho dashboard designer static parameters may be in the form [["name", "", "value" ] ... ]

              if(value) {
                value = Utils.doCsvQuoting(value, '='); //quote if needed for '='
              }
              if(i == 0) {
                cdaParameterString = "";
              } else {
                cdaParameterString += ";";
              }

              cdaParameterString += Utils.doCsvQuoting(name + "=" + value, ';'); //re-quote for ';'
            }
          }
        }
      }

      // check if we should use a data source
      if(typeof cd.dataSource == "string" && cd.dataSource) {
        // merge options, query definition options override options duplicated in the data source
        cd = $.extend({}, this.dashboard.getDataSource(cd.dataSource), cd);
        // remove the data source name from the query definition
        delete cd.dataSource;
      }

      var cd0 = cd.chartOptions != undefined ? $.extend({}, Utils.ev(cd.chartOptions), cd) : cd;

      // go through parameters array and update values
      var parameters = [];
      for(var p in cd0) if(cd0.hasOwnProperty(p)) {
        var key = p;
        var value = Utils.ev(cd0[p]);
        // alert("key: " + key + "; Value: " + value);
        parameters.push([key, value]);
      }
      if(cdaParameterString != null) {
        parameters.push(["cdaParameterString", cdaParameterString]);
      }

      return parameters;

    },

    callPentahoAction: function(action) {
      // increment runningCalls
      var myself = this;

      myself.dashboard.incrementRunningCalls();

      // callback async mode
      myself.dashboard.callPentahoAction(myself, "system", "pentaho-cdf/actions", action, myself.getParameters(), function(jXML) {

        if(jXML != null) {
          if(myself.chartDefinition.caption != undefined) {
            myself.buildCaptionWrapper($(jXML.find("ExecuteActivityResponse:first-child").text()), action);
          } else {
            $('#' + myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
          }
        }
        myself.dashboard.decrementRunningCalls();

      });
    },

    buildCaptionWrapper: function(chart, cdfComponent) {

      var myself = this;

      var exportFile = function(type, cd) {
        var xactionFile = (myself.dashboard.detectQueryType(cd) == 'cda') ? "jtable-cda.xaction" : "jtable.xaction";
        var obj = $.extend({
          solution: "system",
          path: "pentaho-cdf/actions",
          action: xactionFile,
          exportType: type
        }, cd);
        Utils.post(DashboardExt.getExport(), obj);
      };

      var cd = myself.chartDefinition;
      var captionOptions = $.extend(JFreeChartComponentExt.getCaption(cd, myself, exportFile, cdfComponent), cd.caption);

      var captionId = myself.htmlObject + 'caption';
      var caption = $('<div id="' + captionId + '" ></div>');

      chart.attr("id", myself.htmlObject + 'image');
      chart.attr("rel", myself.htmlObject + "caption");
      chart.attr("class", "captify");

      for(var o in captionOptions) if(captionOptions.hasOwnProperty(o)) {
        var show = captionOptions[o].show == undefined || Utils.ev(captionOptions[o].show) ? true : false;

        if(myself.dashboard.detectQueryType(myself.chartDefinition) != "mdx" && captionOptions[o].title == "Details") {
          show = false;
        }
        if(show) {
          var icon = captionOptions[o].icon != undefined 
            ? (Utils.ev(captionOptions[o].icon))
            : undefined;
          
          var op = icon != undefined
            ? $('<div id ="' + captionId + o + '" class=" img ' + icon + '"></div>') 
            : $('<span id ="' + captionId + o + '">' + captionOptions[o].title + '</span>');

          if(captionOptions[o].oclass != undefined) {
            op.addClass(captionOptions[o].oclass);
          }
          op.attr("title", captionOptions[o].title);
          caption.append(op);
        }
      }

      $("#" + myself.htmlObject).empty();

      var bDetails = $('<div class="caption-details">Details</div>');
      $("#" + myself.htmlObject).append(bDetails);
      $("#" + myself.htmlObject).append(chart);
      $("#" + myself.htmlObject).append(caption);


      $('img.captify').captify($.extend({
        bDetails:bDetails,
        spanWidth: '95%',
        hideDelay: 3000,
        hasButton: false,
        opacity: '0.5'
      }, cd.caption));

      //Add events after captify has finished.
      bDetails.one('capityFinished',function(e,wrapper) {
        var chartOffset = chart.offset();
        var bDetailsOffset = bDetails.offset();

        if(chart.length > 1) {
          bDetails.bind("mouseenter",function() {
            $("#" + myself.htmlObject + 'image').trigger('detailsClick',[this]);
          });
          bDetails.css("left", bDetails.position().left + $(chart[1]).width() - bDetails.width() - 5);
          bDetails.css("top", bDetails.position().top + $(chart[1]).height() - bDetails.height());
          // Use UNIQUE ids (chart[0] vs chart[1])
          chart[0].id = chart[0].id + "Map";
        }

        for(var o in captionOptions) if(captionOptions.hasOwnProperty(o)) {
          if(captionOptions[o].callback != undefined) {
            $("#" + captionId + o).bind("click", captionOptions[o].callback);
          }
        }
      });

    }

  });

  return JFreeChartComponent;

});
