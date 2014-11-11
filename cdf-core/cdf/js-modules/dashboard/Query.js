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

define(['../lib/underscore'], function (_) {

/*
 * Query STUFF
 * (Here for legacy reasons)
 * NOTE: The query type detection code should be kept in sync with CGG's UnmanagedComponent#detectQueryType.
 */
//Ctors:
// Query(queryString) --> DEPRECATED
// Query(queryDefinition{path, dataAccessId})
// Query(path, dataAccessId)
return  function( cd, dataAccessId, dashboard ) {

  var opts, queryType;

  if( _.isObject(cd) ){
    opts = $.extend(true, {}, cd);
    queryType = (_.isString(cd.queryType) && cd.queryType) || ( !_.isUndefined(cd.query) && 'legacy') || 
      ( !_.isUndefined(cd.path) && !_.isUndefined(cd.dataAccessId) && 'cda') || undefined ;
  } else if ( _.isString(cd) && _.isString(dataAccessId) ) {
    queryType = 'cda';
    opts = {
      path: cd,
      dataAccessId: dataAccessId
    };
  } 

  if (!queryType) { throw 'InvalidQuery' }

  return dashboard.getQuery(queryType, opts);
};
// QUERIES end



});
