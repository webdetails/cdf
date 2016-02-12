/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
   * The constructor of an unmanaged component.
   *
   * @class cdf.components.UnmanagedComponent
   * @extends cdf.components.BaseComponent
   * @amd cdf/components/UnmanagedComponent
   * @classdesc <p>The <code>UnmanagedComponent</code> is an advanced version of the
   * {@link cdf.components.BaseComponent|BaseComponent} that allows control over the core CDF lifecycle for
   * implementing components.</p>
   * <p>It should be used as the base class for all components that desire to implement an asynchronous lifecycle, as CDF
   * cannot otherwise ensure that the {@link cdf.components.UnmanagedComponent#postExec|postExecution} callback is
   * correctly handled.</p>
   *
   * <h2>CDF Async Developer's Guide</h2>
   *
   * <p>CDF now supports proper, asynchronous, AJAX calls for all its querying. The following is a guide to converting
   * old components and dashboards to the new async style, and developing new ones based on asynchronous querying.</p>
   *
   * <h2>Rationale</h2>
   *
   * <p>The first step to understanding the changes in the async patch is understanding the CDF component lifecycle.
   * When a component is updated, the basic update lifecycle looks like this:</p>
   *
   * <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; update -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution}</code></pre>
   *
   * <p>Usually, though, there will be a call to a data source, with a subsequent call to
   * {@link cdf.components.UnmanagedComponent#postFetchData|postFetch}, and only then is the component rendered:</p>
   *
   * <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; update -&gt; {@link cdf.components.UnmanagedComponent#beginQuery|query} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; redraw -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution}</code></pre>
   *
   * <p>This is a more typical lifecycle, and one that has some important limitations. First,
   * {@link cdf.components.UnmanagedComponent#preExec|preExecution} and
   * {@link cdf.components.UnmanagedComponent#postExec|postExecution} are entirely the responsibility of CDF itself,
   * rather than the component. Because CDF has no control over the contents of the update method, it has no way of
   * ensuring that, should the component execute an asynchronous query,
   *  {@link cdf.components.UnmanagedComponent#postExec|postExecution} only runs after redraw. In this case, you're
   * likely to see this instead:</p>
   *
   * <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; update -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution} -&gt; {@link cdf.components.UnmanagedComponent#beginQuery|query} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; redraw</code></pre>
   *
   * <p>Which breaks the contract for {@link cdf.components.UnmanagedComponent#postExec|postExecution} running after
   * the component is done updating. The solution here is that the component itself must take control of
   *  {@link cdf.components.UnmanagedComponent#postExec|postExecution}, while keeping the burden of implementing the
   * lifecycle in CDF rather than passing it to the component developer. On a related topic,
   *  {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} has become a de facto standard part of the
   * lifecycle, yet its implementation was left to the component implementers, which leads to a fairly large amount of
   * boilerplate code.</p>
   *
   * <p>Our objective here was to retool the base component so as to deal with both of these issues, thus allowing
   * queries to be performed asynchronously while reducing the developer effort involved in creating a component.</p>
   *
   *
   * <h2>Component Execution Order and Priority</h2>
   *
   * <p>There are no major changes in the way components behave. There is, however an important caveat - since all
   * components (that have been converted) will be executed simultaneously, we can no longer rely on the order of
   * execution. </p>
   *
   * <p>There's now an additional property named <em>{@link cdf.components.UnmanagedComponent#priority|priority}</em>.
   * The {@link cdf.components.UnmanagedComponent#priority|priority} of component execution, defaulting to 5. The lower
   * the number, the higher {@link cdf.components.UnmanagedComponent#priority|priority} the component has. Components
   * with the same {@link cdf.components.UnmanagedComponent#priority|priority} with be executed simultaneously. Useful
   * in places where we need to give higher {@link cdf.components.UnmanagedComponent#priority|priority} to filters or
   * other components that need to be executed before other components.</p>
   *
   * <p>This way there's no longer the need to use dummy parameters and postChange tricks to do, for instance, cascade
   * prompts.</p>
   *
   *
   * <h2>Backward Compatibility and Changes</h2>
   *
   * <p>We did a big effort in order to maintain backward compatibility, but some care has to be taken. What we do is
   * assume that if components have no {@link cdf.components.UnmanagedComponent#priority|priority}, we give them a
   * sequential value, trying to emulate the old behavior. It's recommended that proper priorities are set in order to
   * take advantage of the new improvements.</p>
   *
   * <p>If using <em>CDE</em>, please note that if you edit a dashboard and save it, <strong>all components will have a
   * default priority of 5</strong>. This may break the old behavior. If you need to change a dashboard, make sure you
   * tweak the priorities, if needed.</p>
   *
   *
   * <h2>Developing Components</h2>
   *
   * <p>Components desiring to use asynchronous queries should inherit from the new <code>UnmanagedComponent</code>,
   * instead of {@link cdf.components.BaseComponent|BaseComponent}. The <code>UnmanagedComponent</code> base class
   * provides pre-composed methods that implement the core lifecycle, for a variety of different scenarios:</p>
   *
   * <ul>
   * <li><code>{@link cdf.components.UnmanagedComponent#synchronous|synchronous}</code>: implements a synchronous lifecycle identical to the core CDF lifecycle.</li>
   * <li><code>{@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery}</code>: implements a simple interface to a lifecycle built around Query objects.</li>
   * <li><code>{@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}</code>: implements a simple interface to a lifecycle built around AJAX calls.</li>
   * </ul>
   *
   * <p>Since all these lifecycle methods expect a callback that handles the actual component rendering, it's
   * conventional style to have that callback as a method of the Component, called <code>redraw</code>. It's also
   * considered standard practice to use <code>Function#bind</code> or <code>_.bind</code> to ensure that, inside the
   * <code>redraw</code> callback, <code>this</code> points to the component itself.</p>
   *
   * <h3>Use <code>synchronous</code> If Your Component Doesn't Use External Data</h3>
   *
   * <p>Components that don't use any external data at all can continue subclassing
   * {@link cdf.components.BaseComponent|BaseComponent} without any change of functionality. However, for the sake of
   * consistency (or because you want querying to be optional -- see the section for details), you can use subclass
   * <code>UnmanagedComponent</code> and use the
   * <code>{@link cdf.components.UnmanagedComponent#synchronous|synchronous}</code> lifecycle method to emulate
   * {@link cdf.components.BaseComponent|BaseComponent}'s behaviour:</p>
   *
   * <pre><code>
   *   update: function() {
   *     this.synchronous(this.redraw);
   *   }
   * </code></pre>
   *
   * <p>If you want to pass parameters to <code>redraw</code>, you can pass them as an array to
   * <code>{@link cdf.components.UnmanagedComponent#synchronous|synchronous}</code>:</p>
   *
   * <pre><code>
   *   update: function() {
   *     // Will call this.redraw(1, 2, 3)
   *     this.synchronous(this.redraw, [1, 2, 3]);
   *   }
   * </code></pre>
   *
   * <h3>Use <code>{@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery}</code> When You Want Your
   * Component To Use CDA/Query Objects</h3>
   *
   * <p>If you're using a CDA data source, you probably want to use
   * <code>{@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery}</code> to handle the component
   * lifecycle for you. <code>{@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery}</code> expects at a
   * minimum a query definition and a <code>redraw</code> callback to process the query results. The query definition
   * is an object of the form:</p>
   *
   * <pre><code>
   *   {
   *     dataAccessId: 'myQuery',
   *     file: '/path/to/my/datasourceDefinition.cda'
   *   }
   * </code></pre>
   *
   * <p>Typically, if you're using CDE, these properties will be added to one of either
   * <code>this.queryDefinition</code> or <code>this.chartDefinition</code> so you can just use this pattern:</p>
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
   * <p>As the lifecycle methods are completely self-contained, you can switch between them at will, deciding on an
   * appropriate lifecycle at runtime. A common pattern (used e.g. in <code>SelectComponent</code>, and the
   * <code>CccComponent</code> family) is exposing a <code>valuesArray</code> property, and using static data if
   * <code>valuesArray</code> is provided, or a query if it is not. Using <code>UnmanagedComponent</code>, this
   * convention would look like this:</p>
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
   *
   * @param {object} properties An object with the properties to extend the UnmanagedComponent instance.
   */
  return BaseComponent.extend(/** @lends cdf.components.UnmanagedComponent# */{
    /**
     * Managed flag.
     *
     * @type {boolean}
     * @default false
     */
    isManaged: false,

    /**
     * Running flag.
     *
     * @type {boolean}
     * @default false
     */
    isRunning: false,

    /**
     * Priority of a component in the cdf execution cycle.
     *
     * @name cdf.components.UnmanagedComponent#priority
     * @type {number}
     * @default 5
     */
    //priority: 5,

    /**
     * <p>Handles calling `preExecution` when it exists.</p>
     * <p>All components extending UnmanagedComponent should either use one
     * of the three lifecycles declared in this class (<code>{@link cdf.components.UnmanagedComponent#synchronous|synchronous} -&gt; {@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery} -&gt; {@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}</code>)
     * or call this method explicitly at the very earliest opportunity.</p>
     * <p>If `preExecution` returns a falsy value, component execution should be cancelled as close to
     * immediately as possible.</p>
     *
     * @return {boolean} `false` if component execution should be cancelled, `true` otherwise.
     * @fires cdf.event:cdf
     * @fires cdf.components.BaseComponent#event:"cdf:preExecution"
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
     * <p>Handles calling `postExecution` when it exists./p>
     * <p>All components extending UnmanagedComponent should either use one of the three lifecycles declared in this class
     * (<code>{@link cdf.components.UnmanagedComponent#synchronous|synchronous} -&gt; {@link cdf.components.UnmanagedComponent#triggerQuery|triggerQuery} -&gt; {@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}</code>),
     * or call this method explicitly immediately before yielding control back to CDF.</p>
     *
     * @fires cdf.event:cdf
     * @fires cdf.components.BaseComponent#event:"cdf:postExecution"
     */
    postExec: function() {
      if(typeof this.postExecution === "function") {
        this.postExecution();
      }

      this.trigger('cdf cdf:postExecution', this);
    },

    /**
     * Handles calling `postFetch`, when it exists, and of triggering the {@link event:cdf.postFetch|postFetch} event.
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
     * Draws a tooltip, if one is defined in the component options.
     */
    drawTooltip: function() {
      if(this.htmlObject && this.tooltip) {
        this._tooltip = typeof this.tooltip == "function" ? this.tooltip() : this.tooltip;
      }
    },

    /**
     * Shows a tooltip attached to the component, if one is defined in the `_tooltip` option.
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
     * <p>Begins execution of the component.</p>
     * <p>This method handles calling {@link cdf.components.UnmanagedComponent#preExec|preExecution} and blocking the
     * UI, if necessary.</p>
     * <p>A component that actually begins execution, by returning `true` from this method, should later complete the
     * lifecycle by calling either {@link cdf.components.UnmanagedComponent#endExec|endExec} or
     * {@link cdf.components.UnmanagedComponent#failExec|failExec}.</p>
     *
     * @return {boolean} `false` if component execution should be cancelled, `true` otherwise.
     */
    beginExec: function() {
      var exec = this.preExec();
      if(exec) {
        this._maybeBlock();
      }
      return exec;
    },

    /**
     * <p>Fails execution of the component, given an error object or the arguments of a
     * {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} error callback.</p>
     * This method handles parsing, signaling and logging of the error and unblocking the UI, if necessary.
     *
     * @param {object|*} arg An error object or the arguments of a {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} error callback.
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
     * <p>Ends a successful execution of the component.</p>
     * This method handles drawing and showing the component's tooltip, if any, calling
     * {@link cdf.components.UnmanagedComponent#postExec|postExec} and unblocking the UI, if necessary.
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
     * <p>Generic execute method that handles {@link cdf.components.UnmanagedComponent#preExec|preExecution} and
     * {@link cdf.components.UnmanagedComponent#postExec|postExecution} lifecycle tasks.</p>
     * <p>The specified _callback_ function handles the component's
     * core execution. If execution is not cancelled by the
     * {@link cdf.components.UnmanagedComponent#preExec|preExecution} handler, it is called synchronously, from within
     * a call to this method.
     * If it throws an error, it is like if {@link cdf.components.UnmanagedComponent#failExec|failExec} had been called
     * with that error.</p>
     * <p>This method is sugar for the following common pattern:</p>
     *
     *     if(this.beginExec()) {
     *       try {
     *         callback.call(this);
     *       } catch(ex) {
     *         this.failExec(ex);
     *       }
     *     }
     *
     * @param {function} callback The function to execute.
     *   This function receives two arguments:
     *   1. resolve - call this function to signal that core execution has ended.
     *   2. reject  - called, optionally with a cause value (an `Error` object),
     *        to signal that an error occurred during core execution.
     *
     * This function is called with this component as the `this` context.
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
     * The synchronous lifecycle handler closely resembles the core CDF lifecycle, and is provided as an alternative
     * for components that desire the option to alternate between a synchronous and asynchronous style lifecycles
     * depending on external configuration (e.g. if it can take values from either a static array or a query). It takes
     * the component drawing method as a callback.
     *
     * @param {function} callback Component drawing method.
     * @param {object[]} [arg=[]] Argument for the callback.
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
     * <p>The triggerQuery lifecycle handler builds a lifecycle around Query objects.
     * Execution ends immediately after the call to the specified callback.</p>
     * It takes a query definition object that is passed directly into the Query constructor, and the component
     * rendering callback, and implements the lifecycle:</p>
     * <p><pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; {@link cdf.components.UnmanagedComponent#block|block} (optional) -&gt; {@link cdf.components.UnmanagedComponent#block|block} -&gt; {@link cdf.queries.BaseQuery#fetchData|fetchData} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; callback -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution} -&gt; {@link cdf.components.UnmanagedComponent#unblock|unblock} (optional)</code></pre></p>
     * <p>This method detects concurrent updates to the component and ensures that only the redraw of the most recent
     * update is performed. {@link UnmanagedComponent#endExec|endExec} is called after the <code>callback</code>
     * execution.</p>
     *
     * @param {cdf.QueryDefinition} queryDef     The query definition object.
     * @param {function}            callback     Callback to run after query has ran. It receives the fetched data as an argument.
     * @param {object}              queryOptions User options for the query
     */
    triggerQuery: function(queryDef, callback, queryOptions) {
      this.beginQuery(queryDef, function(data) {
        callback(data);
        this.endExec();
      }, queryOptions);
    },

    /**
     * <p>The beginQuery lifecycle handler implements the begin phase of a lifecycle around Query objects.</p>
     * <p>It implements the lifecycle:
     * <pre></code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; {@link cdf.components.UnmanagedComponent#block|block} (optional) -&gt; {@link cdf.components.UnmanagedComponent#block|block} -&gt; {@link cdf.queries.BaseQuery#fetchData|fetchData} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; callback </code></pre></p>
     * <p>Ending the execution, is the responsibility of the specified callback,
     * by calling {@link cdf.components.UnmanagedComponent#endExec|endExec} (resulting in:</p>
     * <p><code>{@link cdf.components.UnmanagedComponent#postExec|postExecution} -&gt; {@link cdf.components.UnmanagedComponent#unblock|unblock} (optional) or {@link cdf.components.UnmanagedComponent#failExec|failExec}</code>).</p>
     *
     * @param {object}   queryDef     The query definition object.
     * @param {function} callback     Callback to run after query has ran.
     * @param {object}   queryOptions User options for the query.
     */
    beginQuery: function(queryDef, callback, queryOptions) {
      this.execute(function() {
        var query = this._setQuery(queryDef, queryOptions);

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
     * <p>The triggerAjax lifecycle handler builds a lifecycle around generic AJAX calls.
     * It implements the lifecycle:
     * <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; {@link cdf.components.UnmanagedComponent#block|block} (optional) -&gt; {@link cdf.components.UnmanagedComponent#block|block} -&gt; {@link cdf.queries.BaseQuery#fetchData|fetchData} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; render -&gt; {@link cdf.components.UnmanagedComponent#postExec|postExecution} -&gt; {@link cdf.components.UnmanagedComponent#unblock|unblock} (optional)</code></pre></p>
     * <p>After the call to the <code>render callback</code>, the event {@link event:cdf.render|render} is fired, and then the execution ends.</p>
     * triggerAjax can be used with either of the following call conventions:
     * <ul>
     *   <li>{@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}(url, params, callback);</li>
     *   <li>{@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}({url: url, data: params, ...}, callback);</li>
     *   <li>{@link cdf.components.UnmanagedComponent#triggerAjax|triggerAjax}({url: url, data: params, ...}, callback, ajaxParameters);</li>
     * </ul>
     * In the second case, you can add any other {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} parameters you desire to the
     * object, but <code>callback</code> will take control over the success and error callbacks.
     * If passed, the supplied _ajaxParameters_ will be passed to the default ajax call.
     *
     * @param {(string|Object)} url                 URL to call.
     * @param {string}          url.url             URL to call.
     * @param {object}          url.params          Parameters for the call.
     * @param {object}          [params]            Parameters for the call.
     * @param {function}        callback            Render callback, called with the response data.
     * @param {object}          [ajaxParameters={}] Parameters specific to the ajax call definition.
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
     * <p>The beginAjax lifecycle handler implements the begin phase of a lifecycle based on generic AJAX calls.
     * It implements the lifecycle:
     * <pre><code>{@link cdf.components.UnmanagedComponent#preExec|preExecution} -&gt; {@link cdf.components.UnmanagedComponent#block|block} (optional) -&gt; {@link cdf.components.UnmanagedComponent#block|block} -&gt; {@link cdf.queries.BaseQuery#fetchData|fetchData} -&gt; {@link cdf.components.UnmanagedComponent#postFetchData|postFetch} -&gt; {@link cdf.components.UnmanagedComponent~beginAjaxCb|callback}</code></pre></p>
     * Ending the execution, is the responsibility of the specified callback, by calling
     * {@link cdf.components.UnmanagedComponent#endExec|endExec}, resulting in: <code>{@link cdf.components.UnmanagedComponent#postExec|postExec} -&gt; {@link cdf.components.UnmanagedComponent#unblock|unblock} (optional) or {@link cdf.components.UnmanagedComponent#failExec|failExec} </code>.
     *
     * @param {object}  ajaxParameters Parameters for {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax},
     *   including, at a minimum, the `url` option. {@link cdf.components.UnmanagedComponent#beginAjax|beginAjax} will
     *   take control over the `success` and `error` callbacks, and default `async` to `true`.
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
     * Creates and sets the component's current query given its definition, and, optionally, query options.
     *
     * @param {object} queryDef The query definition object.
     * @param {object} [queryOptions] Query options object.
     * @param {object} [queryOptions.ajax] Options passed to {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax}.
     *   The {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} options _data_, _url_, _error_ and _success_ are reserved.
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
     * Increment the call counter, so we can keep track of the order in which requests were made.
     *
     * @return {number} The incremented counter.
     */
    callCounter: function() {
      return ++this.runCounter;
    },


    /**
     * <p>Build a generic response handler that runs the success callback when being called in response to the most recent
     * AJAX request that was triggered for this component (as determined by comparing counter and this.runCounter),
     * and always calls the always callback. If the counter is not provided, it'll be generated automatically.</p>
     * Accepts the following calling conventions:
     * - {@link cdf.components.UnmanagedComponent#getSuccessHandler|getSuccessHandler}(counter, success, always)
     * - {@link cdf.components.UnmanagedComponent#getSuccessHandler|getSuccessHandler}(counter, success)
     * - {@link cdf.components.UnmanagedComponent#getSuccessHandler|getSuccessHandler}(success, always)
     * - {@link cdf.components.UnmanagedComponent#getSuccessHandler|getSuccessHandler}(success)
     *
     * @param {number}   [counter={@link cdf.components.UnmanagedComponent#callCounter|callCounter}] Identifier for the
     *   ajax call being made.
     * @param {function} success Success callback.
     * @param {function} [always] Callback that is ran independently of call status.
     * @param {function} [canceled] Callback that is ran when the call has been superseeded by a more recent one.
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
     * <p>Gets an error handler suitable for use as a {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} error callback or a
     * try/catch handler.</p>
     * <p>This method returns a `this` free version of the {@link cdf.components.UnmanagedComponent#failExec|failExec}
     * method.</p>
     *
     * @return {cdf.components.UnmanagedComponent#failExec} Error handler.
     */
    getErrorHandler: function() {
      return _.bind(this.failExec, this);
    },

    /**
     * Trigger an error event on the component. Takes as arguments the error message and, optionally, a `cause` object.
     *
     * @param {string} msg          Error message.
     * @param {string} [cause=null] Cause for the error.
     * @fires cdf.event:cdf
     * @fires cdf.components.BaseComponent#event:"cdf:error"
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
     * Triggers an error notification.
     *
     * @param {object} err A CDF error object containing `msg` and `error` properties.
     * @param {string} err.msg Error message.
     * @param {string} err.error Cause for the error.
     * @param {HtmlElement} [ph={@link cdf.components.UnmanagedComponent#placeholder|placeholder()}|undefined] HTML
     *   element where to display the error notification.
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
     * Trigger UI blocking while the component is updating. Default implementation uses the global CDF blockUI, but
     * implementers are encouraged to override with per-component blocking where appropriate (or no blocking at all in
     * components that support it).
     */
    block: function() {
      if(!this.isRunning) {
        this.dashboard.incrementRunningCalls();
        this.isRunning = true;
      }
    },

    /**
     * Trigger UI unblock when the component finishes updating. Functionality is defined as undoing whatever was done
     * in the block method. Should also be overridden in components that override
     * {@link cdf.components.UnmanagedComponent#block|block}.
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
     * @return {boolean} _true_ if the component should not trigger an UI block when updating.
     */
    isSilent: function() {
      return !!(this.lifecycle && this.lifecycle.silent);
    },

    /**
     * Blocks the UI if it isn't silent.
     *
     * @private
     */
    _maybeBlock: function() {
      if(!this.isSilent()) this.block();
    },

    /**
     * Unblocks the UI if it isn't silent.
     *
     * @private
     */
    _maybeUnblock: function() {
      if(!this.isSilent()) this.unblock();
    }
  });

});
