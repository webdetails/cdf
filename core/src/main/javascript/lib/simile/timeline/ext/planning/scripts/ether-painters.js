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

/*==================================================
 *  Planning Ether Painter
 *==================================================
 */

Timeline.PlanningEtherPainter = function(params, band, timeline) {
    this._params = params;
    this._intervalUnit = params.intervalUnit;
    this._multiple = ("multiple" in params) ? params.multiple : 1;
    this._theme = params.theme;
};

Timeline.PlanningEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params && typeof this._params.align == "string") ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new Timeline.PlanningEtherMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new Timeline.EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
}

Timeline.PlanningEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
}

Timeline.PlanningEtherPainter.prototype.paint = function() {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers"); // for debugging
    this._markerLayer.style.display = "none";
    
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines"); // for debugging
    this._lineLayer.style.display = "none";
    
    var minDate = Math.max(0, Math.ceil(Timeline.PlanningUnit.toNumber(this._band.getMinDate())));
    var maxDate = Math.floor(Timeline.PlanningUnit.toNumber(this._band.getMaxDate()));
    
    var hasMore = function() {
        return minDate < maxDate;
    };
    var change = 1;
    var multiple = this._multiple;
    switch (this._intervalUnit) {
        case Timeline.PlanningUnit.DAY:     change = 1; break;
        case Timeline.PlanningUnit.WEEK:    change = 7; break;
        case Timeline.PlanningUnit.MONTH:   change = 28; break;
        case Timeline.PlanningUnit.QUARTER: change = 28 * 3; break;
        case Timeline.PlanningUnit.YEAR:    change = 28 * 12; break;
    }
    var increment = function() {
        minDate += change * multiple;
    };
    
    var labeller = this._band.getLabeller();
    while (true) {
        this._intervalMarkerLayout.createIntervalMarker(
            Timeline.PlanningUnit.fromNumber(minDate), 
            labeller, 
            this._intervalUnit, 
            this._markerLayer, 
            this._lineLayer
        );
        if (hasMore()) {
            increment();
        } else {
            break;
        }
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

Timeline.PlanningEtherPainter.prototype.softPaint = function() {
};


/*==================================================
 *  Planning Ether Marker Layout
 *==================================================
 */
 
Timeline.PlanningEtherMarkerLayout = function(timeline, band, theme, align, showLine) {
    var horizontal = timeline.isHorizontal();
    if (horizontal) {
        if (align == "Top") {
            this.positionDiv = function(div, offset) {
                div.style.left = offset + "px";
                div.style.top = "0px";
            };
        } else {
            this.positionDiv = function(div, offset) {
                div.style.left = offset + "px";
                div.style.bottom = "0px";
            };
        }
    } else {
        if (align == "Left") {
            this.positionDiv = function(div, offset) {
                div.style.top = offset + "px";
                div.style.left = "0px";
            };
        } else {
            this.positionDiv = function(div, offset) {
                div.style.top = offset + "px";
                div.style.right = "0px";
            };
        }
    }
    
    var markerTheme = theme.ether.interval.marker;
    var lineTheme = theme.ether.interval.line;
    
    var stylePrefix = (horizontal ? "h" : "v") + align;
    var labelStyler = markerTheme[stylePrefix + "Styler"];
    var emphasizedLabelStyler = markerTheme[stylePrefix + "EmphasizedStyler"];
    
    this.createIntervalMarker = function(date, labeller, unit, markerDiv, lineDiv) {
        var offset = Math.round(band.dateToPixelOffset(date));

        if (showLine) {
            var divLine = timeline.getDocument().createElement("div");
            divLine.style.position = "absolute";
            
            if (lineTheme.opacity < 100) {
                Timeline.Graphics.setOpacity(divLine, lineTheme.opacity);
            }
            
            if (horizontal) {
                divLine.style.borderLeft = "1px solid " + lineTheme.color;
                divLine.style.left = offset + "px";
                divLine.style.width = "1px";
                divLine.style.top = "0px";
                divLine.style.height = "100%";
            } else {
                divLine.style.borderTop = "1px solid " + lineTheme.color;
                divLine.style.top = offset + "px";
                divLine.style.height = "1px";
                divLine.style.left = "0px";
                divLine.style.width = "100%";
            }
            lineDiv.appendChild(divLine);
        }
        
        var label = labeller.labelInterval(date, unit);
        
        var div = timeline.getDocument().createElement("div");
        div.innerHTML = label.text;
        div.style.position = "absolute";
        (label.emphasized ? emphasizedLabelStyler : labelStyler)(div);
        
        this.positionDiv(div, offset);
        markerDiv.appendChild(div);
        
        return div;
    };
};
