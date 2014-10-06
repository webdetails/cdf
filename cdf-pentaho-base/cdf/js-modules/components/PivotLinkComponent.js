/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(['./PivotLinkComponent.ext', '../lib/jquery', './BaseComponent', '../lib/jquery.fancybox', '../lib/jquery.tooltip'],
  function(PivotLinkComponentExt, $, BaseComponent) {

  var PivotLinkComponent = BaseComponent.extend({
    update: function() {
      var title = this.tooltip == undefined ? "View details in a Pivot table" : this.tooltip;
      // WPG: this assumes name is global name, can I pass in the object directly instead?
      var link = $('<a class="pivotLink"> </a>')
        .html(this.content)
        .attr("href", "javascript:PivotLinkComponent.openPivotLink(" + this.name + ")")
        .attr("title", title);
      $("#" + this.htmlObject).empty();
      $("#" + this.htmlObject).html(link);
      $('a.pivotLink').tooltip({
        showURL: false,
        track: true,
        delay: 1000,
        opacity: 0.5
      });
    }
  },

  {
    openPivotLink: function(object) {
      var url = PivotLinkComponentExt.getPivot("system", "pentaho-cdf/actions", "jpivot.xaction") + "&";
      var qd = object.pivotDefinition;
      var parameters = [];
      for (p in qd) {
        var key = p;
        var value = typeof qd[p] == 'function' ? qd[p]() : qd[p];
        //alert("key: " + key + "; Value: " + value);
        parameters.push(key + "=" + encodeURIComponent(value));
      }
      url += parameters.join("&");
      var _href = url.replace(/'/g, "&#39;");
      $.fancybox({
        type: "iframe",
        href: _href,
        width: $(window).width(),
        height: $(window).height()
      });
    }
  });

  return PivotLinkComponent;

});
