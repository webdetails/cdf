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
  '../dashboard/Utils',
  './PivotLinkComponent.ext',
  './BaseComponent',
  '../lib/jquery',
  'amd!../lib/jquery.fancybox'
], function(Utils, PivotLinkComponentExt, BaseComponent, $) {

  return BaseComponent.extend({
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
  });

});
