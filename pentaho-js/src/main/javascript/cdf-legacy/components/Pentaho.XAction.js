/*!
 * Copyright 2002 - 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
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

/*
 *
 * Includes all components relating to XActions
 * Hitachi Vantara-owned technologies.
 *
 */

var XactionComponent = BaseComponent.extend({
  update: function() {
    var myself = this;
    try {
      if(typeof (myself.iframe) == 'undefined' || !myself.iframe) {
        // go through parameter array and update values
        var p = new Array(myself.parameters ? myself.parameters.length : 0);
        for(var i = 0, len = p.length; i < len; i++) {
          var key = myself.parameters[i][0];
          var value = myself.parameters[i][1] == "" ? myself.parameters[i][2] : Dashboards.getParameterValue(myself.parameters[i][1]);
          if(myself.value == "NIL") {
            myself.value = myself.parameters[i][2];
          }
          p[i] = [key, value];
        }
        if(typeof (myself.serviceMethod) == 'undefined' || myself.serviceMethod == 'ServiceAction') {
          var jXML = Dashboards.callPentahoAction(myself, myself.solution, myself.path, myself.action, p, null);
          if(jXML != null) {
            $('#' + myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
          }
        } else {
          var html = Dashboards.pentahoServiceAction(myself.serviceMethod, 'html', myself.solution, myself.path, myself.action, p, null);
          $('#' + myself.htmlObject).html(html);
        }
      } else {
        var xactionIFrameHTML = "<iframe id=\"iframe_" + myself.htmlObject + "\"" +
                                " frameborder=\"0\"" +
                                " height=\"100%\"" +
                                " width=\"100%\" />";
        var iframe = $(xactionIFrameHTML);
        var actionIncluded = function(path, action) {
            //check if path ends with action prefixed with '\' or '/'
            return (typeof path == "string") && (typeof action == "string")
                && (path.length > action.length)
                && (path.lastIndexOf(action) == (path.length - action.length))
                && ("\\/".indexOf(path.substr(-action.length-1, 1))>=0);
        };
        var url;
        if (actionIncluded(myself.path, myself.action)) {
            url = wd.cdf.endpoints.getCdfXaction(myself.path, "", myself.solution) + "&wrapper=false";
        } else {
            url = wd.cdf.endpoints.getCdfXaction(myself.path, myself.action, myself.solution) + "&wrapper=false";
        }
        // Add args
        var p = new Array(myself.parameters.length);
        for(var i = 0, len = p.length; i < len; i++) {
          var arg = "&" + encodeURIComponent(myself.parameters[i][0]) + "=";
          var val = "";
          if(myself.parameters[i][1] == "") {
            val = encodeURIComponent(myself.parameters[i][2]);
          } else {
            val = encodeURIComponent(Dashboards.getParameterValue(myself.parameters[i][1]));
            if(val == "NIL") {
              val = encodeURIComponent(myself.parameters[i][2]);
            }
          }
          url += arg + val;
        }
        if(!myself.loading) {
          myself.loading = true;
          Dashboards.incrementRunningCalls();
        }
        iframe.on('load', function() {
          if(this.contentWindow.document.body.innerHTML) {
            myself.loading = false;
            Dashboards.decrementRunningCalls();
          }
        });
        $("#" + myself.htmlObject).empty().append(iframe);
        iframe[0].contentWindow.location = url;
      }
    } catch(e) {
      // don't cause the rest of CDF to fail if xaction component fails for whatever reason
    }
  }
});//XactionComponent

var ExecuteXactionComponent = BaseComponent.extend({
  visible: false,
  update: function() {
    // 2 modes of working; if it's a div, create a button inside it
    var myself = this;
    var o = $("#" + myself.htmlObject);
    if($.inArray(o[0].tagName.toUpperCase(), ["SPAN", "DIV"]) > -1) {
      // create a button
      o = $("<button/>").appendTo(o.empty());
      if(o[0].tagName == "DIV") {
        o.wrap("<span/>");
      }
      if(myself.label != undefined) {
        o.text(myself.label);
      }
      o.button();
    }
    o.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)
    o.bind("click", function() {
      var success = typeof (myself.preChange) == 'undefined' ? true : myself.preChange();
      if(success) {
        myself.executeXAction();
      }
      if(typeof (myself.postChange) != 'undefined') {
        myself.postChange();
      }
    });
  },
  executeXAction: function() {
    var url = wd.cdf.endpoints.getCdfXaction(this.path, this.action, this.solution) + "&";
    var p = new Array(this.parameters.length);
    var parameters = [];
    for(var i = 0, len = p.length; i < len; i++) {
      var key = this.parameters[i][0];
      var value = Dashboards.getParameterValue(this.parameters[i][1]);
      if($.isArray(value)) {
        $(value).each(function(p) {
          parameters.push(key + "=" + encodeURIComponent(this));
        });
      } else {
        parameters.push(key + "=" + encodeURIComponent(value));
      }
    }
    url += parameters.join("&");
    url = url.replace(/'/g, "&#39;");
    $.fancybox.open({
      src: url,
      type: "iframe",
      baseClass: "cdf-fancybox cdf-fancybox-iframe",
      btnTpl: {
        smallBtn:
            '<button type="button" data-fancybox-close class="fancybox-button fancybox-close-small" title="close">' +
            '<svg id="svg-fancybox-close-small" width="350" height="350" viewbox="0 0 350 350" xmlns="http://www.w3.org/2000/svg"> <!-- Created with Method Draw - http://github.com/duopixel/Method-Draw/ --> <defs>  <filter id="svg_1_blur">   <feGaussianBlur stdDeviation="0" in="SourceGraphic"/>  </filter>  <filter height="200%" width="200%" y="-50%" x="-50%" id="svg_20_blur">   <feGaussianBlur stdDeviation="10" in="SourceGraphic"/>  </filter> </defs> <g>  <title>background</title>  <rect fill="none" id="canvas_background" height="302" width="302" y="-1" x="-1"/>  <g display="none" id="canvasGrid">   <rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%" id="svg_2"/>  </g> </g> <g>  <title>Layer 1</title>  <ellipse filter="url(#svg_20_blur)" ry="127.5" rx="127.5" id="svg_20" cy="154.5" cx="158.5" stroke-opacity="0" stroke-width="16" stroke="#0f0f00" fill="#000000"/>  <ellipse filter="url(#svg_1_blur)" ry="111" rx="111" id="svg_1" cy="145" cx="159" stroke-width="30" stroke="#ffffff" fill="#000"/>  <path d="m329,164l2,127" id="svg_3"/>  <path d="m329,164l2,127" id="svg_4"/>  <path d="m329,164l2,127" id="svg_5"/>  <path d="m329,164l2,127" id="svg_6"/>  <path d="m329,164l2,127" id="svg_9"/>  <path d="m241,161l2,127" id="svg_10"/>  <path d="m160,79l2,127"/>  <path d="m120,54l2,127"/>  <line transform="rotate(-45, 162, 143.5)" stroke-linecap="null" stroke-linejoin="null" id="svg_7" y2="207" x2="163" y1="80" x1="161" stroke-width="30" stroke="#ffffff" fill="none"/>  <path d="m329,164l2,127" id="svg_11"/>  <path d="m329,164l2,127" id="svg_12"/>  <path d="m329,164l2,127" id="svg_13"/>  <path d="m329,164l2,127" id="svg_14"/>  <path d="m329,164l2,127" id="svg_15"/>  <path d="m239,162l2,127" id="svg_16"/>  <path d="m239,162l2,127" id="svg_17"/>  <path d="m239,162l2,127" id="svg_18"/>  <path d="m239,162l2,127" id="svg_19"/>  <path d="m158,79l2,127"/>  <path d="m118,54l2,127"/>  <line transform="rotate(45, 163, 141.5)" stroke-linecap="null" stroke-linejoin="null" id="svg_8" y2="205" x2="164" y1="78" x1="162" stroke-width="30" stroke="#ffffff" fill="none"/> </g></svg>' +
            '</button>'
      }
    },
    {
      toolbar  : false,
      smallBtn : true,
      iframe:{
        preload: false,
        css: {
          width: $(window).width(),
          height: $(window).height() - 50,
          "max-width": "100%",
          "max-height": "100%"
        }
      }
    });
  }
});//ExecuteXactionComponent
