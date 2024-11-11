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

      $.fancybox.open({
        src: this._getApiUrl(),
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
            width: $window.width(),
            height: $window.height() - 50,
            "max-width": "100%",
            "max-height": "100%"
          }
        }
      });
    },

    _createExecuteButton: function() {
      // 2 modes of working; if it's a div, create a button inside it
      var $html = $("#" + this.htmlObject);

      if (!$html.length) return;

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
