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

define([
  '../dashboard/Utils',
  './PivotLinkComponent.ext',
  './BaseComponent',
  '../lib/jquery',
  'amd!../lib/jquery.fancybox'
], function(Utils, PivotLinkComponentExt, BaseComponent, $) {

  var PivotLinkComponent = BaseComponent.extend({
    update: function() {
      var title = this.tooltip == undefined ? "View details in a Pivot table" : this.tooltip;
      // WPG: this assumes name is global name, can I pass in the object directly instead?
      var link = $('<a class="pivotLink"> </a>')
        .html(this.content)
        .attr("href", "javascript:require(['cdf/components/PivotLinkComponent'],function(PivotLinkComponent){PivotLinkComponent.openPivotLink(this.dashboard.getComponent('" + this.name + "'));});void(0);")
        .attr("title", title);
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
  },

  {
    openPivotLink: function(object) {
      var url = PivotLinkComponentExt.getPivot("system", "pentaho-cdf/actions", "jpivot.xaction") + "&";
      var qd = object.pivotDefinition;

      // check if we should use a data source
      if(typeof qd.dataSource == "string" && qd.dataSource) {
        // merge options, query definition options override options duplicated in the data source
        qd = $.extend({}, object.dashboard.getDataSource(qd.dataSource), qd);
        // remove the data source name from the query definition
        delete qd.dataSource;
      }

      var parameters = [];
      for(var p in qd) if(qd.hasOwnProperty(p)) {
        parameters.push(p + "=" + encodeURIComponent(Utils.ev(qd[p])));
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
  });

  return PivotLinkComponent;

});
