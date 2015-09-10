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
 * Module aggregating all the classes in the Dashboard hierarchy
 * @module Dashboard
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
  '../lib/shims',
  'css!../lib/cdf.css'],
  function(Base, Logger, RefreshEngine, _, Backbone, $, module) {

  var Dashboard = Base.extend({

    /**
     * A class representing a Dashboard. This class is abstract, so it should not be required or instantiated directly.
     * Instead use one of its extending subclasses, {{#crossLink "Dashboard.Blueprint"}}Dashboard.Blueprint{{/crossLink}},
     * {{#crossLink "Dashboard.Bootstrap"}}Dashboard.Bootstrap{{/crossLink}} or
     * {{#crossLink "Dashboard.Clean"}}Dashboard.Clean{{/crossLink}}.
     *
     *
     * @class Dashboard
     * @constructor
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
       * Calls a function if it is available in the prototype
       *
       * @method _callIfAvailable
       * @private
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
       * Initializes the cdf plugins
       *
       * @method _configurePlugins
       * @private
       */
      function _configurePlugins() {
        var myself = this;

        if(typeof $ == 'function') {
          //ajax
          $.ajaxSetup({
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

    /* globalContext determines if components and params are retrieved
     * from the current window's object or from the Dashboards singleton
     */
    globalContext: false,

    // Holds the dashboard parameters if globalContext = false

    //trying to retrieve context from the module configuration
    contextObj: module.config().context || {},
    
    //trying to retrieve storage from the module configuration
    storageObj: module.config().storage || {},
    
    //trying to retrieve view from the module configuration
    viewObj: module.config().view,

    /*
     * Legacy dashboards don't have priority, so we'll assign a very low priority
     * to them.
     * */

    legacyPriority: -1000,

    /* Log lifecycle events? */
    logLifecycle: true,

    args: [],

    //TODO: Review the monthNames usage in month selector component, impossible to localize!!!!
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],

    registerEvent: function(ev, callback) {
      if(typeof this.events == 'undefined') {
        this.events = {};
      }
      this.events[ev] = callback;
    },

    debug: 1,

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
     * Sets the globalContext value
     *
     * @method setGlobalContext
     * @param globalContext boolean
     */
    setGlobalContext: function(globalContext) {
      this.globalContext = globalContext;
    },

    /**
     * Gets the current webapp path
     *
     * @method getWebAppPath
     * @return the current webapp path (/pentaho for instance)
     */
    getWebAppPath: function() {
      return this.webAppPath;
    },

    /**
     * Gets the dashboard's wcdfSettings
     * This method is meant to be overriden
     *
     * @method getWcdfSettings
     * @return the dashboard's wcdfSettings
     */
    getWcdfSettings: function() {
      Logger.info("getWcdfSettings was not overriden, returning empty object");
      return {};
    }
  });

  return Dashboard;
});
