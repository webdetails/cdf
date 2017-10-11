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
 *  Classic Theme
 *==================================================
 */

Timeline.ClassicTheme = new Object();

Timeline.ClassicTheme.implementations = [];

Timeline.ClassicTheme.create = function(locale) {
    if (locale == null) {
        locale = Timeline.getDefaultLocale();
    }
    
    var f = Timeline.ClassicTheme.implementations[locale];
    if (f == null) {
        f = Timeline.ClassicTheme._Impl;
    }
    return new f();
};

Timeline.ClassicTheme._Impl = function() {
    this.firstDayOfWeek = 0; // Sunday
	
    this.ether = {
        backgroundColors: [
        //    "#EEE",
        //    "#DDD",
        //    "#CCC",
        //    "#AAA"
        ],
     //   highlightColor:     "white",
        highlightOpacity:   50,
        interval: {
            line: {
                show:       true,
               // color:      "#aaa",
                opacity:    25
            },
            weekend: {
              //  color:      "#FFFFE0",
                opacity:    30
            },
            marker: {
                hAlign:     "Bottom",
				/*
                hBottomStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-bottom";
                },
                hBottomEmphasizedStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-bottom-emphasized";
                },
                hTopStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-top";
                },
                hTopEmphasizedStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-top-emphasized";
                },
                */
				
                    
                vAlign:     "Right"
               /*
			    vRightStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-right";
                },
                vRightEmphasizedStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-right-emphasized";
                },
                vLeftStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-left";
                },
                vLeftEmphasizedStyler:function(elmt) {
                    elmt.className = "timeline-ether-marker-left-emphasized";
                }
                */
            }
        }
    };
    
    this.event = {
        track: {
            height:         10, // px
            gap:            2   // px
        },
        overviewTrack: {
            offset:     20,     // px
            tickHeight: 6,      // px
            height:     2,      // px
            gap:        1       // px
        },
        tape: {
            height:         4 // px
        },
        instant: {
            icon:              Timeline.urlPrefix + "images/dull-blue-circle.png",
            iconWidth:         10,
            iconHeight:        10,
    //        color:             "#58A0DC",
    //        impreciseColor:    "#58A0DC",
            impreciseOpacity:  20
        },
        duration: {
      //      color:            "#58A0DC",
      //      impreciseColor:   "#58A0DC",
            impreciseOpacity: 20
        },
        label: {
      //      backgroundColor:   "white",
            backgroundOpacity: 50,
      //      lineColor:         "#58A0DC",
            offsetFromLine:    3 // px
        },
        highlightColors: [
   //         "#FFFF00",
   //         "#FFC000",
   //         "#FF0000",
   //         "#0000FF"
        ],
        bubble: {
            width:          250, // px
            height:         125, // px
            titleStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-title";
            },
            bodyStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-body";
            },
            imageStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-image";
            },
            wikiStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-wiki";
            },
            timeStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-time";
            }
        }
    };
    
    this.zoom = true; // true or false
};
