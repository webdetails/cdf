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


/*
 *
 * Includes all components relating to JPivot
 * Hitachi Vantara-owned technologies.
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
    $.fancybox.open({
      src: url,
      type: "iframe",
      baseClass: "cdf-fancybox cdf-fancybox-iframe",
      btnTpl: {
        smallBtn:
            '<button type="button" data-fancybox-close class="fancybox-button fancybox-close-small" title="close"></button>'
      }
    },
    {
      toolbar  : false,
      smallBtn : true,
      iframe:{
        preload: false,
        css: {
          width: $(window).width(),
          height: $(window).height(),
          "max-width": "100%",
          "max-height": "100%"
        }
      }
    });
  }
});//PivotLinkComponent
