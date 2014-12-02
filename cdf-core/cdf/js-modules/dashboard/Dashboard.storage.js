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

 define(['./Dashboard', '../Logger', '../lib/jquery', '../lib/underscore', './Dashboard.storage.ext'],
     function(Dashboard, Logger, $, _, DashboardStorageExt) {

    /**
     * A module representing a extension to Dashboard module for storage.
     * @module Dashboard.storage
     */
    Dashboard.implement({

      /**
       * Method used by the Dashboard constructor for storage initialization
       *
       * @private
       */
      _initStorage: function() {
        var myself = this;
        myself.storage = {};
        myself.initialStorage = {};

        var args = {
          user: this.context.user,
          action: "read",
          ts: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
        };

        $.getJSON(DashboardStorageExt.getStorage(args.action), args, function(json) {
          $.extend(myself.storage,json);
          $.extend(myself.initialStorage,json);
        });
      },

      /**
       * Requests the storage object and stores it in storage object
       */
      loadStorage: function() {
        var myself = this;
        // Don't do anything for anonymousUser.
        if(this.context && this.context.user === "anonymousUser") {
          return;
        }

        var args = {
          user: this.context.user,
          action: "read",
          ts: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
        };

        $.ajax({
          type: 'GET',
          dataType: "json",
          url: DashboardStorageExt.getStorage(args.action),
          data: args,
          async: true,
          xhrFields: {
            withCredentials: true
          }
        }).done(function(json) {
          $.extend(myself.storage, json);
        });
      },

      /**
       * Saves the storage in the server, based on the storage object
       */
      saveStorage: function() {
        // Don't do anything for anonymousUser
        if(this.context && this.context.user === "anonymousUser") {
          return;
        }

        var args = {
          user: this.context.user,
          action: "store",
          storageValue: JSON.stringify(this.storage),
          ts: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
        };

        $.ajax({
          type: 'GET',
          dataType: "json",
          url: DashboardStorageExt.getStorage(args.action),
          data: args,
          async: true,
          xhrFields: {
            withCredentials: true
          }
        }).done(function(json) {
          if(json.result != true) {
            Logger.log("Error saving storage",'error');
          }
        });
      },

      /**
       * Cleans the storage object in the client and places a request to clean it in the server
       */
      cleanStorage: function() {
        this.storage = {};

        // Don't do noting for anonymousUser
        if(this.context && this.context.user === "anonymousUser") {
          return;
        }

        var args = {
          user: this.context.user,
          action: "delete"
        };

        $.ajax({
          type: 'GET',
          dataType: "json",
          url: DashboardStorageExt.getStorage(args.action),
          data: args,
          async: true,
          xhrFields: {
            withCredentials: true
          }
        }).done(function(json) {
          if(json.result != true) {
            Logger.log("Error deleting storage", 'error');
          }
        });
      }
    });


});