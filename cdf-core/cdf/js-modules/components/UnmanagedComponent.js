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

define(['./BaseComponent', 'amd!../lib/underscore', '../lib/jquery', '../Logger'],
  function(BaseComponent, _, $, Logger) {

  /*
   * UnmanagedComponent is an advanced version of the BaseComponent that allows
   * control over the core CDF lifecycle for implementing components. It should
   * be used as the base class for all components that desire to implement an
   * asynchronous lifecycle, as CDF cannot otherwise ensure that the postExecution
   * callback is correctly handled.
   */
  var UnmanagedComponent = BaseComponent.extend({
    isManaged: false,
    isRunning: false,

    /*
     * Handle calling preExecution when it exists. All components extending
     * UnmanagedComponent should either use one of the three lifecycles declared
     * in this class (synchronous, triggerQuery, triggerAjax), or call this method
     * explicitly at the very earliest opportunity. If preExec returns a falsy
     * value, component execution should be cancelled as close to immediately as
     * possible.
     */
    preExec: function() {
      /*
       * runCounter gets incremented every time we run a query, allowing us to
       * determine whether the query has been called again after us.
       */
      if(typeof this.runCounter == "undefined") {
        this.runCounter = 0;
      }
      var ret;
      if (typeof this.preExecution == "function") {
        try {
          ret = this.preExecution();
          ret = typeof ret == "undefined" || ret;
        } catch(e){
          this.error( this.dashboard.getErrorObj('COMPONENT_ERROR').msg, e);
          Logger.log(e,"error");
          ret = false;
        }
      } else {
        ret = true;
      }
      this.trigger('cdf cdf:preExecution', this, ret);
      return ret;
    },

    /*
     * Handle calling postExecution when it exists. All components extending
     * UnmanagedComponent should either use one of the three lifecycles declared
     * in this class (synchronous, triggerQuery, triggerAjax), or call this method
     * explicitly immediately before yielding control back to CDF.
     */
    postExec: function() {
      if(typeof this.postExecution == "function") {
        this.postExecution();
      }
      this.trigger('cdf cdf:postExecution', this);
    },

    drawTooltip: function() {
      if (this.tooltip) {
        this._tooltip = typeof this.tooltip == "function" ?
            this.tooltip():
            this.tooltip;
      }
    },
    showTooltip: function() {
      if(typeof this._tooltip != "undefined") {
        this.placeholder().attr("title",this._tooltip).tooltip({
          delay:0,
          track: true,
          fade: 250,
          content: this._tooltip
        });
      }
    },

    /*
     * The synchronous lifecycle handler closely resembles the core CDF lifecycle,
     * and is provided as an alternative for components that desire the option to
     * alternate between a synchronous and asynchronous style lifecycles depending
     * on external configuration (e.g. if it can take values from either a static
     * array or a query). It take the component drawing method as a callback.
     */
    synchronous: function(callback, args) {
      if(!this.preExec()) {
        return;
      }
      var silent = this.isSilent();
      if(!silent) {
        this.block();
      }
      setTimeout(_.bind(function(){
        try {
          /* The caller should specify what 'this' points at within the callback
           * via a Function#bind or _.bind. Since we need to pass a 'this' value
           * to call, the component itself is the only sane value to pass as the
           * callback's 'this' as an alternative to using bind.
           */
          callback.call(this, args || []);
          this.drawTooltip();
          this.postExec();
          this.showTooltip();
        } catch(e) {
          this.error(this.dashboard.getErrorObj('COMPONENT_ERROR').msg, e);
          Logger.log(e, "error");
        } finally {
          if(!silent) {
            this.unblock();
          }
        }
      },this), 10);
    },

    /*
     * The triggerQuery lifecycle handler builds a lifecycle around Query objects.
     *
     * It takes a query definition object that is passed directly into the Query
     * constructor, and the component rendering callback, and implements the full
     * preExecution->block->render->postExecution->unblock lifecycle. This method
     * detects concurrent updates to the component and ensures that only one
     * redraw is performed.
     */
    triggerQuery: function(queryDef, callback, userQueryOptions) {
      if(!this.preExec()) {
        return;
      }
      var silent = this.isSilent();
      if(!silent) {
        this.block();
      };
      userQueryOptions = userQueryOptions || {};
      /*
       * The query response handler should trigger the component-provided callback
       * and the postExec stage if the call wasn't skipped, and should always
       * unblock the UI
       */
      var success = _.bind(function(data) {
        callback(data);
        this.postExec();
      },this);
      var always = _.bind(function (){
        if(!silent) {
          this.unblock();
        }
      }, this);
      var handler = this.getSuccessHandler(success, always),
          errorHandler = this.getErrorHandler();

      var query = this.queryState = this.query = this.dashboard.getQuery( queryDef);
      var ajaxOptions = {
        async: true
      }
      if(userQueryOptions.ajax) {
        _.extend(ajaxOptions,userQueryOptions.ajax);
      }
      query.setAjaxOptions(ajaxOptions);
      if(userQueryOptions.pageSize) {
        query.setPageSize(userQueryOptions.pageSize);
      }
      // If this.parameters is a mapping between query and dashboard parameter names
      // send the dashboard's parameter value instead of it's name because the query
      // component doesn't have access to the dashboard instance to get such values
      var params;
      if(this.parameters && this.dashboard && typeof this.dashboard.getParameterValue === 'function') {
        // create a copy of the parameters array
        params = $.extend(true, [], this.parameters);
        for(var i = 0; i < this.parameters.length; i++) {
          var value = this.dashboard.getParameterValue(this.parameters[i][1]);
          params[i][1] = value ? value : this.parameters[i][1];
        }
      }
      query.fetchData(params, handler, errorHandler);
    },

    /*
     * The triggerAjax method implements a lifecycle based on generic AJAX calls.
     * It implements the full preExecution->block->render->postExecution->unblock
     * lifecycle.
     *
     * triggerAjax can be used with either of the following call conventions:
     * - this.triggerAjax(url,params,callback);
     * - this.triggerAjax({url: url, data: params, ...},callback);
     * - this.triggerAjax({url: url, data: params, ...},callback, ajaxParameters);
     * In the second case, you can add any other jQuery.Ajax parameters you desire
     * to the object, but triggerAjax will take control over the success and error
     * callbacks.
     * If passed, the supplied ajaxParameters will be passed to the default ajax call
     */
    triggerAjax: function(url,params,callback,_ajaxParameters) {
      if(!this.preExec()) {
        return;
      }
      var silent = this.isSilent();
      if (!silent){
        this.block();
      };
      var ajaxParameters = $.extend({
        async: true
      },_ajaxParameters);
      /* Detect call convention used and adjust parameters */
      if (typeof callback != "function") {
        callback = params;
        _.extend(ajaxParameters,url);
      } else {
        _.extend(ajaxParameters,{
          url: url,
          data: params
        });
      }
      var success = _.bind(function(data) {
        callback(data);
        this.trigger('cdf cdf:render',this,data);
        this.postExec();
      },this);
      var always = _.bind(function() {
        if (!silent){
          this.unblock();
        }
      }, this);
      ajaxParameters.success = this.getSuccessHandler(success,always);
      ajaxParameters.error = this.getErrorHandler();
      $.ajax(ajaxParameters);
    },


    /*
     * Increment the call counter, so we can keep track of the order in which
     * requests were made.
     */
    callCounter: function() {
      return ++this.runCounter;
    },

    /* Trigger an error event on the component. Takes as arguments the error
     * message and, optionally, a `cause` object.
     * Also
     */
    error: function(msg, cause) {
      msg = msg || this.dashboard.getErrorObj('COMPONENT_ERROR').msg;
      if (!this.isSilent()){
        this.unblock();
      };
      this.errorNotification({
        error: cause,
        msg: msg
      });
      this.trigger("cdf cdf:error", this, msg , cause || null);
    },
    /*
     * Build a generic response handler that runs the success callback when being
     * called in response to the most recent AJAX request that was triggered for
     * this component (as determined by comparing counter and this.runCounter),
     * and always calls the always callback. If the counter is not provided, it'll
     * be generated automatically.
     *
     * Accepts the following calling conventions:
     *
     * - this.getSuccessHandler(counter, success, always)
     * - this.getSuccessHandler(counter, success)
     * - this.getSuccessHandler(success, always)
     * - this.getSuccessHandler(success)
     */
    getSuccessHandler: function(counter,success,always) {

      if (arguments.length === 1) {
      /* getSuccessHandler(success) */
        success = counter;
        counter = this.callCounter();
      } else if (typeof counter == 'function') {
        /* getSuccessHandler(success,always) */
        always = success;
        success = counter;
        counter = this.callCounter();
      }
      return _.bind(function(data) {
          var newData;
          if(counter >= this.runCounter) {
            try {
              if(typeof this.postFetch == "function") {
                newData = this.postFetch(data);
                this.trigger('cdf cdf:postFetch',this,data);
                data = typeof newData == "undefined" ? data : newData;
              }
              success(data);
            } catch(e) {
              this.error(this.dashboard.getErrorObj('COMPONENT_ERROR').msg, e);
              Logger.log(e,"error");
            }
          }
          if(typeof always == "function") {
            always();
          }
      },
      this);
    },

    getErrorHandler: function() {
      return  _.bind(function() {
        var err = this.dashboard.parseServerError.apply(this, arguments );
        this.error( err.msg, err.error );
      },
      this);
    },
    errorNotification: function(err, ph) {
      ph = ph || (this.htmlObject ? this.placeholder() : undefined);
      var name = this.name.replace('render_', '');
      err.msg = err.msg + ' (' + name + ')';
      this.dashboard.errorNotification( err, ph );
    },

    /*
     * Trigger UI blocking while the component is updating. Default implementation
     * uses the global CDF blockUI, but implementers are encouraged to override
     * with per-component blocking where appropriate (or no blocking at all in
     * components that support it!)
     */
    block: function() {
      if(!this.isRunning){
        this.dashboard.incrementRunningCalls();
        this.isRunning = true;
      }

    },

    /*
     * Trigger UI unblock when the component finishes updating. Functionality is
     * defined as undoing whatever was done in the block method. Should also be
     * overridden in components that override UnmanagedComponent#block.
     */
    unblock: function() {

      if(this.isRunning){
        this.dashboard.decrementRunningCalls();
        this.isRunning = false;
      }
    },

    isSilent: function() {
      return (this.lifecycle) ? !!this.lifecycle.silent : false;
    }
  });

  return UnmanagedComponent;

});
