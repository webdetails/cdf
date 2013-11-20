/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
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



// OPTIONS MANAGER begin
;(function (D){

  // This class is intended to be used as a generic Options Manager, by providing a way to
  // keep record of the values of an options set, but also custom readers, writers and validators 
  // for each of the options.
  function OptionsManager (config ){ /* { defaults: {}, interfaces: {}, libraries: {} }*/
    var myself = this;

    // PROTECTED
    this._options = {};
    this._interfaces = {};
    this._libraries = {
      predicates: {
        tautology: function (value){ return true },
        isFunction: _.isFunction ,
        isPositive: function (value){ return (_.isNumber(value) && value > 0); },
        isObjectOrPropertiesArray : function (value){ 
          return _.isArray(value) || _.isObject(value);
        },
        isObject: _.isObject,
        isArray: _.isArray
      },
      mappers: {
        identity: _.identity,
        propertiesObject: function (value) {
          return (_.isArray(value)) ? D.propertiesArrayToObject(value) : value;
        }
      }
    };

    // PUBLIC
    this.mixin = function (instance){
      instance.getOption = this.getOption;
      instance.setOption = this.setOption;
    };

    this.init = function (defaults, interfaces, libraries) {
      var myself = this;
      
      defaults = $.extend(true, {}, defaults);
      interfaces = $.extend(true, {}, interfaces);

      this._libraries = $.extend(true, {}, this._libraries, libraries);
      _.each( interfaces, function (el,key){
        setInterfaces( key, el );
      });
      _.each( defaults, function(el, key) {
        var ifaces = ( interfaces && interfaces[key] ) || {};
        setInterfaces( key, ifaces);
        setValue( key, el );
      })
    };

    this.setOption = function (opt, value, interfaces){
      setInterfaces(opt, interfaces);
      var reader = getReader(opt),
          validator = getValidator(opt);
      if ( validator(value) ){
        value = reader(value);
        setValue( opt, value );
        return true
      } else {
        throw new Error( "Invalid Option " + opt.charAt(0).toUpperCase() + opt.slice(1) );
      }
    };

    this.getOption = function (opt){
      var writer = getWriter( opt ),
          value = getValue(opt);
      return writer( value );
    }; 

    // PRIVATE
    function setInterfaces (opt, interfaces){
      interfaces = interfaces || {};
      setReader(opt, interfaces['reader']);
      setWriter(opt, interfaces['writer']);
      setValidator(opt, interfaces['validator']);
    };

    function getReader(opt){ 
      return get( myself._interfaces, opt, 'reader', myself._libraries.mappers['identity'] 
    )};
    function getWriter(opt){
      return get( myself._interfaces, opt, 'writer', myself._libraries.mappers['identity'] 
    )};
    function getValidator(opt){ 
      return get( myself._interfaces, opt, 'validator', myself._libraries.predicates['tautology'] 
    )};
    function getValue(opt){ return get( myself._options, opt, 'value') };
    
    // Reader, Writer and Validator work in the same way:
    // If the value is a function, use it. 
    // Otherwise, if it is a string and a valid library key, use it.
    // Otherwise, use a default library function: for readers and writers an indentity map, 
    //    for validators a predicate that always returns true.

    function setReader(opt, fn){
      var lib = myself._libraries.mappers;
      fn = ( _.isFunction(fn) && fn ) || ( _.isString(fn) && lib[fn] ) || getReader(opt) || lib['identity'] ;
      return set( myself._interfaces , opt, 'reader', fn) 
    };
    function setWriter(opt, fn){ 
      var lib = myself._libraries.mappers;
      fn = ( _.isFunction(fn) && fn ) || ( _.isString(fn) && lib[fn] ) || getWriter(opt) || lib['identity'] ;
      return set( myself._interfaces, opt, 'writer', fn) 
    };
    function setValidator(opt, fn){ 
      var lib = myself._libraries.predicates;
      fn = ( _.isFunction(fn) && fn ) || ( _.isString(fn) && lib[fn] ) || getValidator(opt) || lib['tautology'] ;
      return set( myself._interfaces, opt, 'validator', fn)
    };
    function setValue(opt, value){ return set( myself._options, opt, 'value', value) };

    // Init
    this.init( config.defaults, config.interfaces, config.libraries);

  }

  // Shared / Static
  function get ( container, opt, attr, defaultValue ){
    var val = defaultValue || undefined ;   
    if ( container && container[opt] && container[opt].hasOwnProperty(attr) ){
      val = container[opt][attr];
    }
    return val
  }
  function set (container, opt, attr, value){
    if (container && opt && attr){
      container[opt] = container[opt] || {};
      container[opt][attr] = value ; 
    }
  }

  D.OptionsManager = OptionsManager;
})(Dashboards);
// OPTIONS MANAGER end



// QUERIES begin
(function (D){

  var _BaseQuery = Base;

  D.getBaseQuery = function (){
    return _BaseQuery;
  };
  D.setBaseQuery = function ( QueryClass ){
    if ( _.isFunction(QueryClass) && QueryClass.extend ){
      _BaseQuery = QueryClass;
    }
  };

  D.queryFactories = new D.Container();

  D.registerQuery = function(type, query){
    var BaseQuery = this.getBaseQuery();

    // Goes a level deeper one extending these properties. Usefull to preserve defaults and
    // options interfaces from BaseQuery.
    if (!_.isFunction(query) && _.isObject(query)){
      var deepProperties = {};
      _.each( BaseQuery.prototype.deepProperties, function (prop){
          deepProperties[prop] = _.extend({} , BaseQuery.prototype[prop], query[prop]);
      });
    }

    var QueryClass  = ( _.isFunction(query) && query ) || 
          ( _.isObject(query) && BaseQuery.extend( _.extend( {}, query, deepProperties ) ) );
 
    // Registers a new query factory with a custom class
    this.queryFactories.register('Query', type, function (container, config){
      return new QueryClass(config);
    });
  };

  D.hasQuery = function(type){
    return Boolean(this.queryFactories && this.queryFactories.has('Query', type));
  };

  D.detectQueryType = function(qd) {
    if(qd) {
      var qt = qd.queryType                 ? qd.queryType : // cpk goes here
               qd.query                     ? 'legacy'     :
               (qd.path && qd.dataAccessId) ? 'cda'        : 
               undefined;
      
      qd.queryType = qt;

      return this.hasQuery(qt)? qt : undefined;
    }
  };

  D.getQuery = function(type, opts){
    if (_.isUndefined(type) ) {
      type = 'cda';
    } else if ( _.isObject(type) ) {
      opts = type;
      type = opts.queryType || 'cda';
    }
    var query = this.queryFactories.getNew('Query', type, opts);
    return query;
  };

  D.listQueries = function() {
    return _.keys( this.queryFactories.listType('Query') );
  };
})(Dashboards);


/*
 * Query STUFF
 * (Here for legacy reasons)
 * NOTE: The query type detection code should be kept in sync with CGG's UnmanagedComponent#detectQueryType.
 */
//Ctors:
// Query(queryString) --> DEPRECATED
// Query(queryDefinition{path, dataAccessId})
// Query(path, dataAccessId)
Query = function( cd, dataAccessId ) {

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

  return Dashboards.getQuery(queryType, opts);
};
// QUERIES end
