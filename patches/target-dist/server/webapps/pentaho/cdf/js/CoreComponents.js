var BaseComponent = Base.extend({
		//type : "unknown",
		visible: true,
		clear : function() {
			document.getElementById(this.htmlObject).innerHTML = "";
		},
		getValuesArray : function() {

			if ( typeof(this.valuesArray) == 'undefined') {
				//go through parameter array and update values
				var p = new Array(this.parameters.length);
				for(var i= 0, len = p.length; i < len; i++){
					var key = this.parameters[i][0];
					var value = this.parameters[i].length == 3 ? this.parameters[i][2] : Dashboards.getParameterValue(this.parameters[i][1]);
					p[i] = [key,value];
				} 

				//execute the xaction to populate the selector
				var myself=this;
				if (this.url) {
					var query = "";
					var idx;
					for( idx=0; idx<p.length; idx++ ) {
						if (query != "") {
							query += "&";
						}
						query += encodeURIComponent( p[idx][0] ) + "=" + encodeURIComponent( p[idx][1] );
					}
					
					html = Dashboards.parseXActionResult(myself, pentahoPost(this.url, query));
				} else {
					html = Dashboards.callPentahoAction(myself, this.solution, this.path, this.action, p,null);
				}
				//transform the result int a javascript array
				var myArray = this.parseArray(html, false);
				return myArray;
			} else {
				return this.valuesArray
			}
		},
		parseArray : function(html,includeHeader){
			var myArray;
			html=html.replace(/<tr>/g,"["); 						/*1. GET ROWS*/
			html=html.replace(/<\/tr>/g,"],");						/*2. GET ROWS*/
			html=html.replace(/<t[hd][^\>]*>/g,"@BEGIN_ELEMENT@");  /*3. GET COLUMNS*/
			html=html.replace(/<\/t[hd]>/g,"@END_ELEMENT@");	 	/*4. GET COLUMNS*/
			html=html.replace(/@BEGIN_ELEMENT@/g,"\"");				/*5. SEPARATE COLUMNS by "," */
			html=html.replace(/@END_ELEMENT@\]/g,"\"]");			/*6. SEPARATE COLUMNS by "," */
			html=html.replace(/@END_ELEMENT@/g,"\",");				/*7. SEPARATE COLUMNS by "," */
			var a = "var myArray = [" + html.substring(0,html.length-1) + "];"	/*REMOVE LAST  "," ADDED  at 2 */
			try{
				eval(a);
			}
			catch(err){
				return [];
			}
			if (!includeHeader){
				myArray.splice(0,1);
			}

			return myArray;

		}
	});

var XactionComponent = BaseComponent.extend({
		update : function() {
		  try {
			if (typeof(this.iframe) == 'undefined' || !this.iframe) {
				// go through parameter array and update values
				var p = new Array(this.parameters.length);
				for(var i= 0, len = p.length; i < len; i++){
					var key = this.parameters[i][0];
					var value = this.parameters[i].length == 3 ? this.parameters[i][2] : Dashboards.getParameterValue(this.parameters[i][1]);
					p[i] = [key,value];
				} 
	
				// callback async mode
				// Dashboards.callPentahoAction(this.solution, this.path, this.action,
				// p,function(json){ Dashboards.xactionCallback(object,json); });
				// or sync mode
				var myself=this;
				$('#'+this.htmlObject).html(Dashboards.callPentahoAction(myself,this.solution, this.path, this.action, p,null));
			} else {
				var xactionIFrameHTML = "<iframe id=\"iframe_"+ this.htmlObject + "\"" + 
				" frameborder=\"0\"" +
				" height=\"100%\"" + 
				" width=\"100%\"" + 
				" src=\"";
				
				xactionIFrameHTML += "/pentaho/ViewAction?wrapper=false&solution="	+ this.solution + "&path=" + this.path + "&action="+ this.action;

				// Add args
				var p = new Array(this.parameters.length);
				for(var i= 0, len = p.length; i < len; i++){
					var arg = "&" + this.parameters[i][0] + "=";
					if (this.parameters[i].length == 3) {
						xactionIFrameHTML += arg + this.parameters[i][2];
					} else {
						xactionIFrameHTML += arg + Dashboards.getParameterValue(this.parameters[i][1]);
					}
				}

				// Close IFrame
				xactionIFrameHTML += "\"></iframe>";

				document.getElementById(this.htmlObject).innerHTML = xactionIFrameHTML;
			}
		  } catch (e) {
			  // don't cause the rest of CDF to fail if xaction component fails for whatever reason
		  }
		}
	});

