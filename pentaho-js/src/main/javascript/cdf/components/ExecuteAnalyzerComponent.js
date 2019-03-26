/*!
 * Copyright 2002 - 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  './AnalyzerComponent',
  '../lib/jquery',
  'amd!../lib/jquery.fancybox'
], function(AnalyzerComponent, $) {

  return AnalyzerComponent.extend({

    update: function() {
      this.clear();

      this._createExecuteButton();
    },

    executeAnalyzerComponent: function() {
      var $window = $(window);

      $.fancybox({
        type: "iframe",
        href: this._getApiUrl(),
        width: $window.width(),
        height: $window.height() - 50
      });
    },

    _createExecuteButton: function() {
      // 2 modes of working; if it's a div, create a button inside it
      var $html = $("#" + this.htmlObject);

      if ($html == null || !$html.length) return;

      var tag = $html[0].tagName.toUpperCase();
      if (["SPAN", "DIV"].indexOf(tag) !== -1) {
        // create a button
        $html = $("<button/>").appendTo($html.empty());

        if (tag === "DIV") {
          $html.wrap("<span/>");
        }

        var label = this.label;
        if (label != null) {
          $html.text(label);
        }

        $html.button();
      }

      $html.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)

      var component = this;
      $html.bind("click", function() {
        var preChangeSuccess = true;

        if (typeof component.preChange === 'function') {
          preChangeSuccess = component.preChange();
        }

        if (preChangeSuccess) {
          component.executeAnalyzerComponent();
        }

        if (typeof component.postChange === 'function') {
          component.postChange();
        }
      });
    }
  });

});
