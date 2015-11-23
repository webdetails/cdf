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

define(['./XactionComponent.ext', '../lib/jquery', './BaseComponent', 'amd!../lib/jquery.fancybox'],
  function(XactionComponentExt, $, BaseComponent) {

  var JpivotComponent = BaseComponent.extend({
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

  return JpivotComponent;

});