var SelectBaseComponent = BaseComponent.extend({
		update : function() {
			var myArray = new Array();
			var myself=this;
			if(typeof(this.queryDefinition) == 'undefined')
				myArray = this.getValuesArray();
			else{
				QueryComponent.makeQuery(this);
				var myArray = new Array();
				for(p in this.result){	
					if(myself.queryDefinition.queryType != "sql")
						myArray.push([this.result[p][0],this.result[p][0]]);
					else
						myArray.push([this.result[p][0],this.result[p][1]]);
				}
			}

			selectHTML = "<select";
			selectHTML += " id='" + this.name + "'";

			// set size
			if (this.size != undefined){
				selectHTML += " size='" + this.size + "'";
			}
			if (this.type == "selectMulti"){
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
			var selector = document.getElementById(this.name);
			for(var i= 0, len  = selector.length; i < len; i++){
				if(selector[i].selected){
					value = selector[i].value;
				};
			}
			return value;
		}
	});

var SelectMultiComponent = SelectBaseComponent.extend({
		getValue : function() {
			var selector = document.getElementById(this.name);
			var selection = new Array();
			var selection_index = 0;
			for(var i= 0, len  = selector.length; i < len; i++){
				if(selector[i].checked || selector[i].selected){
					selection[selection_index] = selector[i].value;
					selection_index ++;
				};
			} 
			return selection.join("','");
		}
	});

var JFreeChartComponent = BaseComponent.extend({
		update : function() {

			var cd = this.chartDefinition;
			// Merge the stuff with a chartOptions element
			if (cd == undefined){
				alert("Fatal - No chartDefinition passed");
				return;
			}
			var cd0 = $.extend({},Dashboards.ev(cd.chartOptions), cd);

			// go through parametere array and update values
			var parameters = [];
			for(p in cd0){
				var key = p;
				var value = typeof cd0[p]=='function'?cd0[p]():cd0[p];
				// alert("key: " + key + "; Value: " + value);
				parameters.push([key,value]);
			} 
			// increment runningCalls
			Dashboards.incrementRunningCalls();

			var myself = this;
			// callback async mode
			Dashboards.callPentahoAction(myself,"cdf", "components", "jfreechart.xaction", parameters, 
				function(json){ 
					$('#'+myself.htmlObject).html(json); 
					Dashboards.decrementRunningCalls();
				});
			// or sync mode
			// $('#'+object.htmlObject).html(Dashboards.callPentahoAction(myself, "cdf", "components",
			// "jfreechart.xaction", parameters,null));
		}
	});

var DialComponent = BaseComponent.extend({
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
			Dashboards.callPentahoAction(myself,"cdf", "components", "jfreechartdial.xaction", parameters, 
				function(json){ 
					$('#'+myself.htmlObject).html(json); 
					Dashboards.decrementRunningCalls();
				});
			// or sync mode
			// $('#'+object.htmlObject).html(Dashboards.callPentahoAction(myself, "cdf", "components",
			// "jfreechartdial.xaction", parameters,null));

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
					
					var i = $("<img>").attr("src",result<=cd.intervals[0]?TRAFFIC_RED:(result>=cd.intervals[1]?TRAFFIC_GREEN:TRAFFIC_YELLOW));
					$('#'+myself.htmlObject).html(i);
					
					if(cd.showValue != undefined && cd.showValue == true){
						var tooltip = "Value: " + result + " <br /><img align='middle' src='" + TRAFFIC_RED + "'/> &le; "  + cd.intervals[0] + " &lt;  <img align='middle' src='" + TRAFFIC_YELLOW + "'/> &lt; " + cd.intervals[1] + " &le; <img align='middle' src='" + TRAFFIC_GREEN + "'/> <br/>" + (tooltip != undefined?tooltip:""); 
						$('#'+myself.htmlObject).attr("title",tooltip + ( myself._tooltip != undefined? myself._tooltip:"")).tooltip({delay:0,track: true,fade: 250});
					}
					
					Dashboards.decrementRunningCalls();
				});
		}
	});

