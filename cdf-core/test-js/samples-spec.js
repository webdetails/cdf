/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
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

define(["cdf/Dashboard.Clean", "cdf/lib/jquery", "amd!cdf/lib/underscore", "cdf/components/BaseComponent", "cdf/components/UnmanagedComponent"],
    function(Dashboard, $, _, BaseComponent, UnmanagedComponent) {


var HelloBaseComponent = BaseComponent.extend({
  update: function() {
    $("#" + this.htmlObject).text("Hello World!");
    this.myFunction();
  }
});

HelloUnmanagedComponent = UnmanagedComponent.extend({
  update: function() {
    var render = _.bind(this.render, this);
    this.synchronous(render);
  },

  render: function() {
    $("#" + this.htmlObject).text("Hello World!");
    this.myFunction();
  }
});

HelloQueryBaseComponent = BaseComponent.extend({
  update: function() {
    var myself = this;
    var query = new Query(myself.queryDefinition);
    query.fetchData(myself.parameters, function(values) {
      var changedValues = undefined;
      if((typeof(myself.postFetch)=='function')){
        changedValues = myself.postFetch(values);
      }
      if (changedValues !== undefined) {
        values = changedValues;
      }
      myself.render(values);
    });
  },

  render: function(data) {
    $("#" + this.htmlObject).text(JSON.stringify(data));
  }
});

HelloQueryUnmanagedComponent = UnmanagedComponent.extend({
  update: function() {
    var render = _.bind(this.render,this);
    this.triggerQuery(this.queryDefinition, render);
  },

  render: function(data) {
    $("#" + this.htmlObject).text(JSON.stringify(data));
  }
});





    /**
     * ## Unmanaged Component Samples #
     */
    describe("Unmanaged Component Samples #", function() {
      var myDashboard = new Dashboard();
    
      var mhello = window.mhello = new HelloBaseComponent({
        name: "mhello",
        type: "HelloBase",
        testFlag: 0,
        htmlObject: 'mhello',
        executeAtStart: true,
        myFunction: function(){}
      });
    
      var uhello = window.uhello = new HelloUnmanagedComponent({
        name: "uhello",
        type: "HelloUnmanaged",
        htmlObject: 'uhello',
        executeAtStart: true,
        myFunction: function(){}
      });
    
      var mquery = window.mquery = new HelloQueryBaseComponent({
        name: "mquery",
        type: "HelloQueryBase",
        htmlObject: 'mquery',
        executeAtStart: true,
        queryDefinition: {
          path: "",
          dataAccessId: ""
        }
      });
    
      var uquery = window.uquery = new HelloQueryUnmanagedComponent({
        name: "uquery",
        type: "HelloQueryUnmanaged",
        htmlObject: 'uquery',
        executeAtStart: true,
        queryDefinition: {
          path: "",
          dataAccessId: ""
        }
      });
    
      var componentList = [
        window.mhello,
        window.uhello
        //mquery,
        //uquery
      ];
    
      myDashboard.addComponents(componentList);
      describe("dasda", function(){
        /**
         * ## Unmanaged Component Samples # updates components
         */
        it("Updates components",function(done){
          spyOn(mhello, 'myFunction');
          spyOn(uhello, 'myFunction');
    
          //update all components of this test 'mhello', 'uhelllo'
          myDashboard.update(componentList);
    
          //Data To Validate
          var dataToValidate = function() {
            expect(mhello.myFunction.calls.count()).toEqual(1);
            expect(uhello.myFunction.calls.count()).toEqual(1);
            done();
          }
    
          setTimeout(dataToValidate, 100);
        });
      });
    });

});
