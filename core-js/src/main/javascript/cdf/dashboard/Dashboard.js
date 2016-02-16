/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
  '../lib/Base',
  '../Logger',
  './RefreshEngine',
  'amd!../lib/underscore',
  'amd!../lib/backbone',
  '../lib/jquery',
  'module',
  'amd!../lib/jquery.impromptu',
  '../lib/shims'
], function(Base, Logger, RefreshEngine, _, Backbone, $, module) {

  return Base.extend(/** @lends cdf.dashboard.Dashboard# */{
    /**
     * This class is abstract, so it should not be required or instantiated directly.
     * Instead use one of its extending subclasses:
     * {@link cdf.Blueprint|Blueprint},
     * {@link cdf.Bootstrap|Bootstrap} or
     * {@link cdf.Clean|Clean}.
     * 
     * @constructs
     * @extends {@link http://dean.edwards.name/weblog/2006/03/base/|Base}
     * @extends {@link http://backbonejs.org/#Events|Backbone.Events}
     * @classdesc Base abstract dashboard class.
     * @param {Object} options Object that can contain the context, storage and view.
     */
    constructor: function(options) {
      var myself = this;

      if(options) {
        if(options.context) {
          this.context = options.context;
        }
        if(options.storage) {
          // Don't do anything for anonymousUser.
          if(!this.context || this.context.user !== "anonymousUser") {
            this.storage = options.storage;
          }
        }
        if(options.view) {
          this.view = options.view;
        }
      }

      _.extend(this, Backbone.Events);

      _configurePlugins();

      //TODO: when we start including the webcontext from the server we must review this part
      if(typeof(CONTEXT_PATH) != 'undefined') {
        this.webAppPath = CONTEXT_PATH;
      }
      if(this.webAppPath === undefined) {
        this.webAppPath = "/" + window.location.pathname.split('/')[1];
      }

      if(this.webAppPath.endsWith("/")) {
        this.webAppPath = this.webAppPath.substr(0, this.webAppPath.length - 1);
      }

      _callIfAvailable(this._initContext, "Context");
      _callIfAvailable(this._initStorage, "Storage");
      _callIfAvailable(this._initViews, "Views");
      _callIfAvailable(this._initParameters, "Parameters");
      _callIfAvailable(this._initBookmarkables, "Bookmarkables");
      _callIfAvailable(this._initI18n, "I18n");
      _callIfAvailable(this._initComponents, "Components");
      _callIfAvailable(this._initLifecycle, "Lifecycle");
      _callIfAvailable(this._initNotifications, "Notifications");
      _callIfAvailable(this._initDataSources, "DataSources");
      _callIfAvailable(this._initQuery, "Query");
      _callIfAvailable(this._initAddIns, "AddIns");

      this.refreshEngine = new RefreshEngine(this);

      /**
       * Calls a function if it is available in the prototype.
       *
       * @param {Function} func The function to execute.
       * @param {String} module The name of the module that will be loaded.
       * @inner
       * @ignore
       */
      function _callIfAvailable(func, module) {
        if(typeof func == "function") {
          Logger.info("Calling init method of module: " + module);
          func.apply(myself);
        } else {
          Logger.warn("Not calling init method of module: " + module);
        }
      }

      /**
       * Initializes the cdf plugins.
       *
       * @inner
       * @ignore
       */
      function _configurePlugins() {
        var myself = this;

        if(typeof $ == 'function') {
          //ajax
          $.ajaxSetup({
            type: "POST",
            async: false,
            traditional: true,
            scriptCharset: "utf-8",
            contentType: "application/x-www-form-urlencoded;charset=UTF-8",

            dataFilter: function(data, dtype) {
              // just tagging date
              myself.lastServerResponse = Date.now ? Date.now() : new Date().getTime();
              return data;
            }
          });

          //Set impromptu defaults
          if($.prompt && typeof $.prompt.setDefaults == 'function') {
            $.prompt.setDefaults({
              prefix: 'jqi',
              show: 'slideDown'
            });
          } else {
            Logger.log("$.prompt plugin not loaded!!");
          }

          //blockUI
          if(typeof $.blockUI == 'function') {
            $.blockUI.defaults.fadeIn = 0;
            $.blockUI.defaults.message = '<div class="blockUIDefaultImg"></div>';
            $.blockUI.defaults.css.left = '50%';
            $.blockUI.defaults.css.top = '40%';
            $.blockUI.defaults.css.marginLeft = '-16px';
            $.blockUI.defaults.css.width = '32px';
            $.blockUI.defaults.css.background = 'none';
            $.blockUI.defaults.overlayCSS = {
              backgroundColor: "#FFFFFF",
              opacity: 0.8,
              cursor: "wait"
            };
            $.blockUI.defaults.css.border = "none";
          } else {
            Logger.log("$.blockUI plugin not loaded!!");
          }
        } else {
          Logger.log("jQuery plugin not loaded!!");
        }
      }
    },

    /**
     * Determines if components and params are retrieved
     * from the _window_ object or from the dashboard instance
     *
     * @type {boolean}
     * @default false
     * 
     * @deprecated
     * @ignore
     */
    globalContext: false,

    // Holds the dashboard parameters if globalContext = false

    /**
     * Initial dashboard context value. It will either be an empty object
     * or will be set according to the context property of the 
     * {@link cdf.dashboard.Dashboard|Dashboard} AMD module configuration.
     *
     * @type {object}
     * @default {}
     * @private
     * @see {@link http://requirejs.org/docs/api.html#config|RequireJS Configuration Options}
     */
    contextObj: module.config().context || {},

    /**
     * Initial dashboard storage value. It will either be an empty object
     * or will be set according to the storage property of the 
     * dashboard AMD module configuration.
     *
     * @type {object}
     * @ignore
     */
    storageObj: module.config().storage || {},

    /**
     * Initial dashboard view value. It will either be an empty object
     * or will be set according to the view property of the 
     * dashboard AMD module configuration.
     *
     * @type {object}
     * @ignore
     */
    viewObj: module.config().view,

    /**
     * Legacy dashboards don't have priority, so we'll assign a very low priority
     * to them.
     *
     * @type {number}
     * @default -1000
     * @ignore
     */
    legacyPriority: -1000,

    /**
     * Flag indicating if the lifecycle events should be logged.
     *
     * @type {boolean}
     * @default true
     */
    logLifecycle: true,

    /**
     * Array of arguments.
     *
     * @type {string[]}
     * @deprecated
     * @ignore
     */
    args: [],

    //TODO: Review the monthNames usage in month selector component, impossible to localize!!!!
    /**
     * Array of month names.
     *
     * @type {string[]}
     * @deprecated
     * @ignore
     */
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],

    /**
     * Registers a callback function in the dashboard's events property.
     * Creates the dashboard's events property if it's undefined.
     *
     * @param {string}   ev       The name of the event.
     * @param {function} callback The callback function.
     * @ignore
     */
    registerEvent: function(ev, callback) {
      if(typeof this.events == 'undefined') {
        this.events = {};
      }
      this.events[ev] = callback;
    },

    /**
     * The dashboard's debug level.
     *
     * @type {number}
     * @default 1
     */
    debug: 1,

    /**
     * Sets the {@link cdf.dashboard.Dashboard#debug|debug} level.
     * If the URL parameter _debug_ has value _true_ and the value of the URL parameter
     * _debugLevel_ is a valid numeric value it will set the debug level according to the latter.
     * If an error occurs while reading the URL parameters, or _debug_ is not set to _true_, the debug level is set to 1.
     * 
     *
     * @return {number} The new {@link cdf.dashboard.Dashboard#debug|debug} level value according to the _debugLevel_ URL parameter,
     *                  1 if an error occurs while parsing the URL, if _debugLevel_ has an invalid numeric value
     *                  or if the _debug_ parameter is not set to _true_.
     */
    syncDebugLevel: function() {
      var level = 1; // log errors
      try {
        var urlIfHasDebug = function(url) { return url && (/\bdebug=true\b/).test(url) ? url : null; };
        var url = urlIfHasDebug(window.location.href) || urlIfHasDebug(window.top.location.href);
        if(url) {
          var m = /\bdebugLevel=(\d+)/.exec(url);
          level = m ? (+m[1]) : 3;
        }
      } catch(ex) {
        // swallow
      }
      return this.debug = level;
    },

    /**
     * Sets the globalContext value.
     *
     * @param {boolean} globalContext Flag indicating if global context is to be activated.
     * @deprecated
     * @ignore
     */
    setGlobalContext: function(globalContext) {
      this.globalContext = globalContext;
    },

    /**
     * Gets the current webapp path.
     *
     * @return {string} The current webapp path (e.g. "/pentaho").
     */
    getWebAppPath: function() {
      return this.webAppPath;
    },

    /**
     * Gets the dashboard's wcdfSettings.
     * This method is meant to be overriden.
     *
     * @return {Object} The dashboard's wcdf settings object.
     */
    getWcdfSettings: function() {
      Logger.info("getWcdfSettings was not overriden, returning empty object");
      return {};
    },

    /**
     * Normalizes an HTML element identifier.
     *
     * This method is meant to be used when we need to directly manipulate an HTML element.
     * It will be overriden returning the proper identifier in embedded scenarios.
     *
     * @param {string} id The HTML element identifier to normalize.
     * @return {string} The normalized identifier.
     */
    normalizeId: function(id) {
      return id;
    }
  });

});
