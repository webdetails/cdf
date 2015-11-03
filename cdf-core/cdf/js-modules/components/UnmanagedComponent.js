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
 * Module that holds everything related to Components
 * @module Components
 */

define([
  './BaseComponent',
  'amd!../lib/underscore',
  '../lib/jquery',
  '../Logger'
], function(BaseComponent, _, $, Logger) {

  /**
   * UnmanagedComponent is an advanced version of the BaseComponent that allows
   * control over the core CDF lifecycle for implementing components. It should
   * be used as the base class for all components that desire to implement an
   * asynchronous lifecycle, as CDF cannot otherwise ensure that the postExecution
   * callback is correctly handled.
   *
   *
   *  <div class="contents">
   *
   *
   * <h2>CDF Async Developer's Guide</h2>
   *
   *    <p>CDF now supports proper, asynchronous, AJAX calls for all its querying. The
   *    following is a guide to converting old components and dashboards to the new
   *    async style, and developing new ones based on asynchronous querying.</p>
   *
   *
   * <h2>Rationale</h2>
   *
   * <p>The first step to understanding the changes in the async patch is understanding
   * the CDF component lifecycle. When a component is updated, the basic update
   * lifecycle looks like this:</p>
   *
   * <pre><code>preExecution -&gt; update -&gt; postExecution
   * </code></pre>
   *
   * <p>Usually, though, there will be a call to a data source, with a subsequent call
   * to postFetch, and only then is the component rendered:</p>
   *
   * <pre><code>preExecution -&gt; update -&gt; query -&gt; postFetch -&gt; redraw -&gt; postExecution
   * </code></pre>
   *
   * <p>This is a more typical lifecycle, and one that has some important limitations.
   * First, preExeuction and postExecution are entirely the responsibility of CDF
   * itself, rather than the component. Because CDF has no control over the contents
   * of the update method, it has no way of ensuring that, should the component
   * execute an asynchronous query, postExecution only runs after redraw. In this
   * case, you're likely to see this instead:</p>
   *
   * <pre><code>preExecution -&gt; update -&gt; postExecution -&gt; query -&gt; postFetch -&gt; redraw
   * </code></pre>
   *
   * <p>Which breaks the contract for postExecution running after the component is done
   * updating. The solution here is that the component itself must take control of
   * postExecution, while keeping the burden of implementing the lifecycle in CDF
   * rather than passing it to the component developer. On a related topic, postFetch
   * has become a de facto standard part of the lifecycle, yet its implementation was
   * left to the component implementers, which leads to a fairly large amount of
   * boilerplate code.</p>
   *
   * <p>Our objective here was to retool the base component so as to deal with both
   * of these issues, thus allowing queries to be performed asynchronously while
   * reducing the developer effort involved in creating a component.</p>
   *
   *
   * <h2>Component Execution Order and Priority</h2>
   *
   * <p>There are no major changes in the way components behave. There is, however an
   * important caveat - since all components (that have been converted) will be
   * executed simultaneously, we can no longer rely on the order of execution. </p>
   *
   * <p>There's now an additional property named <em>priority</em>. The priority of component
   * execution, defaulting to 5. The lower the number, the higher priority the
   * component has. Components with the same priority with be executed simultaneously.
   * Useful in places where we need to give higher priority to filters or other
   * components that need to be executed before other components.</p>
   *
   * <p>This way there's no longer the need to use dummy parameters and postChange
   * tricks to do, for instance, cascade prompts.</p>
   *
   *
   * <h2>Backward Compatibility and Changes</h2>
   *
   * <p>We did a big effort in order to maintain backward compatibility, but some care
   * has to be taken. What we do is assume that if components have no priority, we
   * give them a sequential value, trying to emulate the old behavior. It's
   * recommended that proper priorities are set in order to take advantage of the new
   * improvements.</p>
   *
   * <p>If using <em>CDE</em>, please note that if you edit a dashboard and save it, <strong>all
   * components will have a default priority of 5</strong>. This may break the old behavior.
   * If you need to change a dashboard, make sure you tweak the priorities, if
   * needed.</p>
   *
   *
   * <h2>Developing Components</h2>
   *
   * <p>Components desiring to use asynchronous queries should inherit from the new
   * UnmanagedComponent, instead of BaseComponent. The UnmanagedComponent base class
   * provides pre-composed methods that implement the core lifecycle, for a variety
   * of different scenarios:</p>
   *
   * <ul>
   * <li><code>synchronous</code> implements a synchronous lifecycle identical to the core
   * CDF lifecycle.</li>
   * <li><code>triggerQuery</code> implements a simple interface to a lifecycle built around
   * Query objects.</li>
   * <li><code>triggerAjax</code> implements a simple interface to a lifecycle built around
   * AJAX calls.</li>
   * </ul>
   *
   * <p>Since all these lifecycle methods expect a callback that handles the actual
   * component rendering, it's conventional style to have that callback as a method
   * of the Component, called <code>redraw</code>. It's also considered standard practice to
   * use <code>Function#bind</code> or <code>_.bind</code> to ensure that, inside the <code>redraw</code> callback,
   * <code>this</code> points to the component itself.</p>
   *
   * <h3>Use <code>synchronous</code> If Your Component Doesn't Use External Data</h3>
   *
   * <p>Components that don't use any external data at all can continue subclassing
   * BaseComponent without any change of functionality. However, for the sake of
   * consistency (or because you want querying to be optional -- see the section for
   * details), you can use subclass UnmanagedComponent and use the <code>synchronous</code>
   * lifecycle method to emulate BaseComponent's behaviour:</p>
   *
   * <pre><code>
   *   update: function() {
   *     this.synchronous(this.redraw);
   *   }
   * </code></pre>
   *
   * <p>If you want to pass parameters to <code>redraw</code>, you can pass them as an array to
   * <code>synchronous</code>:</p>
   *
   * <pre><code>
   *   update: function() {
   *     // Will call this.redraw(1, 2, 3)
   *     this.synchronous(this.redraw, [1, 2, 3]);
   *   }
   * </code></pre>
   *
   * <h3>Use <code>triggerQuery</code> When You Want Your Component To Use CDA/Query Objects</h3>
   *
   * <p>If you're using a CDA data source, you probably want to use <code>triggerQuery</code> to
   * handle the component lifecycle for you. <code>triggerQuery</code> expects at a minimum
   * a query definition and a redraw callback to process the query results. The
   * query definition is an object of the form:</p>
   *
   * <pre><code>
   *   {
   *     dataAccessId: 'myQuery',
   *     file: '/path/to/my/datasourceDefinition.cda'
   *   }
   * </code></pre>
   *
   * <p>Typically, if you're using CDE, these properties will be added to one of either
   * <code>this.queryDefinition</code> or <code>this.chartDefinition</code> so you can just use this
   * pattern:</p>
   *
   * <pre><code>
   *   update: function() {
   *     var redraw = _.bind(this.redraw, this);
   *     this.triggerQuery(this.queryDefinition, redraw);
   *   }
   * </code></pre>
   *
   * <h3>Alternating Between Static And Query-Based Data</h3>
   *
   * <p>As the lifecycle methods are completely self-contained, you can switch between
   *   them at will, deciding on an appropriate lifecycle at runtime. A common pattern
   *   (used e.g. in SelectComponent, and the CccComponent family) is exposing a
   * <code>valuesArray</code> property, and using static data if <code>valuesArray</code> is provided, or
   * a query if it is not. Using UnmanagedComponent, this convention would look like
   *     this:</p>
   *
   * <pre><code>
   *   update: function() {
   *     var redraw = _.bind(this.redraw, this);
   *     if(this.valuesArray &amp;&amp; this.valuesArray.length &gt; 0) {
   *       this.synchronous(redraw, this.valuesArray);
   *     } else {
   *       this.triggerQuery(this.queryDefinition, redraw);
   *     }
   *   }
   * </code></pre>
   *
   *   <h3>Rolling Your Own</h3>
   *
   *    <p>If you prefer having absolute control over your component, you can eschew the
   *     use of any of the lifecycle methods. Instead, you're expected to follow these
   *     guidelines:</p>
   *
   *    <ul>
   *   <li>Call <code>this.preExec()</code> as soon as possible, and bail out if it returns false.</li>
   *   <li>If <code>this.preExec()</code> returned true, call <code>this.block()</code> before any meaningful
   *     amount of work is done.</li>
   *   <li>If you called <code>this.block()</code>, make sure to always call <code>this.unblock()</code> as
   *     well once all relevant work is done.</li>
   *   <li>If you want to use any sort of AJAX, consider using <code>triggerAjax</code></li>
   *   <li>Call <code>this.postExec()</code> once all processing is done</li>
   *   <li>You can override <code>this.block</code> and <code>this.unblock</code> to implement component
   *     specific UI blocking. If you override either, you <em>must</em> override the other
   *     as well.</li>
   *   </ul>
   * </div>
   *
   * @class UnmanagedComponent
   * @extends BaseComponent
   */
  var UnmanagedComponent = BaseComponent.extend({
    isManaged: false,
    isRunning: false,

    /**
     * Handles calling preExecution when it exists. All components extending
     * UnmanagedComponent should either use one of the three lifecycles declared
     * in this class (synchronous, triggerQuery, triggerAjax), or call this method
     * explicitly at the very earliest opportunity. If preExec returns a falsy
     * value, component execution should be cancelled as close to immediately as
     * possible.
     *
     * @method preExec
     * @return {boolean} `false` if component execution should be cancelled, `true` otherwise.
     */
    preExec: function() {
      // runCounter gets incremented every time we run a query, allowing us to
      // determine whether the query has been called again after us.
      if(this.runCounter == null) this.runCounter = 0;

      var execute = true;
      if(typeof this.preExecution === "function") {
        try {
          var exec = this.preExecution();
          if(exec !== undefined && !exec) execute = false;
        } catch(ex) {
          execute = false;
          this.failExec(ex);
        }
      }

      // TODO: event should be cancellable!
      this.trigger('cdf cdf:preExecution', this, execute);
      
      return execute;
    },

    /**
     * Handles calling postExecution when it exists. All components extending
     * UnmanagedComponent should either use one of the three lifecycles declared
     * in this class (synchronous, triggerQuery, triggerAjax), or call this method
     * explicitly immediately before yielding control back to CDF.
     *
     * @method postExec
     */
    postExec: function() {
      if(typeof this.postExecution === "function") {
        this.postExecution();
      }

      this.trigger('cdf cdf:postExecution', this);
    },

    /**
     * Handles calling `postFetch`, when it exists,
     * and of triggering the "cdf:postFetch" event.
     * 
     * @method postFetchData
     * @param {Object} data The fetched data.
     * @return {Object} The resulting data.
     */
    postFetchData: function(data) {
      if(typeof this.postFetch == "function") {
        var newData = this.postFetch(data);

        data = (newData === undefined) ? data : newData;
        
        // TODO: postFetch event should allow transformation of data
        // TODO: shouldn't postFetch event be called even when `postFetch` 
        //   is not declared? 
        this.trigger('cdf cdf:postFetch', this, data);
      }
      return data;
    },

    /**
     * Draws a tooltip, if one is defined in the component options.
     *
     * @method drawTooltip
     */
    drawTooltip: function() {
      if(this.htmlObject && this.tooltip) {
        this._tooltip = typeof this.tooltip == "function" 
          ? this.tooltip()
          : this.tooltip;
      }
    },

    /**
     * Shows a tooltip attached to the component,
     * if one is defined in the `_tooltip` option.
     *
     * @method showTooltip
     */
    showTooltip: function() {
      var tooltip; 
      if(this.htmlObject && (tooltip = this._tooltip) !== undefined) {
        this.placeholder()
          .attr("title", tooltip)
          .tooltip({
            delay: 0,
            track: true,
            fade:  250,
            content: tooltip
          });
      }
    },

    // -----------

    /**
     * Begins execution of the component.
     * 
     * This method handles calling `preExec` and 
     * blocking the UI, if necessary.
     * 
     * A component that actually begins execution,
     * by returning `true`from this method,
     * should later complete the lifecycle
     * by calling either `endExec` or `failExec`.
     * 
     * @method beginExec
     * @return {boolean} `false` if component execution should be cancelled, `true` otherwise.
     */
    beginExec: function() {
      var exec = this.preExec();
      if(exec) this._maybeBlock();
      return exec;
    },

    /**
     * Fails execution of the component, 
     * given an error object or the arguments of a `jQuery.ajax` error callback.
     * 
     * This method handles parsing, signaling and logging of the error and 
     * unblocking the UI, if necessary.
     * 
     * @method failExec
     * @param {Error|*} arg An error object or the arguments of a `jQuery.ajax` error callback.
     */
    failExec: function(arg) {
      // NOTE: #error() already unblocks
      if(arg && ('responseText' in arg)) {
        // Used as a jQuery.ajax({error:}) callback. 
        var err = this.dashboard.parseServerError.apply(this.dashboard, arguments);
        this.error(err.msg, err.error);
      } else {
        // As a catch(ex) error handler.
        this.error(null, /*cause:*/arg);
      }
    },

    /**
     * Ends a successful execution of the component.
     * 
     * This method handles 
     * drawing and showing the component's tooltip, if any,
     * calling `postExec` and 
     * unblocking the UI, if necessary.
     * 
     * @method endExec
     */
    endExec: function() {
      try {
        this.drawTooltip();

        this.postExec();

        this.showTooltip();

        this._maybeUnblock();
      } catch(ex) {
        // already unblocks
        this.failExec(ex);
      }
    },

    // ------------

    /**
     * Generic execute method that handles _pre_ and _post_ lifecycle tasks.
     * 
     * The specified _executor_ function handles the component's _core_ execution.
     * If execution is not cancelled by the `preExecution` handler,
     * it is called synchronously, from within a call to this method.
     * 
     * If it throws an error, it is like if `failExec` had been called with that error.
     * 
     * This method is sugar for the following common pattern:
     * 
     *     if(this.beginExec()) {
     *       try {
     *         executor.call(this);
     *       } catch(ex) {
     *         this.failExec(ex);
     *       }
     *     }
     *
     * @method execute
     * @param {function} executor The executor function.
     *   This function receives two arguments:
     *   1. resolve - call this function to signal that core execution has ended.
     *   2. reject  - called, optionally with a cause value (an `Error` object), 
     *        to signal that an error occurred during core execution.
     * 
     *   This function is called with this component as the `this`context.
     */
    execute: function(executor) {
      if(this.beginExec()) {
        try {
          executor.call(this);
        } catch(ex) {
          this.failExec(ex);
        }
      }
    },

    // ------------

    /**
     * The synchronous lifecycle handler closely resembles the core CDF lifecycle,
     * and is provided as an alternative for components that desire the option to
     * alternate between a synchronous and asynchronous style lifecycles depending
     * on external configuration (e.g. if it can take values from either a static
     * array or a query). It takes the component drawing method as a callback.
     *
     * @method synchronous
     * @param callback Component drawing method
     * @param arg Argument for the callback
     */
    synchronous: function(callback, arg) {
      if(!this.beginExec()) return;

      function synchronousInner() {
        try {
          callback.call(this, arg || []);
        } catch(ex) {
          this.failExec(ex);
          return;
        }

        this.endExec();
      }

      setTimeout(_.bind(synchronousInner, this), 10);
    },

    /**
     * The triggerQuery lifecycle handler builds a lifecycle around Query objects.
     * Execution ends immediately after the call to the specified callback.
     * 
     * It takes a query definition object that is passed directly into the Query
     * constructor, and the component rendering callback, and implements the lifecycle:
     * preExecution->block?->doQuery->postFetch->(callback)->postExecution->unblock?.
     * This method detects concurrent updates to the component and 
     * ensures that only the redraw of the most recent update is performed.
     *
     * @method triggerQuery
     * @param queryDef query definition
     * @param callback Callback to run after query has ran.
     *    Receives the fetched data as argument. 
     * @param queryOptions User options for the query
     */
    triggerQuery: function(queryDef, callback, queryOptions) {
      this.beginQuery(
        queryDef, 
        function(data) {
          callback(data);
          this.endExec();
        },
        queryOptions);
    },

    /**
     * The beginQuery lifecycle handler implements the begin phase of a lifecycle around Query objects.
     * It implements the lifecycle:
     * preExecution->block?->doQuery->postFetch->(callback)->
     * 
     * Ending the execution, is the responsibility of the specified callback,
     * by calling `endExec` (resulting in: ->postExecution->unblock?)
     * or `failExec`.
     * 
     * @method beginQuery
     * @param {Object} queryDef query definition
     * @param {function} callback Callback to run after query has ran
     *    Receives as arguments: the fetched data object, a resolve function and a reject function.
     * @param {Object} queryOptions User options for the query
     */
    beginQuery: function(queryDef, callback, queryOptions) {
      this.execute(function() {
        var query = this._setQuery(queryDef, queryOptions);
        
        // `getSuccessHandler`:
        // * if this execution is subsumed by a following one,
        //   only calls `maybeUnlock`; `endExec` will not be called by _this_ execution
        // * calls postFetch with the results from `query.fetchData`
        // * calls the provided callback with the transformed data
        // * handles any thrown errors
        query.fetchData(
          this.parameters,
          this.getSuccessHandler(callback, undefined, this._maybeUnblock),
          this.getErrorHandler());
      });
    },

    /**
     * The triggerAjax lifecycle handler builds a lifecycle around generic AJAX calls.
     * It implements the lifecycle:
     * preExecution->block?->ajax->postFetch->render->postExecution->unblock?.
     * 
     * After the call to the _render callback_, 
     * the event "cdf:render" is fired, 
     * and then execution ends.
     *
     * triggerAjax can be used with either of the following call conventions:
     * - this.triggerAjax(url, params, callback);
     * - this.triggerAjax({url: url, data: params, ...}, callback);
     * - this.triggerAjax({url: url, data: params, ...}, callback, ajaxParameters);
     * 
     * In the second case, you can add any other `jQuery.Ajax` parameters you desire
     * to the object, but `triggerAjax` will take control over the success and error
     * callbacks.
     * If passed, the supplied _ajaxParameters_ will be passed to the default ajax call.
     *
     * @method triggerAjax
     * @param url url to call
     * @param params Parameters for the call
     * @param callback Render callback, called with the response data.
     * @param ajaxParameters Parameters specific to the ajax call definition
     */
    triggerAjax: function(url, params, callback, ajaxParameters) {
      // Process parameters
      var ajaxOptions = $.extend({}, ajaxParameters);

      // ...detect call convention used and adjust parameters
      if(typeof callback !== "function") {
        callback = params;
        _.extend(ajaxOptions, url);
      } else {
        _.extend(ajaxOptions, {url: url, data: params});
      }

      this.beginAjax(ajaxOptions, function(data) {
          callback.call(this, data);
          this.trigger('cdf cdf:render', this, data);
          this.endExec();
        });
    },

    /**
     * The beginAjax lifecycle handler implements the begin phase of
     * a lifecycle based on generic AJAX calls.
     * It implements the lifecycle:
     * preExecution->block?->ajax->postFetch->(callback)->
     * 
     * Ending the execution, is the responsibility of the specified callback,
     * by calling `endExec` (resulting in: ->postExecution->unblock?)
     * or `failExec`.
     * 
     * @method beginAjax
     * @param {Object} ajaxParameters Parameters for `jQuery.ajax`,
     *    including, at a minimum, the `url` option.
     *    `beginAjax` will take control over the `success` and `error` callbacks,
     *    and default `async` to `true`.
     *
     * @param {function} callback Render callback, called with the response data.
     */
    beginAjax: function(ajaxParameters, callback) {
      this.execute(function() {
        var ajaxOptions = $.extend(
          {async: true}, 
          ajaxParameters, // requires url
          {
            success: this.getSuccessHandler(callback, undefined, this._maybeUnblock),
            error:   this.getErrorHandler()
          });

        $.ajax(ajaxOptions);
      });
    },

    // ------------

    /**
     * Creates and sets the component's current query given its definition,
     * and, optionally, query options.
     * 
     * @method _setQuery
     * @param {object} queryDef The query definition object.
     * @param {object} [queryOptions] Query options object.
     * @param {number} [queryOptions.ajax] Options passed to `jQuery.ajax`.
     *   The AJAX options _data_, _url_, _error_ and _success_ are reserved.
     * @param {number} [queryOptions.pageSize] The page size of paginated results.
     * @return {BaseQuery} The query object.
     * 
     * @protected
     */
    _setQuery: function(queryDef, queryOptions) {
      var query = this.queryState = this.query = this.dashboard.getQuery(queryDef);

      // Ajax Options
      var ajaxOptions = {async: true};
      if(queryOptions && queryOptions.ajax)
        _.extend(ajaxOptions, queryOptions.ajax);

      query.setAjaxOptions(ajaxOptions);

      // Other Query Options
      if(queryOptions && queryOptions.pageSize)
        query.setPageSize(queryOptions.pageSize);

      return query;
    },

    /**
     * Increment the call counter, so we can keep track of the order in which
     * requests were made.
     *
     * @method callCounter
     * @return the incremented counter
     */
    callCounter: function() {
      return ++this.runCounter;
    },

    /**
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
     *
     * @method getSuccessHandler
     * @param {number} counter id for the ajax call being made
     * @param {function} success Success callback.
     * @param {function} [always] Callback that is ran independently of call status
     * @param {function} [canceled] Callback that is ran when the call has been superseeded
     *    by a more recent one. Receives the raw received data.
     * @return {function} Success handler function
     */
    getSuccessHandler: function(counter, success, always, canceled) {
      if(arguments.length === 1) {
        // getSuccessHandler(success)
        success = counter;
        counter = this.callCounter();
      } else if(typeof counter === "function") {
        // getSuccessHandler(success, always)
        canceled = always;
        always   = success;
        success  = counter;
        counter  = this.callCounter();
      }

      function fetchDataSuccessHandler(data) {
        if(counter >= this.runCounter) {
          try {
            var dataPost = this.postFetchData(data);
            success.call(this, dataPost);
          } catch(ex) {
            this.failExec(ex);
          }
        } else if(canceled) {
          canceled.call(this, data);
        }

        if(typeof always === "function") always.call(this);
      }

      return _.bind(fetchDataSuccessHandler, this);
    },

    /**
     * Gets an error handler suitable 
     * for use as 
     * a `jQuery.ajax` error callback or 
     * a try/catch handler.
     * 
     * This method returns a `this` free version of the `failExec` method.
     * 
     * @method getErrorHandler
     * @return {Function} Error handler
     */
    getErrorHandler: function() {
      return _.bind(this.failExec, this);
    },

    /**
     * Trigger an error event on the component. Takes as arguments the error
     * message and, optionally, a `cause` object.
     *
     * @method error
     * @param msg Error message
     * @param cause Cause for the error
     */
    error: function(msg, cause) {
      if(!msg) msg = this.dashboard.getErrorObj('COMPONENT_ERROR').msg;

      this._maybeUnblock();

      this.errorNotification({msg: msg, error: cause});

      this.trigger("cdf cdf:error", this, msg, cause || null);

      if(cause) Logger.log(cause, "error");
    },

    /**
     * Triggers an error notification.
     *
     * @method errorNotification
     * @param {Object} err A CDF error object containing `msg` and `error` properties.
     * @param ph HTML element where to display the error notification
     */
    errorNotification: function(err, ph) {
      if(!ph) ph = this.htmlObject ? this.placeholder() : undefined;

      var name = this.name.replace('render_', '');
      err.msg = err.msg + ' (' + name + ')';
      this.dashboard.errorNotification(err, ph);
    },

    /**
     * Trigger UI blocking while the component is updating. Default implementation
     * uses the global CDF blockUI, but implementers are encouraged to override
     * with per-component blocking where appropriate (or no blocking at all in
     * components that support it!).
     *
     * @method block
     */
    block: function() {
      if(!this.isRunning) {
        this.dashboard.incrementRunningCalls();
        this.isRunning = true;
      }
    },

    /**
     * Trigger UI unblock when the component finishes updating. Functionality is
     * defined as undoing whatever was done in the block method. Should also be
     * overridden in components that override {{#crossLink "UnmanagedComponent/block:method"}}block{{/crossLink}}.
     *
     * @method unblock
     */
    unblock: function() {
      if(this.isRunning) {
        this.dashboard.decrementRunningCalls();
        this.isRunning = false;
      }
    },

    /**
     * Returns _true_ if the component's lifecycle is marked as silent (does not trigger UI block when updating).
     *
     * @method isSilent
     * @return {boolean} _true_ if the component should not trigger an UI block when updating
     */
    isSilent: function() {
      return !!(this.lifecycle && this.lifecycle.silent);
    },

    /**
     * Blocks the UI if it isn't silent.
     *
     * @method _maybeBlock 
     *
     * @private
     */
    _maybeBlock: function() {
      if(!this.isSilent()) this.block();
    },

    /**
     * Unblocks the UI if it isn't silent.
     *
     * @method _maybeUnblock 
     *
     * @private
     */
    _maybeUnblock: function() {
      if(!this.isSilent()) this.unblock();
    }
  });

  return UnmanagedComponent;
});
