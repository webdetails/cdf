/**
 * Plot Layer
 * 
 * @fileOverview Plot Layer
 * @name Plot
 */
 
/**
 * A plot layer is the main building block for timeplots and it's the object
 * that is responsible for painting the plot itself. Each plot needs to have
 * a time geometry, either a DataSource (for time series
 * plots) or an EventSource (for event plots) and a value geometry in case 
 * of time series plots. Such parameters are passed along
 * in the 'plotInfo' map.
 * 
 * @constructor
 */
 
var buttonGap = 22;
  
Timeplot.Plot = function(timeplot, plotInfo) {
    this._timeplot = timeplot;
    this._canvas = timeplot.getCanvas();
    this._plotInfo = plotInfo;
    this._id = plotInfo.id;
	this._name = plotInfo.name;
    this._timeGeometry = plotInfo.timeGeometry;
    this._valueGeometry = plotInfo.valueGeometry;
    this._theme = new Timeline.getDefaultTheme();
    this._dataSource = plotInfo.dataSource;
    this._eventSource = plotInfo.eventSource;
    this._bubble = null;
	this._toolTipFormat = plotInfo.toolTipFormat;
	this._headerFormat = plotInfo.headerFormat;
	this._hideZeroToolTipValues = plotInfo.hideZeroToolTipValues;
	this._getSelectedRegion = plotInfo.getSelectedRegion;
	this._showValuesMode = plotInfo.showValuesMode;
	this._rangeColor = plotInfo.rangeColor;
};

