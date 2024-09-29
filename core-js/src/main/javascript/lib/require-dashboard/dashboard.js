/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


/**
 * RequireJS dash! loader plugin that allows to require a CDE dashboard.
 * The module's CDE getDashboard endpoint value should be previously
 * set using the appropriate CDE requirejs configuration file.
 * 
 * Based on the requirejs plugin API (see http://requirejs.org/docs/plugins.html#api).
 * Usage example:
 *
 *      require(['dash!/public/myDashboard.wcdf'], function(MyDashboard) {
 *         // MyDashboard has been loaded and can be instantiated.
 *         var dashboard = new MyDashboard();
 *         ...
 *      });
 *
 *
 * The configuration for this plugin requires the path and the
 * endpoint property to be set. Example:
 * 
 *      requirejs.config({
 *        paths: {
 *          "dash": "path to the dash loader plugin"
 *        },
 *     
 *        config: {
 *          // dash plugin configuration section
 *          "dash": {
 *            "endpoint": "path to the CDE getDashboard endpoint"
 *          }
 *        }
 *      });
 *
 *
 * Alternatively, map the module id "dash" to the path of the dash
 * plugin and use the path to configure the endpoint property. Example:
 *
 *      requirejs.config({
 *        map: {
 *          "*": {
 *            "dash": "path to the dash plugin"
 *          }
 *        },
 *
 *        config: {
 *          // dash plugin configuration section
 *          "path to the dash plugin": {
 *            "endpoint": "path to the CDE getDashboard endpoint"
 *          }
 *        }
 *      });
 *
 * @module dash
 * @ignore
 */
define(["module"], function(module) {
  // dash plugin config
  var mainConfig = module.config ? module.config() : {};

  return {
    version: '0.0.1',

    /**
     * Called when a CDE dashboard module needs to be loaded.
     *
     * @param {string} dashPath The URL of the CDE dashboard to load.
     * @param {function} parentRequire A local "require" function providing some
     *    utils and a way to load other modules.
     * @param {function} onLoad The function to call with the optional value
     *    for the dashboard module, tells the loader that the plugin is done loading.
     * @param {object} config The "global" configuration object, provides a way
     *    for the optimizer/web app to pass configuration information to the plugin.
     * @ignore
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
