/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define([
  './XactionComponent.ext',
  '../lib/jquery',
  './BaseComponent',
  '../dashboard/Utils'
], function(XactionComponentExt, $, BaseComponent, Utils) {

  return BaseComponent.extend({
    update: function() {
      var myself = this;
      try {
        if(typeof (this.iframe) == 'undefined' || !this.iframe) {
          // go through parameter array and update values
          var p = new Array(this.parameters ? this.parameters.length : 0);
          for(var i = 0, len = p.length; i < len; i++) {
            var key = this.parameters[i][0];
            var value = this.parameters[i][1] == ""
              ? this.parameters[i][2]
              : this.dashboard.getParameterValue(this.parameters[i][1]);
            if(this.value == "NIL") {
              this.value = this.parameters[i][2];
            }
            p[i] = [key, value];
          }
          if(typeof (this.serviceMethod) == 'undefined' || this.serviceMethod == 'ServiceAction') {
            var jXML = this.dashboard.callPentahoAction(myself, this.solution, this.path, this.action, p, null);
            if(jXML != null) {
              $('#' + myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
            }
          } else {
            var html = this.dashboard.pentahoServiceAction(this.serviceMethod, 'html', this.solution, this.path, this.action, p, null);
            $('#' + myself.htmlObject).html(html);
          }
        } else {
          var xactionIFrameHTML = "<iframe id=\"iframe_" + this.htmlObject + "\"" +
                                  " frameborder=\"0\"" +
                                  " height=\"100%\"" +
                                  " width=\"100%\" />";
          var iframe = $(xactionIFrameHTML);
          var action = Utils.pathIncludesAction(this.path, this.action) ? "" : (this.action || "");
          var url = XactionComponentExt.getCdfXaction(this.path, action, this.solution) + "&wrapper=false";

          // Add args
          var p = new Array(this.parameters.length);
          for(var i = 0, len = p.length; i < len; i++) {
            var arg = "&" + encodeURIComponent(this.parameters[i][0]) + "=";
            var val = "";
            if(this.parameters[i][1] == "") {
              val = encodeURIComponent(this.parameters[i][2]);
            } else {
              val = encodeURIComponent(this.dashboard.getParameterValue(this.parameters[i][1]));
              if(val == "NIL") {
                val = encodeURIComponent(this.parameters[i][2]);
              }
            }
            url += arg + val;
          }
          if(!this.loading) {
            this.loading = true;
            this.dashboard.incrementRunningCalls();
          }
          iframe.on('load', function() {
            if(this.contentWindow.document.body.innerHTML) {
              myself.loading = false;
              myself.dashboard.decrementRunningCalls();
            }
          });
          $("#" + this.htmlObject).empty().append(iframe);
          iframe[0].contentWindow.location = url;
        }
      } catch(e) {
        // don't cause the rest of CDF to fail if xaction component fails for whatever reason
      }
    }
  });

});
