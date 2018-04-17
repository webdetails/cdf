/*!
 * Copyright 2002 - 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  'pentaho/environment',
  'amd!../lib/underscore',
  'amd!../lib/backbone',
  '../lib/jquery',
  'module',
  'amd!../lib/jquery.impromptu',
  '../lib/shims'
], function(Base, Logger, RefreshEngine, environment, _, Backbone, $, module) {

  return Base.extend(/** @lends cdf.dashboard.Dashboard# */{
    /**
     * @summary Base abstract dashboard class. It should not be required or instantiated directly.
     * @classdesc <p>Base abstract dashboard class. This class is abstract, so it should not be required
     *            or instantiated directly.</p>
     *            <p>Instead, use one of its extending subclasses: {@link cdf."Dashboard.Blueprint"|Blueprint},
     *            {@link cdf."Dashboard.Bootstrap"|Bootstrap} or {@link cdf."Dashboard.Clean"|Clean}.</p>
     *            <p>Each dashboard instance can be localized by adding, in the same directory,
     *            the following properties files:</p>
     *            <ul><li>messages&#95;supported&#95;languages.properties - Defines supported languages,
     *            if not present, i18n support will not be loaded, for example: <pre function="syntax.text">en=English<br>pt=Portuguese</pre></li>
     *            <li>messages.properties: Default messages file, for example: <pre function="syntax.text">myDashboard.title=Default title</pre></li>
     *            <li>messages&#95;[language&#95;code].properties: Language code messages file, for example:
     *            <pre function="syntax.text">myDashboard.title=Title # for messages_en.properties<br>myDashboard.title=Título # for messages_pt.properties</pre></li></ul>
     *            <p>Usage:</p>
     *            <pre function="syntax.javascript">dashboard.i18nSupport.prop("myDashboard.title");</pre>
     *
     * @constructs
     * @description Abstract constructor for the Dashboard object.
     * @extends {@link http://dean.edwards.name/weblog/2006/03/base/|Base}
     * @extends {@link http://backbonejs.org/#Events|Backbone.Events}
     * @param {Object} [options] Object that can contain the context, storage and view.
     * @param {Object} [options.context] The context of the dashboard retrieved from the server.
     * @param {Object} [options.storage] The storage of the dashboard retrieved from the server.
     * @param {Object} [options.view] The views of the dashboard retrieved from the server.
     * @param {boolean} [options.isSilent] Allows disabling the dashboard notifications.
     * @abstract
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
        this.isSilent = !!options.isSilent;
      }

      _.extend(this, Backbone.Events);

      _configurePlugins.call(myself);

      //TODO: when we start including the webcontext from the server we must review this part
      var serverRoot = environment.server.root;
      if (serverRoot != null) {
        this.webAppPath = serverRoot.toString();
      }
      
      if (this.webAppPath == null) {
        this.webAppPath = "/" + window.location.pathname.split('/')[1];
      }

      if (this.webAppPath.endsWith("/")) {
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
     * @summary The current webapp path.
     * @description The current webapp path.
     *
     * @name cdf.dashboard.Dashboard#webAppPath
     * @protected
     * @type {String}
     */
    //webAppPath: undefined,

    /**
     * @summary The {@link cdf.dashboard.RefreshEngine|RefreshEngine} which manages the component refresh cycle.
     * @description The {@link cdf.dashboard.RefreshEngine|RefreshEngine} which manages the component refresh cycle.
     *
     * @protected
     * @type {cdf.dashboard.RefreshEngine}
     */
    refreshEngine: undefined,


    /**
     * @summary Determines if components and parameters are retrieved from the `window` `object` or from the dashboard instance.
     * @description Determines if components and parameters are retrieved from the `window` `object` or from the dashboard instance.
     *
     * @type {boolean}
     * @default false
     * @deprecated
     */
    globalContext: false,

    /**
     * @summary Initial dashboard {@link cdf.dashboard.Dashboard#context|context} value.
     * @description  Initial dashboard {@link cdf.dashboard.Dashboard#context|context} value.
     *               It will either be an empty `object` or will be set according to the
     *               `context` property of the {@link cdf.dashboard.Dashboard|Dashboard}
     *               AMD module configuration.
     *
     * @type {object}
     * @default {}
     * @private
     * @see {@link http://requirejs.org/docs/api.html#config|RequireJS Configuration Options}
     */
    contextObj: module.config().context || {},

    /**
     * @summary Initial dashboard {@link cdf.dashboard.Dashboard#storage|storage} value.
     * @description Initial dashboard {@link cdf.dashboard.Dashboard#storage|storage} value.
     *              It will either be an empty `object` or will be set according to the
     *              `storage` property of the {@link cdf.dashboard.Dashboard|Dashboard}
     *              AMD module configuration.
     *
     * @type {object}
     * @default {}
     * @private
     * @see {@link http://requirejs.org/docs/api.html#config|RequireJS Configuration Options}
     */
    storageObj: module.config().storage || {},

    /**
     * @summary Initial dashboard {@link cdf.dashboard.Dashboard#view|view} value.
     * @description Initial dashboard {@link cdf.dashboard.Dashboard#view|view} value.
     *              It will be set according to the `view` property of the
     *              {@link cdf.dashboard.Dashboard|Dashboard} AMD module configuration.
     *
     * @type {object}
     * @private
     * @see {@link http://requirejs.org/docs/api.html#config|RequireJS Configuration Options}
     */
    viewObj: module.config().view,

    /**
     * @summary Legacy dashboard components do not have priority, so we will assign a very low priority to them.
     * @description Legacy dashboard components do not have priority, so we will assign a very low priority to them.
     *
     * @type {number}
     * @default -1000
     * @deprecated
     * @protected
     */
    legacyPriority: -1000,

    /**
     * @summary Flag indicating if the lifecycle events should be logged.
     * @description Flag indicating if the lifecycle events should be logged. 
     *
     * @type {boolean}
     * @default true
     * @protected
     */
    logLifecycle: true,

    /**
     * @summary Array of arguments.
     * @description Array of arguments.
     *
     * @type {string[]}
     * @deprecated
     */
    args: [],

    //TODO: Review the monthNames usage in month selector component, impossible to localize!!!!
    /**
     * @summary Array of month names.
     * @description Array of month names.
     *
     * @type {string[]}
     * @deprecated
     */
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],

    /**
     * @summary Allows disabling dashboard notifications.
     * @description Allows disabling dashboard notifications.
     *
     * @name cdf.dashboard.Dashboard#isSilent
     * @protected
     * @type {boolean}
     */
    isSilent: false,

    /**
     * @summary Registers a callback function in the dashboard's events property.
     * @description Registers a callback function in the dashboard's events property. 
     *              Creates the dashboard's events property if it's undefined.
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
     * @summary The dashboard debug level.
     * @description The dashboard debug level. 
     *
     * @type {number}
     * @default 1
     * @protected
     */
    debug: 1,

    /**
     * @summary Sets the {@link cdf.dashboard.Dashboard#debug|debug} level.
     * @description Sets the {@link cdf.dashboard.Dashboard#debug|debug} level. If the URL parameter `debug` 
     *              has value of `true` and the value of the URL parameter `debugLevel` is a valid numeric value,  
     *              it will set the debug level according to the latter. If an error occurs while reading 
     *              the URL parameters, or `debug` is not set to `true`, the debug level is set to `1`. 
     *
     * @return {number} The new {@link cdf.dashboard.Dashboard#debug|debug} level value according to the `debugLevel` URL parameter.
     *                  It is `1` if an error occurs while parsing the URL, if the `debugLevel` has an invalid numeric value, 
     *                  or if the `debug` parameter is not set to `true`.
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
     * @summary Sets the {@link cdf.dashboard.Dashboard#globalContext|globalContext} value.
     * @description Sets the {@link cdf.dashboard.Dashboard#globalContext|globalContext} value.
     *
     * @param {boolean} globalContext Flag indicating if global context is to be activated.
     * @deprecated
     */
    setGlobalContext: function(globalContext) {
      this.globalContext = globalContext;
    },

    /**
     * @summary Gets the current webapp path.
     * @description Gets the current webapp path.
     *
     * @return {string} The current webapp path (e.g. "/pentaho").
     */
    getWebAppPath: function() {
      return this.webAppPath;
    },

    /**
     * @summary Gets the dashboard's wcdfSettings.
     * @description Gets the dashboard's wcdfSettings. It will be overridden returning 
     *              the proper wcdf settings in embedded scenarios.
     * 
     * @abstract
     * @return {Object} The dashboard's wcdf settings object.
     */
    getWcdfSettings: function() {
      Logger.info("getWcdfSettings was not overridden, returning empty object");
      return {};
    },

    /**
     * @summary Normalizes a DOM element identifier.
     * @description  Normalizes a DOM element identifier. This method is meant to be used when 
     *               we need to directly manipulate a DOM element. It will be overridden returning 
     *               the proper identifier in embedded scenarios.
     *
     * @abstract
     * @param {string} id The DOM element identifier to normalize.
     * @return {string} The normalized identifier.
     */
    normalizeId: function(id) {
      return id;
    }
  });

});
