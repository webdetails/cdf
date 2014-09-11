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




define(['../lib/Base', './Dashboard', './Container', '../lib/underscore', './Utils'], function (Base, Dashboard, Container,_, Utils) {

    var _BaseQuery = Base;
    
    var  globalQueryFactories = new Container();
    
                
    /**
     * A module representing a extension to Dashboard module for i18n.
     * @module Dashboard.i18n
     */
    Dashboard.implement({

   
    
      /**
       * Method used by the Dashboard constructor for query initialization
       * Reference to current language code . 
       *
       * @private
       */
      _initQuery: function(){
        this.queryFactories = Utils.clone(globalQueryFactories);
      },

        getBaseQuery : function (){
            return _BaseQuery;
        },



        registerQuery : function(type, query){
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
        },

        hasQuery: function(type){
            return Boolean(this.queryFactories && this.queryFactories.has('Query', type));
        },
    
        detectQueryType: function(qd) {
            if(qd) {
                var qt = qd.queryType                 ? qd.queryType : // cpk goes here
                    qd.query                     ? 'legacy'     :
                    (qd.path && qd.dataAccessId) ? 'cda'        : 
                    undefined;
      
                qd.queryType = qt;
                return this.hasQuery(qt)? qt : undefined;
            }
        },    
    
        getQuery: function(type, opts){
            if (_.isUndefined(type) ) {
                type = 'cda';
            } else if ( _.isObject(type) ) {
                opts = type;
                type = opts.queryType || 'cda';
            }
            var query = this.queryFactories.getNew('Query', type, opts);
            return query;
        },

        listQueries: function() {    
            return _.keys( this.queryFactories.listType('Query') );
        }        
    });
    
    
    
    return {
        setBaseQuery: function ( QueryClass ){
            if ( _.isFunction(QueryClass) && QueryClass.extend ){
                _BaseQuery = QueryClass;
            }
        },
        
        registerGlobalQuery : function(type, query){
            var BaseQuery = _BaseQuery;

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
            globalQueryFactories.register('Query', type, function (container, config){
                return new QueryClass(config);
            });
        }
        
        
    
    };
    
    
});    




