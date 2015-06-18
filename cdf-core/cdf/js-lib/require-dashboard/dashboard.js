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
 * Dashboard loader plugin that allows to require a CDE dashboard.
 * Based on the requirejs plugin API (see http://requirejs.org/docs/plugins.html#api)
 * Usage example:
 *
 * require(['dashboard!/public/myDashboard.wcdf'], function(MyDashboard) {
 *    // MyDashboard has been loaded and can be instantiated.
 *    var dashboard = new MyDashboard();
 *    ...
 * });
 *
 *
 * The configuration for this plugin requires the path
 * and the config dashboard endpoint property to be set. Example:
 * 
 * requirejs.config({
 *   paths: {
 *     "dashboard": "path to the dashboard loader plugin"
 *   },
 *
 *   config: {
 *     // dashboard plugin configuration section
 *     "dashboard": {
 *       "endpoint": "path to the CDE getDashboard endpoint"
 *     }
 *   }
 * });
 *
 *
 * Alternatively map and a configuration can be provided. Example:
 *
 * requirejs.config({
 *   map: {
 *     "*": {
 *       "dashboard": "path to the dashboard plugin"
 *     }
 *   },
 *
 *   config: {
 *     // dashboard plugin configuration section
 *     "path to the dashboard plugin": {
 *       "endpoint": "path to the CDE getDashboard endpoint"
 *     }
 *   }
 * });
 * 
 */

/**
 * Dashboard module. Provides a way to require a CDE dashboard.
 * The module's CDE getDashboard endpoint value should be previously
 * set using the appropriate CDE requirejs configuration file.
 *
 * @module dashboard
 */
define(["module"], function(module) {
  // dashboard plugin config
  var mainConfig = module.config ? module.config() : {};

  return {
    version: '0.0.1',

    /**
     * Called when a CDE dashboard module needs to be loaded.
     *
     * @param {string} dashPath the URL of the CDE dashboard to load
     * @param {function} parentRequire a local "require" function providing some
     *   utils and a way to load other modules
     * @param {function(*=)} onLoad the function to call with the optional value
     *   for the dashboard module, tells the loader that the plugin is done loading
     * @param {Object} config the "global" configuration object, provides a way
     *   for the optimizer/web app to pass configuration information to the plugin 
     */
    load: function(dashPath, parentRequire, onLoad, config) {
      config = config || {};
      if(config.isBuild) {
        //Indicate that the optimizer should not wait
        //for this resource any more and complete optimization.
        //This resource will be resolved dynamically during
        //run time in the web browser.
        onLoad();
      } else {
        // use the configured endpoint property to build the full path using dashPath
        parentRequire([mainConfig.endpoint + dashPath], function(RequiredDash) {
          // all done
          onLoad(RequiredDash);
        });
      }
    }
  };
});
