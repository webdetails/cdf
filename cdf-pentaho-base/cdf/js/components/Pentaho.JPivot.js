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

/*
 *
 * Includes all components relating to JPivot
 * Pentaho-owned technologies.
 *
 */

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
      var value = Dashboards.getParameterValue(this.parameters[i][1]);
      params[key] = value;
    }
    jpivotHTML += wd.cdf.endpoints.getCdfXaction(this.path, this.action, this.solution, params);
    // Close IFrame
    jpivotHTML += "\"></iframe>";
    $("#" + this.htmlObject).html(jpivotHTML);
  }
});//JpivotComponent

var PivotLinkComponent = BaseComponent.extend({
  update: function() {
    var title = this.tooltip == undefined ? "View details in a Pivot table" : this.tooltip;
    // WPG: this assumes name is global name, can I pass in the object directly instead?
    var link = $('<a class="pivotLink"> </a>').html(this.content).attr("href", "javascript:PivotLinkComponent.openPivotLink(" + this.name + ")").attr("title", title);
    $("#" + this.htmlObject).empty();
    $("#" + this.htmlObject).html(link);
    $('a.pivotLink').tooltip({
      showURL: false,
      track: true,
      delay: 1000,
      opacity: 0.5,
      content: title
    });
  }
}, {
  openPivotLink: function(object) {
    var url = wd.cdf.endpoints.getPivot("system", "pentaho-cdf/actions", "jpivot.xaction") + "&";
    var qd = object.pivotDefinition;
    var parameters = [];
    for(p in qd) {
      var key = p;
      var value = typeof qd[p] == 'function' ? qd[p]() : qd[p];
      parameters.push(key + "=" + encodeURIComponent(value));
    }
    url += parameters.join("&");
    url = url.replace(/'/g, "&#39;");
    $.fancybox({
      type: "iframe",
      href: url,
      width: $(window).width(),
      height: $(window).height()
    });
  }
});//PivotLinkComponent
