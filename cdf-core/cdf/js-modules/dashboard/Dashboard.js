/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define (['cdf/lib/Base', 'jquery', '../Logger', './RefreshEngine', 'cdf/lib/underscore', 'cdf/lib/backbone', 'cdf/lib/shims'],
    function (Base, jQuery, Logger, RefreshEngine, _, Backbone) {
    /**
     * A module representing a Dashboard.
     * @module Dashboard
     */
    var Dashboard = Base.extend({
    
      /**
       * Creates an instance of Dashboard
       *
       * @constructor
       * @alias module:constructor
       */
      constructor: function(){
        var myself = this;
    
        _.extend(this, Backbone.Events);
    
        configurePlugins();
    
        //TODO: when we start including the webcontext from the server we must review this part
        if (!(typeof(CONTEXT_PATH) == 'undefined')){
          this.webAppPath = CONTEXT_PATH;
        }
        if(this.webAppPath == undefined){
          this.webAppPath = "/" + window.location.pathname.split( '/' )[1];
        }
    
        if(this.webAppPath.endsWith("/")) {
          this.webAppPath = this.webAppPath.substr(0, this.webAppPath.length-1);
        }

        //wd.cdf.endpoints.webAppPath = this.webAppPath;
    
        //this.CDF_BASE_PATH = wd.cdf.endpoints.getCdfBase();
    
        //initial storage
        this.initialStorage = {};
    
        callIfAvailable(this._initStorage);
        callIfAvailable(this._initViews);
        callIfAvailable(this._initParameters);
        callIfAvailable(this._initBookmarkables);
        callIfAvailable(this._initI18n);
        callIfAvailable(this._initComponents);
        callIfAvailable(this._initLifecycle);
        callIfAvailable(this._initNotifications);
        callIfAvailable(this._initQuery);
        callIfAvailable(this._initAddIns);        
    
        this.refreshEngine = new RefreshEngine(this);
    
        /**
         * Calls a function if it is available in the prototype
         *
         * @private
         */
        function callIfAvailable(func){
          if(typeof func == "function"){
            func.apply(myself);
          } else {
            Logger.log("calling init method of unloaded module: " );
          }
        }
    
        /**
         * Initializes the cdf plugins
         *
         * @private
         */
        function configurePlugins() {
          var myself = this;
    
          if(typeof jQuery == 'function') {
            //ajax
            jQuery.ajaxSetup({
              type: "POST",
              async: false,
              traditional: true,
              scriptCharset: "utf-8",
              contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    
              dataFilter: function(data, dtype) {
                // just tagging date
                myself.lastServerResponse = Date.now();
                return data;
              }
            });
    
            //SetImpromptuDefaults
            if(typeof jQuery.SetImpromptuDefaults == 'function') {
              jQuery.SetImpromptuDefaults({
                prefix: 'colsJqi',
                show: 'slideDown'
              });
            } else {
              Logger.log("jQuery.SetImpromptuDefaults plugin not loaded!!!!!!!!");
            }
    
            //blockUI
            if(typeof jQuery.blockUI == 'function') {
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
              Logger.log("jQuery.blockUI plugin not loaded!!!!!!!!");
            }
          } else {
            Logger.log("jQuery plugin not loaded!!!!!!!!");
          }
        }
      },
    
    
    
      /* globalContext determines if components and params are retrieved
       * from the current window's object or from the Dashboards singleton
       */
      globalContext: false,
    
    
    
      /* Holds the dashboard parameters if globalContext = false */
    
    
      // Holder for context
      context:{},
    
    
    
      /*
       * Legacy dashboards don't have priority, so we'll assign a very low priority
       * to them.
       * */
    
      legacyPriority: -1000,
    
      /* Log lifecycle events? */
      logLifecycle: true,
    
      args: [],
    
      //TODO: Review the monthNames usage in month selector component, impossible to localize!!!!
      monthNames : ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'],
    
    
    
      registerEvent : function (ev, callback) {
        if (typeof this.events == 'undefined') {
            this.events = {};
        }
        this.events[ev] = callback;
      },    
    
    
      debug : 1,
      
      syncDebugLevel : function() {
        var level = 1; // log errors
        try {
            var urlIfHasDebug = function(url) { return url && (/\bdebug=true\b/).test(url) ? url : null; };
            var url = urlIfHasDebug(window.location.href) ||
                      urlIfHasDebug(window.top.location.href);
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
       * @param globalContext boolean
       */
      setGlobalContext: function(globalContext) {
        this.globalContext = globalContext;
      },
    
      /**
       *
       * @returns {*}
       */
      getWebAppPath: function (){
        return this.webAppPath;
      }
    });


    return Dashboard;

});