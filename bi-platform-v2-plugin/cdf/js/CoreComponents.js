var BaseComponent = Base.extend({
		//type : "unknown",
		visible: true,
		clear : function() {
			$("#"+this.htmlObject).empty();
		},
		getValuesArray : function() {
		
		
			var jXML;
			if ( typeof(this.valuesArray) == 'undefined' || this.valuesArray.length == 0) {
                        if(typeof(this.queryDefinition) != 'undefined'){
				
				var vid = (this.queryDefinition.queryType == "sql")?"sql":"none";
				if((this.queryDefinition.queryType == "mdx") && (!this.valueAsId)){
					vid = "mdx";
				}
				QueryComponent.makeQuery(this);
				var myArray = new Array();
				for(p in this.result){	
					switch(vid){
						case "sql": myArray.push([this.result[p][0],this.result[p][1]]);break;
						case "mdx": myArray.push([this.result[p][1],this.result[p][0]]);break;
						default: myArray.push([this.result[p][0],this.result[p][0]]);break;
					}
                                }
				return myArray;
			} else {

				//go through parameter array and update values
				var p = new Array(this.parameters?this.parameters.length:0);
				for(var i= 0, len = p.length; i < len; i++){
					var key = this.parameters[i][0];
					var value = this.parameters[i].length == 3 ? this.parameters[i][2] : Dashboards.getParameterValue(this.parameters[i][1]);
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
				return myArray; }
			} else {
				return this.valuesArray;
			}
		},
		parseArray : function(jData,includeHeader){

			if(jData === null){
				return []; //we got an error...
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

		}
	});

var XactionComponent = BaseComponent.extend({
		update : function() {
		  try {
			if (typeof(this.iframe) == 'undefined' || !this.iframe) {
				// go through parameter array and update values
				var p = new Array(this.parameters?this.parameters.length:0);
				for(var i= 0, len = p.length; i < len; i++){
					var key = this.parameters[i][0];
					var value = this.parameters[i].length == 3 ? this.parameters[i][2] : Dashboards.getParameterValue(this.parameters[i][1]);
					p[i] = [key,value];
				} 
	
				var myself=this;
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
				" width=\"100%\"" + 
				" src=\"";
				
				xactionIFrameHTML += webAppPath + "/ViewAction?wrapper=false&solution="	+ this.solution + "&path=" + this.path + "&action="+ this.action;

				// Add args
				var p = new Array(this.parameters.length);
				for(var i= 0, len = p.length; i < len; i++){
				  var arg = "&" + encodeURIComponent(this.parameters[i][0]) + "=";
				  if (this.parameters[i].length == 3) {
				    xactionIFrameHTML += arg + encodeURIComponent(this.parameters[i][2]);
				  } else {
				    xactionIFrameHTML += arg + encodeURIComponent(Dashboards.getParameterValue(this.parameters[i][1]));
				  }
				} 
				
				// Close IFrame
				xactionIFrameHTML += "\"></iframe>";

				$("#"+this.htmlObject).html(xactionIFrameHTML);
			}
		  } catch (e) {
			  // don't cause the rest of CDF to fail if xaction component fails for whatever reason
		  }
		}
	});

var SelectBaseComponent = BaseComponent.extend({
		visible: false,
		update : function() {
			var myArray = this.getValuesArray();

			selectHTML = "<select";
			selectHTML += " id='" + this.name + "'";

			// set size
			if (this.size != undefined){
				selectHTML += " size='" + this.size + "'";
			}
			if (this.type.toLowerCase().indexOf("selectmulti") != -1){
				selectHTML += " multiple";
			}
			selectHTML += ">";
			var firstVal;
			var vid = this.valueAsId==false?false:true;
			for(var i= 0, len  = myArray.length; i < len; i++){
				if(myArray[i]!= null && myArray[i].length>0) {
					var ivid = vid || myArray[i][0] == null;
					var value, label;
					if (myArray[i].length > 1) {
						value = myArray[i][ivid?1:0];
						label = myArray[i][1];
					} else {
						value = myArray[i][0];
						label = myArray[i][0];
					}
					if (i == 0) {
						firstVal = value;
					}
					selectHTML += "<option value = '" + value + "' >" + label + "</option>";
				}
			} 

			selectHTML += "</select>";

			// update the placeholder
			$("#"+this.htmlObject).html(selectHTML);
			var currentVal = Dashboards.getParameterValue(this.parameter);
			currentVal = typeof currentVal == 'function' ? currentVal(): currentVal;
			if (typeof(this.defaultIfEmpty) != 'undefined' && this.defaultIfEmpty && currentVal == '') {
				Dashboards.setParameter(this.parameter, firstVal);
			} else {
				$("#"+this.name).val(currentVal);
			}
			var myself = this;
			$("#"+this.name).change(function() {
					Dashboards.processChange(myself.name);
				});
		}
	});

var SelectComponent = SelectBaseComponent.extend({
		getValue : function() {
			return $("#"+this.name).val();
		}
	});

var SelectMultiComponent = SelectBaseComponent.extend({
		getValue : function() {
			return $("#"+this.name).val();
		}
	});

var JFreeChartComponent = BaseComponent.extend({
		update : function() {
			this.callPentahoAction("jfreechart.xaction");
		},
		
		getParameters: function() {
		
			var cd = this.chartDefinition;
			// Merge the stuff with a chartOptions element
			if (cd == undefined){
				alert("Fatal - No chartDefinition passed");
				return;
			}
			
			var cd0 = cd.chartOptions != undefined ? $.extend({},Dashboards.ev(cd.chartOptions), cd) : cd;

			// go through parametere array and update values
			var parameters = [];
			for(p in cd0){
				var key = p;
				var value = typeof cd0[p]=='function'?cd0[p]():cd0[p];
				// alert("key: " + key + "; Value: " + value);
				parameters.push([key,value]);
			}
			
			return parameters;
		
		},
		
		callPentahoAction: function(action) {
			// increment runningCalls
			Dashboards.incrementRunningCalls();

			var myself = this;
			// callback async mode
			Dashboards.callPentahoAction(myself,"cdf", "components", action, this.getParameters(),function(jXML){
				
					if(jXML != null){
						if(myself.chartDefinition.caption != undefined)
							myself.buildCaptionWrapper($(jXML.find("ExecuteActivityResponse:first-child").text()),action);
						else
							$('#'+myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
					}
					Dashboards.decrementRunningCalls();

				});
		},
		
		buildCaptionWrapper: function(chart,cdfComponent){
		
			var exportFile = function(type,cd){
				var obj = $.extend({solution: "cdf",path: "components",action:"jtable.xaction",exportType: type},cd);
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
					show: function(){ return cd.chartType != 'function' && ( cd.chartType == "BarChart" ||  cd.chartType == "PieChart")},
					icon: function(){ return cd.chartType == "BarChart" ? webAppPath + '/content/pentaho-cdf/resources/style/images/pie_icon.png': webAppPath + '/content/pentaho-cdf/resources/style/images/bar_icon.png';},
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
						var width = 200,height = 200; var urlTemplate,parameterName = "";
						for(p in parameters){
							if(parameters[p][0] == 'width'){width += parameters[p][1]; parameters[p] = ['width',width]};
							if(parameters[p][0] == 'height'){height += parameters[p][1]; parameters[p] = ['height',height]};
							if(parameters[p][0] == 'parameterName'){parameterName = parameters[p][1]; parameters[p] = ['parameterName','parameterValue']};
							if(parameters[p][0] == 'urlTemplate'){urlTemplate = parameters[p][1]; parameters[p] = ['urlTemplate',"javascript:chartClick('" + myself.name +"','{parameterValue}');"]};
						}
						myself.zoomCallBack = function(value){eval(urlTemplate.replace("{" + parameterName + "}",value));};
						Dashboards.callPentahoAction(myself,"cdf", "components", cdfComponent, parameters,function(jXML){
							if(jXML != null){
								var openWindow = window.open(webAppPath + "/content/pentaho-cdf/js/captify/zoom.html","_blank",'width=' + (width+10) + ',height=' + (height+10));
								var maxTries = 10;
								var loadChart = function(){
									if(openWindow.loadChart != undefined)openWindow.loadChart(jXML.find("ExecuteActivityResponse:first-child").text())
									else if(maxTries> 0) {maxTries-=1;setTimeout(loadChart,500);}
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
						myself.pivotDefinition = {jndi: cd.jndi, catalog:cd.catalog, query:cd.query};
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
				
				if (this.chartDefinition.queryType != "mdx" && captionOptions[o].title == "Details") {show = false;};
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
			
			
			$('img.captify').captify($.extend({bDetails:bDetails, spanWidth: '95%',hideDelay:3000,hasButton:false,opacity:'0.5'}, cd.caption));	
			
			//Add events after captify has finished.
			bDetails.one('capityFinished',function(e,wrapper){
				var chartOffset = chart.offset();
				var bDetailsOffset = bDetails.offset();
				if(chart.length > 1){					
					bDetails.bind("mouseenter",function(){$("#" + myself.htmlObject + 'image').trigger('detailsClick',[this]);});
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
				alert("Fatal - No chartDefinition passed");
				return;
			}

			var intervals = cd.intervals;
			if (intervals == undefined){
				alert("Fatal - No intervals passed");
				return;
			}

			var colors = cd.colors;
			if(colors != undefined && intervals.length != colors.length){
				alert("Fatal - Number of intervals differs from number of colors");
				return;
			}

			this.callPentahoAction("jfreechartdial.xaction");

		}
	});
	
var OpenFlashChartComponent = JFreeChartComponent.extend({

	callPentahoAction: function() {
	
		Dashboards.incrementRunningCalls();

		var myself = this;
	
		Dashboards.callPentahoAction(myself,"cdf", "components", "openflashchart.xaction", this.getParameters(),function(jXML){
			
				if(jXML != null){
					var result = jXML.find("ExecuteActivityResponse:first-child").text().replace(/openflashchart/g,webAppPath + "/openflashchart");
					getDataFuntion = result.match(/getData.*\(\)/gi);
					$('#'+myself.htmlObject).html(result);
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
				alert("Fatal - No trafficDefinition passed");
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
			Dashboards.callPentahoAction(myself,"cdf", "components", "traffic.xaction", parameters, 
				function(result){ 
					var value = $(result).find("VALUE").text();
					var i = $("<img>").attr("src",value<=cd.intervals[0]?Dashboards.TRAFFIC_RED:(value>=cd.intervals[1]?Dashboards.TRAFFIC_GREEN:Dashboards.TRAFFIC_YELLOW));
					$('#'+myself.htmlObject).html(i);
					
					if(cd.showValue != undefined && cd.showValue == true){
						var tooltip = "Value: " + value + " <br /><img align='middle' src='" + Dashboards.TRAFFIC_RED + "'/> &le; "  + cd.intervals[0] + " &lt;  <img align='middle' src='" + Dashboards.TRAFFIC_YELLOW + "'/> &lt; " + cd.intervals[1] + " &le; <img align='middle' src='" + Dashboards.TRAFFIC_GREEN + "'/> <br/>" + (tooltip != undefined?tooltip:""); 
						$('#'+myself.htmlObject).attr("title",tooltip + ( myself._tooltip != undefined? myself._tooltip:"")).tooltip({delay:0,track: true,fade: 250});
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
				alert("Fatal - No chart definition passed");
				return;
			}

			// Set default options:
			if (cd.showValues == undefined){
				cd.showValues = true;
			}


			var cols = typeof cd['columns']=='function'?cd['columns']():cd['columns'];
			if (cols == undefined || cols.length == 0){
				alert("Fatal - No 'columns' property passed in chartDefinition");
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
					toolTipFormat: function (value,plot){return  plot._name + " = " + toFormatedString(value);},
					headerFormat: function (value,plot){return  plot._name + " = " + toFormatedString(value) + "&nbsp;&nbsp;";}
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
					id: cd.dateRangeInput != undefined ? "eventPlot" : "events", eventSource: eventSource2,  
					timeGeometry: timePlotTimeGeometry,
					lineColor: "#FF0000",
					rangeColor: this.rangeColor,
					getSelectedRegion: function(start,end){
						myself.updateDateRangeInput(start,end);
					}});
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
			var timePlotEventSourceUrl = webAppPath + "/ViewAction?solution=cdf&path=components&action=timelinefeeder.xaction&" + parameters.join('&');
			var myself = this;
			if(cd.events && cd.events.show == true){

				// go through parametere array and update values
				var parameters = [];
				for(p in cd.events){
					var key = p;
					var value = typeof cd.events[p]=='function'?cd.events[p]():cd.events[p];
					parameters.push(key+"="+value);
				} 

				var eventUrl = webAppPath + "/ViewAction?solution=cdf&path=components&action=timelineeventfeeder.xaction&" + parameters.join('&');

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
				if(start > end){var aux = start; start = end; end = aux;}
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
		update : function() {
			selectHTML = "<input";
			selectHTML += " type=test id='" + this.name +"' name='" + this.name + 
				"' + value='"+ Dashboards.getParameterValue(this.parameter) + "'>";
			$("#"+this.htmlObject).html(selectHTML);
			var myself = this;
			$("#"+this.name).change(function() { Dashboards.processChange(myself.name);}).keyup(function(event) {
					if (event.keyCode==13){
						Dashboards.processChange(myself.name);
					}
				});
		},
		getValue : function() {
			return $("#"+this.name).val();
		}
	});

var DateInputComponent = BaseComponent.extend({
		update : function() {
			var myself = this;
			$("#"+this.htmlObject).html($("<input/>").attr("id",this.name).attr("value",Dashboards.getParameterValue(this.parameter)).css("width","80px"));
			$(function(){ 
					$("#" + myself.htmlObject + " input").datepicker({dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true,
					onSelect:function(date, input) {
						Dashboards.processChange(myself.name);
					}});
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
			$(function(){ 
					$("#" + myself.htmlObject + " input").daterangepicker({
							posX: offset.left + leftOffset, 
							posY: offset.top + topOffset, 
							earliestDate: earliestDate,
							latestDate: latestDate,
							dateFormat: 'yy-mm-dd',
							onDateSelect: function(rangeA, rangeB) { 
								DateRangeInputComponent.fireDateRangeInputChange( myself.name, rangeA, rangeB);
							}
						}); 
				});
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
		update : function() {
			var myArray = this.getValuesArray();
			
			selectHTML = "";
			for(var i= 0, len  = myArray.length; i < len; i++){
				selectHTML += "<input onclick='ToggleButtonBaseComponent.prototype.callAjaxAfterRender(\"" + this.name + "\")'";
				if(i==0){
					selectHTML += " CHECKED";
				}
				if (this.type == 'radio' || this.type == 'radioComponent'){
					selectHTML += " type='radio'";
				}else{
					selectHTML += " type='checkbox'";
				}
				var vid = this.valueAsId==false?0:1;
				selectHTML += "class='" + this.name +"' name='" + this.name +"' value='" + myArray[i][vid] + "' /> " + myArray[i][1] + (this.separator == undefined?"":this.separator);
			} 
			// update the placeholder
			$("#" + this.htmlObject).html(selectHTML);
		},
		callAjaxAfterRender: function(name){
			setTimeout(function(){Dashboards.processChange(name)},1);
		}
	});

var RadioComponent = ToggleButtonBaseComponent.extend({
		getValue : function() {
			return $("#"+this.htmlObject + " ."+this.name+":checked").val()
		}
	});

var CheckComponent = ToggleButtonBaseComponent.extend({
		getValue : function() {
			var a = new Array()
			$("#"+this.htmlObject + " ."+this.name + ":checked").each(function(i,val){
					a.push($(this).val());
				});
			return a;
		}
	});

var AutocompleteBoxComponent = BaseComponent.extend({
		update : function() {
			QueryComponent.makeQuery(this);

			var list = [];

			for(p in this.result){	
				var obj = {};
				obj.text = this.result[p][0];
				list.push(obj);
			}

			$("#"+ this.htmlObject).empty();

			var myself = this;
			var processChange = myself.processChange == undefined ? function(objName){Dashboards.processChange(objName);} : function(objName) {myself.processChange();};
			var processElementChange = myself.processElementChange == true ? function(value){Dashboards.fireChange(myself.parameter+"_value",value)} : undefined;
			if(processElementChange!= undefined)eval(myself.parameter+'_value=""');
			var opt = {
				list: list,
				matchType: myself.matchType == undefined ? "fromStart" : myself.matchType, /*fromStart,all*/
				processElementChange:  processElementChange,
				processChange: function(obj,obj_value) {obj.value = obj_value; processChange(obj.name);},
				multiSellection: myself.selectMulti == undefined ? false : myself.selectMulti,
				checkValue: myself.checkValue == undefined ? true : myself.checkValue,
				minTextLenght: myself.minTextLenght == undefined ? 0 : myself.minTextLenght,
				scrollHeight: myself.scrollHeight,
				applyButton: myself.showApplyButton == undefined ? true : myself.showApplyButton,
				tooltipMessage: myself.tooltipMessage == undefined ? "Click it to Apply" : myself.tooltipMessage,
				addTextElements: myself.addTextElements == undefined ? true : myself.addTextElements,
				parent: myself
			};

			var html_obj = $("#"+myself.name+"Object");
			this.autoBoxOpt = $("#" + this.htmlObject ).autobox(opt);

			this.addFilter = function(value){
				
				if(myself.autoBoxOpt.valueAlreadySelected(encode_prepare(value)))
					return;
				
				var childs = html_obj.children().children().children();

				if(!opt.multiSellection){
					for(i = childs.length;i > 1 ; ){
						$(childs[i-1]).remove();
						i= i -1;
					}
				}
				
				if(opt.multiSellection && myself.autoBoxOpt.applyButton != false)
					myself.autoBoxOpt.showApplyButton();

				var li=$('<li class="bit-box"></li>').attr('id', myself.name + 'bit-0').text(encode_prepare(value));
				li.append($('<a href="#" class="closebutton"></a>')
					.bind('click', function(e) {
							li.remove();
							e.preventDefault();
							
							if(!opt.multiSellection)
								myself.autoBoxOpt.processAutoBoxChange();
		
							if(myself.autoBoxOpt.applyButton != false)
								myself.autoBoxOpt.showApplyButton();
							
						})).append($('<input type="hidden" />').attr('name', myself.name).val(encode_prepare(value)));

				this.autoBoxOpt.input.after(li);
			}
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
			// Build IFrame and set url
			var jpivotHTML = "<iframe id=\"jpivot_"+ this.htmlObject + "\" scrolling=\"no\" onload=\"this.style.height = this.contentWindow.document.body.offsetHeight + 'px';\" frameborder=\"0\" height=\""+this.iframeHeight+"\" width=\""+this.iframeWidth+"\" src=\"";
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

var TableComponent = BaseComponent.extend({
		update : function() {
			var cd = this.chartDefinition;
			if (cd == undefined){
				alert("Fatal - No chart definition passed");
				return;
			}
			cd["tableId"] = this.htmlObject + "Table";

			// Clear previous table
			$("#"+this.htmlObject).empty();
			var myself = this;
			Dashboards.fetchData(cd, this.cdaParams, function(values) {myself.processTableComponentResponse(values);});
		},
		processTableComponentResponse : function(json)
		{
			// General documentation here: http://datatables.net

			var cd = this.chartDefinition;
			// Build a default config from the standard options
			var dtData0 = TableComponent.getDataTableOptions(cd);
			var dtData = $.extend(cd.dataTableOptions,dtData0);


			// Sparklines still applied to drawcallback
			var myself = this;
			dtData.fnDrawCallback = function() {
				$("#" + myself.htmlObject + " td.sparkline:visible").each(function(i){
						$(this).sparkline($(this).text().split(/,/));
						$(this).removeClass("sparkline");
					});

				if(typeof cd.drawCallback == 'function'){
					cd.drawCallback();
				}

			};
                        // We need to make sure we're getting data from the right place,
                        // depending on whether we're using CDA
                        if (cd.dataAccessId != undefined) {
			    dtData.aaData = json.resultset;
                        } else {
			    dtData.aaData = json;
                        }
			$("#"+this.htmlObject).html("<table id='" + this.htmlObject + "Table' class=\"tableComponent\" width=\"100%\"></table>");
			this.dataTable = $("#"+this.htmlObject+'Table').dataTable( dtData );


			// Apply the formats
			if(cd.colFormats != undefined){
				$.each(cd.colFormats,function(colNo,val){
						if(val != null){
							var td = $(myself.dataTable.fnGetNodes()).find("td:nth-child("+ (colNo + 1) +")");
							td.each(function(){
									if ($(this).text() != "null" ) {
										$(this).text( sprintf( val, $(this).text() ) );
									} else {
										$(this).text('0');
									}
								});
						}
					});
			}

			if(cd.urlTemplate != undefined){
				var td =$("#" + myself.htmlObject + " td:nth-child(1)"); 
				var td = $(myself.dataTable.fnGetNodes()).find("td:nth-child(1)");
				td.addClass('cdfClickable');
				td.bind("click", function(e){
						var regex = new RegExp("{"+cd.parameterName+"}","g");
						var f = cd.urlTemplate.replace(regex,$(this).text());
						eval(f);
					});
			}

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
							col.sClass+=" "+val;

							if(val=='sparkline'){
								col.bSearchable=false;
								col.bSortable=false;
							}
							else{
								col.sType=val;
							}
						})
				};  // colTypes
				if(options.colFormats!=undefined){
					// Changes are made directly to the json

				};  // colFormats

				if(options.colWidths!=undefined){
					$.each(options.colWidths,function(i,val){
							if (val!=null){
								dtData.aoColumns[i].sWidth=val
							}
						})
				}; //colWidths
				
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
				alert("Fatal - no page definition passed");
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
				function(){ $(this).addClass("ui-state-hover"); },
				function(){ $(this).removeClass("ui-state-hover"); }
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
					var args = {action: "add", page: myself.page, comment: code};
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
			var url = webAppPath + "/Pivot?solution=cdf&path=components&action=jpivot.xaction&";

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
			$.fancybox({type:"iframe", href:_href, width: $(window).width(), height:$(window).height()});
		}
	});

var QueryComponent = BaseComponent.extend({
		visible: false,
		update : function() {
			QueryComponent.makeQuery(this);
		}
	},
	{
		makeQuery: function(object){
			var cd = object.queryDefinition;
			if (cd == undefined){
				alert("Fatal - No query definition passed");
				return;
			}
			Dashboards.fetchData(cd, object.cdaParams, function(values) {object.result = values;})

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
			if ($.inArray(["SPAN","DIV"],o[0].tagName)){
				// create a button
				o = o.empty().append("<button/>");
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
			$.fancybox({type:"iframe", href:_href, width: $(window).width(), height:$(window).height() - 50});
		}

	});

var ButtonComponent = BaseComponent.extend({
		update : function() {
			$("#"+ this.htmlObject).empty().append("<button/>").button().text(this.label).unbind("click").bind("click", this.action);
		}
	});

var PrptComponent = BaseComponent.extend({

		// gets the runUrl and paramServiceUrl from the server then alerts the caller via the callback
		setSolutionPathAction : function(solution, path, action, callback) {

			this.solution = solution;
			this.path = path;
			this.action = action;


			//Set the prpt Viewer options for pagination and parameters
			var prpt_options = this.prptViewerOptions();


			// parameter service url from file details; tells us how to render the content;
			var paramServiceUrl = '';
			var runUrl = '';
			var prptref = this.genXaction();
			// get the base url so that we can call the sol repo service
			// save a reference to this for use in nested functions

			var thisComponent = this;

			$.ajax({
					url: webAppPath+ '/SolutionRepositoryService?component=getSolutionRepositoryFileDetails&fullPath=' + prptref,
					async:   false,
					success: function(data2) {
						$('file', data2).each(function() {
								thisComponent.paramServiceUrl = $(this).attr('param-service-url') + '&renderMode=xml';
								thisComponent.runUrl = $(this).attr('url') + prpt_options;
								if(callback){
									callback.onfinish();
								}
							});
					}
				});

		},

		preExecution: function(){
			this.setSolutionPathAction(this.solution, this.path, this.action);
		}, 

		getQueryStringFragment : function() {
			// save a reference to this for use in nested functions
			var thisComponent = this;

			var queryStringFragment = '';
			for (var i = 0; i < thisComponent.parameters.length; i++) {
				var paramId = null;
				if(thisComponent.paramExtraInfo == undefined){
					paramId = this.parameters[i][1];
				} else if (i == 0 && typeof(thisComponent.paramExtraInfo.id) != "undefined") {
					paramId = thisComponent.paramExtraInfo.id;
				} else {
					paramId = thisComponent.paramExtraInfo[i].id;
				}
				var paramValue = '';
				if (this.staticParameters && thisComponent.parameters[i].length == 3) {
					paramValue = thisComponent.parameters[i][2];
				} else if(thisComponent.parameters[i][1] != ""){
					paramValue = Dashboards.getParameterValue(thisComponent.parameters[i][1]);
				} else {
					paramValue = Dashboards.getParameterValue(paramId);
				}

				if (paramValue != undefined && paramValue != '') {
					queryStringFragment += '&' + encodeURIComponent(paramId) + '=' + encodeURIComponent(paramValue);
				}
			}
			return queryStringFragment
		},

		update : function() {

			var htmlObject = document.getElementById(this.htmlObject);
			if(!htmlObject){
				// Widget defined, but template does not have a space for it.
				return;
			}
			var queryStringFragment = this.getQueryStringFragment();

			htmlObject.innerHTML = "<iframe style='width:100%;height:100%;border:0px' frameborder='0' border='0' src='" + this.runUrl + queryStringFragment + "' />";

		},
		genXaction : function() {
			var gen = this.solution == null ? '' : this.solution;
			if (this.path != null) {
				if (gen.length > 0 && gen.substr(gen.length - 1, 1) != '/') {
					gen += '/';
				}
				gen += this.path;
			}
			if (this.action != null) {
				if (gen.length > 0 && gen.substr(gen.length - 1, 1) != '/') {
					gen += '/';
				}
				gen += this.action;
			}
			return gen;
		},
		prptViewerOptions : function() {
			//default settings
			var showParameters = false;
			var myPaginate = true;

			//set to defined values
			if (this.paginate != undefined) {
				myPaginate = this.paginate;
			}

			if (this.showParameters != undefined) {
				showParameters = this.showParameters;
			}


			var options = '&showParameters='+showParameters+'&paginate='+myPaginate;
			return options;
		},
		type : "PrptComponent",
		executeAtStart : true,
		iconImgSrc : '../images/file.png'
	});
