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
  './XactionComponent.ext',
  '../Logger',
  '../lib/jquery',
  './BaseComponent',
  '../dashboard/Utils'
], function(XactionComponentExt, Logger, $, BaseComponent, Utils) {

  var TimePlotComponent = BaseComponent.extend({

    reset: function() {
      this.timeplot = undefined;
      this.chartDefinition.dateRangeInput = this.InitialDateRangeInput;
      this.listeners = this.InitialListeners;
    },

    update: function() {

      var myself = this;

      var cd = myself.chartDefinition;

      myself.InitialListeners = myself.InitialListeners == undefined
        ? myself.listeners
        : myself.InitialListeners;
      myself.InitialDateRangeInput = myself.InitialDateRangeInput == undefined
        ? cd.dateRangeInput
        : myself.InitialDateRangeInput;

      if(cd.updateOnDateRangeInputChange != true && myself.timeplot!= undefined && cd.dateRangeInput != undefined) {

        if(myself.updateTimeplot != false && myself.timeplot._plots.length > 0) {

          var lastEventPlot = myself.timeplot._plots[myself.timeplot._plots.length -1];
          if(lastEventPlot._id == "eventPlot") {

            lastEventPlot._addSelectEvent(
              myself.dashboard.getParameterValue(myself.startDateParameter) + " 00:00:00",
              myself.dashboard.getParameterValue(myself.endDateParameter) + " 23:59:59",
              lastEventPlot._eventSource,
              "iso8601",
              myself.geometry._earliestDate,
              myself.geometry._latestDate);
          }
        }

        return;

      }

      if(cd.dateRangeInput != undefined && myself.timeplot == undefined) {
        cd.dateRangeInput = myself.dashboard.getComponent(cd.dateRangeInput);
        myself.startDateParameter = cd.dateRangeInput.parameter[0];
        myself.endDateParameter = cd.dateRangeInput.parameter[1];
        myself.listeners = myself.listeners == undefined ? [] : myself.listeners;
        myself.listeners = myself.listeners.concat(myself.startDateParameter).concat(myself.endDateParameter);
      }

      if(typeof Timeplot != "undefined" && myself.dashboard.timePlotColors == undefined) {
        myself.dashboard.timePlotColors = [new Timeplot.Color('#820000'),
        new Timeplot.Color('#13E512'), new Timeplot.Color('#1010E1'),
        new Timeplot.Color('#E532D1'), new Timeplot.Color('#1D2DE1'),
        new Timeplot.Color('#83FC24'), new Timeplot.Color('#A1D2FF'),
        new Timeplot.Color('#73F321')];
      }

      var timePlotTimeGeometry = new Timeplot.DefaultTimeGeometry({
        gridColor: "#000000",
        axisLabelsPlacement: "top",
        gridType: "short",
        yAxisColor: "rgba(255,255,255,0)",
        gridColor: "rgba(100,100,100,1)"
      });

      var timePlotValueGeometry = new Timeplot.DefaultValueGeometry({
        gridColor: "#000000",
        min: 0,
        axisLabelsPlacement: "left",
        gridType: "short",
        valueFormat: function(value) {
          return toFormatedString(value);
        }
      });


      var timePlotEventSource = new Timeplot.DefaultEventSource();
      var eventSource2 = new Timeplot.DefaultEventSource();
      var timePlot;

      if(cd == undefined) {
        Logger.log("Fatal - No chart definition passed","error");
        return;
      }

      // Set default options:
      if(cd.showValues == undefined) {
        cd.showValues = true;
      }

      var cols = Utils.ev(cd['columns']);
      if(cols == undefined || cols.length == 0) {
        Logger.log("Fatal - No 'columns' property passed in chartDefinition", "error");
        return;
      }
      // Write the title
      var title = $('<div></div>');
      if(cd.title != undefined) {
        title.append('<span style="text-transform: lowercase;">' + cd.title + '&nbsp; &nbsp; &nbsp;</span>');
      }

      var plotInfo = [];
      for(var i = 0, j = 0; i < cols.length; i++, j++) {

        j = j > 7 ? 0 : j;
        title.append('<span id="' + myself.name + 'Plot' + i + 'Header" style="color:'
          + myself.dashboard.timePlotColors[j].toHexString() + '">' + cols[i] + ' &nbsp;&nbsp;</span>');

        var plotInfoOpts = {
          id: myself.name + "Plot" + i,
          name: cols[i],
          dataSource: new Timeplot.ColumnSource(timePlotEventSource, i + 1),
          valueGeometry: timePlotValueGeometry,
          timeGeometry: timePlotTimeGeometry,
          lineColor: myself.dashboard.timePlotColors[j],
          showValues: cd.showValues,
          hideZeroToolTipValues: cd.hideZeroToolTipValues != undefined ? cd.hideZeroToolTipValues : false,
          showValuesMode: cd.showValuesMode != undefined ? cd.showValuesMode : "header",
          toolTipFormat: function(value,plot) {
            return plot._name + " = " + toFormatedString(value);
          },
          headerFormat: function(value,plot) {
            return plot._name + " = " + toFormatedString(value) + "&nbsp;&nbsp;";
          }
        };
        if(cd.dots == true) {
          plotInfoOpts.dotColor = myself.dashboard.timePlotColors[j];
        }
        if(cd.fill == true) {
          plotInfoOpts.fillColor = myself.dashboard.timePlotColors[j].transparency(0.5);
        }
        plotInfo.push(new Timeplot.createPlotInfo(plotInfoOpts));

      }


      // support for events
      var eventSource2 = undefined;
      var eventSourcePlot = undefined;
      if(cd.dateRangeInput != undefined || (cd.events && cd.events.show == true)) {
        myself.rangeColor = "00FF00";
        eventSource2 = new Timeplot.DefaultEventSource();
        eventSourcePlot = Timeplot.createPlotInfo({
          id: cd.dateRangeInput != undefined ? "eventPlot" : "events",
          eventSource: eventSource2,
          timeGeometry: timePlotTimeGeometry,
          lineColor: "#FF0000",
          rangeColor: myself.rangeColor,
          getSelectedRegion: function(start, end) {
            myself.updateDateRangeInput(start, end);
          }
        });
        plotInfo.push(eventSourcePlot);
      }

      $("#" + myself.htmlObject).html(title);
      $("#" + myself.htmlObject).append("<div class='timeplot'></div>");

      if(cd.height > 0) {
        $("#" + myself.htmlObject + " > div.timeplot").css("height", cd.height);
      }
      if(cd.width > 0) {
        $("#" + myself.htmlObject + " > div.timeplot").css("width", cd.width);
      }

      timeplot = Timeplot.create($("#" + myself.htmlObject + " > div.timeplot")[0], plotInfo);
      myself.timeplot = timeplot;
      myself.geometry = timePlotTimeGeometry;

      var allData = undefined;

      // check if we should use a data source
      if(typeof cd.dataSource == "string" && cd.dataSource) {
        // merge options, query definition options override options duplicated in the data source
        cd = $.extend({}, this.dashboard.getDataSource(cd.dataSource), cd);
        // remove the data source name from the query definition
        delete cd.dataSource;
      }

      var timePlotEventSourceUrl = XactionComponentExt.getCdfXaction("pentaho-cdf/actions", "timelinefeeder.xaction", null, cd);
      if(cd.events && cd.events.show == true) {
        var eventUrl = XactionComponentExt.getCdfXaction("pentaho-cdf/actions", "timelineeventfeeder.xaction", null, cd.events);
        timeplot.loadText(timePlotEventSourceUrl, ",", timePlotEventSource, null, null, function(range) {
          timeplot.loadJSON(eventUrl, eventSource2, function(data) {
            data.events = myself.filterEvents(data.events, range);
            if(cd.dateRangeInput) {
              var lastEventPlot =  timeplot._plots[timeplot._plots.length - 1];
              if(lastEventPlot._id == "eventPlot") {
                lastEventPlot._addSelectEvent(
                  myself.dashboard.getParameterValue(myself.startDateParameter) + " 00:00:00",
                  myself.dashboard.getParameterValue(myself.endDateParameter) + " 23:59:59",
                  eventSource2,
                  "iso8601",
                  timePlotTimeGeometry._earliestDate,
                  timePlotTimeGeometry._latestDate);
              }
            }
          })
        });
      } else { 
        timeplot.loadText(timePlotEventSourceUrl, ",", timePlotEventSource, null, null, function() {
          if(cd.dateRangeInput) {
            var lastEventPlot =  timeplot._plots[timeplot._plots.length - 1];
            if(lastEventPlot._id == "eventPlot") {
              lastEventPlot._addSelectEvent(
                myself.dashboard.getParameterValue(myself.startDateParameter) + " 00:00:00",
                myself.dashboard.getParameterValue(myself.endDateParameter) + " 23:59:59",
                eventSource2,
                "iso8601",
                timePlotTimeGeometry._earliestDate,
                timePlotTimeGeometry._latestDate);
            }
          }
        });
      }
    },
    filterEvents: function(events, range) {
      var result = [];
      var min = MetaLayer.toDateString(new Date(range.earliestDate));
      var max = MetaLayer.toDateString(new Date(range.latestDate));
      for(i = 0; i < events.length; i++) {
        if(events[i].start >= min && ((events[i].end == undefined && events[i].start <= max) || events[i].end <= max)) {
          result.push(events[i]);
        }
      }
      return result;
    },
    updateDateRangeInput: function(start, end) {
      var toDateString = function(d) {
        var currentMonth = "0" + (d.getMonth() + 1);
        var currentDay = "0" + (d.getDate());
        return d.getFullYear() + "-"
          + (currentMonth.substring(currentMonth.length - 2, currentMonth.length)) + "-"
          + (currentDay.substring(currentDay.length - 2, currentDay.length));
      };
      if(this.chartDefinition.dateRangeInput != undefined) {
        if(start > end){
          var aux = start;
          start = end;
          end = aux;
        }
        this.dashboard.setParameter(this.startDateParameter, toDateString(start));
        this.dashboard.setParameter(this.endDateParameter , toDateString(end));
        this.updateTimeplot = false;
        this.dashboard.update(this.chartDefinition.dateRangeInput);
        this.dashboard.fireChange(this.startDateParameter,toDateString(start));
        this.updateTimeplot = true;
      }
    }
  });

  return TimePlotComponent;

});
