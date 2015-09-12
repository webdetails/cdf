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


define(['./Dashboard', 'amd!../lib/backbone', '../lib/mustache', '../Logger', '../lib/jquery'],
  function(Dashboard, Backbone, Mustache, Logger, $) {
  /**
   * A module representing an extension to the Dashboard module for components.
   *
   * @module Dashboard.components
   */
  Dashboard.implement({
  
    /**
     * Method used by the Dashboard constructor for components initialization.
     *
     * @method _initComponents
     * @for Dashboard
     * @private
     */
    _initComponents: function() {
      this.components = [];
    },
  
    /**
     * Gets the component with a given name.
     *
     * @method getComponent
     * @for Dashboard
     * @param name of the component
     * @return the component or undefined if it does not exists
     */
    getComponent: function(name) {
      if(!name) { return; }
      for(var i in this.components) {
        if(this.components[i].name == name) {
          return this.components[i];
        }
      }
    },
  
    /**
     * Alias for {{#crossLink "Dashboard/getComponent:method"}}getComponent{{/crossLink}}.
     *
     * @method getComp
     * @for Dashboard
     * @param name of the component
     * @return the component or undefined if it does not exists
     */
    getComp: function(name) {
      return this.getComponent(name);
    },
  
    /**
     * Alias for {{#crossLink "Dashboard/getComponent:method"}}getComponent{{/crossLink}}.
     *
     * @method getComponentByName
     * @for Dashboard
     * @param name of the component
     * @return the component or undefined if it does not exists
     */
    getComponentByName: function(name) {
      return this.getComponent(name);
    },
  
    /**
     * Adds a set of components.
     *
     * @method addComponents
     * @for Dashboard
     * @param components to add
     */
    addComponents: function(components) {
      if(!$.isArray(components)) { 
        Logger.warn('addComponents: components in a structure other than an array will not be added!');
        return;
      }
      components.forEach(function(component) {
        this.addComponent(component);
      }, this);
    },
  
    /**
     * Add a component.
     *
     * @method addComponent
     * @for Dashboard
     * @param component to add
     * @param options to append to the component
     */
    addComponent: function(component, options) {
      this.removeComponent(component);
  
      // Attempt to convert over to component implementation
      this._bindControl(component);
  
      var index = options && options.index;
      var L = this.components.length;
      if(index == null || index < 0 || index > L) { index = L; } // <=> push
      this.components[index] = component;
    },
  
    /**
     * Gets a component given a name or a index.
     *
     * @method getComponentIndex
     * @for Dashboard
     *
     * @param compOrNameOrIndex
     * @return component index
     */
    getComponentIndex: function(compOrNameOrIndex) {
      if(compOrNameOrIndex != null) {
        switch(typeof compOrNameOrIndex) {
          case 'string':
            for(var i = 0, cs = this.components, L = cs.length ; i < L ; i++) {
              if(cs[i].name === compOrNameOrIndex) { return i; }
            }
            break;
          case 'number': //really?
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
     * Remove a component.
     *
     * @method removeComponent
     * @for Dashboard
     * @param compOrNameOrIndex
     * @return the component removed
     */
    removeComponent: function(compOrNameOrIndex) {
      var index = this.getComponentIndex(compOrNameOrIndex);
      var comp = null;
      if(index >= 0) {
        var cs = this.components;
        comp = cs[index];
        cs.splice(index, 1);
        comp.dashboard = null;
  
        comp.off('cdf:postExecution');
        comp.off('cdf:preExecution');
        comp.off('cdf:error');
        comp.off('all');
      }
  
      return comp;
    },
  
    /**
     *
     * @method _bindControl
     * @param control
     * @private
     * @return {*}
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
     *
     * @method _bindExistingControl
     * @param control
     * @param Class
     * @private
     * @return {*}
     *
     * @deprecated
     */
    _bindExistingControl: function(control, Class) {
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
     *
     * @method _castControlToClass
     * @param control
     * @param Class
     * @private
     */
    _castControlToClass: function(control, Class) {
      if(!(control instanceof Class)) {
        var controlImpl = this._makeInstance(Class);
  
        // Copy implementation into control
        $.extend(control, controlImpl);
      }
    },
  
    /**
     *
     * @method _getControlClass
     * @param control
     * @return {*}
     * @private
     */
    _getControlClass: function(control) {
      // see if there is a class defined for this control
      var typeName = control.type;
      if(typeof typeName === 'function') { typeName = typeName.call(control); } // <=> control.type() ; the _this_ in the call is _control_
  
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
     *
     * @method _makeInstance
     * @param Class
     * @param args
     * @return {Class}
     * @private
     */
    _makeInstance: function(Class, args) {
      var o = Object.create(Class.prototype);
      if(args) { Class.apply(o, args); } else { Class.apply(o); }
      return o;
    },
  
    /**
     *
     * @method _castControlToComponent
     * @param control
     * @param Class
     * @private
     */
    _castControlToComponent: function(control, Class) {
      // Extend control with BaseComponent methods, if it's not an instance of it.
      // Also, avoid extending if _Class_ was already applied
      // and it is a subclass of BaseComponent.
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
     *
     * @method _addLogLifecycleToControl
     * @param control
     * @private
     */
    _addLogLifecycleToControl: function(control) {
      // TODO: Could the _typeof console !== "undefined"_ test be made beforehand,
      // to avoid always installing the catch-all handler?
      // The same could be said for the _this.logLifecycle_ test.
      // To still allow changing the value dynamically, a Dashboards.setLogLifecycle(.) method could be provided.
  
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
