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
  _initStorage: function(){
    this.storage = {};
  },
  /**
   * Requests the storage object and stores it in storage object
   */
  loadStorage: function(){
    var myself = this;
    // Don't do anything for anonymousUser.
    if( this.context && this.context.user === "anonymousUser") {
      return;
    }

    var args = {
      action: "read",
      ts: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
    };

    $.getJSON(wd.cdf.endpoints.getStorage( args.action ), args, function(json) {
      $.extend(myself.storage,json);
    });
  },

  /**
   * Saves the storage in the server, based on the storage object
   */
  saveStorage: function(){
    var myself = this;
    // Don't do anything for anonymousUser
    if( this.context && this.context.user === "anonymousUser") {
      return;
    }

    var args = {
      action: "store",
      storageValue: JSON.stringify(this.storage),
      ts: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
    };

    $.getJSON(wd.cdf.endpoints.getStorage( args.action ), args, function(json) {
      if(json.result != true){
        myself.log("Error saving storage",'error');
      }
    });
  },

  /**
   * Cleans the storage object in the client and places a request to clean it in the server
   */
  cleanStorage: function(){
    var myself = this;
    this.storage = {};

    // Don't do noting for anonymousUser
    if( this.context && this.context.user === "anonymousUser") {
      return;
    }

    var args = {
      action: "delete"
    };

    $.getJSON(wd.cdf.endpoints.getStorage( args.action ), args, function(json) {
      if(json.result != true){
        myself.log("Error deleting storage", 'error');
      }
    });
  }

});