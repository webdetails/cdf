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
 
 
 define(['dashboard/Dashboard', 'Logger', 'backbone', 'dashboard/Utils'], function (Dashboard, Logger, Backbone, Utils) {

    /**
     * A module representing a extension to Dashboard module for parameters.
     * @module Dashboard.parameters
     */
    Dashboard.implement({
    
      /**
       * Method used by the Dashboard constructor for parameters initialization
       *
       * @private
       */
      _initParameters: function () {
        this.parameters = [];
        this.parameterModel = new Backbone.Model();
    
        this.chains = [];
        this.syncedParameters = {};
    
        this.escapeParameterValues = true;
      },
    
    
    /**
     * Verifies if a parameter is available in the Parameter Model
     *
     * @param name of the parameter
     * @returns boolean
     * @private
     */
    _isParameterInModel : function(name){
      return this.parameterModel.attributes.hasOwnProperty(name);
    },
    
    /**
     * Gets the value from a context o from the property with a given path
     *
     * @param o the context of the assignment
     * @param path the path of the property
     * @returns the value of the property
     * @private
     */
    _getValueFromContext : function(o, path) {
      if (!o) return; //undefined
      if (null != path) {
        var parts = (path instanceof Array) ? path : path.split("."), L = parts.length;
        if (L) for (var i = 0; L > i; ) {
          var part = parts[i++], value = o[part];
          if (null == value) {
            return; //the path requested is undefined
          }
          o = value;
        }
      }
      return o;
    },
    
    /**
     * Sets a property path in a context o with v as value
     *
     * @param o the context of the assignment
     * @param path the path of the property
     * @param v the value of the property
     * @returns the value of the property assigned
     * @private
     */
    _setValueInContext : function(o, path, v) {
      if (o && null != path) {
        var parts = (path instanceof Array) ? path : path.split(".");
        if (parts.length) {
          var pLast = parts.pop();
          o = this._getValueFromContext(o, parts);
          if(o) o[pLast] = v;
        }
      }
      return o;
    },

    /**
     * Adds a parameter new parameter to the parameter module.
     * Receives a parameter name and an initial value, that will be used if the parameter is
     * not available in the parameter model. Otherwise, the getParameterValue return is used
     *
     * @param name the name of the parameter
     * @param initValue the initial value of the parameter
     * @returns the value assigned to the parameter
     */
    addParameter : function(name, initValue){
        if(this._isParameterInModel(name)){
            initValue = this.getParameterValue(name);
        }
        this.setParameter(name,initValue);
        return initValue;
    },

    getParameterValue : function (parameterName) {
        var parameterStore = this.globalContext ? window : this.parameters;
        return this._getValueFromContext(parameterStore, parameterName);
    },

    /**
      * Stores a parameter with a certain value
      *
      * @param parameterName is the parameter name
      * @param parameterValue is the value of the parameter
      * @param isNotified
      */
    setParameter : function(parameterName, parameterValue, isNotified) {
        if(parameterName == undefined || parameterName == "undefined"){
            Logger.log('Dashboards.setParameter: trying to set undefined!!','warn');
            return;
        }
        var parameterStore = this.globalContext ? window : this.parameters;
        if(!this.globalContext && this.escapeParameterValues){
            this._setValueInContext(parameterStore, parameterName, Utils.encode_prepare_arr(parameterValue));
        } else {
            this._setValueInContext(parameterStore, parameterName, parameterValue);
        }
        this.parameterModel.set(parameterName,parameterValue,{notify:isNotified});
        this.persistBookmarkables(parameterName);
    },
    
        
      /**
       * Alias for getParameterValue
       *
       * @param parameterName
       * @returns the parameterName value stored
       */
      getParam: function (parameterName) {
        this.getParameterValue(parameterName);
      },
    
       
      /**
       * Alias for setPArameter
       *
       * @param parameterName is the parameter name
       * @param parameterValue is the value of the parameter
       * @param isNotified
       */
      setParam: function (parameterName, parameterValue, isNotified) {
        this.setParameter(parameterName, parameterValue, isNotified);
      },
    
      /**
       * Keep parameters master and slave in sync. The master parameter's initial value takes precedence over the slave
       * parameter's when initializing the dashboard.
       *
       * @private
       * @param master
       * @param slave
       */
      syncParameters: function (master, slave) {
        this.setParameter(slave, this.getParameterValue(master));
        this.parameterModel.on("change:" + master, function (m, v, o) {
          this[o.notify ? 'fireChange' : 'setParameter'](slave, v)
        }, this);
        this.parameterModel.on("change:" + slave, function (m, v, o) {
          this[o.notify ? 'fireChange' : 'setParameter'](master, v)
        }, this);
      },
    
    
      /**
       * Register parameter pairs that will be synced on dashboard init.
       *
       * @private
       * @param master
       * @param slave
       */
      syncParametersOnInit: function (master, slave) {
        /* We'll store the dependency pairings in Dashboards.syncedParameters, as an object mapping master parameters to an
         * array of all its slaves (so {a: [b,c]} means that both *b* and *c* are subordinate to *a*), and in
         * Dashboards.chains wel'll store an array of arrays representing a list of separate dependency trees. An entry of
         * the form [a, b, c] means that *a* doesn't depend on either *b* or *c*, and that *b* doesn't depend on *c*.
         * Inversely, *b* depends on *a*, and *c* depends on either *a* or *b*. You can have multiple such entries, each
         * representing a completely isolated set of dependencies.
         *
         * Note that we make no effort to detect circular dependencies. Behaviour is undetermined should you provide such a
         * case.
         */
        var parameters = this.syncedParameters,
            currChain,
            masterChain,
            slaveChain, slaveChainIdx, i;
        if (!parameters[master]) parameters[master] = [];
        parameters[master].push(slave);
    
        /* When inserting an entry into Dashboards.chains, we need to check whether any of the master or the slave are
         * already in one of the chains.
         */
        for (i = 0; i < this.chains.length; i++) {
          currChain = this.chains[i];
          if (currChain.indexOf(master) > -1) {
            masterChain = currChain;
          }
          if (currChain.indexOf(slave) > -1) {
            slaveChain = currChain;
            slaveChainIdx = i;
          }
        }
        /* If both slave and master are present in different chains, we merge the chains.
         *
         * If only one of the two is present, we insert the slave at the end of the master's chain, or the master at the
         * head of the slave's chain.
         *
         * Note that, since a parameter can be both a master and a slave, and because no slave can have two masters, it is
         * guaranteed that we can only add the master to the head of the chain if the slave was the head before, and, when
         * adding the slave at the end of the master's chain, none of the parameters between master and slave can depend on
         * the slave. This means there is no scenario where a chain can become inconsistent from prepending masters or
         * appending slaves.
         *
         * If neither master nor slave is present in the existing chains, we create a new chain with [master, slave].
         */
        if (slaveChain && masterChain) {
          if (masterChain != slaveChain) {
            args = slaveChain.slice();
            args.unshift(0);
            args.unshift(masterChain.length);
            [].splice.apply(masterChain, args);
            this.chains.splice(slaveChainIdx, 1);
          }
        } else if (slaveChain) {
          slaveChain.unshift(master);
        } else if (masterChain) {
          masterChain.push(slave)
        } else {
          this.chains.push([master, slave]);
        }
      },
    
      /**
       * Iterate over the registered parameter syncing chains, and configure syncing for each parameter pair.
       *
       * @private
       */
      syncParametersInit: function () {
        var parameters = this.syncedParameters,
            i, j, k, master, slave;
        for (i = 0; i < this.chains.length; i++) {
          for (j = 0; j < this.chains[i].length; j++) {
            var master = this.chains[i][j];
            if (!parameters[master]) continue;
            for (k = 0; k < parameters[master].length; k++) {
              slave = parameters[master][k];
              this.syncParameters(master, slave);
            }
          }
        }
      }
    
    
    });


});