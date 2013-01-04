CSS: style.css

# CDF Async Developer's Guide

## Introduction

CDF now supports proper, asynchronous, AJAX calls for all its querying. The
following is a guide to converting old components and dashboards to the new
async style, and developing new ones based on asynchronous querying.

## Rationale

The first step to understanding the changes in the async patch is understanding
the CDF component lifecycle. When a component is updated, the basic update
lifecycle looks like this:

    preExecution -> update -> postExecution

Usually, though, there will be a call to a data source, with a subsequent call
to postFetch, and only then is the component rendered:

    preExecution -> update -> query -> postFetch -> redraw -> postExecution

This is a more typical lifecycle, and one that has some important limitations.
First, preExeuction and postExecution are entirely the responsibility of CDF
itself, rather than the  component. Because CDF has no control over the contents
of the update method, it has no way of ensuring that, should the component
execute an asynchronous query, postExecution only runs after redraw. In this
case, you're likely to see this instead:

    preExecution -> update -> postExecution -> query -> postFetch -> redraw

Which breaks the contract for postExecution running after the component is done
updating. The solution here is that the component itself must take control of
postExecution, while keeping the burden of implementing the lifecycle in CDF
rather than passing it to the component developer. On a related topic, postFetch
has become a de facto standard part of the lifecycle, yet its implementation was
left to the component implenters, which leads to a fairly large amount of
boilerplate code.

Our objective here was to retool the base component so as to deal with both
of these issues, thus allowing queries to be performed asynchronously while 
reducing the developer effort involved in creating a component.


## Component execution order and Priority

There are no major changes in the way components behave. There is, however an
important caveat - since all components (that have been converted) will be
executed simultaneously, we can no longer rely on the order of execution. 

There's now an additional property named *priority*. The priority of component
execution, defaulting to 5. The lower the number, the higher priority the
component has. Components with same priority with be executed simultaneously.
Useful in places where we need to give higher priority to filters or other
components that need to be executed before other components.

This way there's no longer the need to use dummy parameters and postChange
tricks to do, for instance, cascade prompts.


## Backward compatibility and changes

We did a big effort in order to maintain backward compatibility, but some care
has to be taken. What we do is assume that if components have no priority, we
give them a sequential value, trying to emulate the old behavior. It's
recommended that proper priorities are set in order to take advantage of the new
improvements.

If using *CDE*, please note that if you edit a dashboard and save it, **all
components will have a default priority of 5**. This may break the old behavior.
If you need to change a dashboard, make sure you tweak the priorities, if
needed.


## Developing Components

Components desiring to use asynchronous queries should inherit from the new
UnmanagedComponent, instead of BaseComponent. The UnmanagedComponent base class
provides pre-composed methods that implement the core lifecycle, for a variety
of different scenarios:

  * `synchronous` implements a synchronous lifecycle identical to the core
    CDF lifecycle.
  * `triggerQuery` implements a simple interface to a lifecycle built around
    Query objects.
  * `triggerAjax` implements a simple interface to a lifecycle built around
    AJAX calls.

Since all these lifecycle methods expect a callback that handles the actual
component rendering, it's conventional style to have that callback as a method
of the Component, called `redraw`. It's also considered standard practice to
use `Function#bind` or `_.bind` to ensure that, inside the `redraw` callback,
`this` points to the component itself.

### Use `synchronous` If Your Component Doesn't Use External Data

Components that don't use any external data at all can continue subclassing
BaseComponent without any change of functionality. However, for the sake of
consistency (or because you want querying to be optional -- see the section for
details), your can use subclass UnmanagedComponent and use the `synchronous`
lifecycle method to emulate BaseComponent's behaviour:

    update: function() {
      this.synchronous(this.redraw);
    }

If you want to pass parameters to `redraw`, you can pass them as an array to
`synchronous`:

    update: function() {
      /* Will call this.redraw(1,2,3) */
      this.synchronous(this.redraw, [1,2,3]);
    }

### Use `triggerQuery` When You Want Your Component To Use CDA/Query Objects

If you're using a CDA data source, you probably want to use `triggerQuery` to
handle the component lifecycle for you. `triggerQuery` expects at a minimum
a query definition and a redraw callback to process the query results. The
query definition is an object of the form:

    {
      dataAccessId: 'myQuery',
      file: '/path/to/my/datasourceDefinition.cda'
    }

Typically, if you're using CDE, these properties will be added to one of either
`this.queryDefinition` or `this.chartDefinition` so you can just use this
pattern:

    update: function() {
      var redraw = _.bind(this.redraw,this);
      this.synchronous(this.queryDefinition, redraw);
    }


### Alternating Between Static And Query-Based Data

As the lifecycle methods are completely self-contained, you can switch between
them at will, deciding on an appropriate lifecycle at runtime. A common pattern
(used e.g. in SelectComponent, and the CccComponent family) is exposing a
`valuesArray` property, and using static data if `valuesArray` is provided, or
a query if it is not. Using UnmanagedComponent, this convention would like like
this:

    update: function() {
      var redraw = _.bind(this.redraw,this);
      if(this.valuesArray && this.valuesArray.length > 0) {
        this.synchronous(redraw,this.valuesArray);
      } else {
        this.triggerQuery(this.queryDefinition,redraw);
      }
    }


### Rolling Your Own

If you prefer having absolute control over your component, you can eschew the
use of any of the lifecycle methods. Instead, you're expected to follow these
guidelines:

  * Call `this.preExec()` as soon as possible, and bail out if it returns false.
  * If `this.preExec()` returned true, call `this.block()` before any meaningful
    amount of work is done.
  * If you called `this.block()`, make sure to always call `this.unblock()` as
    well once all relevant work is done.
  * If you want to use any sort of AJAX, consider using 
  * Call `this.postExec()` once all 
  * You can override `this.block` and `this.unblock` to implement component
    specific UI blocking. If you override either, you *must* override the other
    as well.


## New and Changed Features

### Component Cloning

If your component holds any references to other components, you need to override
the `clone` method so as to ensure that you don't accidentally clone the target
component. For example, if your component has a property named `otherComponent`
pointing at another component, you should override `clone` using this general
template:

    clone: function(parameterRemap,componentRemap,htmlRemap) {
      var other = this.otherComponent;
      delete this.otherComponent;
      var that = this.base(parameterRemap,componentRemap,htmlRemap);
      this.otherComponent = that.otherComponent = other;
      return that;
    }

### New Base Component Class: UnmanagedComponent

UnmanagedComponent is a new base class for components. It provides the base on
which all asynchronous components should be built.

### Per-Component `isManaged` Flag

Each component should have a member property with isManaged, indicating whether
CDF should managed the component's lifecycle. Components where `isManaged` is 
false need to implement
