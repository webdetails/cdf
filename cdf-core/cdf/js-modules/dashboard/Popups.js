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

/**
 * A module containing pre-built error and ok popups.
 * Each exposed popup is an object with a _render_ method that can be called to show the popup.
 * @class Popups
 * @module Popups
 */

define([
  '../lib/mustache',
  'amd!../lib/underscore',
  '../lib/jquery',
  'amd!../lib/jquery.blockUI'
], function(Mustache, _, $) {

  var Popups = {};

  /**
   * Ok Popup.
   * @property okPopup
   * @type object
   * @static
   */
  Popups.okPopup = {
    template: "<div class='cdfPopup'>" +
              "  <div class='cdfPopupHeader'>{{{header}}}</div>" +
              "  <div class='cdfPopupBody'>" +
              "    <div class='cdfPopupDesc'>{{{desc}}}</div>" +
              "    <div class='cdfPopupButton'>{{{button}}}</div>" +
              "  </div>" +
              "</div>",
    defaults: {
      header: "Title",
      desc: "Description Text",
      button: "Button Text",
      callback: function() {
        return true
      }
    },
    $el: undefined,
    show: function(opts) {
      if(opts || this.firstRender) {
        this.render(opts);
      }
      this.$el.show();
    },
    hide: function() {
      this.$el.hide();
    },
    render: function(newOpts) {
      var opts = _.extend({} , this.defaults, newOpts);
      var myself = this;
      if(this.firstRender) {
        this.$el = $('<div/>').addClass('cdfPopupContainer')
          .hide()
          .appendTo('body');
        this.firstRender = false;
      }
      this.$el.empty().html( Mustache.render(this.template, opts));
      this.$el.find('.cdfPopupButton').click(function() {
        opts.callback();
        myself.hide();
      });
    },
    firstRender: true
  };

  /*
   * Error information divs
   *
   *
   */

  /**
   * Error Popup used by the notificationsComponent.
   * @property notificationsComponent
   * @type object
   * @static
   */
  Popups.notificationsComponent = {
    template: "<div class='cdfNotification component {{#isSmallComponent}}small{{/isSmallComponent}}'>" +
              "  <div class='cdfNotificationBody'>" +
              "    <div class='cdfNotificationImg'>&nbsp;</div>" +
              "    <div class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</div>" +
              "    <div class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</div>" +
              "  </div>" +
              "</div>" ,
    defaults: {
      title: "Component Error",
      desc: "Error processing component."
    },
    render: function(ph, newOpts) {
      var opts = _.extend({}, this.defaults, newOpts);
      opts.isSmallComponent = ($(ph).width() < 300);
      $(ph).empty().html( Mustache.render(this.template, opts));
      var $nt = $(ph).find('.cdfNotification');
      $nt.css({'line-height': $nt.height() + 'px'});
    }
  };

  /**
   * Growl default Popup
   * @property notificationsGrowl
   * @type object
   * @static
   */
  Popups.notificationsGrowl = {
    template: "<div class='cdfNotification growl'>" +
              "  <div class='cdfNotificationBody'>" +
              "    <h1 class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</h1>" +
              "    <h2 class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</h2>" +
              "  </div>" +
              "</div>" ,
    defaults: {
      title: 'Title',
      desc: 'Default CDF notification.',
      timeout: 4000,
      onUnblock: function() { return true; },
      css: $.extend(
        {},
        $.blockUI.defaults.growlCSS,
        {position: 'absolute' , width: '100%' , top:'10px'}
      ),
      showOverlay: false,
      fadeIn: 700,
      fadeOut: 1000,
      centerY: false
    },
    render: function(newOpts) {
      var opts = _.extend({}, this.defaults, newOpts),
          $m = $(Mustache.render(this.template, opts)),
          myself = this;
      opts.message = $m;
      var outerUnblock = opts.onUnblock;
      opts.onUnblock = function() {
        myself.$el.hide();
        outerUnblock.call(this);
      };
      if(this.firstRender) {
        this.$el = $('<div/>').addClass('cdfNotificationContainer').hide().appendTo('body');
        this.firstRender = false;
      }
      this.$el.show().block(opts);
    },
    firstRender: true
  };

  return Popups;
});