var TimePlotComponent = BaseComponent.extend({
		update : function() {
		
			var cd = this.chartDefinition;
	
				
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
			for(var i = 0; i<cols.length; i++){

				title.append('<span id="' + obj.name + 'Plot' + i + 'Header" style="color:' + Dashboards.timePlotColors[i].toHexString() + '">'+cols[i]+' &nbsp;&nbsp;</span>');

				var plotInfoOpts = {
					id: obj.name + "Plot" + i,
					name: cols[i],
					dataSource: new Timeplot.ColumnSource(timePlotEventSource,i + 1),
					valueGeometry: timePlotValueGeometry,
					timeGeometry: timePlotTimeGeometry,
					lineColor: Dashboards.timePlotColors[i],
					showValues: cd.showValues,
					hideZeroToolTipValues: cd.hideZeroToolTipValues != undefined ? cd.hideZeroToolTipValues : false,
					showValuesMode: cd.showValuesMode != undefined ? cd.showValuesMode : "header",
					toolTipFormat: function (value,plot){return  plot._name + " = " + toFormatedString(value);},
					headerFormat: function (value,plot){return  plot._name + " = " + toFormatedString(value) + "&nbsp;&nbsp;";}
				};
				if ( cd.dots == true){
					plotInfoOpts.dotColor = Dashboards.timePlotColors[i];
				}
				if ( cd.fill == true){
					plotInfoOpts.fillColor = Dashboards.timePlotColors[i].transparency(0.5);
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
			var timePlotEventSourceUrl = "/pentaho/ViewAction?solution=cdf&path=components&action=timelinefeeder.xaction&" + parameters.join('&');
			var myself = this;
			if(cd.events && cd.events.show == true){

				// go through parametere array and update values
				var parameters = [];
				for(p in cd.events){
					var key = p;
					var value = typeof cd.events[p]=='function'?cd.events[p]():cd.events[p];
					parameters.push(key+"="+value);
				} 

				var eventUrl = "/pentaho/ViewAction?solution=cdf&path=components&action=timelineeventfeeder.xaction&" + parameters.join('&');

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
			document.getElementById(this.htmlObject).innerHTML = selectHTML;
			var myself = this;
			$("#"+this.name).change(function() { Dashboards.processChange(myself.name);}).keyup(function(event) {
					if (event.keyCode==13){
						Dashboards.processChange(myself.name);
					}
				});
		},
		getValue : function() {
			var selector = document.getElementById(this.name);
			return selector.value;
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
			var selector = document.getElementById(this.name);
			return selector.value;
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
			document.getElementById(this.htmlObject).innerHTML = selectHTML;
			var myself = this;
			$("#"+this.name).change(function() {
					Dashboards.processChange(myself.name);
				});
		},
		getValue : function() {
			var value = $("#" + this.name).val()

			var year = value.substring(0,4);
			var month = parseInt(value.substring(5,7) - 1);
			var d = new Date();
			d.setMonth(month);
			d.setYear(year);

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
				selectHTML += "<input onclick='Dashboards.processChange(\"" + this.name + "\")'";
				if(i==0){
					selectHTML += " CHECKED";
				}
				if (this.type == 'radio' || this.type == 'radioComponent'){
					selectHTML += " type='radio'";
				}else{
					selectHTML += " type='checkbox'";
				}
				var vid = this.valueAsId==false?0:1;
				selectHTML += " id='" + this.name +"' name='" + this.name +"' value='" + myArray[i][vid] + "' /> " + myArray[i][1] + (this.separator == undefined?"":this.separator);
			} 
			// update the placeholder
			document.getElementById(this.htmlObject).innerHTML = selectHTML;
		}
	});

var RadioComponent = ToggleButtonBaseComponent.extend({
		getValue : function() {
			var selector = document.getElementsByName(this.name);
			for(var i= 0, len  = selector.length; i < len; i++){
				if(selector[i].checked){
					return selector[i].value;
				};
			}
		}
	});

var CheckComponent = ToggleButtonBaseComponent.extend({
		getValue : function() {
			var selector = document.getElementsByName(this.name);
			var selection = new Array();
			var selection_index = 0;
			for(var i= 0, len  = selector.length; i < len; i++){
				if(selector[i].checked || selector[i].selected){
					selection[selection_index] = selector[i].value;
					selection_index ++;
				};
			} 
			return selection.join("','");
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
			
			var opt = {
				list: list,
				matchType: myself.matchType == undefined ? "fromStart" : myself.matchType, /*fromStart,all*/
				processChange: function(obj,obj_value) {obj.value = obj_value; processChange(obj.name);},
				multiSellection: myself.selectMulti == undefined ? false : myself.selectMulti,
				checkValue: myself.checkValue == undefined ? true : myself.checkValue,
				minTextLenght: myself.minTextLenght == undefined ? 0 : myself.minTextLenght,
				scrollHeight: myself.scrollHeight,
				applyButton: myself.showApplyButton == undefined ? false : myself.showApplyButton,
				tooltipMessage: myself.tooltipMessage == undefined ? "Click it to Apply" : myself.tooltipMessage,
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
			jpivotHTML += "/pentaho/ViewAction?solution="	+ this.solution + "&path=" + 	this.path + "&action="+ this.action;

			// Add args
			var p = new Array(this.parameters.length);
			for(var i= 0, len = p.length; i < len; i++){
				var arg = "&" + this.parameters[i][0] + "=";
				jpivotHTML += arg +  Dashboards.getParameterValue(this.parameters[i][1]);
			}

			// Close IFrame
			jpivotHTML += "\"></iframe>";

			document.getElementById(this.htmlObject).innerHTML = jpivotHTML;
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
			$.getJSON("/pentaho/ViewAction?solution=cdf&path=components&action=jtable.xaction", cd, function(json) {
					myself.processTableComponentResponse(json);
				});
		},
		processTableComponentResponse : function(json)
		{
			// General documentation here: http://sprymedia.co.uk/article/DataTables

			var cd = this.chartDefinition;
			// Build a default config from the standard options
			var dtData0 = TableComponent.getDataTableOptions(cd);
			var dtData = $.extend(cd.dataTableOptions,dtData0);
			dtData.aaData = json;
			$("#"+this.htmlObject).html("<table id='" + this.htmlObject + "Table' class=\"tableComponent\" width=\"100%\"></table>");

			var myself = this;

			dtData.fnFinalCallback = function( aData, iRowCount ){
				$("#" + myself.htmlObject + " td.sparkline").each(function(i){
						$(this).sparkline($(this).text().split(/,/));
					});
				if(cd.urlTemplate != undefined){
					var td =$("#" + myself.htmlObject + " td:nth-child(1)"); 
					td.addClass('cdfClickable');
					td.bind("click", function(e){
							var regex = new RegExp("{"+cd.parameterName+"}","g");
							var f = cd.urlTemplate.replace(regex,$(this).text());
							eval(f);
						});
				}
			};
			$("#"+this.htmlObject+'Table').dataTable( dtData );
		}
	},
	{
		getDataTableOptions : function(options) {
			var dtData = {};
			if(options.info != undefined){
				dtData.bInfo = options.info
			};
			if(options.displayLength != undefined){
				dtData.iDisplayLength = options.displayLength
			};
			if(options.lengthChange != undefined){
				dtData.bLengthChange = options.lengthChange
			};
			if(options.paginate != undefined){
				dtData.bPaginate = options.paginate
			};
			if(options.sort != undefined){
				dtData.bSort = options.sort
			};
			if(options.filter != undefined){
				dtData.bFilter = options.filter
			};
			if(options.colHeaders != undefined){
				dtData.aoColumns = new Array(options.colHeaders.length);
				for(var i = 0; i< options.colHeaders.length; i++){
					dtData.aoColumns[i]={}
				};
				$.each(options.colHeaders,function(i,val){
						dtData.aoColumns[i].sTitle=val;
						if(val == "") dtData.aoColumns[i].bVisible=false;
					});  // colHeaders
				if(options.colTypes!=undefined){
					$.each(options.colTypes,function(i,val){
							var col = dtData.aoColumns[i];
							if(val=='sparkline'){
								col.sClass=val;
								col.bSearchable=false;
								col.bSortable=false;
							}
							else{
								col.sClass=val;
								col.sType=val;
							}
						})
				};  // colTypes
				if(options.colFormats!=undefined){
					
					$.each(options.colFormats,function(i,val){
							if (val != null){
								dtData.aoColumns[i].fnRender=
									function ( obj ) {
										return sprintf(val,obj.aData[obj.iDataRow][obj.iDataColumn]);
									}
							}
						})
				};  // colFormats

				if(options.colWidths!=undefined){
					$.each(options.colWidths,function(i,val){
							if (val!=null){
								dtData.aoColumns[i].sWidth=val
							}
						})
				}; //colWidths
				dtData.aaSorting=options.sortBy;
			}

			return dtData;
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
			var url = "/pentaho/Pivot?solution=cdf&path=components&action=jpivot.xaction&";

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
			GB_show("Pivot Details",_href, $(window).height() - 50 , $(window).width() - 100);
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

			$.getJSON("/pentaho/ViewAction?solution=cdf&path=components&action=jtable.xaction", cd, function(json){
					object.result = json;
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
			var myself = this;
			$("#"+ this.htmlObject).bind("click", function(){
					var success = typeof(myself.preChange)=='undefined' ? true : myself.preChange();
					if(success) {
						myself.executeXAction();
					}
					typeof(myself.postChange)=='undefined' ? true : myself.postChange();
				});
		},
		executeXAction : function() {
			var url = "/pentaho/ViewAction?solution=" + this.solution + "&path=" + this.path + "&action=" + this.action + "&";

			var p = new Array(this.parameters.length);
			var parameters = [];
			for(var i= 0, len = p.length; i < len; i++){
				var key = this.parameters[i][0];
				var value = Dashboards.getParameterValue(this.parameters[i][1]);
				parameters.push(key + "=" + encodeURIComponent(value));
			}

			url += parameters.join("&");

			var _href = url.replace(/'/g,"&#39;");
			GB_show("Report",_href, $(window).height() - 50 , $(window).width() - 100);
		}

	});
