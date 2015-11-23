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
 *  Planning
 *==================================================
 */

Timeline.Planning = new Object();

Timeline.Planning.createBandInfo = function(params) {
    var theme = ("theme" in params) ? params.theme : Timeline.getDefaultTheme();
    
    var eventSource = ("eventSource" in params) ? params.eventSource : null;
    
    var ether = new Timeline.LinearEther({ 
        centersOn:          ("date" in params) ? params.date : Timeline.PlanningUnit.makeDefaultValue(),
        interval:           1,
        pixelsPerInterval:  params.intervalPixels
    });
    
    var etherPainter = new Timeline.PlanningEtherPainter({
        intervalUnit:       params.intervalUnit, 
        multiple:           ("multiple" in params) ? params.multiple : 1,
        align:              params.align,
        theme:              theme 
    });
    
    var eventPainterParams = {
        theme:      theme
    };
    if ("trackHeight" in params) {
        eventPainterParams.trackHeight = params.trackHeight;
    }
    if ("trackGap" in params) {
        eventPainterParams.trackGap = params.trackGap;
    }
    var eventPainter = ("overview" in params && params.overview) ?
        new Timeline.OverviewEventPainter(eventPainterParams) :
        new Timeline.DetailedEventPainter(eventPainterParams);
    
    return {   
        width:          params.width,
        eventSource:    eventSource,
        timeZone:       ("timeZone" in params) ? params.timeZone : 0,
        ether:          ether,
        etherPainter:   etherPainter,
        eventPainter:   eventPainter
    };
};
