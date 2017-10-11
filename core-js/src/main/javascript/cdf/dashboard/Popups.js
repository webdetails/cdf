/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  '../lib/mustache',
  'amd!../lib/underscore',
  '../lib/jquery',
  'amd!../lib/jquery.blockUI',
  'css!./Popups.css'
], function(Mustache, _, $) {

  /**
   * @class cdf.dashboard.Popups
   * @staticClass
   * @amd cdf/dashboard/Popups
   * @summary A static class containing pre-built error and success popups.
   * @classdesc <p>A static class containing pre-built error and success popups.</p>
   *            <p>Each exposed popup is an object with a `render` method that can be called to show the popup with
   *            some default values for each case.</p>
   */
  return /** @lends cdf.dashboard.Popups */ {

    /**
     * @class
     * @staticClass
     * @summary The Ok Popup.
     * @classdesc <p>The Ok Popup object containing the default values for a success notification popup.</p>
     *            <p>On button click, the Popup is closed.</p>
     * @example
     * <div class='cdfPopup'>
     *   <div class='cdfPopupHeader'>Title</div>
     *   <div class='cdfPopupBody'>
     *     <div class='cdfPopupDesc'>Description Text</div>
     *     <div class='cdfPopupButton'>Button Text</div>
     *   </div>
     * </div>
     *
     */
    okPopup: /** @lends cdf.dashboard.Popups.okPopup */{
      /**
       * @summary <code>Boolean</code> for component render state.
       * @description <code>Boolean</code> property used to define if the component was rendered or not.
       * @type {Boolean}
       * @private
       */
      _firstRender: true,

      /**
       * @summary The template of the Popup.
       * @description <p>The {@link https://mustache.github.io/|Mustache} template of the Ok Popup.</p>
       *              <p>It has a header, a description and a button. The default values for each of the template
       *              variables are stored in {@link cdf.dashboard.Popups.okPopup.defaults|defaults} `object`.</p>
       * @type {String}
       *
       * @code
       * <div class='cdfPopup'>
       *   <div class='cdfPopupHeader'>{{{header}}}</div>
       *   <div class='cdfPopupBody'>
       *     <div class='cdfPopupDesc'>{{{desc}}}</div>
       *     <div class='cdfPopupButton'>{{{button}}}</div>
       *   </div>
       * </div>
       */
      template: "<div class='cdfPopup'>" +
                "  <div class='cdfPopupHeader'>{{{header}}}</div>" +
                "  <div class='cdfPopupBody'>" +
                "    <div class='cdfPopupDesc'>{{{desc}}}</div>" +
                "    <div class='cdfPopupButton'>{{{button}}}</div>" +
                "  </div>" +
                "</div>",
      /**
       * @summary The Popup default properties.
       * @description The Popup default properties, with the properties applied during the template render.
       * @type {Object}
       *
       * @property {String} header=Title The header of the popup.
       * @property {String} desc=Description Text - The description of the popup.
       * @property {String} button=Button Text - The text on the button used to close the popup.
       * @property {Function} callback Callback function executed when the button is clicked.
       */
      defaults: {
        header: "Title",
        desc: "Description Text",
        button: "Button Text",
        callback: function() {
          return true
        }
      },

      /**
       * @summary The DOM element which holds the popup's content.
       * @description The DOM element which holds the popup's content.
       * @type {jQuery}
       */
      $el: undefined,

      /**
       * @summary Shows the popup.
       * @description <p>Shows the popup based on the {@link cdf.dashboard.Popups.okPopup.$el|$el} `object`.</p>
       *              <p>If the popup is rendering for the first time or if show is called with the `opts` parameter, then
       *              the render is called.</p>
       * @param {Object} [opts] Options object used to call the render.
       */
      show: function(opts) {
        if(opts || this._firstRender) {
          this.render(opts);
        }
        this.$el.show();
      },

      /**
       * @summary Hides the popup.
       * @description Hides the popup, based on the {@link cdf.dashboard.Popups.okPopup.$el|$el} element.
       */
      hide: function() {
        this.$el.hide();
      },

      /**
       * @summary Renders the Popup.
       * @description <p>Renders the Popup based on the object containing the properties to apply to the
       *              {@link https://mustache.github.io/|Mustache} template.</p>
       *              <p>When the component is rendered, it gets hidden and appended to the body.</p>
       * @param {Object} [newOpts] Options object used to extend the
       *                           {@link cdf.dashboard.Popups.okPopup.defaults|defaults} `object`.
       *                           This is used to assign values to the properties which define the content of the component.
       */
      render: function(newOpts) {
        var opts = _.extend({} , this.defaults, newOpts);
        var myself = this;
        if(this._firstRender) {
          this.$el = $('<div/>').addClass('cdfPopupContainer')
            .hide()
            .appendTo('body');
          this._firstRender = false;
        }
        this.$el.empty().html(Mustache.render(this.template, opts));
        this.$el.find('.cdfPopupButton').click(function() {
          opts.callback();
          myself.hide();
        });
      }
    },

    /**
     * @class
     * @staticClass
     * @summary The Error Notification Popup.
     * @classdesc <p>The Error Notification Popup object containing the default values for a error notification popup.</p>
     *
     * @example
     * <div class='cdfNotification component small>
     *   <div class='cdfNotificationBody'>
     *     <div class='cdfNotificationImg'>&nbsp;</div>
     *     <div class='cdfNotificationTitle' title='Component Error'>Component Error</div>
     *     <div class='cdfNotificationDesc' title='Error processing component.'>Error processing component.</div>
     *   </div>
     * </div>
     */
    notificationsComponent: /** @lends cdf.dashboard.Popups.notificationsComponent */{
      /**
       * @summary The template of the Popup.
       * @description <p>The {@link https://mustache.github.io/|Mustache} template of the Error Notification Popup.</p>
       *              <p>It has a title and description. The default values for each of the template variables are
       *              stored in {@link cdf.dashboard.Popups.notificationsComponent.defaults|defaults} `object`.</p>
       * @type {String}
       *
       * @code
       * <div class='cdfNotification component {{#isSmallComponent}}small{{/isSmallComponent}}>
       *   <div class='cdfNotificationBody'>
       *     <div class='cdfNotificationImg'>&nbsp;</div>
       *     <div class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</div>
       *     <div class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</div>
       *   </div>
       * </div>
       */
      template: "<div class='cdfNotification component {{#isSmallComponent}}small{{/isSmallComponent}}'>" +
                "  <div class='cdfNotificationBody'>" +
                "    <div class='cdfNotificationImg'>&nbsp;</div>" +
                "    <div class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</div>" +
                "    <div class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</div>" +
                "  </div>" +
                "</div>" ,
      /**
       * @summary The Popup default properties.
       * @description The Popup default properties, with the properties applied during the template render.
       *
       * @type {Object}
       * @property {String} title=Component Error - Title of the Error message
       * @property {String} desc=Error processing component - The Error message
      */
      defaults: {
        title: "Component Error",
        desc: "Error processing component."
      },

      /**
       * @summary Renders the Popup.
       * @description <p>Renders the Popup based on the object containing the properties to apply to the
       *              {@link https://mustache.github.io/|Mustache} template.</p>
       *              <p>If the component has a width smaller than 300, the css class small is added.</p>
       *
       * @param {jQuery|Selector} ph The DOM Element or the jQuery Selector.
       *                             This is the container which will hold the content of the popup.
       * @param {Object} [newOpts] Options object used to extend the
       *                           {@link cdf.dashboard.Popups.notificationsComponent.defaults|defaults} `object`.
       *                           This is used to assign values to the properties that define the content of the component.
       */
      render: function(ph, newOpts) {
        var opts = _.extend({}, this.defaults, newOpts);
        opts.isSmallComponent = ($(ph).width() < 300);
        $(ph).empty().html( Mustache.render(this.template, opts));
        var $nt = $(ph).find('.cdfNotification');
        $nt.css({'line-height': $nt.height() + 'px'});
      }
    },

    /**
     * @class
     * @staticClass
     * @summary The Error Notification Growl Popup.
     * @classdesc <p>The Error Notification Growl Popup object containing the default values for an error
     *            notification growl popup.</p>
     * @example
     * <div class='cdfNotification growl'>
     *   <div class='cdfNotificationBody'>
     *     <h1 class='cdfNotificationTitle' title='Title'>Title</h1>
     *     <h2 class='cdfNotificationDesc' title='Default CDF notification.'>Default CDF notification.</h2>
     *   </div>
     * </div>
     */
    notificationsGrowl: /** @lends cdf.dashboard.Popups.notificationsGrowl */{
      /**
       * @summary <code>Boolean</code> for component render state.
       * @description <code>Boolean</code> property used to define if the component was rendered or not.
       * @type {Boolean}
       * @private
       */
      _firstRender: true,

      /**
       * @summary The template of the Popup.
       * @description <p>The {@link https://mustache.github.io/|Mustache} template of the Error Notification
       *              Popup.</p>
       *              <p>It has a title and a description. The default values for each of the template variables are
       *              stored in {@link cdf.dashboard.Popups.notificationsGrowl.defaults|defaults} `object`.</p>
       * @type {String}
       *
       * @code
       * <div class='cdfNotification growl'>
       *   <div class='cdfNotificationBody'>
       *     <h1 class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</h1>
       *     <h2 class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</h2>
       *   </div>
       * </div>
       *
       * @see {@link https://mustache.github.io/|Mustache}
       */
      template: "<div class='cdfNotification growl'>" +
                "  <div class='cdfNotificationBody'>" +
                "    <h1 class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</h1>" +
                "    <h2 class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</h2>" +
                "  </div>" +
                "</div>" ,

      /**
       * @summary The Popup default properties.
       * @description <p>The Popup default properties, with the properties applied during the template render.</p>
       *              <p>More info about some of the properties used is detailed below.</p>
       * @type {Object}
       *
       * @property {String} title=Title The title of the popup.
       * @property {String} desc=Default CDF notification - The description of the popup.
       * @property {Number} timeout=4000 The timeout for the popup.
       * @property {Function} onUnblock Callback function called when onUnblock from
       *                                {@link http://malsup.com/jquery/block/|jQuery.blockUI} is called.
       * @property {Object} css An object with the {@link http://malsup.com/jquery/block/|jQuery.blockUI} default options.
       * @property {String} css.position=Absolute The default popup css position value.
       * @property {String} css.width=100% The default popup css width value.
       * @property {String} css.top=10px The default popup css top value.
       * @property {Boolean} showOverlay=false Boolean flag to control whether the overlay is shown or not.
       * @property {Number} fadeIn=700 Time in milliseconds to show the Growl Popup.
       * @property {Number} fadeOut=1000 Time in milliseconds to hide the Growl Popup.
       * @property {Boolean} centerY=false Boolean to force the Growl Popup to now be centered in the Y axis.
       *
       * @see {@link http://malsup.com/jquery/block/|jQuery.blockUI}
       */
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

      /**
       * @summary Renders the Popup.
       * @description <p>Renders the Popup based on the object containing the properties to apply to the
       *              {@link https://mustache.github.io/|Mustache} template.</p>
       *              <p>If the render function is called for the first time, then the component is rendered and
       *              attached in the body of the page. Otherwise, the component is shown, calling the
       *              {@link http://malsup.com/jquery/block/|jQuery.blockUI}.
       *              {@link http://malsup.com/jquery/block/#element|block} function with the defaults extended
       *              with the newOpts argument to allow user customizations.</p>
       *
       * @param {Object} [newOpts] Options object used to extend the default object. This is used to assign values
       *                           to the properties that define the content of the component.
       *
       * @see {@link http://malsup.com/jquery/block/|jQuery.blockUI}
       */
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
        if(this._firstRender) {
          this.$el = $('<div/>').addClass('cdfNotificationContainer').hide().appendTo('body');
          this._firstRender = false;
        }
        this.$el.show().block(opts);
      }
    }
  };
});
