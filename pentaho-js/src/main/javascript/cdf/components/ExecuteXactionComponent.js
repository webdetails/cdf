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
    visible: false,
    update: function() {
      // 2 modes of working; if it's a div, create a button inside it
      var myself = this;
      var o = this.placeholder();
      if(o[0] && $.inArray(o[0].tagName.toUpperCase(), ["SPAN", "DIV"]) > -1) {
        // create a button
        o = $("<button/>").appendTo(o.empty());
        if(o[0].tagName == "DIV") {
          o.wrap("<span/>");
        }
        if(this.label != undefined) {
          o.text(this.label);
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
      var url = XactionComponentExt.getCdfXaction(this.path, this.action, this.solution) + "&";
      var p = new Array(this.parameters.length);
      var parameters = [];
      for(var i = 0, len = p.length; i < len; i++) {
        var key = this.parameters[i][0];
        var value = this.dashboard.getParameterValue(this.parameters[i][1]);
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
            height: $(window).height() - 50,
            "max-width": "100%",
            "max-height": "100%"
          }
        }
      });
    }
  });

});
