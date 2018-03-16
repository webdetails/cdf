/*!
 * Copyright 2002 - 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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

define([
  './BaseComponent',
  'amd!../lib/underscore',
  '../lib/jquery',
  '../Logger'
], function(BaseComponent, _, $, Logger) {

  /**
   * @description The constructor of an unmanaged component.
   *
   * @class cdf.components.UnmanagedComponent
   * @extends cdf.components.BaseComponent
   * @amd cdf/components/UnmanagedComponent
   * @summary Advanced version of the {@link cdf.components.BaseComponent|BaseComponent}
   *          which allows control over the core CDF lifecycle.
   * @classdesc <p>The `UnmanagedComponent` is an advanced version of the
   *  {@link cdf.components.BaseComponent|BaseComponent} which allows control over the core CDF lifecycle for
   *  implementing components.</p>
   * <p>It should be used as the base class for all components which desire to implement an asynchronous lifecycle, as CDF
   *  cannot otherwise ensure that the {@link cdf.components.UnmanagedComponent#postExec|postExecution} callback is
   *  correctly handled.</p>
   *
   * <h2>CDF Async Developer's Guide</h2>
   *
   * <p>CDF now supports proper, asynchronous, AJAX calls for all its querying. The following is a guide to converting
   *  old components and dashboards to the new async style, and developing new ones based on asynchronous querying.</p>
   *
   * <h2>Rationale</h2>
   *
   * <p>The first step to understanding the changes in the async patch is understanding the CDF component lifecycle.
   *  When a component is updated, the basic update lifecycle looks like this:</p>
   *
   * <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; update -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution}</code></pre>
   *
   * <p>Usually, though, there will be a call to a data source, with a subsequent call to
   *  {@link cdf.components.UnmanagedComponent#postFetchData|postFetch}, and only then is the component rendered:</p>
   *
   * <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; update -&gt; {@link cdf.components.UnmanagedComponent#beginQuery|query} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; redraw -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution}</code></pre>
   *
   * <p>This is a more typical lifecycle, and one that has some important limitations. First,
   *  {@link cdf.components.UnmanagedComponent#preExec|preExecution} and
   *  {@link cdf.components.UnmanagedComponent#postExec|postExecution} are entirely the responsibility of CDF itself,
   *  rather than the component. Because CDF has no control over the contents of the update method, it has no way of
   *  ensuring that, should the component execute an asynchronous query,
   *  {@link cdf.components.UnmanagedComponent#postExec|postExecution} only runs after redraw. In this case, you are
   *  likely to see this instead:</p>
   *
   * <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; update -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution} -&gt; {@link cdf.components.UnmanagedComponent#beginQuery|query} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; redraw</code></pre>
   *
   * <p>This breaks the contract for {@link cdf.components.UnmanagedComponent#postExec|postExecution} running after
   *  the component is done updating. The solution here is that the component itself must take control of
   *  {@link cdf.components.UnmanagedComponent#postExec|postExecution}, while keeping the burden of implementing the
   *  lifecycle in CDF rather than passing it to the component developer. On a related topic,
   *  {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} has become a de facto standard part of the
   *  lifecycle, yet its implementation was left to the component implementers, which leads to a fairly large amount of
   *  boilerplate code.</p>
   *
   * <p>Our objective here was to retool the base component to deal with both of these issues, thus allowing
   *  queries to be performed asynchronously while reducing the developer effort involved in creating a component.</p>
   *
   *
   * <h2>Component Execution Order and Priority</h2>
   *
   * <p>There are no major changes in the way components behave. There is, however an important caveat: since all
   *  components that have been converted will be executed simultaneously, we can no longer rely on the order of
   *  execution.</p>
   *
   * <p>There's now an additional property named {@link cdf.components.UnmanagedComponent#priority|priority}.
   *  This is the {@link cdf.components.UnmanagedComponent#priority|priority} of component execution, defaulting to 5. The lower
   *  the number, the higher {@link cdf.components.UnmanagedComponent#priority|priority} the component has. Components
   *  with the same {@link cdf.components.UnmanagedComponent#priority|priority} with be executed simultaneously. This property
   *  is useful in places where we need to give higher {@link cdf.components.UnmanagedComponent#priority|priority} to filters or
   *  other components that need to be executed before other components.</p>
   *
   * <p>This way there's no longer the need to use dummy parameters and postChange tricks to do, for instance, cascade prompts.</p>
   *
   *
   * <h2>Backward Compatibility and Changes</h2>
   *
   * <p>Maintaining backwards compatibility requires some care. If components have no
   *  {@link cdf.components.UnmanagedComponent#priority|priority}, we give them a sequential value,
   *  trying to emulate the old behavior. It's recommended that proper priorities are set in order to
   *  take advantage of the new improvements.</p>
   *
   * <p>If using Community Dashboard Editor (CDE), note that if you edit a dashboard and save it, <em>all components will have a
   *  default priority of 5</em>. This may break the old behavior. If you need to change a dashboard, make sure you
   *  tweak the priorities, if needed.</p>
   *
   *
   * <h2>Developing Components</h2>
   *
   * <p>Components desiring to use asynchronous queries should inherit from the new `UnmanagedComponent`,
   *  instead of {@link cdf.components.BaseComponent|BaseComponent}. The `UnmanagedComponent` base class
   *  provides pre-composed methods which implement the core lifecycle for a variety of different scenarios:</p>
   *
   * <ul>
   * <li>{@link cdf.components.UnmanagedComponent#synchronous|synchronous}: implements a synchronous lifecycle identical to the core CDF lifecycle.</li>
   * <li>{@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery}: implements a simple interface to a lifecycle built around Query objects.</li>
   * <li>{@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}: implements a simple interface to a lifecycle built around AJAX calls.</li>
   * </ul>
   *
   * <p>Since all these lifecycle methods expect a callback which handles the actual component rendering,
   *  it's a conventional style to have that callback as a method of the component, called `redraw`.
   *  It's also considered standard practice to use
   *  {@link http://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_objects/Function/bind|Function#bind}
   *  or {@link http://underscorejs.org/#bind|_.bind} to ensure that, inside the `redraw` callback,
   *  `this` points to the component itself.</p>
   *
   * <h3>Use {@link cdf.components.UnmanagedComponent#synchronous|synchronous} If Your Component Does Not Use External Data</h3>
   *
   * <p>Components that do not use any external data at all can continue subclassing
   *  {@link cdf.components.BaseComponent|BaseComponent} without any change of functionality. However, for the sake of
   *  consistency (or because you want querying to be optional), you can use subclass
   *  `UnmanagedComponent` and use the
   *  {@link cdf.components.UnmanagedComponent#synchronous|synchronous} lifecycle method to emulate
   *  {@link cdf.components.BaseComponent|BaseComponent}'s behavior:</p>
   *
   * <pre function="syntax.javascript">update: function() {<br>
   *   this.synchronous(this.redraw);<br>
   * }<br>
   * </pre>
   *
   * <p>If you want to pass parameters to `redraw`, you can pass them as an array to
   *  {@link cdf.components.UnmanagedComponent#synchronous|synchronous}:</p>
   *
   * <pre function="syntax.javascript">update: function() {<br>
   *   // Will call this.redraw(1, 2, 3)<br>
   *   this.synchronous(this.redraw, [1, 2, 3]);<br>
   * }<br>
   * </pre>
   *
   * <h3>Use {@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery} When You Want Your
   *  Component To Use CDA/Query Objects</h3>
   *
   * <p>If you're using a CDA data source, you probably want to use
   *  {@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery} to handle the component
   *  lifecycle for you. {@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery} expects at a
   *  minimum a query definition and a `redraw` callback to process the query results. The query definition
   *  is an object of the form:</p>
   *
   * <pre function="syntax.javascript">{<br>
   *   dataAccessId: 'myQuery',<br>
   *   file: '/path/to/my/datasourceDefinition.cda'<br>
   * }<br>
   * </pre>
   *
   * <p>Typically, if you are using CDE, these properties will be added to one of either
   *  `this.queryDefinition`, `this.chartDefinition` or `this.trafficDefinition` so you can just use this pattern:</p>
   *
   * <pre function="syntax.javascript">update: function() {<br>
   *   var redraw = _.bind(this.redraw, this);<br>
   *   this.triggerQuery(this.queryDefinition, redraw);<br>
   * }<br>
   * </pre>
   *
   * <h3>Alternating Between Static And Query-Based Data</h3>
   *
   * <p>As the lifecycle methods are completely self-contained, you can switch between them at will, deciding on an
   *  appropriate lifecycle at runtime. A common pattern (used for example in `SelectComponent` and the
   *  `CccComponent` family) is exposing a `valuesArray` property, and using static data if
   *  `valuesArray` is provided, or a query if it is not. Using `UnmanagedComponent`, this
   *  convention would look like this:</p>
   *
   * <pre function="syntax.javascript">update: function() {<br>
   *   var redraw = _.bind(this.redraw, this);<br>
   *   if(this.valuesArray &amp;&amp; this.valuesArray.length &gt; 0) {<br>
   *     this.synchronous(redraw, this.valuesArray);<br>
   *   } else {<br>
   *     this.triggerQuery(this.queryDefinition, redraw);<br>
   *   }<br>
   * }<br>
   * </pre>
   *
   *
   * @param {object} properties An object with the properties to extend the UnmanagedComponent instance.
   */
  return BaseComponent.extend(/** @lends cdf.components.UnmanagedComponent# */{
    /**
     * @summary Flag that defines if the component is managed or not.
     * @description Flag that defines if the component is managed or not.
     *
     * @type {boolean}
     * @default false
     */
    isManaged: false,

    /**
     * @summary Flag that defines if the component is running or not.
     * @description Flag that defines if the component is running or not.
     *
     * @type {boolean}
     * @default false
     */
    isRunning: false,

    /**
     * @summary Priority of a component in the cdf execution cycle.
     * @description Priority of a component in the cdf execution cycle.
     *
     * @name cdf.components.UnmanagedComponent#priority
     * @type {number}
     * @default 5
     */
    //priority: 5,

    /**
     * @summary The query definition `object`.
     * @description The query definition `object` used to hold the parameters for the query.
     * 
     * @name cdf.components.UnmanagedComponent#queryDefinition
     * @type {object|function}
     */
    //queryDefinition: undefined,

    /**
     * @summary The chart definition `object`.
     * @description The chart definition `object` used to hold the parameters for the query.
     * 
     * @name cdf.components.UnmanagedComponent#chartDefinition
     * @see {@link cdf.components.UnmanagedComponent#queryDefinition|queryDefinition}.
     * @type {object|function}
     */
    //chartDefinition: undefined,

    /**
     * @summary The traffic definition `object`.
     * @description The traffic definition `object` used to hold the parameters for the query.
     * 
     * @name cdf.components.UnmanagedComponent#trafficDefinition
     * @see {@link cdf.components.UnmanagedComponent#queryDefinition|queryDefinition}.
     * @type {object|function}
     */
    //trafficDefinition: undefined,

    /**
     * @summary Handles calling `preExecution` when it exists.
     * @description <p>Handles calling `preExecution` when it exists.</p>
     *              <p>All components extending UnmanagedComponent should either use one
     *              of the three lifecycles declared in this class 
     *              ({@link cdf.components.UnmanagedComponent#synchronous|synchronous},
     *              {@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery}
     *              or {@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}),
     *              or explicitly call this method at the very earliest opportunity.
     *              If `preExecution` returns a falsy value, component execution should be canceled as
     *              immediately as possible.</p>
     *
     * @return {boolean} `false` if component execution should be canceled, `true` otherwise.
     * @fires cdf.event:cdf
     * @fires cdf.components.UnmanagedComponent#event:"cdf:preExecution"
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
     * @summary Handles calling `postExecution` when it exists.
     * @description  <p>Handles calling `postExecution` when it exists.</p>
     *               <p>All components extending UnmanagedComponent should either use one of the three
     *               lifecycles declared in this class
     *               ({@link cdf.components.UnmanagedComponent#synchronous|synchronous},
     *               {@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery}
     *               or {@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}),
     *               or explicitly call this method immediately before yielding control back to CDF.</p>
     *
     * @fires cdf.event:cdf
     * @fires cdf.components.UnmanagedComponent#event:"cdf:postExecution"
     */
    postExec: function() {
      if(typeof this.postExecution === "function") {
        this.postExecution();
      }

      this.trigger('cdf cdf:postExecution', this);
    },

    /**
     * @summary Handles calling `postFetch`, when it exists, and triggering the
     *          {@link cdf.components.UnmanagedComponent#event:"cdf:postFetch"|postFetch} event.
     * @description Handles calling `postFetch`, when it exists, and triggering the
     *              {@link cdf.components.UnmanagedComponent#event:"cdf:postFetch"|postFetch} event.
     *
     * @param {object} data The fetched data.
     * @return {object} The resulting data.
     * @fires cdf.event:cdf
     * @fires cdf.components.UnmanagedComponent#event:"cdf:postFetch"
     */
    postFetchData: function(data) {
      if(typeof this.postFetch == "function") {
        var newData = this.postFetch(data);

        data = (newData === undefined) ? data : newData;

        // TODO: postFetch event should allow transformation of data
        // TODO: shouldn't postFetch event be called even when `postFetch` is not declared? 
        this.trigger('cdf cdf:postFetch', this, data);
      }
      return data;
    },

    /**
     * @summary Draws a tooltip, if one is defined in the component options.
     * @description Draws a tooltip, if one is defined in the component options.
     */
    drawTooltip: function() {
      if(this.htmlObject && this.tooltip) {
        this._tooltip = typeof this.tooltip == "function" ? this.tooltip() : this.tooltip;
      }
    },

    /**
     * @summary Shows a tooltip attached to the component, if one is defined in the `_tooltip` option.
     * @description Shows a tooltip attached to the component, if one is defined in the `_tooltip` option.
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

    /**
     * @summary Begins execution of the component.
     * @description <p>Begins execution of the component. This method handles calling 
     *              {@link cdf.components.UnmanagedComponent#preExec|preExecution} and blocking the UI, if necessary.</p>
     *              <p>A component that actually begins execution, by returning `true` from this method, should later complete the
     *              lifecycle by calling either {@link cdf.components.UnmanagedComponent#endExec|endExec} or
     *              {@link cdf.components.UnmanagedComponent#failExec|failExec}.</p>
     *
     * @return {boolean} `false` if component execution should be canceled, `true` otherwise.
     */
    beginExec: function() {
      var exec = this.preExec();
      if(exec) {
        this._maybeBlock();
      }
      return exec;
    },

    /**
     * @summary Fails execution of the component, given an error object or the arguments of a
     *          {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} error callback.
     * @description <p>Fails execution of the component, given an error object or the arguments of a
     *              {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} error callback.
     *              This method handles parsing, signaling and logging of the error and unblocking the UI, if necessary.</p>
     *
     * @param {object} arg An error object or the arguments of a {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} error callback.
     */
    failExec: function(arg) {
      // NOTE: #error() already unblocks
      if(arg && ('responseText' in arg)) {
        // Used as a $.ajax({error:}) callback. 
        var err = this.dashboard.parseServerError.apply(this.dashboard, arguments);
        this.error(err.msg, err.error);
      } else {
        // As a catch(ex) error handler.
        this.error(null, /*cause:*/arg);
      }
    },

    /**
     * @summary Ends a successful execution of the component.
     * @description <p>Ends a successful execution of the component. 
     *              This method handles drawing and showing the component's tooltip, if any, calling
     *              {@link cdf.components.UnmanagedComponent#postExec|postExec} and unblocking the UI, if necessary.</p>
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


    /**
     * @summary Generic execute method that handles {@link cdf.components.UnmanagedComponent#preExec|preExecution} and
     *          {@link cdf.components.UnmanagedComponent#postExec|postExecution} lifecycle tasks.
     * @description <p>Generic execute method that handles {@link cdf.components.UnmanagedComponent#preExec|preExecution} and
     *              {@link cdf.components.UnmanagedComponent#postExec|postExecution} lifecycle tasks.</p>
     *              <p>The specified `callback` function handles the component's core execution. If execution
     *              is not canceled by the {@link cdf.components.UnmanagedComponent#preExec|preExecution} handler,
     *              it is called synchronously, from within a call to this method.
     *              If it throws an error, it is like if {@link cdf.components.UnmanagedComponent#failExec|failExec}
     *              had been called with that error. This function is called with this component as the `this` context.</p>
     *              <p>This method is sugar for the following common pattern:</p>
     *
     *       if(this.beginExec()) {
     *         try {
     *           callback.call(this);
     *         } catch(ex) {
     *           this.failExec(ex);
     *         }
     *       }
     *
     * @param {function} callback The function to execute. This function receives two arguments:
     *   1. resolve - call this function to signal that core execution has ended.
     *   2. reject  - called, optionally with a cause value (an `Error` object),
     *        to signal that an error occurred during core execution.
     */
    execute: function(callback) {
      if(this.beginExec()) {
        try {
          callback.call(this);
        } catch(ex) {
          this.failExec(ex);
        }
      }
    },

    /**
     * @summary The synchronous lifecycle handler closely resembles the core CDF lifecycle.
     * @description The synchronous lifecycle handler closely resembles the core CDF lifecycle,
     *              and is provided as an alternative for components that desire the option to
     *              alternate between a synchronous and asynchronous style lifecycles
     *              depending on external configuration (e.g., if it can take values from 
     *              either a static array or a query). It takes the component drawing method as a callback.
     *
     * @param {Function} callback Component drawing method.
     * @param {Array<Object>} [arg=[]] Argument for the callback.
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
     * @summary The triggerQuery lifecycle handler builds a lifecycle around Query objects. 
     * @description <p>The triggerQuery lifecycle handler builds a lifecycle around Query objects.
     *              Execution ends immediately after the call to the specified callback.</p>
     *              <p>It takes a query definition object which is passed directly into the Query constructor,
     *              and the component rendering callback, and implements the lifecycle:</p>
     *              <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; {@link cdf.components.UnmanagedComponent#block|block} (optional) -&gt; {@link cdf.queries.BaseQuery#fetchData|fetchData} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; callback -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution} -&gt; {@link cdf.components.UnmanagedComponent#unblock|unblock} (optional)</code></pre>
     *              <p>This method detects concurrent updates to the component and ensures that only
     *              the redraw of the most recent update is performed.
     *              {@link UnmanagedComponent#endExec|endExec} is called after the `callback` execution.</p>
     *
     * @param {object} queryDef The query definition object.
     * @param {function} callback Callback to run after query has ran. It receives the fetched data as an argument.
     * @param {object} queryOptions User options for the query.
     */
    triggerQuery: function(queryDef, callback, queryOptions) {
      this.beginQuery(queryDef, function(data) {
        callback(data);
        this.endExec();
      }, queryOptions);
    },

    /**
     * @summary The beginQuery lifecycle handler implements the beginning phase of a lifecycle around Query objects.
     * @description <p>The beginQuery lifecycle handler implements the beginning phase of a lifecycle around Query objects.
     *              It implements the lifecycle:</p>
     *              <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; {@link cdf.components.UnmanagedComponent#block|block} (optional) -&gt; {@link cdf.queries.BaseQuery#fetchData|fetchData} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; callback</code></pre>
     *              <p>Ending the execution, is the responsibility of the specified callback
     *              by calling {@link cdf.components.UnmanagedComponent#endExec|endExec}, resulting in:</p>
     *              <pre><code>{@link cdf.components.UnmanagedComponent#postExec|postExecution} -&gt; {@link cdf.components.UnmanagedComponent#unblock|unblock} (optional) or {@link cdf.components.UnmanagedComponent#failExec|failExec}</code></pre>
     *
     * @param {object} queryDef The query definition object.
     * @param {function} callback Callback to run after query has ran.
     * @param {object} queryOptions User options for the query.
     */
    beginQuery: function(queryDef, callback, queryOptions) {
      this.execute(function() {
        var query = this._setQuery(this._resolveQueryDefinition(queryDef), queryOptions);
        // `getSuccessHandler`:
        // * if this execution is subsumed by a following one, only calls `maybeUnlock`; `endExec` will not be called by _this_ execution
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
     * @summary Resolves the correct query definition.
     * @description <p>Resolves the correct query definition, always defaulting to `undefined`.</p>
     *
     * @param {Object|Function} queryDef The query definition `object` or a getter `function`.
     * @return {Object} The resolved query definition `object`.
     * @private
     */
    _resolveQueryDefinition: function(queryDef) {
      var queryDefinition;
      if(_.isFunction(this.getQueryDefinition)) {
        queryDefinition = this.getQueryDefinition();
      }
      return this.dashboard.isValidQueryDefinition(queryDefinition) ?
            queryDefinition : (_.isFunction(queryDef) ? queryDef() : queryDef);
    },

    /**
     * @summary Gets the query definition `object`.
     * @description <p>Gets the query definition `object`.</p>
     *              <p>The properties used for retrieving the query definition are based on the known component implementations.</p>
     *
     * @return {Object|undefined} The query definition `object` or `undefined`.
     */
    getQueryDefinition: function() {
      return this.queryDefinition || this.chartDefinition || this.trafficDefinition;
    },

    /**
     * @summary The triggerAjax lifecycle handler builds a lifecycle around generic AJAX calls.
     * @description <p>The triggerAjax lifecycle handler builds a lifecycle around generic AJAX calls.
     *              It implements the lifecycle:</p>
     *              <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; {@link cdf.components.UnmanagedComponent#block|block} (optional) -&gt; {@link cdf.queries.BaseQuery#fetchData|fetchData} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; render -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution} -&gt; {@link cdf.components.UnmanagedComponent#unblock|unblock} (optional)</code></pre>
     *              <p>After the call to the `render` callback, the event {@link cdf.components.UnmanagedComponent#event:"cdf:render"|cdf:render} is fired, and then the execution ends.</p>
     *              triggerAjax can be used with either of the following call conventions:
     *              <ul>
     *                <li>{@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}(url, params, callback);</li>
     *                <li>{@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}({url: url, data: params, ...}, callback);</li>
     *                <li>{@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}({url: url, data: params, ...}, callback, ajaxParameters);</li>
     *              </ul>
     *              <p>In the second case, you can add any other {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} parameters you desire to the
     *              object, but `callback` will take control over the success and error callbacks.
     *              If passed, the supplied `ajaxParameters` will be passed to the default Ajax call.</p>
     *
     * @param {string|Object} url URL to call.
     * @param {string} url.url URL to call.
     * @param {object} url.params Parameters for the call.
     * @param {object} [params] Parameters for the call.
     * @param {function} callback Render callback, called with the response data.
     * @param {object} [ajaxParameters={}] Parameters specific to the Ajax call definition.
     * @fires cdf.event:cdf
     * @fires cdf.components.UnmanagedComponent#event:"cdf:render"
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
     * @summary The beginAjax lifecycle handler implements the beginning phase of a lifecycle based on generic AJAX calls.
     * @description <p>The beginAjax lifecycle handler implements the beginning phase of a lifecycle based on generic AJAX calls.
     *              It implements the lifecycle:</p>
     *              <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; {@link cdf.components.UnmanagedComponent#block|block} (optional) -&gt; {@link cdf.queries.BaseQuery#fetchData|fetchData} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; {@link cdf.components.UnmanagedComponent~beginAjaxCb|callback}</code></pre>
     *              Ending the execution is the responsibility of the specified callback, by calling
     *              {@link cdf.components.UnmanagedComponent#endExec|endExec}, resulting in:
     *              <pre><code>{@link cdf.components.UnmanagedComponent#postExec|postExec} -&gt; {@link cdf.components.UnmanagedComponent#unblock|unblock} (optional) or {@link cdf.components.UnmanagedComponent#failExec|failExec}</code></pre>
     *
     * @param {object} ajaxParameters Parameters for {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax},
     *                                including, at a minimum, the `url` option. {@link cdf.components.UnmanagedComponent#beginAjax|beginAjax} will
     *                                take control over the `success` and `error` callbacks and default `async` to `true`.
     * @param {string} ajaxParameters.url URL to call.
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
     * @summary Creates and sets the component's current query given its definition, and optionally, query options.
     * @description Creates and sets the component's current query given its definition, and optionally, query options.
     *
     * @param {object} queryDef The query definition `object`.
     * @param {object} [queryOptions] Query options `object`.
     * @param {object} [queryOptions.ajax] Options passed to {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax}.
     *   The {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} options `data`, `url`, `error` and `success` are reserved.
     * @param {number} [queryOptions.pageSize] The page size of paginated results.
     * @return {cdf.queries.BaseQuery} The query `object`.
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
     * @summary Increment the call counter, so we can keep track of the order in which requests were made.
     * @description Increment the call counter, so we can keep track of the order in which requests were made.
     *
     * @return {number} The incremented counter.
     */
    callCounter: function() {
      return ++this.runCounter;
    },

    /**
     * @summary Builds a generic response handler which runs the success callback.
     * @description <p>Builds a generic response handler which runs the success callback when being called in response to the most recent
     *              AJAX request that was triggered for this component (as determined by comparing counter and this.runCounter),
     *              and always calls the always callback. If the counter is not provided, it will be generated automatically.</p>
     *              <p>Accepts the following calling conventions:</p>
     *              <ul>
     *                <li>{@link cdf.components.UnmanagedComponent#getSuccessHandler|getSuccessHandler}(counter, success, always)</li>
     *                <li>{@link cdf.components.UnmanagedComponent#getSuccessHandler|getSuccessHandler}(counter, success)</li>
     *                <li>{@link cdf.components.UnmanagedComponent#getSuccessHandler|getSuccessHandler}(success, always)</li>
     *                <li>{@link cdf.components.UnmanagedComponent#getSuccessHandler|getSuccessHandler}(success)</li>
     *              </ul>
     *
     * @param {number}   [counter={@link cdf.components.UnmanagedComponent#callCounter|callCounter}] Identifier for the
     *   ajax call being made.
     * @param {function} success Success callback.
     * @param {function} [always] Callback that is run independently of call status.
     * @param {function} [canceled] Callback that is run when the call has been superseeded by a more recent one.
     *   It receives the raw received data.
     * @return {function} Success handler function.
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
        var dataPost;
        if(counter >= this.runCounter) {
          try {
            dataPost = this.postFetchData(data);
            success.call(this, dataPost);
          } catch(ex) {
            this.failExec(ex);
          }
        } else if(canceled) {
          canceled.call(this, data);
        }

        if(typeof always === "function") always.call(this);

        return dataPost;
      }

      return _.bind(fetchDataSuccessHandler, this);
    },

    /**
     * @summary Gets an error handler suitable for use as a {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} error callback or a
     *          try/catch handler.
     * @description <p>Gets an error handler suitable for use as a {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} error callback or a
     *              try/catch handler.</p>
     *              <p>This method returns a `this` free version of the {@link cdf.components.UnmanagedComponent#failExec|failExec} method.</p>
     *
     * @return {cdf.components.UnmanagedComponent#failExec} Error handler.
     */
    getErrorHandler: function() {
      return _.bind(this.failExec, this);
    },

    /**
     * @summary Triggers an error event on the component.
     * @description Triggers an error event on the component. Takes as arguments the error message
     *              and optionally, a `cause` object. It also calls 
     *              {@link cdf.components.UnmanagedComponent#errorNotification|errorNotification}
     *              showing the notification to the user.
     *
     * @param {string} msg          Error message.
     * @param {string} [cause=null] Cause for the error.
     * @fires cdf.event:cdf
     * @fires cdf.components.UnmanagedComponent#event:"cdf:error"
     */
    error: function(msg, cause) {
      if(!msg) {
        msg = this.dashboard.getErrorObj('COMPONENT_ERROR').msg;
      }

      this._maybeUnblock();

      this.errorNotification({msg: msg, error: cause});

      this.trigger("cdf cdf:error", this, msg, cause || null);

      if(cause) {
        Logger.log(cause, "error");
      }
    },

    /**
     * @summary Creates an error notification {@link cdf.dashboard.Popups|popup}.
     * @description Creates an error notification {@link cdf.dashboard.Popups|popup} with the given messages and error.
     *
     * @param {object} err A CDF error object containing `msg` and `error` properties.
     * @param {string} err.msg Error message.
     * @param {string} err.error Cause for the error.
     * @param {jQuery} [ph] DOM element where to display the error notification.
     * @see {@link cdf.dashboard.Dashboard#errorNotification|errorNotification}
     */
    errorNotification: function(err, ph) {
      if(!ph) {
        ph = this.htmlObject ? this.placeholder() : undefined;
      }

      var name = this.name.replace('render_', '');
      err.msg = err.msg + ' (' + name + ')';
      this.dashboard.errorNotification(err, ph);
    },

    /**
     * @summary Trigger UI blocking while the component is updating.
     * @description Trigger UI blocking while the component is updating. Default implementation uses the
     *              global CDF blockUI, but implementers are encouraged to override with per-component
     *              blocking where appropriate (or no blocking at all in components that support it).
     */
    block: function() {
      if(!this.isRunning) {
        this.dashboard.incrementRunningCalls();
        this.isRunning = true;
      }
    },

    /**
     * @summary Trigger UI unblock when the component finishes updating.
     * @description Trigger UI unblock when the component finishes updating. Functionality is defined
     *              as undoing whatever was done in the block method. Should also be overridden in
     *              components that override {@link cdf.components.UnmanagedComponent#block|block}.
     */
    unblock: function() {
      if(this.isRunning) {
        this.dashboard.decrementRunningCalls();
        this.isRunning = false;
      }
    },

    /**
     * @summary Returns `true` if the component's lifecycle is marked as silent.
     * @description Returns `true` if the component's lifecycle is marked as silent. This means that any
     *              step in the lifecycle of the component will not try to block the UI.
     *
     * @return {boolean} `true` if the component should not trigger an UI block when updating.
     */
    isSilent: function() {
      return !!(this.lifecycle && this.lifecycle.silent);
    },

    /**
     * @summary Blocks the UI if it isn't silent.
     * @description Blocks the UI, calling the {@link cdf.components.UnmanagedComponent#block|block}
     *              function if the component execution is not silent.
     *
     * @private
     */
    _maybeBlock: function() {
      if(!this.isSilent()) this.block();
    },

    /**
     * @summary Unblocks the UI if it isn't silent.
     * @description Unblocks the UI, calling the {@link cdf.components.UnmanagedComponent#block|block}
     *              function if the component execution is not silent.
     *
     * @private
     */
    _maybeUnblock: function() {
      if(!this.isSilent()) this.unblock();
    }
  });
});
