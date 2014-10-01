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

define(['../wd', './BaseQuery', '../dashboard/Dashboard.query', '../lib/underscore', '../lib/jquery', '../dashboard/Utils'],
  function(wd, BaseQuery, Dashboard, _, $, Utils) {

  function makeMetadataElement(idx, name, type) {
    return { "colIndex" : idx || 0, "colType" : type || "String" , "colName" : name || "Name" };
  }

  var legacyOpts = {
    name: "legacy",
    label: "Legacy",
    defaults: {
      url: wd.cdf.endpoints.getCdfXaction("pentaho-cdf/actions" , "jtable.xaction"),
      queryDef:{}
    },
    interfaces:{
      lastResultSet:{
        reader: function(json) {
          json = eval("(" + json + ")");
          var result = { metadata: [ makeMetadataElement(0)] , resultset:json.values || [] };
          _.each(json.metadata , function(el, idx) {
            return result.metadata.push( makeMetadataElement(idx+1, el) );
          });
          return result
        }
      }
    },

    init: function(opts) {
      this.setOption('queryDef', opts);
    },

    getSuccessHandler: function(callback) {
      var myself = this;
      return function(json) {
        try{
          myself.setOption('lastResultSet' , json);
        }catch(e){
          if(this.async){
            // async + legacy errors while parsing json response aren't caught
            var msg = Dashboard.getErrorObj('COMPONENT_ERROR').msg + ":" + e.message;
            Dashboard.error(msg);
            json = {"metadata":[msg],"values":[]};
          }else{
            //exceptions while parsing json response are
            //already being caught+handled in updateLifecyle()
            throw e;
          }
        }
        var clone = $.extend(true,{}, myself.getOption('lastResultSet'));
        callback(clone);
      }
    },

    //TODO: is this enough?
    buildQueryDefinition: function(overrides) {
      return _.extend({}, this.getOption('queryDef'), overrides);
    }

  };
  Dashboard.registerGlobalQuery( "legacy", legacyOpts );

  // TODO: Temporary until CDE knows how to write queryTypes definitions, with all these old queries
  // falling under the 'legacy' umbrella.
  Dashboard.registerGlobalQuery( "mdx", legacyOpts );
  Dashboard.registerGlobalQuery( "sql", legacyOpts );

 });
