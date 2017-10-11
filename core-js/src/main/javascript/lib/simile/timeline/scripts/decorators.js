/*
 *  (c) Copyright The SIMILE Project 2006. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * 3. The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Note: JQuery, www.jquery.com is included in the Ajax section of this
 *       distribution. It is covered by its own license:
 *
 *       Copyright (c) 2008 John Resig (jquery.com)
 *       Dual licensed under the MIT (MIT-LICENSE.txt)
 *       and GPL (GPL-LICENSE.txt) licenses.
 */

/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
 *  Span Highlight Decorator
 *==================================================
 */

Timeline.SpanHighlightDecorator = function(params) {
    this._unit = ("unit" in params) ? params.unit : SimileAjax.NativeDateUnit;
    this._startDate = (typeof params.startDate == "string") ? 
        this._unit.parseFromObject(params.startDate) : params.startDate;
    this._endDate = (typeof params.endDate == "string") ?
        this._unit.parseFromObject(params.endDate) : params.endDate;
    this._startLabel = params.startLabel;
    this._endLabel = params.endLabel;
    this._color = params.color;
	this._cssClass = ("cssClass" in params) ? params.cssClass : null;
    this._opacity = ("opacity" in params) ? params.opacity : 100;
};

Timeline.SpanHighlightDecorator.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._layerDiv = null;
};

Timeline.SpanHighlightDecorator.prototype.paint = function() {
    if (this._layerDiv != null) {
        this._band.removeLayerDiv(this._layerDiv);
    }
    this._layerDiv = this._band.createLayerDiv(10);
    this._layerDiv.setAttribute("name", "span-highlight-decorator"); // for debugging
    this._layerDiv.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    if (this._unit.compare(this._startDate, maxDate) < 0 &&
        this._unit.compare(this._endDate, minDate) > 0) {
        
        minDate = this._unit.later(minDate, this._startDate);
        maxDate = this._unit.earlier(maxDate, this._endDate);
        
        var minPixel = this._band.dateToPixelOffset(minDate);
        var maxPixel = this._band.dateToPixelOffset(maxDate);
        
        var doc = this._timeline.getDocument();
        
        var createTable = function() {
            var table = doc.createElement("table");
            table.insertRow(0).insertCell(0);
            return table;
        };
    
        var div = doc.createElement("div");
		div.className='timeline-highlight-decorator'
		if(this._cssClass) div.className += ' ' + this._cssClass
		  
        if (this._opacity < 100) {
            SimileAjax.Graphics.setOpacity(div, this._opacity);
        }
        this._layerDiv.appendChild(div);
            
        var tableStartLabel = createTable();
		tableStartLabel.className = 'timeline-highlight-label timeline-highlight-label-start'
		var tdStart =  tableStartLabel.rows[0].cells[0]
        tdStart.innerHTML = this._startLabel;
		if(this._cssClass) tdStart.className = 'label_' + this._cssClass
        this._layerDiv.appendChild(tableStartLabel);
        
		
        var tableEndLabel = createTable();
		tableEndLabel.className = 'timeline-highlight-label timeline-highlight-label-end'
        var tdEnd = tableEndLabel.rows[0].cells[0]
		tdEnd.innerHTML = this._endLabel;
		if(this._cssClass) tdEnd.className = 'label_' + this._cssClass
        this._layerDiv.appendChild(tableEndLabel);
        
        if (this._timeline.isHorizontal()){
            div.style.left = minPixel + "px";
            div.style.width = (maxPixel - minPixel) + "px";
			
            tableStartLabel.style.right = (this._band.getTotalViewLength() - minPixel) + "px";
            tableStartLabel.style.width = (this._startLabel.length) + "em";       
			            
            tableEndLabel.style.left = maxPixel + "px";
            tableEndLabel.style.width = (this._endLabel.length) + "em";
            
        } else {
            div.style.top = minPixel + "px";
            div.style.height = (maxPixel - minPixel) + "px";
            
            tableStartLabel.style.bottom = minPixel + "px";
            tableStartLabel.style.height = "1.5px";
            
            tableEndLabel.style.top = maxPixel + "px";
            tableEndLabel.style.height = "1.5px";        
        }
    }
    this._layerDiv.style.display = "block";
};

Timeline.SpanHighlightDecorator.prototype.softPaint = function() {
};

/*==================================================
 *  Point Highlight Decorator
 *==================================================
 */

Timeline.PointHighlightDecorator = function(params) {
    this._unit = ("unit" in params) ? params.unit : SimileAjax.NativeDateUnit;
    this._date = (typeof params.date == "string") ? 
        this._unit.parseFromObject(params.date) : params.date;
    this._width = ("width" in params) ? params.width : 10;
    this._color = params.color;
	this._cssClass = ("cssClass" in params) ? params.cssClass : '';
    this._opacity = ("opacity" in params) ? params.opacity : 100;
};

Timeline.PointHighlightDecorator.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;    
    this._layerDiv = null;
};

Timeline.PointHighlightDecorator.prototype.paint = function() {
    if (this._layerDiv != null) {
        this._band.removeLayerDiv(this._layerDiv);
    }
    this._layerDiv = this._band.createLayerDiv(10);
    this._layerDiv.setAttribute("name", "span-highlight-decorator"); // for debugging
    this._layerDiv.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    if (this._unit.compare(this._date, maxDate) < 0 &&
        this._unit.compare(this._date, minDate) > 0) {
        
        var pixel = this._band.dateToPixelOffset(this._date);
        var minPixel = pixel - Math.round(this._width / 2);
        
        var doc = this._timeline.getDocument();
    
        var div = doc.createElement("div");
		div.className='timeline-highlight-point-decorator'
		div.className += ' ' + this._cssClass
		
        if (this._opacity < 100) {
            SimileAjax.Graphics.setOpacity(div, this._opacity);
        }
        this._layerDiv.appendChild(div);
            
        if (this._timeline.isHorizontal()) {
            div.style.left = minPixel + "px";
        
        } else {
            div.style.top = minPixel + "px";
        }
    }
    this._layerDiv.style.display = "block";
};

Timeline.PointHighlightDecorator.prototype.softPaint = function() {
};
