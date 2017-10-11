/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  './Dashboard',
  'amd!../lib/backbone',
  '../lib/mustache',
  '../Logger',
  '../lib/jquery'
], function(Dashboard, Backbone, Mustache, Logger, $) {

  /**
   * @class cdf.dashboard."Dashboard.components"
   * @amd cdf/dashboard/Dashboard.components
   * @summary A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *          class for handling components.
   * @classdesc A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *            class for handling components. It defines the methods used to interact
   *            with the components array. These components are instances of
   *            {@link cdf.components.BaseComponent|BaseComponent}.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{
    /**
     * @summary Array which stores all components in the dashboard.
     * @description Array of instances of {@link cdf.components.BaseComponent|BaseComponents} in the dashboard.
     *
     * @type {Array<cdf.components.BaseComponent>}
     * @protected
     */
    components: [],

    /**
     * @summary Initializes the components array with an empty array.
     * @description Method used by the Dashboard constructor for components initialization.
     *
     * @private
     */
    _initComponents: function() {
      this.components = [];
    },

    /**
     * @summary Gets the component instance from a given name.
     * @description <p>Gets the component given a string representing the component's name.</p>
     *              <p>This method iterates over the components array and searches for the component with the name
     *              used as the argument. If the component with that name is not found, then `undefined` is returned.</p>
     *
     * @param {String} name The component's name.
     * @return {cdf.components.BaseComponent} The instance of {@link cdf.components.BaseComponent|BaseComponent} with the given name.
     * @return {undefined} If an instance of {@link cdf.components.BaseComponent|BaseComponent} with the given name is not found in the components array.
     * @example
     *   var myComponent = myDashboard.getComponent("myInputComponent");
     */
    getComponent: function(name) {
      if(!name || typeof name !== "string") {
        Logger.warn('getComponent: invalid component name');
        return;
      }
      for(var i in this.components) {
        if(this.components[i].name === name) {
          return this.components[i];
        }
      }
    },

    /**
     * @summary Alias for {@link cdf.dashboard.Dashboard#getComponent|getComponent}.
     * @description Alias for {@link cdf.dashboard.Dashboard#getComponent|getComponent}.
     */
    getComp: function(name) {
      return this.getComponent(name);
    },

    /**
     * @summary Alias for {@link cdf.dashboard.Dashboard#getComponent|getComponent}.
     * @description Alias for {@link cdf.dashboard.Dashboard#getComponent|getComponent}.
     */
    getComponentByName: function(name) {
      return this.getComponent(name);
    },

    /**
     * @summary Adds an array of component instances to the dashboard.
     * @description <p>Adds one or more components to the dashboard. If a component was already added,
     *              it will not be replaced.</p>
     *              <p>It iterates through the array and calls
     *              {@link cdf.dashboard.Dashboard#addComponent|addComponent} for each component.</p>
     *              <p>Along with the {@link cdf.dashboard.Dashboard#addComponent|addComponent}
     *              behaviour, if a component in the array fails to be added to the dashboard
     *              instance, an error is thrown and the execution stops.</p>
     *
     * @param {Array<cdf.components.BaseComponent>} components The array of components to be added.
     * @throws {Error} Error if a component in the array is invalid or was already added.
     * @see {@link cdf.dashboard.Dashboard#addComponent|addComponent}
     */
    addComponents: function(components) {
      if(!$.isArray(components)) {
        Logger.warn('addComponents: components in a structure other than an array will not be added');
        return;
      }
      components.forEach(function(component) {
        this.addComponent(component);
      }, this);
    },

    /**
     * @summary Adds an instance of a component to the dashboard.
     * @description <p>Adds an instance of {@link cdf.components.BaseComponent|BaseComponent} to the dashboard
     *              components array if it was not already added.<p>
     *              <p>If the `component` does not have a valid property `component.name`, or if the property is not
     *              a valid string, an exception is thrown.</p>
     *              <p>The <code>options</code> parameter is optional and when it is absent, the component is added
     *              to the end of the components array. The same rule is applied if `options.index` is false.
     *              If not, the new component is appended to the array at position `options.index`.</p>
     * @param {cdf.components.BaseComponent} component The new component to be added.
     * @param {Object} [options] An option object.
     * @param {Number} [options.index] The index at which to add the component.
     * @return {cdf.dashboard.Dashboard} The dashboard instance where the component was added.
     * @throws {Error} The component is invalid.
     * @throws {Error} The component already exists in the dashboard instance.
     */
    addComponent: function(component, options) {
      // validate new component's name
      if(!component || !component.name) {
        Logger.error("addComponent: invalid component");
        throw new Error("addComponent: invalid component");
      }

      // check if a component with the same name exists
      var existing = this.getComponentByName(component.name);
      if(existing) {
        // check if it is a different component
        if(existing !== component) {
          Logger.error("addComponent: duplicate component name '" + component.name + "'");
          throw new Error("addComponent: duplicate component name '" + component.name + "'");
        }
        return this;
      }

      // Attempt to convert over to component implementation
      this._bindControl(component);

      var index = options && options.index,
          L = this.components.length;
      // validate the index
      if(index == null || index < 0 || index >= L) {
        this.components.push(component);
      } else {
        this.components.splice(index, 0, component);
      }
      return this;
    },

    /**
     * @summary Gets the index of a component.
     * @description <p>Get the index of the array `components` that contains the component.</p>
     *              <p>If `compOrNameOrIndex` is a `string`, it searches the component that first matches such name.
     *              If `compOrNameOrIndex` is a `number`, it returns component index on the components array.
     *              Lastly, if `compOrNameOrIndex` is a component instance, it returns the index where it is in
     *              `components` array.</p>
     *
     * @param {cdf.components.BaseComponent|string|number} compOrNameOrIndex
     *        The name, index, or the component to search.
     * @return {number} The index where the component is at or `-1` if not found.
     */
    getComponentIndex: function(compOrNameOrIndex) {
      if(compOrNameOrIndex != null) {
        switch(typeof compOrNameOrIndex) {
          case 'string':
            for(var i = 0, cs = this.components, L = cs.length ; i < L ; i++) {
              if(cs[i].name === compOrNameOrIndex) { return i; }
            }
            break;
          case 'number':
            if(compOrNameOrIndex >= 0 && compOrNameOrIndex < this.components.length) {
              return compOrNameOrIndex;
            }
            break;
          default:
            return this.components.indexOf(compOrNameOrIndex);
        }
      }
      return -1;
    },

    /**
     * @summary Removes a component from the `components` array.
     * @description <p>Removes a component from the `components` array, calling
     *              {@link cdf.dashboard.Dashboard#getComponentIndex|getComponentIndex} to retrieve the correct
     *              component. Additionally, all the cdf events are removed, returning the component instance
     *              removed.</p>
     *              <p>If argument is a {@link cdf.components.BaseComponent|BaseComponent} instance that
     *              exists in the `components` array, it will be removed. If `compOrNameOrIndex` is a string,
     *              the first component with such name is removed from the `components` array. The other case is
     *              if `compOrNameOrIndex` is a number. In this scenario, the component in such a position in
     *              the `components` array is removed.</p>
     *
     * @param {cdf.components.BaseComponent|string|number} compOrNameOrIndex The component object,
     *   the name of the component, or the index of the component to be removed.
     * @return {cdf.components.BaseComponent} The removed component.
     * @return {undefined} The component was not found.
     * @see {@link cdf.dashboard.Dashboard#getComponentIndex|getComponentIndex}
     */
    removeComponent: function(compOrNameOrIndex) {
      var index = this.getComponentIndex(compOrNameOrIndex);
      if(index === -1) {
        Logger.warn("removeComponent: component not found");
        return;
      }

      var comp = this.components[index];
      this.components.splice(index, 1);
      comp.dashboard = null;

      comp.off('cdf:postExecution');
      comp.off('cdf:preExecution');
      comp.off('cdf:error');
      comp.off('all');

      return comp;
    },

    /**
     * @summary Bind the control of a given component to the current dashboard instance
     * if none was previously bound.
     * @description Bind the control of a given component to the current dashboard instance
     * if none was previously bound.
     *
     * @private
     * @param {cdf.components.BaseComponent} control The target component.
     * @return {cdf.components.BaseComponent} The target component.
     */
    _bindControl: function(control) {

      if(!control.dashboard) {
        control.dashboard = this;
        // Add logging lifeCycle
        this._addLogLifecycleToControl(control);
      }
      return control;
    },

    /**
     * @summary Bind the control of a given component to the current dashboard instance.
     * @description Bind the control of a given component to the current dashboard instance
     *              if none was previously bound. Sets the priority of the component if none exists.
     *
     * @private
     * @param {cdf.components.BaseComponent} control The target component.
     * @return {cdf.components.BaseComponent} The target component.
     * @deprecated
     */
    _bindExistingControl: function(control /*, Class*/) {
      if(!control.dashboard) {
        control.dashboard = this;
        delete control.initInstance;

        // Ensure BaseComponent's methods
        //this._castControlToComponent(control, Class);

        // Make sure we clean all events in the case we're redefining the control.
        if(typeof control.off === "function") { control.off("all"); }

        // Endow it with the Backbone event system.
        if(!control.on) { $.extend(control, Backbone.Events); }

        // Add logging lifeCycle
        this._addLogLifecycleToControl(control);

        // For legacy dashboards, we'll automatically assign some priority for component execution.
        if(control.priority == null || control.priority === "") {
          control.priority = this.legacyPriority++;
        }
      }

      return control;
    },

    /**
     * @summary Casts a component to a new component class type.
     * @description Casts a component to a new component class type.
     *
     * @private
     * @param {cdf.components.BaseComponent} control The target component.
     * @param {Object} Class The new class to cast the component to.
     * @deprecated
     */
    _castControlToClass: function(control, Class) {
      if(!(control instanceof Class)) {
        var controlImpl = this._makeInstance(Class);

        // Copy implementation into control
        $.extend(control, controlImpl);
      }
    },

    /**
     * @summary Gets the class name of a given component.
     * @description Gets the class name of a given component.
     *
     * @private
     * @param {cdf.components.BaseComponent} control The target component.
     * @return {Object}
     * @deprecated
     */
    _getControlClass: function(control) {
      // see if there is a class defined for this control
      var typeName = control.type;
      if(typeof typeName === 'function') { typeName = typeName.call(control); } // <=> control.type() ; the `this` in the call is `control`

      var TypeName = typeName.substring(0, 1).toUpperCase() + typeName.substring(1);

      // try _TypeComponent_, _type_ and _Type_ as class names
      var typeNames = [TypeName + 'Component', typeName, TypeName];

      for(var i = 0, N = typeNames.length ; i < N ; i++) {
        // TODO: window represents access to the JS global object.
        // This, or a special object on which to eval types, should be provided by some FWK.

        // If the value of a name is not a function, keep on trying.
        var Class = window[typeNames[i]];
        if(Class && typeof Class === 'function') { return Class; }
      }
      // return undefined;
    },

    /**
     * @summary Creates a new component of a given class type.
     * @description Creates a new component of a given class type. Allows to set default properties
     *              for the component instance.
     *
     * @private
     * @param {Object} Class The component class object.
     * @param {Object} args The component properties.
     * @return {cdf.components.BaseComponent} The new component instance.
     * @deprecated
     */
    _makeInstance: function(Class, args) {
      var o = Object.create(Class.prototype);
      if(args) { Class.apply(o, args); } else { Class.apply(o); }
      return o;
    },

    /**
     * @summary Extend control with BaseComponent methods.
     * @description Extend control with BaseComponent methods, if it's not an instance of it.
     *              Also, avoid extending if `Class` was already applied and it is a subclass of
     *              {@link cdf.components.BaseComponent|BaseComponent}.
     *
     * @private
     * @param {Object} control The target component.
     * @param {cdf.components.BaseComponent} Class The target component class object.
     * @deprecated
     */
    _castControlToComponent: function(control, Class) {
      if(!(control instanceof BaseComponent)
        && (!Class || !(Class.prototype instanceof BaseComponent))) {

        var baseProto = BaseComponent.prototype;
        for(var p in baseProto) {
          if(baseProto.hasOwnProperty(p)
            && (control[p] === undefined)
            && (typeof baseProto[p] === 'function')) {

            switch(p) {
              // Exceptions
              case 'base':
                break;

              // Copy
              default:
                control[p] = baseProto[p];
                break;
            }
          }
        }
      }
    },

    /**
     * @summary Binds a callback function to the provided `control` component for debugging.
     * @description Binds a callback function to the provided `control` component using the special
     * Backbone {@link http://backbonejs.org/#Events-catalog|all} event that will be
     * triggered whenever any event is triggered. The callback will log a message, using
     * the {@link cdf.Logger|Logger} class, whenever an event is triggered. The only
     * exceptions are if the event triggered is the {@link cdf.event:cdf|cdf} event, if
     * {@link cdf.dashboard.Dashboard#logLifecycle|logLifeCycle} is `false` or if the
     * component is a `PostInitMarker`.
     *
     * @private
     * @param {cdf.components.BaseComponent} control The target component.
     */
    _addLogLifecycleToControl: function(control) {
      // TODO: Could the _typeof console !== "undefined"_ test be made beforehand,
      // to avoid always installing the catch-all handler?
      // The same could be said for the _this.logLifecycle_ test.
      // To still allow changing the value dynamically, a dashboard.setLogLifecycle(.) method could be provided.

      // Add logging lifeCycle
      control.on("all", function(e) {
        var dashs = this.dashboard;
        if(dashs && dashs.logLifecycle && e !== "cdf"
          && this.name !== "PostInitMarker"
          && typeof console !== "undefined") {

          var eventStr;
          var eventName = e.substr(4);
          switch(eventName) {
            case "preExecution":  eventStr = ">Start"; break;
            case "postExecution": eventStr = "<End  "; break;
            case "error":         eventStr = "!Error"; break;
            default:              eventStr = "      "; break;
          }

          var timeInfo = Mustache.render("Timing: {{elapsedSinceStartDesc}} since start, {{elapsedSinceStartDesc}} since last event", this.splitTimer());
          Logger.log("          [Lifecycle " + eventStr + "] " + this.name + " [" + this.type + "]"  + " (P: " + this.priority + " ): " +
            eventName + " " + timeInfo + " (Running: "+ this.dashboard.runningCalls  + ")", "log", "color: " + this.getLogColor());
        }
      });
    }
  });

});
