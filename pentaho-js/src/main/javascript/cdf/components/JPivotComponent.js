/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

define([
  './XactionComponent.ext',
  '../lib/jquery',
  './BaseComponent',
  'amd!../lib/jquery.fancybox'
], function(XactionComponentExt, $, BaseComponent) {

  return BaseComponent.extend({
    update: function() {
      //to be backwards compatible set default value for iframeScolling
      // also added 20px
      if(this.iframeScrolling == undefined) {
        this.iframeScrolling = "no";
      }
      // Build IFrame and set url
      var jpivotHTML = "<iframe id=\"jpivot_" + this.htmlObject + "\" scrolling=\"" + this.iframeScrolling + "\" onload=\"var dynamicHeight = this.contentWindow.document.body.offsetHeight+50; this.style.height = dynamicHeight + 'px';\" frameborder=\"0\" height=\"" + this.iframeHeight + "\" width=\"" + this.iframeWidth + "\" src=\"";
      // Add args
      var params = {};
      var p = new Array(this.parameters.length);
      for(var i = 0, len = p.length; i < len; i++) {
        var key = this.parameters[i][0];
        var value = this.dashboard.getParameterValue(this.parameters[i][1]);
        params[key] = value;
      }
      jpivotHTML += XactionComponentExt.getCdfXaction(this.path, this.action, this.solution, params);
      // Close IFrame
      jpivotHTML += "\"></iframe>";
      $("#" + this.htmlObject).html(jpivotHTML);
    }
  });

});
