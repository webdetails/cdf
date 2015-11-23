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

var JFreeChartComponent = BaseComponent.extend({
  update : function() {
    var xactionFile = (this.chartDefinition.queryType == 'cda') ? "jfreechart-cda.xaction" : "jfreechart.xaction";
    this.callPentahoAction(xactionFile);
  },

  getParameters: function() {

    var cd = this.chartDefinition;
    // Merge the stuff with a chartOptions element
    if(cd == undefined){
      Dashboards.log("Fatal - No chartDefinition passed","error");
      return;
    }

    // If the user filled titleKey get the title value from language files
    if(typeof cd.titleKey !== "undefined" && typeof Dashboards.i18nSupport !== "undefined" && Dashboards.i18nSupport != null) {
      cd.title = Dashboards.i18nSupport.prop(cd.titleKey);
    }

    //set parameters string if using cda
    var cdaParameterString = null;
    if(cd.queryType == "cda") {
      if ($.isArray(this.parameters)) {
        var param;
        for(var i = 0; i < this.parameters.length; i++) {
          param = this.parameters[i];
          if($.isArray(param) && param.length >= 2) {
            var name = param[0];
            var value = param[1]; //TODO: in pho dashboard designer static parameters may be in the form [["name", "", "value" ] ... ]

            if(value){
              value = doCsvQuoting(value, '=');	//quote if needed for '='
            }
            if(i == 0) {
              cdaParameterString = "";
            } else {
              cdaParameterString += ";";
            }

            cdaParameterString += doCsvQuoting(name + "=" + value, ';'); //re-quote for ';'
          }
        }
      }
    }

    var cd0 = cd.chartOptions != undefined ? $.extend({},Dashboards.ev(cd.chartOptions), cd) : cd;

    // go through parameters array and update values
    var parameters = [];
    for(p in cd0) {
      var key = p;
      var value = typeof cd0[p]=='function'?cd0[p]():cd0[p];
      // alert("key: " + key + "; Value: " + value);
      parameters.push([key,value]);
    }
    if(cdaParameterString != null) {
      parameters.push(["cdaParameterString", cdaParameterString]);
    }

    return parameters;

  },

  callPentahoAction: function(action) {
    // increment runningCalls
    var myself = this;

    Dashboards.incrementRunningCalls();

    // callback async mode
    Dashboards.callPentahoAction(myself,"system", "pentaho-cdf/actions", action, myself.getParameters(), function(jXML) {

      if(jXML != null) {
        if(myself.chartDefinition.caption != undefined) {
          myself.buildCaptionWrapper($(jXML.find("ExecuteActivityResponse:first-child").text()),action);
        } else {
          $('#' + myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
        }
      }
      Dashboards.decrementRunningCalls();

    });
  },

  buildCaptionWrapper: function(chart, cdfComponent) {

    var exportFile = function(type, cd) {
      var xactionFile = (cd.queryType == 'cda')? "jtable-cda.xaction" : "jtable.xaction";
      var obj = $.extend({
        solution: "system",
        path: "pentaho-cdf/actions",
        action: xactionFile,
        exportType: type
      },cd);
      Dashboards.post(wd.cdf.endpoints.getExport() ,obj);
    };

    var myself = this;
    var cd = myself.chartDefinition;
    var captionOptions = $.extend(wd.helpers.jfreechartHelper.getCaption(cd, myself, exportFile, cdfComponent), cd.caption);

    var captionId = myself.htmlObject + 'caption';
    var caption = $('<div id="' + captionId + '" ></div>');

    chart.attr("id",myself.htmlObject + 'image');
    chart.attr("rel",myself.htmlObject + "caption");
    chart.attr("class","captify");

    for(o in captionOptions) {
      var show = captionOptions[o].show == undefined || (typeof captionOptions[o].show == 'function' ? captionOptions[o].show() : captionOptions[o].show) ? true : false;

      if (this.chartDefinition.queryType != "mdx" && captionOptions[o].title == "Details") {
        show = false;
      };
      if(show) {
        var icon = captionOptions[o].icon != undefined ? (typeof captionOptions[o].icon == 'function' ? captionOptions[o].icon() : captionOptions[o].icon) : undefined;
        
        var op = icon != undefined ? $('<div id ="' + captionId + o + '" class=" img ' + icon + '"></div>') : $('<span id ="' + captionId + o + '">' + captionOptions[o].title  +'</span>');
        if(captionOptions[o].oclass != undefined) {
          op.addClass(captionOptions[o].oclass);
        }
        op.attr("title",captionOptions[o].title);
        caption.append(op);
      }
    };

    $("#" + myself.htmlObject).empty();

    var bDetails = $('<div class="caption-details">Details</div>');
    $("#" + myself.htmlObject).append(bDetails);
    $("#" + myself.htmlObject).append(chart);
    $("#" + myself.htmlObject).append(caption);


    $('img.captify').captify($.extend({
      bDetails:bDetails,
      spanWidth: '95%',
      hideDelay:3000,
      hasButton:false,
      opacity:'0.5'
    }, cd.caption));

    //Add events after captify has finished.
    bDetails.one('capityFinished',function(e, wrapper) {
      var chartOffset = chart.offset();
      var bDetailsOffset = bDetails.offset();
      if(chart.length > 1) {
        bDetails.bind("mouseenter",function() {
          $("#" + myself.htmlObject + 'image').trigger('detailsClick',[this]);
        });
        bDetails.css("left",bDetails.position().left + $(chart[1]).width() - bDetails.width() - 5);
        bDetails.css("top",bDetails.position().top + $(chart[1]).height() - bDetails.height());
        // Use UNIQUE ids (chart[0] vs chart[1])
        chart[0].id = chart[0].id + "Map";

      }
      for(o in captionOptions) {
        if(captionOptions[o].callback != undefined) {
          $("#" + captionId + o).bind("click",captionOptions[o].callback);
        }
      }
    });

  }

});

var DialComponent = JFreeChartComponent.extend({

  update : function() {

    var cd = this.chartDefinition;
    if(cd == undefined) {
      Dashboards.log("Fatal - No chartDefinition passed","error");
      return;
    }
    
    cd.chartType = 'DialChart';

    var intervals = cd.intervals;

    var colors = cd.colors;
    if(colors != undefined && intervals.length != colors.length) {
      Dashboards.log("Fatal - Number of intervals differs from number of colors", "error");
      return;
    }

    this.callPentahoAction(cd.queryType == 'cda' ? "jfreechartdial-cda.xaction" : "jfreechartdial.xaction");

  }
  
});

var OpenFlashChartComponent = JFreeChartComponent.extend({

  callPentahoAction: function() {

    Dashboards.incrementRunningCalls();

    var myself = this;

    Dashboards.callPentahoAction(myself,"system", "pentaho-cdf/actions", "openflashchart.xaction", this.getParameters(),function(jXML) {

      if(jXML != null) {
        var result = wd.helpers.jfreechartHelper.getOpenFlashChart(jXML.find("ExecuteActivityResponse:first-child").text());
        getDataFuntion = result.match(/getData.*\(\)/gi);
        $("#"+myself.htmlObject).html(result);
      }
      Dashboards.decrementRunningCalls();

    });

    OpenFlashChartComponent.prototype.onClick = function(value) {
      if(getDataFuntion != null && myself.chartDefinition.urlTemplate != undefined && myself.chartDefinition.parameterName != undefined) {
        myself.data = myself.data != undefined ? myself.data : eval('(' + eval(getDataFuntion[0]) + ')');
        if(myself.data.x_axis != undefined) {
          var urlTemplate = myself.chartDefinition.urlTemplate.replace("{" + myself.chartDefinition.parameterName + "}",myself.data.x_axis.labels.labels[value]);
          eval(urlTemplate);
        }

      }
    };

  }

});

var TrafficComponent = UnmanagedComponent.extend({
  trafficLight: function(result, xaction) {
    var cd = this.trafficDefinition;
    var value; 
    if(xaction) {
      value = $(result).find("VALUE").text();
    } else {
      value = result[0][0];
    }
    var greenClass = "img trafficGreen", yellowClass = "img trafficYellow", redClass = "img trafficRed";
    var i = $("<div>").attr( "class", (value <= cd.intervals[0] ? redClass : (value >= cd.intervals[1] ? greenClass : yellowClass)));
    var $htmlObject = $('#' + this.htmlObject);
    $htmlObject.html(i);
    if(cd.showValue != undefined && cd.showValue == true) {
      var tooltip = "Value: " + value + " <br />" +
        "<div align='middle' class='" + redClass + "'/> &le; "  + cd.intervals[0] + " &lt; " +
        "<div align='middle' class='" + yellowClass + "'/> &lt; " + cd.intervals[1] + " &le; " +
        "<div align='middle' class='" + greenClass + "'/>" +
        (tooltip != undefined ? "<br/>" + tooltip : "");
      if($htmlObject.tooltip.Constructor) { //hack to know if we should use bootstrap's tooltip or jquery's
        $htmlObject.tooltip({
          delay: 0,
          html: true,
          title: tooltip,
          placement: "auto top"
        });
      } else {
        $htmlObject.tooltip({
          delay: 0,
          track: true,
          fade: 250,
          content: tooltip
        });
        $htmlObject.attr("title", tooltip);
      }
    }
  },
  doQuery: function() {
    var cd = this.trafficDefinition;
    if(cd.path && cd.dataAccessId) {
      var handler = _.bind(function(data) {
        var filtered;
        if(this.valueAsId) {
          filtered = data.resultset.map(function(e) {
            return [e[0], e[0]];
          });
        } else {
          filtered = data.resultset;
        }
        this.trafficLight(filtered);
      },this);
      this.triggerQuery(cd, handler);
    } else {
       // go through parameter array and update values
      var parameters = [];
      for(p in cd) {
        var key = p;
        var value = typeof cd[p] == 'function' ? cd[p]() : cd[p];
        parameters.push([key,value]);
      }
      var myself = this;
      var handler = _.bind(function() {
        Dashboards.callPentahoAction(
          myself,
          "system",
          "pentaho-cdf/actions",
          "traffic.xaction",
          parameters,
          function(result) {
            myself.trafficLight(result, true);
          });
      },this);
      this.synchronous(handler);
    }
  },
  update: function() {
    var cd = this.trafficDefinition;
    if(cd == undefined) {
      Dashboards.log("Fatal - No trafficDefinition passed", "error");
      return;
    }
    var intervals = cd.intervals;
    if(intervals == undefined) {
      cd.intervals = [-1, 1];
    }
    this.doQuery();    
  }
});

var TimePlotComponent = BaseComponent.extend({

  reset: function() {
    this.timeplot = undefined;
    this.chartDefinition.dateRangeInput = this.InitialDateRangeInput;
    this.listeners = this.InitialListeners;
  },

  update : function() {

    var myself = this;

    var cd = myself.chartDefinition;

    myself.InitialListeners = myself.InitialListeners == undefined ? myself.listeners : myself.InitialListeners;
    myself.InitialDateRangeInput = myself.InitialDateRangeInput == undefined ? cd.dateRangeInput : myself.InitialDateRangeInput;

    if(cd.updateOnDateRangeInputChange != true && myself.timeplot!= undefined && cd.dateRangeInput != undefined) {

      if(myself.updateTimeplot != false && myself.timeplot._plots.length > 0) {

        var lastEventPlot = myself.timeplot._plots[myself.timeplot._plots.length -1];
        if(lastEventPlot._id == "eventPlot") {
          lastEventPlot._addSelectEvent(
            Dashboards.getParameterValue(myself.startDateParameter) + " 00:00:00",
            Dashboards.getParameterValue(myself.endDateParameter) + " 23:59:59",
            lastEventPlot._eventSource,
            "iso8601",
            myself.geometry._earliestDate,
            myself.geometry._latestDate);
        }
      }

      return;

    }


    if(cd.dateRangeInput != undefined && myself.timeplot == undefined) {
      cd.dateRangeInput = Dashboards.getComponent(cd.dateRangeInput);
      myself.startDateParameter = cd.dateRangeInput.parameter[0];
      myself.endDateParameter = cd.dateRangeInput.parameter[1];
      myself.listeners = myself.listeners == undefined ? [] : myself.listeners;
      myself.listeners = myself.listeners.concat(myself.startDateParameter).concat(myself.endDateParameter);
    }

    if(typeof Timeplot != "undefined" && Dashboards.timePlotColors == undefined) {
      Dashboards.timePlotColors = [new Timeplot.Color('#820000'),
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
      valueFormat : function (value){
        return toFormatedString(value);
      }
    });


    var timePlotEventSource = new Timeplot.DefaultEventSource();
    var eventSource2 = new Timeplot.DefaultEventSource();
    var timePlot;

    if(cd == undefined) {
      Dashboards.log("Fatal - No chart definition passed","error");
      return;
    }

    // Set default options:
    if(cd.showValues == undefined) {
      cd.showValues = true;
    }


    var cols = typeof cd['columns']=='function'?cd['columns']():cd['columns'];
    if(cols == undefined || cols.length == 0) {
      Dashboards.log("Fatal - No 'columns' property passed in chartDefinition","error");
      return;
    }
    // Write the title
    var title = $('<div></div>');
    if(cd.title != undefined) {
      title.append('<span style="text-transform: lowercase;">' + cd.title + '&nbsp; &nbsp; &nbsp;</span>');
    }

    var plotInfo = [];
    for(var i = 0,j=0; i<cols.length; i++,j++) {

      j = j > 7 ? 0 : j;
      title.append('<span id="' + myself.name + 'Plot' + i + 'Header" style="color:' + Dashboards.timePlotColors[j].toHexString() + '">' + cols[i] + ' &nbsp;&nbsp;</span>');

      var plotInfoOpts = {
        id: myself.name + "Plot" + i,
        name: cols[i],
        dataSource: new Timeplot.ColumnSource(timePlotEventSource,i + 1),
        valueGeometry: timePlotValueGeometry,
        timeGeometry: timePlotTimeGeometry,
        lineColor: Dashboards.timePlotColors[j],
        showValues: cd.showValues,
        hideZeroToolTipValues: cd.hideZeroToolTipValues != undefined ? cd.hideZeroToolTipValues : false,
        showValuesMode: cd.showValuesMode != undefined ? cd.showValuesMode : "header",
        toolTipFormat: function (value,plot) {
          return plot._name + " = " + toFormatedString(value);
        },
        headerFormat: function (value,plot) {
          return plot._name + " = " + toFormatedString(value) + "&nbsp;&nbsp;";
        }
      };
      if(cd.dots == true) {
        plotInfoOpts.dotColor = Dashboards.timePlotColors[j];
      }
      if(cd.fill == true) {
        plotInfoOpts.fillColor = Dashboards.timePlotColors[j].transparency(0.5);
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
      $("#" + myself.htmlObject + " > div.timeplot").css("height",cd.height);
    }
    if(cd.width > 0) {
      $("#" + myself.htmlObject + " > div.timeplot").css("width",cd.width);
    }

    timeplot = Timeplot.create($("#" + myself.htmlObject + " > div.timeplot")[0], plotInfo);
    myself.timeplot = timeplot;
    myself.geometry = timePlotTimeGeometry;

    var allData = undefined;
    var timePlotEventSourceUrl = wd.cdf.endpoints.getCdfXaction("pentaho-cdf/actions", "timelinefeeder.xaction", null, cd);
    if(cd.events && cd.events.show == true) {
      var eventUrl = wd.cdf.endpoints.getCdfXaction("pentaho-cdf/actions", "timelineeventfeeder.xaction", null, cd.events);
      timeplot.loadText(timePlotEventSourceUrl,",", timePlotEventSource, null,null,function(range){
        timeplot.loadJSON(eventUrl,eventSource2,function(data){
          data.events = myself.filterEvents(data.events, range);
          if(cd.dateRangeInput) {
            var lastEventPlot =  timeplot._plots[timeplot._plots.length - 1];
            if(lastEventPlot._id == "eventPlot") {
              lastEventPlot._addSelectEvent(
                Dashboards.getParameterValue(myself.startDateParameter) + " 00:00:00",
                Dashboards.getParameterValue(myself.endDateParameter) + " 23:59:59",
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
              Dashboards.getParameterValue(myself.startDateParameter) + " 00:00:00",
              Dashboards.getParameterValue(myself.endDateParameter) + " 23:59:59",
              eventSource2,
              "iso8601",
              timePlotTimeGeometry._earliestDate,
              timePlotTimeGeometry._latestDate);
          }
        }
      });
    }
  },
  filterEvents : function (events, range) {
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
  updateDateRangeInput: function(start,end) {
    var toDateString = function(d) {
      var currentMonth = "0" + (d.getMonth() + 1);
      var currentDay = "0" + (d.getDate());
      return d.getFullYear() + "-" + (currentMonth.substring(currentMonth.length-2, currentMonth.length)) + "-" + (currentDay.substring(currentDay.length-2, currentDay.length));
    };
    if(this.chartDefinition.dateRangeInput != undefined) {
      if(start > end) {
        var aux = start;
        start = end;
        end = aux;
      }
      Dashboards.setParameter(this.startDateParameter, toDateString(start));
      Dashboards.setParameter(this.endDateParameter , toDateString(end));
      this.updateTimeplot = false;
      Dashboards.update(this.chartDefinition.dateRangeInput);
      Dashboards.fireChange(this.startDateParameter,toDateString(start));
      this.updateTimeplot = true;
    }
  }
});

