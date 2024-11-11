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
  './PrptComponent.ext',
  '../lib/jquery',
  './PrptComponent',
  'amd!../lib/jquery.fancybox'
], function(PrptComponentExt, $, PrptComponent) {

  return PrptComponent.extend({
    visible: false,
    update: function() {
      // 2 modes of working; if it's a div, create a button inside it
      var myself = this;
      var o = myself.placeholder();
      if(o.length > 0) {
        if($.inArray(o[0].tagName.toUpperCase(), ["SPAN", "DIV"]) > -1) {
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
          var success = (typeof myself.preChange == 'undefined') ? true : myself.preChange();
          if(success) {
            myself.executePrptComponent();
          }
          if(typeof myself.postChange != 'undefined') {
            myself.postChange();
          }
        });
      }

    },
    executePrptComponent: function() {
      var parameters = this.getOptions();
      var path = {};
      if(parameters.solution) {
        $.extend( path, {solution: parameters.solution});
      }
      if(parameters.path) {
        $.extend( path, {path: parameters.path});
      }
      if(parameters.action) {
        $.extend( path, {action: parameters.action});
      }
      delete parameters.solution;
      delete parameters.path;
      delete parameters.action;
      $.extend( parameters, {ts: new Date().getTime()});
      $.fancybox.open({
        src: PrptComponentExt.getReport(path, "viewer", parameters),
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
