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

define(['../lib/underscore', './UnmanagedComponent'], function (_, UnmanagedComponent) {

	var ActionComponent = UnmanagedComponent.extend({
	  _docstring: function (){
	    return "Abstract class for components calling a query/endpoint";
	    /**
	       By default, uses a UnmanagedComponent.synchronous() lifecycle.
	       Methods/properties defined in CDE for all child classes:

	       this.actionDefinition (datasource used to trigger the action)
	       this.actionParameters (parameters to be passed to the datasource)
	       this.successCallback(data)
	       this.failureCallback()

	       Each descendant is expected to override this.render()

	       Notes:
	       - in this.actionParameters, static values should be quoted, in order to survive the "eval" in this.dashboard.getParameterValue

	    */
	  },

	  update: function () {
	    /**
	       Entry-point of the component, manages the actions. Follows a synchronous cycle by default.
	    */
	    var render = _.bind(this.render, this);
	    if( _.isUndefined(this.manageCallee) || this.manageCallee) {
	      this.synchronous(render);
	    } else {
	      render();
	    }

	  },

	  triggerAction: function () {
	    /**
	       Calls the endpoint, passing any parameters.
	       This method is typically bound to the "click" event of the component.
	    */
	    var params = this.dashboard.propertiesArrayToObject( this.actionParameters ),
	        failureCallback =  (this.failureCallback) ?  _.bind(this.failureCallback, this) : function (){},
	        successCallback = this.successCallback ?  _.bind(this.successCallback, this) : function (){};

	    return this.dashboard.getQuery(this.actionDefinition).fetchData(params, successCallback, failureCallback);
	  },

	  hasAction: function(){
	    /**
	       Detect if the endpoint associated with the Action is defined
	    */
	    if ( ! this.actionDefinition ){
	      return false;
	    }
	    if (this.dashboard.detectQueryType){
	      return !! this.dashboard.detectQueryType(this.actionDefinition);
	    } else {
	      return !! this.actionDefinition.queryType && this.dashboard.hasQuery(this.actionDefinition.queryType);
	    }
	  }
	});

    return ActionComponent;

});