Timeplot.Plot.prototype = {
    
    /**
     * Initialize the plot layer
     */
    initialize: function() {
        
            this._timeFlag = this._timeplot.putDiv("timeflag","timeplot-timeflag");
            this._valueFlag = this._timeplot.putDiv(this._id + "valueflag","timeplot-valueflag");
            this._valueFlagLineLeft = this._timeplot.putDiv(this._id + "valueflagLineLeft","timeplot-valueflag-line");
            this._valueFlagLineRight = this._timeplot.putDiv(this._id + "valueflagLineRight","timeplot-valueflag-line");
            if (!this._valueFlagLineLeft.firstChild) {
                this._valueFlagLineLeft.appendChild(SimileAjax.Graphics.createTranslucentImage(Timeplot.urlPrefix + "images/line_left.png"));
                this._valueFlagLineRight.appendChild(SimileAjax.Graphics.createTranslucentImage(Timeplot.urlPrefix + "images/line_right.png"));
            }
            this._valueFlagPole = this._timeplot.putDiv(this._id + "valuepole","timeplot-valueflag-pole");

            var opacity = this._plotInfo.valuesOpacity;
            
            SimileAjax.Graphics.setOpacity(this._timeFlag, opacity);
            SimileAjax.Graphics.setOpacity(this._valueFlag, opacity);
            SimileAjax.Graphics.setOpacity(this._valueFlagLineLeft, opacity);
            SimileAjax.Graphics.setOpacity(this._valueFlagLineRight, opacity);
            SimileAjax.Graphics.setOpacity(this._valueFlagPole, opacity);

            var plot = this;
            
            var mouseOverHandler = function(elmt, evt, target) {
                if (plot._plotInfo.showValues) { 
	                plot._valueFlag.style.display = "block";
	                mouseMoveHandler(elmt, evt, target);
	            }
            }
        
            var day = 24 * 60 * 60 * 1000;
            var month = 30 * day;
            
            var mouseMoveHandler = function(elmt, evt, target) {
                if (plot._plotInfo.showValues && !plot._mouseDown) {
                    var c = plot._canvas;
                    var x = Math.round(SimileAjax.DOM.getEventRelativeCoordinates(evt,plot._canvas).x);
                    if (x > c.width){x = c.width;}
					x = isNaN(x) || x < 0 ? 0 : x ;
                    var t = plot._timeGeometry.fromScreen(x);
					var p = plot._timeGeometry.getPeriod(); 
					var v = plot._dataSource.getValue(t);
                    if (t == 0 || (plot._showValuesMode == "tooltip" && plot._hideZeroToolTipValues && Math.round(v) == 0)) {
                        plot._valueFlag.style.display = "none";
                        return;
                    }
                    
                    var v = plot._dataSource.getValue(t);
                    if (plot._plotInfo.roundValues){ v = Math.round(v);}
					
					var d = new Date(t);
					
                    if (p < day) {
                        plot._timeFlag.innerHTML = d.toLocaleTimeString();
                    } else if (p > month) {
                        plot._timeFlag.innerHTML = d.toLocaleDateString();
                    } else {
                        plot._timeFlag.innerHTML = d.toLocaleString();
                    }
					
                    var tw = plot._timeFlag.clientWidth;
                    var th = plot._timeFlag.clientHeight;
                    var tdw = Math.round(tw / 2);
                    var vw = plot._valueFlag.clientWidth;
                    var vh = plot._valueFlag.clientHeight;
                    var y = plot._valueGeometry.toScreen(v);

                    if (x + tdw > c.width) {
                        var tx = c.width - tdw;
                    } else if (x - tdw < 0) {
                        var tx = tdw;
                    } else {
                        var tx = x;
                    }

                    if (plot._timeGeometry._timeValuePosition == "top") {
                        plot._timeplot.placeDiv(plot._valueFlagPole, {
                            left: x,
                            top: th - 5,
                            height: c.height - y - th + 6,
                            display: "block"
                        });
                        plot._timeplot.placeDiv(plot._timeFlag,{
                            left: tx - tdw,
                            top: -6,
                            display: "block"
                        });
                    } else {
                        plot._timeplot.placeDiv(plot._valueFlagPole, {
                            left: x,
                            bottom: th - 5,
                            height: y - th + 6,
                            display: "block"
                        });
                        plot._timeplot.placeDiv(plot._timeFlag,{
                            left: tx - tdw,
                            bottom: -6,
                            display: "block"
                        });
                    }
					
					var vStr = v;
					if(plot._showValuesMode == "tooltip" && plot._toolTipFormat != undefined &&  typeof plot._toolTipFormat == 'function')
						vStr = plot._toolTipFormat(v,plot);
					
					if(plot._showValuesMode == "header"){
						if(plot._headerFormat != undefined &&  typeof plot._headerFormat == 'function')
							vStr = plot._headerFormat(v,plot);
						$("#" + plot._id + "Header").html(vStr);
						plot._valueFlag.style.display = "none";
						return;
					}
					else
						plot._valueFlag.innerHTML = vStr;

                    if (x + vw + 14 > c.width && y + vh + 4 > c.height) {
                        plot._valueFlagLineLeft.style.display = "none";
                        plot._timeplot.placeDiv(plot._valueFlagLineRight,{
                            left: x - 14,
                            bottom: y - 14,
                            display: "block"
                        });
                        plot._timeplot.placeDiv(plot._valueFlag,{
                            left: x - vw - 13,
                            bottom: y - vh - 13,
                            display: "block"
                        });
                    } else if (x + vw + 14 > c.width && y + vh + 4 < c.height) {
                        plot._valueFlagLineRight.style.display = "none";
                        plot._timeplot.placeDiv(plot._valueFlagLineLeft,{
                            left: x - 14,
                            bottom: y,
                            display: "block"
                        });
                        plot._timeplot.placeDiv(plot._valueFlag,{
                            left: x - vw - 13,
                            bottom: y + 13,
                            display: "block"
                        });
                    } else if (x + vw + 14 < c.width && y + vh + 4 > c.height) {
                        //plot._valueFlagLineRight.style.display = "none";
                        //plot._timeplot.placeDiv(plot._valueFlagLineLeft,{
						plot._valueFlagLineLeft.style.display = "none";
                        plot._timeplot.placeDiv(plot._valueFlagLineRight,{
                             left: x,
                             bottom: y, //bottom: y - 13,
                            display: "block"
                        });
                        plot._timeplot.placeDiv(plot._valueFlag,{
                            left: x + 13,
                           bottom: y, //bottom: y - 13,
                            display: "block"
                        });
                    } else {
                        plot._valueFlagLineLeft.style.display = "none";
                        plot._timeplot.placeDiv(plot._valueFlagLineRight,{
                            left: x,
                            bottom: y,
                            display: "block"
                        });
                        plot._timeplot.placeDiv(plot._valueFlag,{
                            left: x + 13,
                            bottom: y + 13,
                            display: "block"
                        });
                    }
					
					y =  parseFloat(plot._valueFlag.style["bottom"].replace(/px/g,""));
					
					if(plot._dataSource._column == 0){
						timeplot.previousArray = new Array();
						timeplot.previousArray[0] = [plot._id,v,y];
					}
					else
						timeplot.previousArray[timeplot.previousArray.length] = [plot._id,v,
							plot._resolveDivConflit(y,v,false,timeplot.previousArray)];
                }
				else if(plot._mouseDown)
				{
					var x = Math.round(SimileAjax.DOM.getEventRelativeCoordinates(evt,plot._canvas).x);
					var dif = x > plot.startSelectEventPos ? x - plot.startSelectEventPos : plot.startSelectEventPos - x; 
					if(dif> 10){
						if (x < plot._canvas.width)
							plot._addSelectEvent(plot.startSelectEvent,plot.getSelectedDate(evt,x),plot._eventSource,undefined,undefined,undefined);
						else
							plot._mouseDown = false;
					}
					
				}
            }
			
			 var mouseDownHandler = function(elmt, evt, target) {
				var x = Math.round(SimileAjax.DOM.getEventRelativeCoordinates(evt,plot._canvas).x);
				var d = plot.getSelectedDate(evt,x);
				plot.startSelectEvent = d;
				plot.startSelectEventPos = x;
				plot._mouseDown = true;
				
			}
			
			 var mouseUpHandler = function(elmt, evt, target) {
				var x = Math.round(SimileAjax.DOM.getEventRelativeCoordinates(evt,plot._canvas).x);
				var dif = x > plot.startSelectEventPos ? x - plot.startSelectEventPos : plot.startSelectEventPos - x; 
				if(dif> 10)
					plot._getSelectedRegion(plot.startSelectEvent,plot.getSelectedDate(evt,x));
				plot._mouseDown = false;
			}


            var timeplotElement = this._timeplot.getElement();
            SimileAjax.DOM.registerEvent(timeplotElement, "mouseover", mouseOverHandler);
            SimileAjax.DOM.registerEvent(timeplotElement, "mousemove", mouseMoveHandler);
			
			if(plot._id == "eventPlot"){
				SimileAjax.DOM.registerEvent(timeplotElement, "mousedown", mouseDownHandler);
				SimileAjax.DOM.registerEvent(timeplotElement, "mouseup", mouseUpHandler);
			}
        
    },

    /**
     * Dispose the plot layer and all the data sources and listeners associated to it
     */
    dispose: function() {
        if (this._dataSource) {
            this._dataSource.removeListener(this._paintingListener);
            this._paintingListener = null;
            this._dataSource.dispose();
            this._dataSource = null;
        }
    },

    /**
     * Hide the values
     */
    hideValues: function() {
        if (this._valueFlag) this._valueFlag.style.display = "none";
        if (this._timeFlag) this._timeFlag.style.display = "none";
        if (this._valueFlagLineLeft) this._valueFlagLineLeft.style.display = "none";
        if (this._valueFlagLineRight) this._valueFlagLineRight.style.display = "none";
        if (this._valueFlagPole) this._valueFlagPole.style.display = "none";
    },
    
    /**
     * Return the data source of this plot layer (it could be either a DataSource or an EventSource)
     */
    getDataSource: function() {
        return (this._dataSource) ? this._dataSource : this._eventSource;
    },

    /**
     * Return the time geometry associated with this plot layer
     */
    getTimeGeometry: function() {
        return this._timeGeometry;
    },

    /**
     * Return the value geometry associated with this plot layer
     */
    getValueGeometry: function() {
        return this._valueGeometry;
    },

    /**
     * Paint this plot layer
     */
    paint: function() {
        var ctx = this._canvas.getContext('2d');

        ctx.lineWidth = this._plotInfo.lineWidth;
        ctx.lineJoin = 'miter';

        if (this._dataSource) {     
            if (this._plotInfo.fillColor) {
                if (this._plotInfo.fillGradient) {
                    var gradient = ctx.createLinearGradient(0,this._canvas.height,0,0);
                    gradient.addColorStop(0,this._plotInfo.fillColor.toString());
                    gradient.addColorStop(0.5,this._plotInfo.fillColor.toString());
                    gradient.addColorStop(1, 'rgba(255,255,255,0)');

                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = this._plotInfo.fillColor.toString();
                }

                ctx.beginPath();
                ctx.moveTo(0,0);
                this._plot(function(x,y) {
					if(!isNaN(x) && !isNaN(y))
						ctx.lineTo(x,y);
                });
                if (this._plotInfo.fillFrom == Number.NEGATIVE_INFINITY) {
                    ctx.lineTo(this._canvas.width, 0);
                } else if (this._plotInfo.fillFrom == Number.POSITIVE_INFINITY) {
                    ctx.lineTo(this._canvas.width, this._canvas.height);
                    ctx.lineTo(0, this._canvas.height);
                } else {
                    ctx.lineTo(this._canvas.width, this._valueGeometry.toScreen(this._plotInfo.fillFrom));
                    ctx.lineTo(0, this._valueGeometry.toScreen(this._plotInfo.fillFrom));
                }
                ctx.fill();
            }
                    
            if (this._plotInfo.lineColor) {
                ctx.strokeStyle = this._plotInfo.lineColor.toString();
                ctx.beginPath();
                var first = true;
                this._plot(function(x,y) {
					if(!isNaN(x) && !isNaN(y)){
                        if (first) {
                             first = false;
                             ctx.moveTo(x,y);
                        }
                    ctx.lineTo(x,y);
					}
                });
                ctx.stroke();
            }

            if (this._plotInfo.dotColor) {
                ctx.fillStyle = this._plotInfo.dotColor.toString();
                var r = this._plotInfo.dotRadius;
                this._plot(function(x,y) {
                    ctx.beginPath();
                    ctx.arc(x,y,r,0,2*Math.PI,true);
                    ctx.fill();
                });
            }
        }

        if (this._eventSource) {
            var gradient = ctx.createLinearGradient(0,0,0,this._canvas.height);
            gradient.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.strokeStyle = gradient;
            ctx.fillStyle = gradient; 
            ctx.lineWidth = this._plotInfo.eventLineWidth;
            ctx.lineJoin = 'miter';
            
            var i = this._eventSource.getAllEventIterator();
            while (i.hasNext()) {
                var event = i.next();
                var color = event.getColor();
                color = (color) ? new Timeplot.Color(color) : this._plotInfo.lineColor;
                var eventStart = event.getStart().getTime();
                var eventEnd = event.getEnd().getTime();
                if (eventStart == eventEnd) {
                    var c = color.toString();
                    gradient.addColorStop(0, c);
                    var start = this._timeGeometry.toScreen(eventStart);
                    start = Math.floor(start) + 0.5; // center it between two pixels (makes the rendering nicer)
                    var end = start;
                    ctx.beginPath();
                    ctx.moveTo(start,0);
                    ctx.lineTo(start,this._canvas.height);
                    ctx.stroke();
                    var x = start - 4;
                    var w = 7;
                } else {
                    var c = color.toString(0.5);
                    gradient.addColorStop(0, c);
                    var start = this._timeGeometry.toScreen(eventStart);
                    start = Math.floor(start) + 0.5; // center it between two pixels (makes the rendering nicer)
                    var end = this._timeGeometry.toScreen(eventEnd);
                    end = Math.floor(end) + 0.5; // center it between two pixels (makes the rendering nicer)
                    ctx.fillRect(start,0,end - start, this._canvas.height);
                    var x = start;
                    var w = end - start - 1;
                }

                var div = this._timeplot.putDiv(event.getID(),event.getID() != "selectEvent" ? "timeplot-event-box" : "timeplot-selectevent-box",{
                    left: Math.round(x),
                    width: Math.round(w),
                    top: 0,
                    height: this._canvas.height - 1
                });

                var plot = this;
                var clickHandler = function(event) { 
                    return function(elmt, evt, target) { 
						if(event._id !="selectEvent"){
	                        var doc = plot._timeplot.getDocument();
	                        plot._closeBubble();
	                        var coords = SimileAjax.DOM.getEventPageCoordinates(evt);
	                        var elmtCoords = SimileAjax.DOM.getPageCoordinates(elmt);
	                        plot._bubble = SimileAjax.Graphics.createBubbleForPoint(coords.x, elmtCoords.top + plot._canvas.height, plot._plotInfo.bubbleWidth, plot._plotInfo.bubbleHeight, "bottom");
	                        event.fillInfoBubble(plot._bubble.content, plot._theme, plot._timeGeometry.getLabeler());
						}
                    }
                };
                var mouseOverHandler = function(elmt, evt, target) {
                    elmt.oldClass = elmt.className;
                    elmt.className = elmt.className + " timeplot-event-box-highlight";
                };
                var mouseOutHandler = function(elmt, evt, target) {
                    elmt.className = elmt.oldClass;
                    elmt.oldClass = null;
                }
                
                if (!div.instrumented) {
                    SimileAjax.DOM.registerEvent(div, "click"    , clickHandler(event));
                    SimileAjax.DOM.registerEvent(div, "mouseover", mouseOverHandler);
                    SimileAjax.DOM.registerEvent(div, "mouseout" , mouseOutHandler);
                    div.instrumented = true;
                }
            }
        }
    },

    _plot: function(f) {
        var data = this._dataSource.getData();
        if (data) {
            var times = data.times;
            var values = data.values;
            var T = times.length;
            for (var t = 0; t < T; t++) {
                var x = this._timeGeometry.toScreen(times[t]);
                var y = this._valueGeometry.toScreen(values[t]);
                f(x, y);
            }
        }
    },
    
    _closeBubble: function() {
        if (this._bubble != null) {
            this._bubble.close();
            this._bubble = null;
        }
    },
	
	_resolveDivConflit: function(y,divValue,conflict,divs) {
		
		for(i = 0; i < divs.length; i++){
			var value = divs[i][1];
			var bottom = divs[i][2];
			var top = bottom + buttonGap;
			if(this._id != divs[i][0] && y <= top && (y >= bottom  || (y + buttonGap >= bottom))){
			
				y = divValue < value ? (bottom - buttonGap - 1) > 0 ? (bottom - buttonGap - 1) : y : top + 1;
				this._valueFlag.style["bottom"] = y + "px";
				
				if(!conflict) return this._resolveDivConflit(y,divValue,true,divs);
				if((conflict && divValue < value) || y < 0) 
					this._valueFlag.style["zIndex"] = "0";
				
			}
		}
		return y;
	},
	
	_addSelectEvent: function(start,end,events,format,min,max)
	{
		if(format != undefined){
			var parser = events._events.getUnit().getParser(format);
			start = parser(start);
			end = parser(end);
		}
		
		if(min != undefined && max != undefined){
			start = start < min ? new Date(min) : start;
			end = end > max ? new Date(max) : end;
		}
		
		var evt = new Timeline.DefaultEventSource.Event(
                "selectEvent",start,end,start,end,false,null,null,null,null,null,this._rangeColor,null,null,null);
			
		var previousEvent = events.getEvent("selectEvent");
		if( previousEvent != undefined)
			while(events._events._events.remove(previousEvent));
			
		events.add(evt);
		
		return true;
	},
	
	getSelectedDate : function(evt,x){
	
		var x = Math.round(SimileAjax.DOM.getEventRelativeCoordinates(evt,this._canvas).x);
		var t = this._timeGeometry.fromScreen(x);
		return new Date(t);
	}
	
}