BaseComponent = Base.extend({
  //type : "unknown",
  visible: true,
  clear : function() {
    $("#"+this.htmlObject).empty();
  },
  clone: function(parameterRemap,componentRemap,htmlRemap) {
    var that;
    that = $.extend(true,{},this);
    if (that.parameters) {
      that.parameters = that.parameters.map(function(param){
        if (param[1] in parameterRemap) {
          return [param[0],parameterRemap[param[1]]];
        } else {
          return param;
        }
      });
    }
    if (that.components) {
      that.components = that.components.map(function(comp){
        if (comp in componentRemap) {
          return componentRemap[comp];
        } else {
          return comp;
        }
      });
    }
    that.htmlObject = !that.htmlObject? undefined : htmlRemap[that.htmlObject];
    if (that.listeners) {
      that.listeners = that.listeners.map(function(param){
        if (param in parameterRemap) {
          return parameterRemap[param];
        } else {
          return param;
        }
      });
    }
    if (that.parameter && that.parameter in parameterRemap) {
      that.parameter = parameterRemap[that.parameter];
    }
    return that;
  },
  getAddIn: function (slot,addIn) {
    var type = typeof this.type == "function" ? this.type() : this.type;
    return Dashboards.getAddIn(type,slot,addIn);
  },
  hasAddIn: function (slot,addIn) {
    var type = typeof this.type == "function" ? this.type() : this.type;
    return Dashboards.hasAddIn(type,slot,addIn);
  },
  getValuesArray : function() {


    var jXML;
    if ( typeof(this.valuesArray) == 'undefined' || this.valuesArray.length == 0) {
      if(typeof(this.queryDefinition) != 'undefined'){

        var vid = (this.queryDefinition.queryType == "sql")?"sql":"none";
        if((this.queryDefinition.queryType == "mdx") && (!this.valueAsId)){
          vid = "mdx";
        } else if (this.queryDefinition.dataAccessId !== undefined && !this.valueAsId) {
          vid = 'cda';
        }
        QueryComponent.makeQuery(this);
        var myArray = new Array();
        for(p in this.result) if(this.result.hasOwnProperty(p)){
          switch(vid){
            case "sql":
              myArray.push([this.result[p][0],this.result[p][1]]);
              break;
            case "mdx":
              myArray.push([this.result[p][1],this.result[p][0]]);
              break;
            case 'cda':
              myArray.push([this.result[p][0],this.result[p][1]]);
              break;
            default:
              myArray.push([this.result[p][0],this.result[p][0]]);
              break;
          }
        }
        return myArray;
      } else {

        //go through parameter array and update values
        var p = new Array(this.parameters?this.parameters.length:0);
        for(var i= 0, len = p.length; i < len; i++){
          var key = this.parameters[i][0];
          var value = this.parameters[i][1] == "" || this.parameters[i][1] == "NIL" ? this.parameters[i][2] : Dashboards.getParameterValue(this.parameters[i][1]);
          p[i] = [key,value];
        }

        //execute the xaction to populate the selector
        var myself=this;
        if (this.url) {
          var arr = {};
          $.each(p,function(i,val){
            arr[val[0]]=val[1];
          });
          jXML = Dashboards.parseXActionResult(myself, Dashboards.urlAction(this.url, arr));
        } else {
          jXML = Dashboards.callPentahoAction(myself, this.solution, this.path, this.action, p,null);
        }
        //transform the result int a javascript array
        var myArray = this.parseArray(jXML, false);
        return myArray;
      }
    } else {
      return this.valuesArray;
    }
  },
  parseArray : function(jData,includeHeader){

    if(jData === null){
      return []; //we got an error...
    }

    if($(jData).find("CdaExport").size() > 0){
      return this.parseArrayCda(jData, includeHeader);
    }

    var myArray = new Array();

    var jHeaders = $(jData).find("COLUMN-HDR-ITEM");
    if (includeHeader && jHeaders.size() > 0 ){
      var _a = new Array();
      jHeaders.each(function(){
        _a.push($(this).text());
      });
      myArray.push(_a);
    }

    var jDetails = $(jData).find("DATA-ROW");
    jDetails.each(function(){
      var _a = new Array();
      $(this).children("DATA-ITEM").each(function(){
        _a.push($(this).text());
      });
      myArray.push(_a);
    });

    return myArray;

  },
  parseArrayCda : function(jData,includeHeader){
    //ToDo: refactor with parseArray?..use as parseArray?..
    var myArray = new Array();

    var jHeaders = $(jData).find("ColumnMetaData");
    if (jHeaders.size() > 0 ){
      if(includeHeader){//get column names
        var _a = new Array();
        jHeaders.each(function(){
          _a.push($(this).attr("name"));
        });
        myArray.push(_a);
      }
    }

    //get contents
    var jDetails = $(jData).find("Row");
    jDetails.each(function(){
      var _a = new Array();
      $(this).children("Col").each(function(){
        _a.push($(this).text());
      });
      myArray.push(_a);
    });

    return myArray;

  },

  setAddInDefaults: function(slot,addIn,defaults) {
    var type = typeof this.type == "function" ? this.type() : this.type;
    Dashboards.setAddInDefaults(type,slot,addIn,defaults)
  },
  setAddInOptions: function(slot, addIn,options) {
    if(!this.addInOptions) {
      this.addInOptions = {};
    }

    if (!this.addInOptions[slot]) {
      this.addInOptions[slot] = {};
    }
    this.addInOptions[slot][addIn] = options
  },

  getAddInOptions: function(slot,addIn) {
    var opts = null;
    try {
      opts = this.addInOptions[slot][addIn];
    } catch (e) {
      /* opts is still null, no problem */
    }
    /* opts is falsy if null or undefined */
    return opts || {};
  }
});

