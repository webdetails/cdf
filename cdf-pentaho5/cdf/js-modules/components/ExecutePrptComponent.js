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
  './PrptComponent.ext',
  '../lib/jquery',
  './PrptComponent',
  'amd!../lib/jquery.fancybox'
], function(PrptComponentExt, $, PrptComponent) {

  var ExecutePrptComponent = PrptComponent.extend({
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
      $.fancybox({
        type: "iframe",
        href: PrptComponentExt.getReport(path, "viewer", parameters),
        width: $(window).width(),
        height: $(window).height() - 50
      });
    }
  });

  return ExecutePrptComponent;

});