var XactionComponent = BaseComponent.extend({
  update : function() {
    var myself=this;
    try {
      if (typeof(this.iframe) == 'undefined' || !this.iframe) {
        // go through parameter array and update values
        var p = new Array(this.parameters?this.parameters.length:0);
        for(var i= 0, len = p.length; i < len; i++){
          var key = this.parameters[i][0];
          var value = this.parameters[i][1] == "" ? this.parameters[i][2] : Dashboards.getParameterValue(this.parameters[i][1]);
          if(this.value == "NIL"){
            this.value = this.parameters[i][2];
          }
          p[i] = [key,value];
        }

        if (typeof(this.serviceMethod) == 'undefined' || this.serviceMethod == 'ServiceAction') {
          var jXML = Dashboards.callPentahoAction(myself,this.solution, this.path, this.action, p,null);

          if(jXML != null){
            $('#'+myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
          }
        } else {
          var html = Dashboards.pentahoServiceAction(this.serviceMethod, 'html', this.solution, this.path, this.action, p, null);
          $('#'+myself.htmlObject).html(html);
        }

      } else {
        var xactionIFrameHTML = "<iframe id=\"iframe_"+ this.htmlObject + "\"" +
        " frameborder=\"0\"" +
        " height=\"100%\"" +
        " width=\"100%\" />";        
        var iframe = $(xactionIFrameHTML);        
        var url = webAppPath + "/ViewAction?wrapper=false" +
              "&solution=" + this.solution +
              "&path=" + this.path +
              "&action="+ this.action;

        // Add args
        var p = new Array(this.parameters.length);
        for(var i= 0, len = p.length; i < len; i++){
          var arg = "&" + encodeURIComponent(this.parameters[i][0]) + "=";
          var val = "";
          if (this.parameters[i][1] == "") {
            val = encodeURIComponent(this.parameters[i][2]);
          } else {
            val =  encodeURIComponent(Dashboards.getParameterValue(this.parameters[i][1]));
            if(val == "NIL"){
              val = encodeURIComponent(this.parameters[i][2])
            }
          }
          url += arg + val;
        }
        if (!this.loading) {
          this.loading = true;
          Dashboards.incrementRunningCalls();
        }
        iframe.load(function(){
          if (this.contentWindow.document.body.innerHTML){
            myself.loading = false;
            Dashboards.decrementRunningCalls();
          }
        });
        $("#"+this.htmlObject).empty().append(iframe);
        iframe[0].contentWindow.location = url;
      }
    } catch (e) {
    // don't cause the rest of CDF to fail if xaction component fails for whatever reason
    }
  }
});

var SelectBaseComponent = BaseComponent.extend({
  visible: false,
  update: function () {
    var ph = $("#" + this.htmlObject);
    var myArray = this.getValuesArray(),
    isMultiple = false;

    selectHTML = "<select";

    // set size
    if (this.size != undefined) {
      selectHTML += " size='" + this.size + "'";
    }
    if (this.type.toLowerCase().indexOf("selectmulti") != -1) {
      if (typeof(this.isMultiple) == 'undefined' || this.isMultiple == true) {
        selectHTML += " multiple";
        isMultiple = true;
      } else
      if (!this.isMultiple && this.size == undefined) {
        selectHTML += " size='" + myArray.length + "'";
      }
    }
    if (this.externalPlugin == "chosen") {
      selectHTML += " class='chzn-select'";
    }
    selectHTML += ">";
    var firstVal,
    currentVal = Dashboards.ev(Dashboards.getParameterValue(this.parameter)),
    currentIsValid = false;

    var hasCurrentVal = typeof currentVal != undefined;
    //var vid = this.valueAsId == false ? false : true;
    var vid = !!this.valueAsId;
    var hasValueSelected = false;
    var isSelected = false;

    var currentValArray = [];
    if(currentVal instanceof Array || (typeof(currentVal) == "object" && currentVal.join)) {
      currentValArray = currentVal;
    } else if(typeof(currentVal) == "string"){
      currentValArray = currentVal.split("|");
    }

    for (var i = 0, len = myArray.length; i < len; i++) {
      if (myArray[i] != null && myArray[i].length > 0) {
        var ivid = vid || myArray[i][0] == null;
        var value, label;
        if (myArray[i].length > 1) {
          value = "" + myArray[i][ivid ? 1 : 0];
          label = "" + myArray[i][1];
        } else {
          value = "" + myArray[i][0];
          label = "" + myArray[i][0];
        }
        if (i == 0) {
          firstVal = value;
        }
        if (jQuery.inArray( value, currentValArray) > -1) {
          currentIsValid = true;
        }
        selectHTML += "<option value = '" + Dashboards.escapeHtml(value) + "' >" + Dashboards.escapeHtml(label) + "</option>";
      }
    }

    selectHTML += "</select>";
    ph.html(selectHTML);

    /* If the current value for the parameter is invalid or empty, we need
     * to pick a sensible default. If there is a defaultIfEmpty value,
     * we use that; otherwise, we use the first value in the selector.
     * An "invalid" value is, of course, one that's not in the values array.
     */
    if (isMultiple ? !currentIsValid && currentVal !== '' : !currentIsValid) {
      var replacementValue = (this.defaultIfEmpty)? firstVal : null;
      $("select", ph).val(replacementValue);
      Dashboards.setParameter(this.parameter,replacementValue);
      Dashboards.processChange(this.name);
    } else {
      $("select", ph).val(currentValArray);
    }
    
    if( this.externalPlugin == "chosen" ){ 
      ph.find("select.chzn-select").chosen(); 
    }
    
    var myself = this;
    $("select", ph).change(function () {
      Dashboards.processChange(myself.name);
    });
  }
});

var SelectComponent = SelectBaseComponent.extend({
  defaultIfEmpty: true,
  getValue : function() {
    return $("#"+this.htmlObject + " select").val();
  }
});

var SelectMultiComponent = SelectBaseComponent.extend({
  getValue : function() {
  	var ph = $("#"+this.htmlObject + " select");
	// caveat: chosen returns null when nothing's selected, and CDF doesn't handle nulls correctly
	if(ph.hasClass("chzn-select") && ph.val() == null)
		return [];
    return ph.val();
  }
});

var JFreeChartComponent = BaseComponent.extend({
  update : function() {
    var xactionFile = (this.chartDefinition.queryType == 'cda')? "jfreechart-cda.xaction" : "jfreechart.xaction";
    this.callPentahoAction(xactionFile);
  },

  getParameters: function() {

    var cd = this.chartDefinition;
    // Merge the stuff with a chartOptions element
    if (cd == undefined){
     Dashboards.log("Fatal - No chartDefinition passed","error");
      return;
    }

    // If the user filled titleKey get the title value from language files
    if (typeof cd.titleKey !== "undefined" && typeof Dashboards.i18nSupport !== "undefined" && Dashboards.i18nSupport != null) {
      cd.title = Dashboards.i18nSupport.prop(cd.titleKey);
    }

    //set parameters string if using cda
    var cdaParameterString = null;
    if(cd.queryType == "cda"){
      if ($.isArray(this.parameters)){
        var param;
        for(var i = 0; i < this.parameters.length; i++){
          param = this.parameters[i];
          if($.isArray(param) && param.length >= 2){
            var name = param[0];
            var value = param[1]; //TODO: in pho dashboard designer static parameters may be in the form [["name", "", "value" ] ... ]

            if(value){
              value = doCsvQuoting(value, '=');	//quote if needed for '='
            }
            if(i == 0) cdaParameterString = "";
            else cdaParameterString += ";";

            cdaParameterString += doCsvQuoting(name + "=" + value, ';'); //re-quote for ';'
          }
        }
      }
    }

    var cd0 = cd.chartOptions != undefined ? $.extend({},Dashboards.ev(cd.chartOptions), cd) : cd;

    // go through parameters array and update values
    var parameters = [];
    for(p in cd0){
      var key = p;
      var value = typeof cd0[p]=='function'?cd0[p]():cd0[p];
      // alert("key: " + key + "; Value: " + value);
      parameters.push([key,value]);
    }
    if(cdaParameterString != null){
      parameters.push(["cdaParameterString", cdaParameterString]);
    }

    return parameters;

  },

  callPentahoAction: function(action) {
    // increment runningCalls
    Dashboards.incrementRunningCalls();

    var myself = this;
    // callback async mode
    Dashboards.callPentahoAction(myself,"system", "pentaho-cdf/actions", action, this.getParameters(),function(jXML){

      if(jXML != null){
        if(myself.chartDefinition.caption != undefined){
          myself.buildCaptionWrapper($(jXML.find("ExecuteActivityResponse:first-child").text()),action);
        }
        else {
          $('#'+myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
        }
      }
      Dashboards.decrementRunningCalls();

    });
  },

  buildCaptionWrapper: function(chart,cdfComponent){

    var exportFile = function(type,cd){
      var xactionFile = (cd.queryType == 'cda')? "jtable-cda.xaction" : "jtable.xaction";
      var obj = $.extend({
        solution: "system",
        path: "pentaho-cdf/actions",
        action: xactionFile,
        exportType: type
      },cd);
      Dashboards.post(webAppPath + '/content/pentaho-cdf/Export',obj);
    };

    var myself = this;
    var cd = myself.chartDefinition;
    var captionOptions = $.extend({
      title:{
        title: cd.title != undefined ? cd.title : "Details",
        oclass: 'title'
      },
      chartType:{
        title: "Chart Type",
        show: function(){
          return cd.chartType != 'function' && ( cd.chartType == "BarChart" ||  cd.chartType == "PieChart")
        },
        icon: function(){
          return cd.chartType == "BarChart" ? webAppPath + '/content/pentaho-cdf/resources/style/images/pie_icon.png': webAppPath + '/content/pentaho-cdf/resources/style/images/bar_icon.png';
        },
        oclass: 'options',
        callback: function(){
          cd.chartType = cd.chartType == "BarChart" ? "PieChart" : "BarChart";
          myself.update();
        }
      },
      excel: {
        title: "Excel",
        icon: webAppPath + '/content/pentaho-cdf/resources/style/images/excel_icon.png',
        oclass: 'options',
        callback: function(){
          exportFile("excel",cd);
        }
      },
      csv: {
        title: "CSV",
        icon: webAppPath + '/content/pentaho-cdf/resources/style/images/csv_icon.gif',
        oclass: 'options',
        callback: function(){
          exportFile("csv",cd);
        }
      },
      zoom: {
        title:'Zoom',
        icon: webAppPath + '/content/pentaho-cdf/resources/style/images/magnify.png',
        oclass: 'options',
        callback: function(){
          Dashboards.incrementRunningCalls();
          var parameters = myself.getParameters();
          var width = 200,height = 200;
          var urlTemplate,parameterName = "";
          for(p in parameters){
            if(parameters[p][0] == 'width'){
              width += parameters[p][1];
              parameters[p] = ['width',width]
            };
            if(parameters[p][0] == 'height'){
              height += parameters[p][1];
              parameters[p] = ['height',height]
            };
            if(parameters[p][0] == 'parameterName'){
              parameterName = parameters[p][1];
              parameters[p] = ['parameterName','parameterValue']
            };
            if(parameters[p][0] == 'urlTemplate'){
              urlTemplate = parameters[p][1];
              parameters[p] = ['urlTemplate',"javascript:chartClick('" + myself.name +"','{parameterValue}');"]
            };
          }
          myself.zoomCallBack = function(value){
            eval(urlTemplate.replace("{" + parameterName + "}",value));
          };
          Dashboards.callPentahoAction(myself,"system", "pentaho-cdf/actions", cdfComponent, parameters,function(jXML){
            if(jXML != null){
              var openWindow = window.open(webAppPath + "/content/pentaho-cdf/js/captify/zoom.html","_blank",'width=' + (width+10) + ',height=' + (height+10));
              var maxTries = 10;
              var loadChart = function(){
                if(openWindow.loadChart != undefined)openWindow.loadChart(jXML.find("ExecuteActivityResponse:first-child").text())
                else if(maxTries> 0) {
                  maxTries-=1;
                  setTimeout(loadChart,500);
                }
              };
              loadChart();
            }
            Dashboards.decrementRunningCalls();
          });
        }
      },
      details:{
        title:'Details',
        icon:webAppPath + '/content/pentaho-cdf/resources/style/images/table.png',
        oclass: 'options',
        callback: function(){
          myself.pivotDefinition = {
            jndi: cd.jndi,
            catalog:cd.catalog,
            query:cd.query
          };
          PivotLinkComponent.openPivotLink(myself);
        }

      }

    }, cd.caption);

    var captionId = myself.htmlObject + 'caption';
    var caption = $('<div id="' + captionId + '" ></div>');

    chart.attr("id",myself.htmlObject + 'image');
    chart.attr("rel",myself.htmlObject + "caption");
    chart.attr("class","captify");

    for(o in captionOptions){
      var show = captionOptions[o].show == undefined || (typeof captionOptions[o].show=='function'?captionOptions[o].show():captionOptions[o].show) ? true : false;

      if (this.chartDefinition.queryType != "mdx" && captionOptions[o].title == "Details") {
        show = false;
      };
      if(show){
        var icon = captionOptions[o].icon != undefined ? (typeof captionOptions[o].icon=='function'?captionOptions[o].icon():captionOptions[o].icon) : undefined;
        var op = icon != undefined ? $('<image id ="' + captionId + o + '" src = "' + icon + '"></image>') : $('<span id ="' + captionId + o + '">' + captionOptions[o].title  +'</span>');
        op.attr("class",captionOptions[o].oclass != undefined ? captionOptions[o].oclass : "options");
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
    bDetails.one('capityFinished',function(e,wrapper){
      var chartOffset = chart.offset();
      var bDetailsOffset = bDetails.offset();
      if(chart.length > 1){
        bDetails.bind("mouseenter",function(){
          $("#" + myself.htmlObject + 'image').trigger('detailsClick',[this]);
        });
        bDetails.css("left",bDetails.position().left + $(chart[1]).width() - bDetails.width() - 5);
        bDetails.css("top",bDetails.position().top + $(chart[1]).height() - bDetails.height() );
        //Append map after image
        $(chart[1]).append(chart[0]);

      }
      for(o in captionOptions)
        if(captionOptions[o].callback != undefined)
          $("#" + captionId + o).bind("click",captionOptions[o].callback);
    });

  }

});

var DialComponent = JFreeChartComponent.extend({

  update : function() {

    var cd = this.chartDefinition;
    if (cd == undefined){
     Dashboards.log("Fatal - No chartDefinition passed","error");
      return;
    }
    
    cd.chartType = 'DialChart';

    var intervals = cd.intervals;

    var colors = cd.colors;
    if(colors != undefined && intervals.length != colors.length){
     Dashboards.log("Fatal - Number of intervals differs from number of colors","error");
      return;
    }

    this.callPentahoAction(cd.queryType == 'cda' ? "jfreechartdial-cda.xaction" : "jfreechartdial.xaction");

  }
  
});

var OpenFlashChartComponent = JFreeChartComponent.extend({

  callPentahoAction: function() {

    Dashboards.incrementRunningCalls();

    var myself = this;

    Dashboards.callPentahoAction(myself,"system", "pentaho-cdf/actions", "openflashchart.xaction", this.getParameters(),function(jXML){

      if(jXML != null){
        var result = jXML.find("ExecuteActivityResponse:first-child").text().replace(/openflashchart/g,webAppPath + "/openflashchart");
        getDataFuntion = result.match(/getData.*\(\)/gi);
        $("#"+myself.htmlObject).html(result);
      }
      Dashboards.decrementRunningCalls();

    });

    OpenFlashChartComponent.prototype.onClick = function(value) {
      if(getDataFuntion != null && myself.chartDefinition.urlTemplate != undefined && myself.chartDefinition.parameterName != undefined){
        myself.data = myself.data != undefined ? myself.data : eval('(' + eval(getDataFuntion[0]) + ')');
        if(myself.data.x_axis != undefined){
          var urlTemplate = myself.chartDefinition.urlTemplate.replace("{" + myself.chartDefinition.parameterName + "}",myself.data.x_axis.labels.labels[value]);
          eval(urlTemplate);
        }

      }
    };

  }

});

var TrafficComponent = BaseComponent.extend({
  update : function() {
    var cd = this.trafficDefinition;
    if (cd == undefined){
     Dashboards.log("Fatal - No trafficDefinition passed","error");
      return;
    }

    var intervals = cd.intervals;
    if (intervals == undefined){
      cd.intervals = [-1,1];
    }

    // go through parametere array and update values
    var parameters = [];
    for(p in cd){
      var key = p;
      var value = typeof cd[p]=='function'?cd[p]():cd[p];
      // alert("key: " + key + "; Value: " + value);
      parameters.push([key,value]);
    }

    // increment runningCalls
    Dashboards.incrementRunningCalls();

    var myself = this;
    // callback async mode
    Dashboards.callPentahoAction(myself,"system", "pentaho-cdf/actions", "traffic.xaction", parameters,
      function(result){
        var value = $(result).find("VALUE").text();
        var i = $("<img>").attr("src",value<=cd.intervals[0]?Dashboards.TRAFFIC_RED:(value>=cd.intervals[1]?Dashboards.TRAFFIC_GREEN:Dashboards.TRAFFIC_YELLOW));
        $('#'+myself.htmlObject).html(i);

        if(cd.showValue != undefined && cd.showValue == true){
          var tooltip = "Value: " + value + " <br /><img align='middle' src='" + Dashboards.TRAFFIC_RED + "'/> &le; "  + cd.intervals[0] + " &lt;  <img align='middle' src='" + Dashboards.TRAFFIC_YELLOW + "'/> &lt; " + cd.intervals[1] + " &le; <img align='middle' src='" + Dashboards.TRAFFIC_GREEN + "'/> <br/>" + (tooltip != undefined?tooltip:"");
          $('#'+myself.htmlObject).attr("title",tooltip + ( myself._tooltip != undefined? myself._tooltip:"")).tooltip({
            delay:0,
            track: true,
            fade: 250
          });
        }

        Dashboards.decrementRunningCalls();
      });
  }
});

var TimePlotComponent = BaseComponent.extend({

  reset: function(){
    this.timeplot = undefined;
    this.chartDefinition.dateRangeInput = this.InitialDateRangeInput;
    this.listeners = this.InitialListeners;
  },

  update : function() {

    var cd = this.chartDefinition;

    this.InitialListeners = this.InitialListeners == undefined ? this.listeners : this.InitialListeners;
    this.InitialDateRangeInput = this.InitialDateRangeInput == undefined ? cd.dateRangeInput : this.InitialDateRangeInput;

    if(cd.updateOnDateRangeInputChange != true && this.timeplot!= undefined && cd.dateRangeInput != undefined){

      if(this.updateTimeplot != false && this.timeplot._plots.length > 0 ){

        var lastEventPlot = this.timeplot._plots[this.timeplot._plots.length -1];
        if(lastEventPlot._id == "eventPlot")
          lastEventPlot._addSelectEvent(Dashboards.getParameterValue(this.startDateParameter)+ " 00:00:00",Dashboards.getParameterValue(this.endDateParameter)+ " 23:59:59",
            lastEventPlot._eventSource,"iso8601",this.geometry._earliestDate,this.geometry._latestDate);
      }

      return;

    }


    if(cd.dateRangeInput != undefined && this.timeplot == undefined){
      cd.dateRangeInput = Dashboards.getComponent(cd.dateRangeInput);
      this.startDateParameter = cd.dateRangeInput.parameter[0];
      this.endDateParameter = cd.dateRangeInput.parameter[1];
      this.listeners = this.listeners == undefined ? [] : this.listeners;
      this.listeners = this.listeners.concat(this.startDateParameter).concat(this.endDateParameter);
    }

    if (typeof Timeplot != "undefined" && Dashboards.timePlotColors == undefined ){
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

    var obj = this;
    if (cd == undefined){
     Dashboards.log("Fatal - No chart definition passed","error");
      return;
    }

    // Set default options:
    if (cd.showValues == undefined){
      cd.showValues = true;
    }


    var cols = typeof cd['columns']=='function'?cd['columns']():cd['columns'];
    if (cols == undefined || cols.length == 0){
     Dashboards.log("Fatal - No 'columns' property passed in chartDefinition","error");
      return;
    }
    // Write the title
    var title = $('<div></div>');
    if(cd.title != undefined){
      title.append('<span style="text-transform: lowercase;">' + cd.title + '&nbsp; &nbsp; &nbsp;</span>');
    }

    var plotInfo = [];
    for(var i = 0,j=0; i<cols.length; i++,j++){

      j = j > 7 ? 0 : j;
      title.append('<span id="' + obj.name + 'Plot' + i + 'Header" style="color:' + Dashboards.timePlotColors[j].toHexString() + '">'+cols[i]+' &nbsp;&nbsp;</span>');

      var plotInfoOpts = {
        id: obj.name + "Plot" + i,
        name: cols[i],
        dataSource: new Timeplot.ColumnSource(timePlotEventSource,i + 1),
        valueGeometry: timePlotValueGeometry,
        timeGeometry: timePlotTimeGeometry,
        lineColor: Dashboards.timePlotColors[j],
        showValues: cd.showValues,
        hideZeroToolTipValues: cd.hideZeroToolTipValues != undefined ? cd.hideZeroToolTipValues : false,
        showValuesMode: cd.showValuesMode != undefined ? cd.showValuesMode : "header",
        toolTipFormat: function (value,plot){
          return  plot._name + " = " + toFormatedString(value);
        },
        headerFormat: function (value,plot){
          return  plot._name + " = " + toFormatedString(value) + "&nbsp;&nbsp;";
        }
      };
      if ( cd.dots == true){
        plotInfoOpts.dotColor = Dashboards.timePlotColors[j];
      }
      if ( cd.fill == true){
        plotInfoOpts.fillColor = Dashboards.timePlotColors[j].transparency(0.5);
      }
      plotInfo.push(new Timeplot.createPlotInfo(plotInfoOpts));

    }


    // support for events
    var eventSource2 = undefined;
    var eventSourcePlot = undefined;
    if(cd.dateRangeInput != undefined || (cd.events && cd.events.show == true)){
      this.rangeColor = "00FF00";
      eventSource2 = new Timeplot.DefaultEventSource();
      eventSourcePlot = Timeplot.createPlotInfo({
        id: cd.dateRangeInput != undefined ? "eventPlot" : "events",
        eventSource: eventSource2,
        timeGeometry: timePlotTimeGeometry,
        lineColor: "#FF0000",
        rangeColor: this.rangeColor,
        getSelectedRegion: function(start,end){
          myself.updateDateRangeInput(start,end);
        }
      });
      plotInfo.push(eventSourcePlot);
    }

    $("#"+this.htmlObject).html(title);
    $("#"+this.htmlObject).append("<div class='timeplot'></div>");

    if(cd.height > 0){
      $("#" + this.htmlObject + " > div.timeplot").css("height",cd.height);
    }
    if(cd.width > 0){
      $("#" + this.htmlObject + " > div.timeplot").css("width",cd.width);
    }

    timeplot = Timeplot.create($("#"+this.htmlObject+" > div.timeplot")[0], plotInfo);
    obj.timeplot = timeplot;
    obj.geometry = timePlotTimeGeometry;

    // go through parametere array and update values
    var parameters = [];
    for(p in cd){
      var key = p;
      var value = typeof cd[p]=='function'?cd[p]():cd[p];
      // parameters.push(encodeURIComponent(key)+"="+encodeURIComponent(value));
      parameters.push(key+"="+value);
    }
    var allData = undefined;
    var timePlotEventSourceUrl = webAppPath + "/ViewAction?solution=system&path=pentaho-cdf/actions&action=timelinefeeder.xaction&" + parameters.join('&');
    var myself = this;
    if(cd.events && cd.events.show == true){

      // go through parametere array and update values
      var parameters = [];
      for(p in cd.events){
        var key = p;
        var value = typeof cd.events[p]=='function'?cd.events[p]():cd.events[p];
        parameters.push(key+"="+value);
      }

      var eventUrl = webAppPath + "/ViewAction?solution=system&path=pentaho-cdf/actions&action=timelineeventfeeder.xaction&" + parameters.join('&');

      timeplot.loadText(timePlotEventSourceUrl,",", timePlotEventSource, null,null,function(range){
        timeplot.loadJSON(eventUrl,eventSource2,function(data){
          data.events = myself.filterEvents(data.events, range);
          if(cd.dateRangeInput){
            var lastEventPlot =  timeplot._plots[timeplot._plots.length -1];
            if(lastEventPlot._id == "eventPlot")
              lastEventPlot._addSelectEvent(Dashboards.getParameterValue(obj.startDateParameter) + " 00:00:00",Dashboards.getParameterValue(obj.endDateParameter)+ " 23:59:59",
                eventSource2,"iso8601",timePlotTimeGeometry._earliestDate,timePlotTimeGeometry._latestDate);
          }
        })
      });
    }
    else
      timeplot.loadText(timePlotEventSourceUrl,",", timePlotEventSource,null,null,function(){
        if(cd.dateRangeInput){
          var lastEventPlot =  timeplot._plots[timeplot._plots.length -1];
          if(lastEventPlot._id == "eventPlot")
            lastEventPlot._addSelectEvent(Dashboards.getParameterValue(obj.startDateParameter) + " 00:00:00",Dashboards.getParameterValue(obj.endDateParameter)+ " 23:59:59",
              eventSource2,"iso8601",timePlotTimeGeometry._earliestDate,timePlotTimeGeometry._latestDate);
        }
      });
  },
  filterEvents : function (events, range) {
    var result = [];
    var min = MetaLayer.toDateString(new Date(range.earliestDate));
    var max = MetaLayer.toDateString(new Date(range.latestDate));
    for(i = 0; i < events.length; i++){
      if(events[i].start >= min && ((events[i].end == undefined && events[i].start <= max) || events[i].end <= max)){
        result.push(events[i]);
      }
    }
    return result;
  },
  updateDateRangeInput: function(start,end){
    var toDateString = function(d){
      var currentMonth = "0" + (d.getMonth() + 1);
      var currentDay = "0" + (d.getDate());
      return d.getFullYear() + "-" + (currentMonth.substring(currentMonth.length-2, currentMonth.length)) + "-" + (currentDay.substring(currentDay.length-2, currentDay.length));
    };
    if(this.chartDefinition.dateRangeInput != undefined ){
      if(start > end){
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

var TextComponent = BaseComponent.extend({
  update : function() {
    $("#"+this.htmlObject).html(this.expression());
  }
});

var TextInputComponent = BaseComponent.extend({
  update: function(){
    selectHTML = "<input";
    selectHTML += " type=test id='" + this.name + "' name='" + this.name +
    "' + value='" +
    Dashboards.getParameterValue(this.parameter) +
    (this.charWidth ? ("' + size='" + this.charWidth) : "") +
    (this.maxChars ? ("' + maxlength='" + this.maxChars) : "") +
    "'>";
    $("#" + this.htmlObject).html(selectHTML);
    var myself = this;
    $("#" + this.name).change(function(){
      Dashboards.processChange(myself.name);
    }).keyup(function(event){
      if (event.keyCode == 13) {
        Dashboards.processChange(myself.name);
      }
    });
  },
  getValue : function() {
    return $("#"+this.name).val();
  }
});


// Start by setting a sane i18n default to datepicker
$(function(){$.datepicker.setDefaults($.datepicker.regional[''])});

var DateInputComponent = BaseComponent.extend({
  update: function(){
    var format = (this.dateFormat == undefined || this.dateFormat == null)? 'yy-mm-dd' : this.dateFormat;
    var myself = this;

    var startDate, endDate;

    if(this.startDate == 'TODAY') startDate = new Date();
    else if(this.startDate) startDate = $.datepicker.parseDate( format, this.startDate);

    if(this.endDate == 'TODAY') endDate = new Date();
    else if(this.endDate) endDate = $.datepicker.parseDate( format, this.endDate);

    //ToDo: stretch interval to catch defaultValue?..
    //Dashboards.getParameterValue(this.parameter))

    $("#" + this.htmlObject).html($("<input/>").attr("id", this.name).attr("value", Dashboards.getParameterValue(this.parameter)).css("width", "80px"));
    $(function(){
      $("#" + myself.htmlObject + " input").datepicker({
        dateFormat: format,
        changeMonth: true,
        changeYear: true,
        minDate: startDate,
        maxDate: endDate,
        onSelect: function(date, input){
          Dashboards.processChange(myself.name);
        }
      });
      // Add JQuery DatePicker standard localization support only if the dashboard is localized
      if (typeof Dashboards.i18nSupport !== "undefined" && Dashboards.i18nSupport != null) {
        $("#" + myself.htmlObject + " input").datepicker('option', $.datepicker.regional[Dashboards.i18nCurrentLanguageCode]);
      }
    });
  },
  getValue : function() {
    return $("#"+this.name).val();
  }
});


var DateRangeInputComponent = BaseComponent.extend({
  update : function() {
    var dr;
    if (this.singleInput == undefined || this.singleInput == true){
      dr = $("<input/>").attr("id",this.name).attr("value",Dashboards.getParameterValue(this.parameter[0]) + " > " + Dashboards.getParameterValue(this.parameter[1]) ).css("width","170px");
      $("#"+this.htmlObject).html(dr);
    } else {
      dr = $("<input/>").attr("id",this.name).attr("value",Dashboards.getParameterValue(this.parameter[0])).css("width","80px");
      $("#"+this.htmlObject).html(dr);
      dr.after($("<input/>").attr("id",this.name + "2").attr("value",Dashboards.getParameterValue(this.parameter[1])).css("width","80px"));
      if(this.inputSeparator != undefined){
        dr.after(this.inputSeparator);
      }
    }
    var offset = dr.offset();
    var myself = this;
    var earliestDate = this.earliestDate != undefined  ?  Dashboards.getParameterValue(this.earliestDate) : Date.parse('-1years');
    var latestDate = this.latestDate != undefined  ?  Dashboards.getParameterValue(this.latestDate) : Date.parse('+1years');
    var leftOffset = this.leftOffset != undefined ?  this.leftOffset : 0;
    var topOffset = this.topOffset != undefined ?  this.topOffset : 15;
    
    var changed, closed;
    function triggerWhenDone() {
      if(changed && closed) {
        myself.fireInputChange(myself.startValue,myself.endValue);
        changed = closed = false;
      }
    };
    $(function(){
      $("#" + myself.htmlObject + " input").daterangepicker({
        posX: offset.left + leftOffset,
        posY: offset.top + topOffset,
        earliestDate: earliestDate,
        latestDate: latestDate,
        dateFormat: 'yy-mm-dd',
        onOpen: function() {
          changed = closed = false;
          myself.startValue = null;
          myself.endValue = null;
        },
        onDateSelect: function(rangeA, rangeB) {
          changed = true;
          myself.storeChanges(rangeA, rangeB);
          triggerWhenDone();
        },
        onClose: function() {
          closed = true;
          triggerWhenDone();
        }
      });
    });
  },
  
  fireInputChange : function(start, end){
    //TODO: review this!
    if(this.preChange){
      this.preChange(start, end);
    }
    
    if(this.parameter)
    {
      if( this.parameter.length == 2) Dashboards.setParameter(this.parameter[1], end);
      if( this.parameter.length > 0) Dashboards.fireChange(this.parameter[0], start);
    }
    
    if(this.postChange){
      this.postChange(start, end);
    }
  },

  storeChanges : function(start,end){
    this.startValue = start;
    this.endValue = end;
  }
},
{
  fireDateRangeInputChange : function(name, rangeA, rangeB){
    // WPG: can we just use the parameter directly?
    var object = Dashboards.getComponentByName(name);
    if(!(typeof(object.preChange)=='undefined')){
      object.preChange(rangeA, rangeB);
    }
    var parameters = eval(name + ".parameter");
    // set the second date and fireChange the first
    Dashboards.setParameter(parameters[1], rangeB);
    Dashboards.fireChange(parameters[0],rangeA);
    if(!(typeof(object.postChange)=='undefined')){
      object.postChange(rangeA, rangeB);
    }
  }
}
);

var MonthPickerComponent = BaseComponent.extend({
  update : function() {
    var selectHTML = this.getMonthPicker(this.name, this.size, this.initialDate, this.minDate, this.maxDate, this.months);
    $("#" + this.htmlObject).html(selectHTML);
    var myself = this;
    $("#"+this.name).change(function() {
      Dashboards.processChange(myself.name);
    });
  },
  getValue : function() {
    var value = $("#" + this.name).val()

    var year = value.substring(0,4);
    var month = parseInt(value.substring(5,7) - 1);
    var d = new Date(year,month,1);

    // rebuild picker
    var selectHTML = this.getMonthPicker(this.name, this.size, d, this.minDate, this.maxDate, this.months);
    $("#" + this.htmlObject).html(selectHTML);
    var myself = this;
    $("#"+this.name).change(function() {
      Dashboards.processChange(myself.name);
    });
    return value;
  },
  getMonthPicker : function(object_name, object_size, initialDate, minDate, maxDate, monthCount) {


    var selectHTML = "<select";
    selectHTML += " id='" + object_name + "'";

    if (minDate == undefined){
      minDate = new Date();
      minDate.setYear(1980);
    }
    if (maxDate == undefined){
      maxDate = new Date();
      maxDate.setYear(2060);
    }

    // if monthCount is not defined we'll use everything between max and mindate
    if(monthCount == undefined || monthCount == 0) {
      var monthsToAdd = (maxDate.getFullYear() - minDate.getFullYear())*12;
      monthCount = (maxDate.getMonth() - minDate.getMonth()) + monthsToAdd;
    }

    //set size
    if (object_size != undefined){
      selectHTML += " size='" + object_size + "'";
    }

    var currentDate = new Date(+initialDate);
    currentDate.setMonth(currentDate.getMonth()- monthCount/2 - 1);

    for(var i= 0; i <= monthCount; i++){

      currentDate.setMonth(currentDate.getMonth() + 1);
      if(currentDate >= minDate && currentDate <= maxDate)
      {
        selectHTML += "<option value = '" + currentDate.getFullYear() + "-" + this.zeroPad(currentDate.getMonth()+1,2) + "'";

        if(currentDate.getFullYear() == initialDate.getFullYear() && currentDate.getMonth() == initialDate.getMonth()){
          selectHTML += "selected='selected'"
        }

        selectHTML += "' >" + Dashboards.monthNames[currentDate.getMonth()] + " " +currentDate.getFullYear()  + "</option>";
      }
    }

    selectHTML += "</select>";

    return selectHTML;
  },
  zeroPad : function(num,size) {
    var n = "00000000000000" + num;
    return n.substring(n.length-size,n.length);
  }
});

var ToggleButtonBaseComponent = BaseComponent.extend({
  update: function(){
    var myArray = this.getValuesArray();

    selectHTML = "";

    //default
    var currentVal = Dashboards.getParameterValue(this.parameter);
    currentVal = (typeof currentVal == 'function') ? currentVal() : currentVal;

    var isSelected = false;

    var currentValArray = [];
    if(currentVal instanceof Array || (typeof(currentVal) == "object" && currentVal.join)) {
      currentValArray = currentVal;
    } else if(typeof(currentVal) == "string"){
      currentValArray = currentVal.split("|");
    }

    // check to see if current selected values are in the current values array. If not check to see if we should default to the first
    var vid = this.valueAsId==false?0:1;
    var hasCurrentVal = false;
      outer:
      for(var i = 0; i < currentValArray.length; i++){
        for(var y = 0; y < myArray.length; y++) {
          if (currentValArray[i] == myArray[y][vid]) {
            hasCurrentVal = true;
            break outer;
          }
        }
      }
    // if there will be no selected value, but we're to default if empty, select the first
    if(!hasCurrentVal && this.defaultIfEmpty){
      currentValArray = [myArray[0][vid]];

      this.currentVal = currentValArray;
      Dashboards.setParameter(this.parameter,currentValArray);
      Dashboards.processChange(this.name);
    }
    // (currentValArray == null && this.defaultIfEmpty)? firstVal : null


    selectHTML += "<ul class='"+ ((this.verticalOrientation)? "toggleGroup vertical":"toggleGroup horizontal")+"'>"
    for (var i = 0, len = myArray.length; i < len; i++) {
      selectHTML += "<li class='"+ ((this.verticalOrientation)? "toggleGroup vertical":"toggleGroup horizontal")+"'><label><input onclick='ToggleButtonBaseComponent.prototype.callAjaxAfterRender(\"" + this.name + "\")'";

      isSelected = false;
      for (var j = 0, valLength = currentValArray.length; j < valLength; j++) {
        isSelected = currentValArray[j] == myArray[i][vid];
        if(isSelected) {
          break;
        }
      }

      if (this.type == 'radio' || this.type == 'radioComponent'){
        if ((i == 0 && !hasCurrentVal) ||
          (hasCurrentVal && (myArray[i][vid] == currentVal ))) {
          selectHTML += " CHECKED";
        }
        selectHTML += " type='radio'";
      }else{
        if ((i == 0 && !hasCurrentVal && this.defaultIfEmpty) ||
          (hasCurrentVal && isSelected)) {
          selectHTML += " CHECKED";
        }
        selectHTML += " type='checkbox'";
      }
      selectHTML += "class='" + this.name +"' name='" + this.name +"' value='" + myArray[i][vid] + "' /> " + myArray[i][1] + "</label></li>" + ((this.separator == undefined || this.separator == null || this.separator == "null")?"":this.separator);
    }
    selectHTML += "</ul>"
    // update the placeholder
    $("#" + this.htmlObject).html(selectHTML);
    this.currentVal = null;
  },
  callAjaxAfterRender: function(name){
    setTimeout(function(){
      Dashboards.processChange(name)
    },1);
  }
});

var RadioComponent = ToggleButtonBaseComponent.extend({
  getValue : function() {
    if (this.currentVal != 'undefined' && this.currentVal != null) {
      return this.currentVal;
    } else {
      return $("#"+this.htmlObject + " ."+this.name+":checked").val()
    }
  }
});

var CheckComponent = ToggleButtonBaseComponent.extend({
  getValue : function() {
    if (this.currentVal != 'undefined' && this.currentVal != null) {
      return this.currentVal;
    } else {
      var a = new Array()
      $("#"+this.htmlObject + " ."+this.name + ":checked").each(function(i,val){
        a.push($(this).val());
      });
      return a;
    }
  }
});

var MultiButtonComponent = ToggleButtonBaseComponent.extend({
  indexes: [],//used as static
  update: function(){
    var myArray = this.getValuesArray();
    this.cachedArray = myArray;
    var cssWrapperClass= "pentaho-toggle-button pentaho-toggle-button-up "+ ((this.verticalOrientation)? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
    selectHTML = "";
    var firstVal;

    var valIdx = this.valueAsId ? 1 : 0;
    var lblIdx = 1;

    if (this.isMultiple == undefined) this.isMultiple = false;

    var ph = $("<div>");

    for (var i = 0, len = myArray.length; i < len; i++){
      var value = myArray[i][valIdx],
        label = myArray[i][lblIdx],
        classes = cssWrapperClass + this.getExtraCss(i,len,this.verticalOrientation),
        selector;

      value = (value == null ? null : value.replace('"','&quot;' ));
      label = (label == null ? null : label.replace('"','&quot;' ));

      if(i == 0){
        firstVal = value;
      }

      selectHTML = "<div class='" + classes +"'><button name='" + this.name + "'>" + label + "</button  >" +"</div>";
      selector = $(selectHTML);
      // We wrap the click handler in a self-executing function so that we can capture 'i'.
      var myself = this;
      (function(index){ selector.click(function(){
        MultiButtonComponent.prototype.clickButton(myself.htmlObject, myself.name, index, myself.isMultiple, myself.verticalOrientation);
      });}(i));
      ph.append(selector);
      if (!(this.separator == undefined || this.separator == null || this.separator == "null") && i != myArray.length - 1) {
        ph.append(this.separator);
      }
    }

    ph.appendTo($("#" + this.htmlObject).empty());
    
    //default
    var currentVal = Dashboards.ev(Dashboards.getParameterValue(this.parameter));

    var isSelected = false;

    var currentValArray;
    if(currentVal instanceof Array || (typeof(currentVal) == "object" && currentVal.join)) {
      currentValArray = currentVal;
    } else {
      currentValArray = currentVal.toString().split("|");
    }

    var foundDefault = false;
    this.clearSelections(this.htmlObject, this.name, this.verticalOrientation);
    for (var i = 0; i < myArray.length; i++) {

      isSelected = false;
      for (var j = 0, valLength = currentValArray.length; j < valLength; j++) {
        isSelected = currentValArray[j] == myArray[i][valIdx];
        if(isSelected) {
          break;
        }
      }


      if ( ( $.isArray(currentVal) && isSelected || isSelected)
        || (myArray[i][valIdx] == currentVal || myArray[i][lblIdx] == currentVal) ) {

        MultiButtonComponent.prototype.clickButton(this.htmlObject, this.name, i, this.isMultiple, this.verticalOrientation, true);

        foundDefault = true;
        if(!this.isMultiple) {
          break;
        }
      }
    }
    if(((!foundDefault && !this.isMultiple) || (!foundDefault && this.isMultiple && this.defaultIfEmpty)) && myArray.length > 0){
      //select first value
      if((currentVal == null || currentVal == "" || (typeof(currentVal) == "object" && currentVal.length == 0)) && this.parameter){
        Dashboards.fireChange(this.parameter, (this.isMultiple) ? [firstVal] : firstVal);
      }

      MultiButtonComponent.prototype.clickButton(this.htmlObject, this.name, 0, this.isMultiple, this.verticalOrientation, true);
    }

    // set up hovering
    $(".pentaho-toggle-button").hover(function() {
      $(this).addClass("pentaho-toggle-button-up-hovering");
    }, function() {
      $(this).removeClass("pentaho-toggle-button-up-hovering");
    });
    // set up hovering when inner button is hovered
    $(".pentaho-toggle-button button").hover(function() {
      $(this).parent().addClass("pentaho-toggle-button-up-hovering");
    }, function() {
      // don't remove it, since it's inside the outer div it will handle that
    });

  },

  getValue: function(){
    if(this.isMultiple){
      var indexes = MultiButtonComponent.prototype.getSelectedIndex(this.name);
      var a = new Array();
      // if it is not an array, handle that too
      if (indexes.length == undefined) {
        a.push(this.getValueByIdx(indexes));
      } else {
        for(var i=0; i < indexes.length; i++){
          a.push(this.getValueByIdx(indexes[i]));
        }
      }
      return a;
    }
    else {
      return this.getValueByIdx(MultiButtonComponent.prototype.getSelectedIndex(this.name));
    }
  },

  getValueByIdx: function(idx){
    return this.cachedArray[idx][this.valueAsId ? 1 : 0];
  },

  getSelecetedCss: function(verticalOrientation) {
    return "pentaho-toggle-button pentaho-toggle-button-down "+ ((verticalOrientation)? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
  },
  getUnselectedCss: function(verticalOrientation) {
    return "pentaho-toggle-button pentaho-toggle-button-up "+ ((verticalOrientation)? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
  },

  //static MultiButtonComponent.prototype.clickButton
  // This method should be broken up so the UI state code is reusable outside of event processing
  clickButton: function(htmlObject, name, index, isMultiple, verticalOrientation, updateUIOnly){

    var cssWrapperClass= this.getUnselectedCss(verticalOrientation);
    var cssWrapperClassSelected= this.getSelecetedCss(verticalOrientation);

    var buttons = $("#" + htmlObject + " button");
    if (isMultiple) {//toggle button
      if (this.indexes[name] == undefined) this.indexes[name] = [];
      else if(!$.isArray(this.indexes[name])) this.indexes[name] = [this.indexes[name]];//!isMultiple->isMultiple

      var disable = false;
      for (var i = 0; i < this.indexes[name].length; ++i) {
        if (this.indexes[name][i] == index) {
          disable = true;
          this.indexes[name].splice(i, 1);
          break;
        }
      }
      if (disable){
        buttons[index].parentNode.className = cssWrapperClass + this.getExtraCss(index,buttons.length,verticalOrientation);
      } else {
        buttons[index].parentNode.className = cssWrapperClassSelected + this.getExtraCss(index,buttons.length,verticalOrientation);
        this.indexes[name].push(index);
      }
    }
    else {//de-select old, select new
      this.clearSelections(htmlObject, name, verticalOrientation);
      this.indexes[name] = index;
      buttons[index].parentNode.className = cssWrapperClassSelected + this.getExtraCss(index,buttons.length,verticalOrientation);
    }
    if(!updateUIOnly){
      this.callAjaxAfterRender(name);
    }
  },

  clearSelections: function(htmlObject, name, verticalOrientation) {
    var buttons = $("#" + htmlObject + " button");
    var cssWrapperClass = this.getUnselectedCss(verticalOrientation);
    for(var i = 0; i < buttons.length; i++){
      buttons[i].parentNode.className = cssWrapperClass + this.getExtraCss(i,buttons.length,verticalOrientation);
    }

    this.indexes[name] = [];
  },

  getExtraCss: function(index, count, verticalOrientation) {
    var css = "";
    if (index == 0 && count == 1) {
      // both first & last
      return " pentaho-toggle-button-single";
    }
    if (index == 0) {
      css += " "+ ((verticalOrientation) ? " pentaho-toggle-button-vertical-first" : " pentaho-toggle-button-horizontal-first");
    } else if (index == count-1) {
      css += " "+ ((verticalOrientation) ? " pentaho-toggle-button-vertical-last" : " pentaho-toggle-button-horizontal-last");
    }
    return css;
  },

  //static MultiButtonComponent.prototype.getSelectedIndex
  getSelectedIndex: function(name){
    return this.indexes[name];
  }
});

var AutocompleteBoxComponent = BaseComponent.extend({
  
  searchedWord : '',
  result: [],
  
  queryServer : function(searchString){
    
    if(!this.parameters) this.parameters = [];
    
    if(this.searchParam){
      this.parameters = [ [this.searchParam, this.getInnerParameterName()] ];
    }
    else if (this.parameters.length > 0){
      this.parameters[0][1] = this.getInnerParameterName();
    }
    
    if(this.maxResults){
      this.queryDefinition.pageSize = this.maxResults;
    }
    Dashboards.setParameter(this.getInnerParameterName(),this.getTextBoxValue());
    QueryComponent.makeQuery(this);
  },
  
  getTextBoxValue: function(){
    return this.textbox.val();
  },
  
  getInnerParameterName : function(){
    return this.parameter + '_textboxValue';
  },
  
  update : function() {
    
    $("#"+ this.htmlObject).empty();
    
    var initialValue = null;
    if(this.parameter){
      initialValue = Dashboards.getParameterValue(this.parameter);
    }

    var myself = this;
    
    //init parameter
    if(!Dashboards.getParameterValue(this.getInnerParameterName)){
      Dashboards.setParameter(this.getInnerParameterName(), '' );
    }

    var processChange = myself.processChange == undefined ? function(objName){
      Dashboards.processChange(objName);
    } : function(objName) {
      myself.processChange();
    };
    var processElementChange = myself.processElementChange == true ? function(value){
      Dashboards.fireChange(myself.parameter,value);
    } : undefined;
    
    //TODO:typo on minTextLength
    if(this.minTextLenght == undefined){
      this.minTextLenght = 0;
    }
    
    var opt = {
      list: function(){
        var val = myself.textbox.val();
        if(val.length >= myself.minTextLenght &&
           !(val == '' //nothing to search
             ||
             val == myself.searchedWord
             ||
            ((myself.queryInfo != null && myself.result.length == myself.queryInfo.totalRows) && //has all results
             myself.searchedWord != '' && 
             ((myself.matchType == "fromStart")? 
                val.indexOf(myself.searchedWord) == 0 :
                val.indexOf(myself.searchedWord) > -1)))) //searchable in local results
        {
          myself.queryServer(val);
          myself.searchedWord = val;
        }
        var list = [];
        for(p in myself.result) if (myself.result.hasOwnProperty(p)){
          var obj = {};
          obj.text = myself.result[p][0];
          list.push(obj);
        }
        return list;
      },
      matchType: myself.matchType == undefined ? "fromStart" : myself.matchType, /*fromStart,all*/
      processElementChange:  processElementChange,
      processChange: function(obj,value) {
        obj.value = value;
        processChange(obj.name);
      },
      multiSelection: myself.selectMulti == undefined ? false : myself.selectMulti,
      checkValue: myself.checkValue == undefined ? true : myself.checkValue,
      minTextLenght: myself.minTextLenght == undefined ? 0 : myself.minTextLenght,
      scrollHeight: myself.scrollHeight,
      applyButton: myself.showApplyButton == undefined ? true : myself.showApplyButton,
      tooltipMessage: myself.tooltipMessage == undefined ? "Click it to Apply" : myself.tooltipMessage,
      addTextElements: myself.addTextElements == undefined ? true : myself.addTextElements,
      externalApplyButtonId: myself.externalApplyButtonId,
  //    selectedValues: initialValue,
      parent: myself
    };


    this.autoBoxOpt = $("#" + this.htmlObject ).autobox(opt);
    
    //setInitialValue
    this.autoBoxOpt.setInitialValue(this.htmlObject, initialValue, this.name);
    
    this.textbox = $('#' + this.htmlObject + ' input');
  },
  getValue : function() {
    return this.value;
  },
  processAutoBoxChange : function() {
    this.autoBoxOpt.processAutoBoxChange();
  }
});

var JpivotComponent = BaseComponent.extend({
  update : function() {
    //to be backwards compatible set default value for iframeScolling
    // also added 20px 
	if(this.iframeScrolling == undefined){
		this.iframeScrolling="no";
	}
     // Build IFrame and set url
    var jpivotHTML = "<iframe id=\"jpivot_"+ this.htmlObject + "\" scrolling=\""+this.iframeScrolling+"\" onload=\"var dynamicHeight = this.contentWindow.document.body.offsetHeight+50; this.style.height = dynamicHeight + 'px';\" frameborder=\"0\" height=\""+this.iframeHeight+"\" width=\""+this.iframeWidth+"\" src=\"";
    jpivotHTML += webAppPath + "/ViewAction?solution="	+ this.solution + "&path=" + 	this.path + "&action="+ this.action;

    // Add args
    var p = new Array(this.parameters.length);
    for(var i= 0, len = p.length; i < len; i++){
      var arg = "&" + this.parameters[i][0] + "=";
      jpivotHTML += arg +  Dashboards.getParameterValue(this.parameters[i][1]);
    }

    // Close IFrame
    jpivotHTML += "\"></iframe>";

    $("#"+this.htmlObject).html(jpivotHTML);
  }
});


/*
 * Function: fnLengthChange
 * Purpose:  Change the number of records on display
 * Returns:  array:
 * Inputs:   object:oSettings - DataTables settings object
 *           int:iDisplay - New display length
 */
if($.fn.dataTableExt != undefined){ // Ensure we load dataTables before this line. If not, just keep going
  $.fn.dataTableExt.oApi.fnLengthChange = function ( oSettings, iDisplay )
  {
    oSettings._iDisplayLength = iDisplay;
    oSettings.oApi._fnCalculateEnd( oSettings );

    // If we have space to show extra rows backing up from the end point - then do so
    if ( oSettings._iDisplayEnd == oSettings.aiDisplay.length )
    {
      oSettings._iDisplayStart = oSettings._iDisplayEnd - oSettings._iDisplayLength;
      if ( oSettings._iDisplayStart < 0 )
      {
        oSettings._iDisplayStart = 0;
      }
    }

    if ( oSettings._iDisplayLength == -1 )
    {
      oSettings._iDisplayStart = 0;
    }

    oSettings.oApi._fnDraw( oSettings );

    $('select', oSettings.oFeatures.l).val( iDisplay );
  };
/* Example
	 * $(document).ready(function() {
	 *    var oTable = $('#example').dataTable();
	 *    oTable.fnLengthChange( 100 );
	 * } );
	 */
}

var TableComponent = BaseComponent.extend({
  
  ph: undefined,
  
  update : function() {
    var cd = this.chartDefinition;
    if (cd == undefined){
     Dashboards.log("Fatal - No chart definition passed","error");
      return;
    }
    cd["tableId"] = this.htmlObject + "Table";

    // Clear previous table
    this.ph = $("#"+this.htmlObject);
    this.ph.empty();
    var myself = this;
    // remove drawCallback from the parameters, or
    // it'll be called before we have an actual table...
    var croppedCd = $.extend({},cd);
    croppedCd.drawCallback = undefined;
    this.queryState = new Query(croppedCd);
    this.query = this.queryState; // for analogy with ccc component's name
    // make sure to clean sort options
    var sortBy = this.chartDefinition.sortBy || [],
      sortOptions = [];
    for (var i = 0; i < sortBy.length; i++) {
      var col = sortBy[i][0];
      var dir = sortBy[i][1];
      sortOptions.push( col + (dir == "asc" ? "A" : "D"));
    }
    this.queryState.setSortBy(sortOptions);

    if(cd.paginateServerside) {
      this.extraOptions = this.extraOptions || [];
      this.extraOptions.push(["bServerSide",true]);
      this.extraOptions.push(["bProcessing",true]);
      this.queryState.setPageSize(parseInt(cd.displayLength || 10));
      this.queryState.setCallback(function(values) {
        changedValues = undefined;
        if((typeof(myself.postFetch)=='function')){
          changedValues = myself.postFetch(values);
        }
        if (changedValues != undefined) {
          values = changedValues;
        }
        myself.processTableComponentResponse(values);
      });
      this.queryState.setParameters(this.parameters);
      this.processTableComponentResponse();
    } else {
      this.queryState.fetchData(this.parameters, function(values) {
        changedValues = undefined;
        if((typeof(myself.postFetch)=='function')){
          changedValues = myself.postFetch(values);
        }
        if (changedValues != undefined) {
          values = changedValues;
        }
        myself.rawData = values;
        myself.processTableComponentResponse(values);
      });
    }
  },

  pagingCallback: function(url, params,callback,dataTable) {
    function p( sKey ) {
      for ( var i=0, iLen=params.length ; i<iLen ; i++ ) {
        if ( params[i].name == sKey ) {
          return params[i].value;
        }
      }
      return null;
    }
    var sortingCols = p("iSortingCols"),sort = [];
    if (sortingCols > 0) {
      for (var i = 0; i < sortingCols; i++) {
        var col = p("iSortCol_" + i);
        var dir = p("sSortDir_" + i);
        sort.push( col + (dir == "asc" ? "A" : "D"));
      }
    }
    var query = this.queryState,
    myself = this;
    query.setSortBy(sort.join(","));
    query.setPageSize(parseInt(p("iDisplayLength")));
    query.setPageStartingAt(p("iDisplayStart"));
    query.fetchData(function(d) {
      if (myself.postFetch){
        var mod = myself.postFetch(d,dataTable);
        if (typeof mod !== "undefined") {
          d = mod;
        }
      }
      var response = {
        iTotalRecords: d.queryInfo.totalRows,
        iTotalDisplayRecords: d.queryInfo.totalRows
        };
      response.aaData = d.resultset;
      response.sEcho = p("sEcho");
      myself.rawData = d;
      callback(response);
    });
  },

  processTableComponentResponse : function(json)
  {
    // General documentation here: http://datatables.net
    var myself = this,
      cd = this.chartDefinition,
      extraOptions = {};
   
    myself.ph.trigger('cdfTableComponentProcessResponse');
    
   
    // Set defaults for headers / types
    if(typeof cd.colHeaders === "undefined" || cd.colHeaders.length == 0)
      cd.colHeaders = json.metadata.map(function(i){return i.colName});

    if(typeof cd.colTypes === "undefined" || cd.colTypes.length == 0)
      cd.colTypes = json.metadata.map(function(i){return i.colType.toLowerCase()});

    var dtData0 = TableComponent.getDataTableOptions(cd),
    dtData;

    // Build a default config from the standard options
    $.each(this.extraOptions ? this.extraOptions : {}, function(i,e){
      extraOptions[e[0]] = e[1];
    });
    dtData = $.extend(cd.dataTableOptions,dtData0,extraOptions);


    // Sparklines still applied to drawcallback
    var myself = this;
    dtData.fnDrawCallback = function(dataTableSettings) {
      var dataTable = this;
      myself.ph.find("tbody tr").each(function(row,tr){
          if (dataTable.fnGetPosition(tr) == null) //Tr not found in datatable, continue
              return true;
        $(tr).children("td:visible").each(function(col,td){
            var position = dataTable.fnGetPosition(td),
                rowIdx = position[0],
                colIdx = position[2];
            var colType = cd.colTypes[colIdx];
            var addIn = myself.getAddIn("colType",colType);
            if (addIn) {
              var state = {},
                target = $(td),
                results = myself.rawData;
              if(!(target.parents('tbody').length)) {
                return;
              } else if (target.get(0).tagName != 'TD') {
                target = target.closest('td');
              }
              state.rawData = results;
              state.tableData = dataTable.fnGetData();
              state.colIdx = colIdx;
              state.rowIdx = rowIdx;
              state.series = results.resultset[state.rowIdx][0];
              state.category = results.metadata[state.colIdx].colName;
              state.value =  results.resultset[state.rowIdx][state.colIdx];
              if(cd.colFormats) {
                state.colFormat = cd.colFormats[state.colIdx];
              }
              state.target = target;
              addIn.call(td,state,myself.getAddInOptions("colType",addIn.getName()));
            } else if(cd.colFormats) {
              var format = cd.colFormats[position[1]],
                value = myself.rawData.resultset[rowIdx][colIdx];
              if (format && (typeof value != "undefined" && value !== null)) {
                $(td).text(sprintf(format,value));
              }
            }
        });
      });


      if(typeof cd.drawCallback == 'function'){
        cd.drawCallback.apply(myself,arguments);
      }

    };


    /* We need to make sure we're getting data from the right place,
     * depending on whether we're using CDA
     */
    if (json) {
      dtData.aaData = json.resultset;
    } 
    
    ////else {
    //  dtData.aaData = json;
  //  }
  
  
  
    /* If we're doing server-side pagination, we need to set up the server callback
     */
    if (dtData.bServerSide) {
      dtData.fnServerData = function(u,p,c) {
        myself.pagingCallback(u,p,c,this);
      };
    }
    myself.ph.html("<table id='" + this.htmlObject + "Table' class=\"tableComponent\" width=\"100%\"></table>");
    // We'll first initialize a blank table so that we have a table handle to work with while the table is redrawing
    this.dataTable = $("#"+this.htmlObject+'Table').dataTable(dtData);
  
    // We'll create an Array to keep track of the open expandable rows.
    this.dataTable.anOpen = [];


    myself.ph.find ('table').bind('click',function(e) {
      if (typeof cd.clickAction === 'function' || myself.expandOnClick) { 
        var state = {},
          target = $(e.target),
          results = myself.queryState.lastResults();
        if(!(target.parents('tbody').length)) {
          return;
        } else if (target.get(0).tagName != 'TD') {
          target = target.closest('td');
        }
        var position = myself.dataTable.fnGetPosition(target.get(0));
        state.rawData = myself.rawData;
        state.tableData = myself.dataTable.fnGetData();
        state.colIdx = position[1];
        state.rowIdx = position[0];
        state.series = results.resultset[state.rowIdx][0];
        state.category = results.metadata[state.colIdx].colName;
        state.value =  results.resultset[state.rowIdx][state.colIdx];
        state.target = target;
        state.colFormat = cd.colFormats[state.colIdx]; 
        
        if (myself.expandOnClick) {
        	myself.handleExpandOnClick(state);
        }
        if (cd.clickAction)
	        cd.clickAction.call(myself,state);
      }
    });
    myself.ph.trigger('cdfTableComponentFinishRendering');
  },

   handleExpandOnClick:     function(event){     
        var myself = this,
            detailContainerObj = myself.expandContainerObject,
            activeclass = "expandingClass";
        if(typeof activeclass === 'undefined'){
          activeclass = "activeRow";
        }
        var obj = event.target.closest("tr");
            var a = event.target.closest("a");
            if (a.hasClass ('info')){
                    return;
            }else{
                    var row = obj.get(0);
                   
                    var value = event.series;
                    var htmlContent = $("#" + detailContainerObj).html();
                   
                    var anOpen = myself.dataTable.anOpen;
                    var i = $.inArray( row, anOpen );
                   
                    if( obj.hasClass(activeclass) ){
                      obj.removeClass(activeclass);
                      myself.dataTable.fnClose( row );
                      anOpen.splice(i,1);
                    }
                    else{
                            // Closes all open expandable rows .
                            for ( var j=0; j < anOpen.length; j++ ){
                                $(anOpen[j]).removeClass(activeclass);
                                myself.dataTable.fnClose( anOpen[j] );
                                anOpen.splice(j ,1);
                            }
                            
                            //Closes previously opened expandable row.
                           /* var prev = obj.siblings('.'+activeclass).each(function(i,d){
                                    var curr = $(d);
                                    curr.removeClass(activeclass);
                                    myself.dataTable.fnClose( d );
                            });*/

                            obj.addClass(activeclass);
                            
                            //Read parameters and fire changes
                            var results = myself.queryState.lastResults();
                            $(myself.expandParameters).each(function f(i, elt) {                            
                            	Dashboards.fireChange(elt[1], results.resultset[event.rowIdx][parseInt(elt[0],10)]);                            
                            });
                            myself.dataTable.fnOpen( row, htmlContent, activeclass );
                            anOpen.push( row );
                    };
            };
    }
},
{
  getDataTableOptions : function(options) {
    var dtData = {};

    if(options.tableStyle == "themeroller"){
      dtData.bJQueryUI = true;
    }
    dtData.bInfo = options.info;
    dtData.iDisplayLength = options.displayLength;
    dtData.bLengthChange = options.lengthChange;
    dtData.bPaginate = options.paginate;
    dtData.bSort = options.sort;
    dtData.bFilter = options.filter;
    dtData.sPaginationType = options.paginationType;
    dtData.sDom = options.sDom;
    dtData.aaSorting = options.sortBy;
    dtData.oLanguage = options.oLanguage;

    if(options.colHeaders != undefined){
      dtData.aoColumns = new Array(options.colHeaders.length);
      for(var i = 0; i< options.colHeaders.length; i++){
        dtData.aoColumns[i]={}
        dtData.aoColumns[i].sClass="column"+i;
      };
      $.each(options.colHeaders,function(i,val){
        dtData.aoColumns[i].sTitle=val;
        if(val == "") dtData.aoColumns[i].bVisible=false;
      });  // colHeaders
      if(options.colTypes!=undefined){
        $.each(options.colTypes,function(i,val){
          var col = dtData.aoColumns[i];
          // Specific case: hidden cols
          if(val == "hidden") col.bVisible=false;
          col.sClass+=" "+val;
          col.sType=val;

        })
      };  // colTypes
      if(options.colFormats!=undefined){
      // Changes are made directly to the json

      };  // colFormats

      var bAutoWidth = true;
      if(options.colWidths!=undefined){
        $.each(options.colWidths,function(i,val){
          if (val!=null){
            dtData.aoColumns[i].sWidth=val;
            bAutoWidth = false;
          }
        })
      }; //colWidths
      dtData.bAutoWidth = bAutoWidth;

      if(options.colSortable!=undefined){
        $.each(options.colSortable,function(i,val){
          if (val!=null && ( !val || val == "false" ) ){
            dtData.aoColumns[i].bSortable=false
          }
        })
      }; //colSortable
      if(options.colSearchable!=undefined){
        $.each(options.colSearchable,function(i,val){
          if (val!=null && ( !val || val == "false" ) ){
            dtData.aoColumns[i].bSearchable=false
          }
        })
      }; //colSearchable

    }

    return dtData;
  }

}
);

var CommentsComponent = BaseComponent.extend({
  update : function() {

    // Set page start and length - for pagination
    if(typeof this.firstResult == 'undefined'){
      this.firstResult = 0;
    }
    if(typeof this.maxResults == 'undefined'){
      this.maxResults = 4;
    }

    if (this.page == undefined){
     Dashboards.log("Fatal - no page definition passed","error");
      return;
    }

    this.firePageUpdate();

  },
  firePageUpdate: function(json){

    // Clear previous table
    var placeHolder = $("#"+this.htmlObject);
    placeHolder.empty();
    placeHolder.append('<div class="cdfCommentsWrapper ui-widget"><dl class="cdfCommentsBlock"/></div>');
    var myself = this;
    var args = {
      action: "list",
      page: this.page,
      firstResult: this.firstResult,
      maxResults: this.maxResults + 1 // Add 1 to maxResults for pagination look-ahead
    };
    $.getJSON(webAppPath + "/content/pentaho-cdf/Comments", args, function(json) {
      myself.processCommentsList(json);
    });
  },

  processCommentsList : function(json)
  {
    // Add the possibility to add new comments
    var myself = this;
    var placeHolder = $("#"+this.htmlObject + " dl ");
    myself.addCommentContainer = $('<dt class="ui-widget-header comment-body"><textarea/></dt>'+
      '<dl class="ui-widget-header comment-footer">'+
      '<a class="cdfAddComment">Add Comment</a>'+
      ' <a class="cdfCancelComment">Cancel</a></dl>'
      );
    myself.addCommentContainer.find("a").addClass("ui-state-default");
    myself.addCommentContainer.find("a").hover(
      function(){
        $(this).addClass("ui-state-hover");
      },
      function(){
        $(this).removeClass("ui-state-hover");
      }
      )

    // Cancel
    $(".cdfCancelComment",myself.addCommentContainer).bind('click',function(e){
      myself.addCommentContainer.hide("slow");
      myself.addCommentContainer.find("textarea").val('');
    });

    // Add comment
    $(".cdfAddComment",myself.addCommentContainer).bind('click',function(e){
      var tarea = $("textarea",myself.addCommentContainer);
      var code = tarea.val();
      tarea.val('');
      var args = {
        action: "add",
        page: myself.page,
        comment: code
      };
      $.getJSON(webAppPath + "/content/pentaho-cdf/Comments", args, function(json) {
        myself.processCommentsAdd(json);
      });
      myself.addCommentContainer.hide("slow");
    });

    myself.addCommentContainer.hide();
    myself.addCommentContainer.appendTo(placeHolder);

    // Add comment option
    var addCodeStr = '<div class="cdfAddComment"><a> Add comment</a></div>';

    $(addCodeStr).insertBefore(placeHolder).bind('click',function(e){
      myself.addCommentContainer.show("slow");
      $("textarea",myself.addCommentContainer).focus();
    });

    if (typeof json.error != 'undefined' || typeof json.result == 'undefined') {
      placeHolder.append('<span class="cdfNoComments">There was an error processing comments</span>' );
      json.result = [];
    } else
    if (json.result.length == 0 ){
      placeHolder.append('<span class="cdfNoComments">No comments yet</span>' );
    }
    $.each(json.result.slice(0,this.maxResults), // We drop the lookahead item, if any
      function(i,comment){
        var bodyClass = comment.isMe?"ui-widget-header":"ui-widget-content";
        placeHolder.append('<dt class="'+ bodyClass +' comment-body"><p>'+comment.comment+'</p></dt>');
        placeHolder.append('<dl class="ui-widget-header comment-footer ">'+comment.user+ ",  " + comment.createdOn +  '</dl>');

      });


    // Add pagination support;
    var paginationContent = $('<div class="cdfCommentsPagination ui-helper-clearfix"><ul class="ui-widget"></ul></div>');
    var ul = $("ul",paginationContent);
    if(this.firstResult > 0){
      ul.append('<li class="ui-state-default ui-corner-all"><span class="cdfCommentPagePrev ui-icon ui-icon-carat-1-w"></a></li>');
      ul.find(".cdfCommentPagePrev").bind("click",function(){
        myself.firstResult -= myself.maxResults;
        myself.firePageUpdate();
      });
    }
    // check if we got a lookahead hit
    if(this.maxResults < json.result.length) {
      ul.append('<li class="ui-state-default ui-corner-all"><span class="cdfCommentPageNext ui-icon ui-icon-carat-1-e"></a></li>');
      ul.find(".cdfCommentPageNext").bind("click",function(){
        myself.firstResult += myself.maxResults;
        myself.firePageUpdate();
      });
    }
    paginationContent.insertAfter(placeHolder);


  },
  processCommentsAdd: function(json){
    // json response
    var result = json.result;
    var placeHolder = $("#"+this.htmlObject + " dl ");

    var container = $('<dt class="ui-widget-header comment-body">'+ result.comment +'</dt>'+
      '<dl class="ui-widget-header comment-footer">'+ result.user +
      ", " + result.createdOn + '</dl>'
      );
    container.hide();
    container.insertAfter($("dl:eq(0)",placeHolder));
    container.show("slow");
    this.update();
  }
}
);

var PivotLinkComponent = BaseComponent.extend({
  update : function() {
    var title = this.tooltip==undefined?"View details in a Pivot table":this.tooltip;
    // WPG: this assumes name is global name, can I pass in the object directly instead?
    var link = $('<a class="pivotLink"> </a>').html(this.content).attr("href","javascript:PivotLinkComponent.openPivotLink("+ this.name +")").attr("title",title);

    $("#"+this.htmlObject).empty();
    $("#"+this.htmlObject).html(link);

    $('a.pivotLink').tooltip({
      showURL: false,
      track:true,
      delay: 1000,
      opacity: 0.5
    });
  }
},{
  openPivotLink : function(object) {
    var url = webAppPath + "/Pivot?solution=system&path=pentaho-cdf/actions&action=jpivot.xaction&";

    var qd = object.pivotDefinition;
    var parameters = [];
    for(p in qd){
      var key = p;
      var value = typeof qd[p]=='function'?qd[p]():qd[p];
      //alert("key: " + key + "; Value: " + value);
      parameters.push(key + "=" + encodeURIComponent(value));
    }
    url += parameters.join("&");

    var _href = url.replace(/'/g,"&#39;");
    $.fancybox({
      type:"iframe",
      href:_href,
      width: $(window).width(),
      height:$(window).height()
    });
  }
});

var QueryComponent = BaseComponent.extend({
  visible: false,
  update : function() {
    QueryComponent.makeQuery(this);
  },
  warnOnce: function() {
  Dashboards.log("Warning: QueryComponent behaviour is due to change. See " +
    "http://http://www.webdetails.org/redmine/projects/cdf/wiki/QueryComponent" + 
    " for more information");
    delete(this.warnOnce);
  }
},
{
  makeQuery: function(object){

    if (this.warnOnce) {this.warnOnce();}
    var cd = object.queryDefinition;
    if (cd == undefined){
     Dashboards.log("Fatal - No query definition passed","error");
      return;
    }
    var query = new Query(cd);
    
    query.fetchData(object.parameters, function(values) {
      // We need to make sure we're getting data from the right place,
      // depending on whether we're using CDA

      changedValues = undefined;
      object.metadata = values.metadata;
      object.result = values.resultset != undefined ? values.resultset: values;
      object.queryInfo = values.queryInfo;
      if((typeof(object.postFetch)=='function')){
        changedValues = object.postFetch(values);
      }
      if (changedValues != undefined){
        values = changedValues;

      }

      if (object.resultvar != undefined){
        Dashboards.setParameter(object.resultvar, object.result);
      }
      object.result = values.resultset != undefined ? values.resultset: values;
      if (typeof values.resultset != "undefined"){
        object.metadata = values.metadata;
        object.queryInfo = values.queryInfo;
      }
    });

  }
}
);

var MdxQueryGroupComponent = BaseComponent.extend({
  visible: false,
  update : function() {
    OlapUtils.updateMdxQueryGroup(this);
  }
});

var ExecuteXactionComponent = BaseComponent.extend({
  visible: false,

  update : function() {
    // 2 modes of working; if it's a div, create a button inside it
    var myself = this;
    var o = $("#"+ this.htmlObject);
    if ($.inArray(o[0].tagName.toUpperCase(),["SPAN","DIV"]) > -1){
      // create a button
      o = $("<button/>").appendTo(o.empty());
      if (o[0].tagName=="DIV") o.wrap("<span/>");
      if (this.label != undefined) o.text(this.label);
      o.button();
    }
    o.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)
    o.bind("click", function(){
      var success = typeof(myself.preChange)=='undefined' ? true : myself.preChange();
      if(success) {
        myself.executeXAction();
      }
      typeof(myself.postChange)=='undefined' ? true : myself.postChange();
    });
  },

  executeXAction : function() {
    var url = webAppPath + "/ViewAction?solution=" + this.solution + "&path=" + this.path + "&action=" + this.action + "&";

    var p = new Array(this.parameters.length);
    var parameters = [];

    for(var i= 0, len = p.length; i < len; i++){
      var key = this.parameters[i][0];
      var value = Dashboards.getParameterValue(this.parameters[i][1]);

      if($.isArray(value))
        $(value).each(function(p) {
          parameters.push(key + "=" + encodeURIComponent(this));
        });
      else
        parameters.push(key + "=" + encodeURIComponent(value));
    }

    url += parameters.join("&");

    var _href = url.replace(/'/g,"&#39;");
    $.fancybox({
      type:"iframe",
      href:_href,
      width: $(window).width(),
      height:$(window).height() - 50
    });
  }

});

var ButtonComponent = BaseComponent.extend({
  update : function() {
    var b = $("<button type='button'/>").text(this.label).unbind("click").bind("click", this.expression);
    if (typeof this.buttonStyle === "undefined" || this.buttonStyle === "themeroller")
      b.button();
    b.appendTo($("#"+ this.htmlObject).empty());
  }
});



var PrptComponent = BaseComponent.extend({

  update: function(){

    this.clear();

    var options = this.getOptions();
    //options.showParameters = false;

    if(options["dashboard-mode"]){
      var url = webAppPath + '/content/reporting';
      var myself=this;
      $.ajax({
        url: url,
        data: options,
        dataType:"html",
        success: function(json){
          $("#"+myself.htmlObject).html(json);
        }
      });
    }
    else{
      var url = webAppPath + '/content/reporting/reportviewer/report.html';
      var encodeArray = function(k,v) {
        var arr = [];
        for (var i = 0; i < v.length;i++) {
          arr.push(encodeURIComponent(k)+'='+encodeURIComponent(v[i]));
        }
        return arr;
      };
      var a=[];
      $.each(options,function(k,v){
        if (typeof v == 'object') {
          a.push.apply(a,encodeArray(k,v));
        } else {
          a.push(encodeURIComponent(k)+"="+encodeURIComponent(v));
        }
      });
      /*
       * We really shouldn't mess around with the CDF running call counter,
       * but if we don't do so in this case, the report will count as "finished"
       * even though nothing has been loaded into the iframe. We'll increment it
       * here,decrement it again from the iframe's onload event.
       */
      var myself = this;
      if(!this.loading){
        this.loading = true;
        Dashboards.incrementRunningCalls();
      }
      var iframe = $("<iframe style='width:100%;height:100%;border:0px' frameborder='0' border='0' />");
      iframe.load(function(){
        /* This is going to get called several times with "about:blank"-style pages.
         * We're only interested in the one call that happens once the page is _really_
         * loaded -- which means an actual document body.
         */
        if(this.contentWindow.document.body.innerHTML){
          myself.loading = false;
          Dashboards.decrementRunningCalls();
        }
      });
      $("#"+this.htmlObject).empty().append(iframe);
      iframe[0].contentWindow.location = url + "?"+ a.join('&');
    }
  },

  getOptions: function(){

    var options = {
      paginate : this.paginate || false,
      showParameters: this.showParameters || false,
      autoSubmit: (this.autoSubmit || this.executeAtStart) || false,
      "dashboard-mode": this.iframe==undefined?false:!this.iframe,
      solution: this.solution,
      path: this.path,
      action: this.action
    };
    if(this.paginate){

      options["output-target"] = "table/html;page-mode=page";
    } else {
      options["output-target"] = "table/html;page-mode=stream";
    }

    // process params and update options
    $.map(this.parameters,function(k){
      options[k[0]] = k.length==3?k[2]: Dashboards.getParameterValue(k[1]);
    });

    options["output-type"] = "";

    return options;

  }
});


var ExecutePrptComponent = PrptComponent.extend({
  visible: false,

  update : function() {
    // 2 modes of working; if it's a div, create a button inside it
    var myself = this;
    var o = $("#"+ this.htmlObject);
    if ($.inArray(o[0].tagName.toUpperCase(),["SPAN","DIV"]) > -1){
      // create a button
      o = $("<button/>").appendTo(o.empty());
      if (o[0].tagName=="DIV") o.wrap("<span/>");
      if (this.label != undefined) o.text(this.label);
      o.button();
    }
    o.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)
    o.bind("click", function(){
      var success = typeof(myself.preChange)=='undefined' ? true : myself.preChange();
      if(success) {
        myself.executePrptComponent();
      }
      typeof(myself.postChange)=='undefined' ? true : myself.postChange();
    });
  },

  executePrptComponent: function(){

    var options = this.getOptions();
    var url = webAppPath + '/content/reporting/reportviewer/report.html';
    var a=[];
    var encodeArray = function(k,v) {
      var arr = [];
      for (var i = 0; i < v.length;i++) {
        arr.push(encodeURIComponent(k)+'='+encodeURIComponent(v[i]));
      }
      return arr;
    };
    $.each(options,function(k,v){
      if (typeof v == 'object') {
        a.push.apply(a,encodeArray(k,v));
      } else {
        a.push(encodeURIComponent(k)+"="+encodeURIComponent(v));
      }
    });
    $.fancybox({
      type:"iframe",
      href: url + "?"+ a.join('&') ,
      width: $(window).width(),
      height:$(window).height() - 50
    });

  }
}
);

var AnalyzerComponent = BaseComponent.extend({

  update: function(){
    
    this.clear();
            
    var options = this.getOptions();
    var url = webAppPath + '/content/analyzer/';
    var myself=this;

    // enable editing the view?
    this.viewOnly?url+='viewer':url+='editor';

    var height = this.height? this.height: "480px";
    var width = this.width? this.width: "100%";

    var iFrameHTML = this.generateIframe(this.htmlObject,url,options,height,width);
    $("#"+this.htmlObject).html(iFrameHTML);
  },

  getOptions: function() {
                            
    var options = {
      solution : this.solution,
      path: this.path,
      action: this.action,
      command: this.command == undefined? "open": this.command,
      showFieldList: this.showFieldList == undefined? false: this.showFieldList,
      frameless: this.frameless
    };

    // process params and update options
    $.map(this.parameters,function(k){
      options[k[0]] = k.length==3?k[2]: Dashboards.getParameterValue(k[1]);
    });
            
    return options;
  },
  
  generateIframe: function(htmlObject,url,parameters,height,width) {
	  var iFrameHTML = '<iframe id="iframe_'+ htmlObject + '"' +
	  ' frameborder="0"' +
	  ' height="' + height + '"' +
	  ' width="' + width + '"' +
	  ' src="' + url + "?";

	  iFrameHTML += $.param(parameters, true);
	  iFrameHTML += "\"></iframe>";
	       
	  return iFrameHTML;
	}
});

var FreeformComponent = BaseComponent.extend({
  update : function() {
    var myself = this;
    this.customfunction(this.parameters || []);
  }
})
