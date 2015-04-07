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

define(["cdf/Dashboard.Clean", "cdf/lib/jquery", "amd!cdf/lib/underscore", "cdf/components/FreeformComponent"], function(Dashboard, $, _, FreeformComponent) {

/*
 * Tests on the JS:
 * - name:
 * - location:
 */
describe("Unmanaged Base Component #", function() {

  /**
   * ## Global settings for all suites.
   * #begin
   * - beforeEach
   * - afterEach
   */
  beforeEach(function(done){
    var a = 0;
    setTimeout(function(){
      a = 1;
    }, 50);
    done();
  });

  afterEach(function(done){
    var a = 0;
    setTimeout(function(){
      a = 1;
    }, 50);
    done();
  });
  //#end

  /**
   * ## Setting test data
   * #begin
   */
  var myDashboard = new Dashboard();
  
  
  var basic = window.basic = new FreeformComponent({
    name: "basic",
    type: "freeform",
    testFlag: 0,
    executeAtStart: true,
    preExecution: function() {},
    customfunction: function() {
      this.testFlag = 0x1;
    },
    postExecution: function(){}
  } );

  var freeformQuery = window.freeformQuery = new FreeformComponent({
    name: "freeformQuery",
    type: "freeform",
    testFlag: 0,
    executeAtStart: true,
    manageCallee: false,
    preExecution: function() {},
    customfunction: function() {
      var redraw = _.bind(this.redraw,this);
      this.triggerQuery({
        dataAccessId: "foo",
        path: "bar" 
      }, redraw);
    },
    postFetch: function(d) {return d;},
    redraw: function() {
      this.testFlag=0x2;
    },
    postExecution: function(){}
  } );



  var freeformAjax = window.freeformAjax = new FreeformComponent({
    name: "freeformAjax",
    type: "freeform",
    testFlag: 0,
    executeAtStart: true,
    manageCallee: false,
    preExecution: function() {},
    customfunction: function() {
      var redraw = _.bind(this.redraw,this);
      this.triggerAjax({
        url: "foo",
        type: "json",
        method: "get",
        path: "bar" 
      }, redraw);
    },
    postFetch: function(d) {return d;},
    redraw: function() {
      this.testFlag = 0x4; 
    },
    postExecution: function(){}
  } );

  var componentList = [
    window.basic,
    window.freeformQuery,
    window.freeformAjax
  ];
  myDashboard.addComponents(componentList);
  //#end

  /**
   * ## Unmanaged Base Component # Synchronous Lifecycle #
   */
  describe("Synchronous Lifecycle #", function () {
    /**
     * ## Unmanaged Base Component # Synchronous Lifecycle # Calls each event handler exactly once
     * - event handler: preExecution -> customfunction -> postExecution
     */
    it("Calls each event handler exactly once", function (done) {
      spyOn(basic, 'preExecution').and.callThrough();
      spyOn(basic, 'customfunction').and.callThrough();
      spyOn(basic, 'postExecution').and.callThrough();

      //update
      myDashboard.update(basic);

      var dataToValidate = function() {
        expect(basic.preExecution.calls.count()).toEqual(1);
        expect(basic.postExecution.calls.count()).toEqual(1);
        expect(basic.customfunction.calls.count()).toEqual(1);
        done();
      }

      //Wait 100mms
      setTimeout(dataToValidate, 100);
    });
    /**
     * ## Unmanaged Base Component # Synchronous Lifecycle # Lets preExecution cancel updates
     */
    it("Lets preExecution cancel updates", function(done) {
      spyOn(basic,"preExecution").and.returnValue(false);
      spyOn(basic,"customfunction").and.callThrough();
      spyOn(basic,"postExecution").and.callThrough();

      myDashboard.update(basic);

      var dataToValidate = function() {
          expect(basic.preExecution.calls.count()).toEqual(1);
          expect(basic.postExecution).not.toHaveBeenCalled();
          expect(basic.customfunction).not.toHaveBeenCalled();
          done();
      }

      //Wait 100mms
      setTimeout(dataToValidate, 100);
    });
  });

  /**
   * ## Unmanaged Base Component # Query Lifecycle
   */
  describe("Query Lifecycle #", function() {
    /**
     * ## Unmanaged Base Component # Query Lifecycle # calls each event handler exactly once
     */
    it("Calls each event handler exactly once", function(done) {
      var freeformQueryTemp = freeformQuery;
      spyOn(freeformQueryTemp,"preExecution").and.callThrough();
      spyOn(freeformQueryTemp,"customfunction").and.callThrough();
      spyOn(freeformQueryTemp,"postExecution").and.callThrough();
      spyOn(freeformQueryTemp,"postFetch").and.callThrough();
      spyOn($,"ajax").and.callFake(function(options){
        setTimeout(function(){
          options.success({resultset:[],metadata:[]});
        },100);
      });

      myDashboard.update(freeformQueryTemp);

      var dataToValidate = function(){
        expect(freeformQueryTemp.preExecution.calls.count()).toEqual(1);
        expect(freeformQueryTemp.postExecution.calls.count()).toEqual(1);
        expect(freeformQueryTemp.postFetch.calls.count()).toEqual(1);
        expect(freeformQueryTemp.customfunction.calls.count()).toEqual(1);
        done();
      }

      //Wait 150mms
      setTimeout(dataToValidate, 150);
    });

    /**
     * ## Unmanaged Base Component # Query Lifecycle # Overwrites data from postFetch
     */
    it("Overwrites data from postFetch", function(done) {
      var timeoutmms = 150;
      var freeformQueryTemp = freeformQuery;
      spyOn(freeformQueryTemp,"preExecution");
      spyOn(freeformQueryTemp,"customfunction").and.callThrough();
      spyOn(freeformQueryTemp,"postExecution");
      spyOn(freeformQueryTemp,"postFetch").and.returnValue({test:true});
      spyOn(freeformQueryTemp,"redraw");
      spyOn(freeformQueryTemp,"block").and.callThrough();
      spyOn(freeformQueryTemp,"unblock").and.callThrough();
      spyOn($,"ajax").and.callFake(function(options){
        setTimeout(function(){
          options.success({resultset:[],metadata:[]});
        },100);
      });


      //update
      myDashboard.update(freeformQueryTemp);
      setTimeout(function(){
        //update
        myDashboard.update(freeformQueryTemp);
        setTimeout(dataToValidate,timeoutmms);
      }, timeoutmms);


      //Data to validate
      var dataToValidate = function() {
        var blockCount = freeformQueryTemp.block.calls.count();
        expect(blockCount).toEqual(2);
        expect(freeformQueryTemp.preExecution.calls.count()).toEqual(2);
        expect(freeformQueryTemp.customfunction.calls.count()).toEqual(2);
        expect(freeformQueryTemp.postFetch.calls.count()).toEqual(2);
        expect(freeformQueryTemp.redraw.calls.count()).toEqual(2);
        expect(freeformQueryTemp.redraw.calls.argsFor(0)[0].test).toBeTruthy();
        expect(freeformQueryTemp.postExecution.calls.count()).toEqual(2);
        expect(freeformQueryTemp.unblock.calls.count()).toEqual(blockCount);
        done();
      };
    });

    /**
     * ## Unmanaged Base Component # Query Lifecycle # Doesn't overwrite data if postFetch returns undefined
     */
    it("Doesn't overwrite data if postFetch returns undefined", function(done) {
      var timeoutmms = 150;
      var freeformQueryTemp = freeformQuery;
      spyOn(freeformQueryTemp,"preExecution");
      spyOn(freeformQueryTemp,"customfunction").and.callThrough();
      spyOn(freeformQueryTemp,"postExecution");
      spyOn(freeformQueryTemp,"postFetch").and.returnValue(undefined);
      spyOn(freeformQueryTemp,"redraw");
      spyOn(freeformQueryTemp,"block").and.callThrough();
      spyOn(freeformQueryTemp,"unblock").and.callThrough();
      spyOn($,"ajax").and.callFake(function(options){
        setTimeout(function(){
          options.success({resultset:[],metadata:[]});
        },100);
      });

      //update
      myDashboard.update(freeformQueryTemp);
      setTimeout(function(){
        //update
        myDashboard.update(freeformQueryTemp);
        setTimeout(dataToValidate,timeoutmms);
      }, timeoutmms);

      //Data to validate
      var dataToValidate = function() {
        var blockCount = freeformQueryTemp.block.calls.count();
        expect(blockCount).toEqual(2);
        expect(freeformQueryTemp.preExecution.calls.count()).toEqual(2);
        expect(freeformQueryTemp.customfunction.calls.count()).toEqual(2);
        expect(freeformQueryTemp.postFetch.calls.count()).toEqual(2);
        expect(freeformQueryTemp.redraw.calls.count()).toEqual(2);
        expect(freeformQueryTemp.redraw.calls.argsFor(0)[0].resultset).not.toBeUndefined();
        expect(freeformQueryTemp.postExecution.calls.count()).toEqual(2);
        expect(freeformQueryTemp.unblock.calls.count()).toEqual(blockCount);
        done();
      };
    });
    /**
     * ## Unmanaged Base Component # Query Lifecycle # Only updates once if called concurrently
     */
    it("Only updates once if called concurrently", function(done) {
      var timeoutmms = 150;
      var freeformQueryTemp = freeformQuery;
      spyOn(freeformQueryTemp,"preExecution");
      spyOn(freeformQueryTemp,"customfunction").and.callThrough();
      spyOn(freeformQueryTemp,"postExecution");
      spyOn(freeformQueryTemp,"postFetch").and.callThrough();
      spyOn(freeformQueryTemp,"redraw");
      spyOn(freeformQueryTemp,"block").and.callThrough();
      spyOn(freeformQueryTemp,"unblock").and.callThrough();
      spyOn($,"ajax").and.callFake(function(options){
        setTimeout(function(){
          options.success({resultset:[],metadata:[]});
        },100);
      });

      //update
      myDashboard.update(freeformQueryTemp);
      myDashboard.update(freeformQueryTemp);

      //Data to validate
      var dataToValidate = function() {
        var blockCount = freeformQueryTemp.block.calls.count();
        expect(blockCount).toEqual(1);
        expect(freeformQueryTemp.preExecution.calls.count()).toEqual(1);
        expect(freeformQueryTemp.customfunction.calls.count()).toEqual(1);
        expect(freeformQueryTemp.postFetch.calls.count()).toEqual(1);
        expect(freeformQueryTemp.redraw.calls.count()).toEqual(1);
        expect(freeformQueryTemp.postExecution.calls.count()).toEqual(1);
        expect(freeformQueryTemp.unblock.calls.count()).toEqual(blockCount);
        done();
      }

      setTimeout(dataToValidate,timeoutmms);
    });
    /**
     * ## Unmanaged Base Component # Query Lifecycle # Updates multiple times when not called concurrently
     */
    it("Updates multiple times when not called concurrently", function(done) {
      var timeoutmms = 150;
      var freeformQueryTemp = freeformQuery;
      spyOn(freeformQueryTemp,"preExecution");
      spyOn(freeformQueryTemp,"customfunction").and.callThrough();
      spyOn(freeformQueryTemp,"postExecution");
      spyOn(freeformQueryTemp,"redraw");
      spyOn($,"ajax").and.callFake(function(options){
        setTimeout(function(){
          options.success({resultset:[],metadata:[]});
        },100);
      });

      //update
      myDashboard.update(freeformQueryTemp);
      setTimeout(function(){
        //update
        myDashboard.update(freeformQueryTemp);
        setTimeout(dataToValidate,timeoutmms);
      }, timeoutmms);

      //Data to validate
      var dataToValidate = function() {
        expect(freeformQuery.preExecution.calls.count()).toEqual(2);
        expect(freeformQuery.customfunction.calls.count()).toEqual(2);
        expect(freeformQuery.redraw.calls.count()).toEqual(2);
        expect(freeformQuery.postExecution.calls.count()).toEqual(2);
        done();
      }
    });
    /**
     * ## Unmanaged Base Component # Query Lifecycle # Lets preExecution cancel updates
     */
    it("Lets preExecution cancel updates", function(done) {
      var timeoutmms = 150;
      var freeformQueryTemp = freeformQuery;
      spyOn(freeformQuery,"preExecution").and.returnValue(false);
      spyOn(freeformQuery,"customfunction").and.callThrough();
      spyOn(freeformQuery,"postExecution").and.callThrough();
      spyOn($,"ajax").and.callFake(function(options){
        setTimeout(function(){
          options.success({resultset:[],metadata:[]});
        },100);
      });

      //Update
      myDashboard.update(freeformQuery);

      //Data to validate
      var dataToValidate = function() {
        expect(freeformQuery.preExecution.calls.count()).toEqual(1);
        expect(freeformQuery.customfunction.calls.count()).toEqual(1);
        expect(freeformQuery.postExecution).not.toHaveBeenCalled();
        done();
      }

      setTimeout(dataToValidate,timeoutmms);
    });
  });

  /**
   * ## Unmanaged Base Component # AJAX Lifecycle
   */
  describe("AJAX Lifecycle #", function() {
    /**
     * ## Unmanaged Base Component # AJAX Lifecycle # Calls each event handler exactly once
     */
    it("Calls each event handler exactly once", function(done) {
      var timeoutmms = 150;
      spyOn(freeformAjax,"preExecution").and.callThrough();
      spyOn(freeformAjax,"customfunction").and.callThrough();
      spyOn(freeformAjax,"postExecution").and.callThrough();
      spyOn(freeformAjax,"postFetch").and.callThrough();
      spyOn(freeformAjax,"redraw").and.callThrough();
      spyOn(freeformAjax,"block").and.callThrough();
      spyOn(freeformAjax,"unblock").and.callThrough();
      spyOn($,"ajax").and.callFake(function(options){
        setTimeout(function(){
          options.success({resultset:[],metadata:[]});
        },100);
      });

      //update
      myDashboard.update(freeformAjax);

      //Data to validate
      var dataToValidate = function() {
        expect(freeformAjax.preExecution.calls.count()).toEqual(1);
        expect(freeformAjax.postExecution.calls.count()).toEqual(1);
        expect(freeformAjax.postFetch.calls.count()).toEqual(1);
        expect(freeformAjax.customfunction.calls.count()).toEqual(1);
        expect(freeformAjax.block.calls.count()).toEqual(1);
        expect(freeformAjax.unblock.calls.count()).toEqual(1);
        expect(freeformAjax.redraw.calls.count()).toEqual(1);
        done();
      }

      setTimeout(dataToValidate,timeoutmms);
    });
    /**
     * ## Unmanaged Base Component # AJAX Lifecycle # Only updates once if called concurrently
     */
    it("Only updates once if called concurrently", function(done) {
      var timeoutmms = 150;
      spyOn(freeformAjax,"preExecution");
      spyOn(freeformAjax,"customfunction").and.callThrough();
      spyOn(freeformAjax,"postExecution");
      spyOn(freeformAjax,"postFetch").and.callThrough();
      spyOn(freeformAjax,"redraw");
      spyOn(freeformAjax,"block").and.callThrough();
      spyOn(freeformAjax,"unblock").and.callThrough();
      spyOn($,"ajax").and.callFake(function(options){
        setTimeout(function(){
          options.success({resultset:[],metadata:[]});
        },10);
      });

      //Update
      myDashboard.update(freeformAjax);
      myDashboard.update(freeformAjax);

      //Data to validate
      var dataToValidate = function() {
        var blockCount = freeformAjax.block.calls.count();
        expect(blockCount).toEqual(1);
        expect(freeformAjax.preExecution.calls.count()).toEqual(1);
        expect(freeformAjax.customfunction.calls.count()).toEqual(1);
        expect(freeformAjax.redraw.calls.count()).toEqual(1);
        expect(freeformAjax.postFetch.calls.count()).toEqual(1);
        expect(freeformAjax.postExecution.calls.count()).toEqual(1);
        expect(freeformAjax.unblock.calls.count()).toEqual(blockCount);
        done();
      }

      setTimeout(dataToValidate,timeoutmms);
    });
    /**
     * ## Unmanaged Base Component # AJAX Lifecycle # Lets preExecution cancel updates
     */
    it("Lets preExecution cancel updates", function(done) {
      var timeoutmms = 20;
      spyOn(freeformAjax,"preExecution").and.returnValue(false);
      spyOn(freeformAjax,"customfunction").and.callThrough();
      spyOn(freeformAjax,"redraw");
      spyOn(freeformAjax,"postExecution");
      spyOn($,"ajax").and.callFake(function(options){
        setTimeout(function(){
          options.success({resultset:[],metadata:[]});
        },100);
      });

      //Update
      myDashboard.update(freeformAjax);

      //Data to validate
      var dataToValidate = function() {
        expect(freeformAjax.preExecution.calls.count()).toEqual(1);
        expect(freeformAjax.customfunction.calls.count()).toEqual(1);
        expect(freeformAjax.redraw).not.toHaveBeenCalled();
        expect(freeformAjax.postExecution).not.toHaveBeenCalled();
        done();
      }
      setTimeout(dataToValidate,timeoutmms);
    });
  });


  /**
   * ## Unmanaged Base Component # Plays nicely with postInit
   */
  it("Plays nicely with postInit", function(done) {
    var expectedFlag = 0x7,
        testFlag = 0;
    spyOn($,"ajax").and.callFake(function(options){
      setTimeout(function(){
        options.success({resultset:[],metadata:[]});
      },100);
    });

    setTimeout(function(){
      myDashboard.postInit = function() {
        var i;
        for(i = 0; i < componentList.length;i++) {
          testFlag |= componentList[i].testFlag;
        }
      };
      spyOn(myDashboard, "postInit").and.callThrough();
      myDashboard.init();

      setTimeout(function(){
        expect(testFlag).toEqual(expectedFlag);
        expect(myDashboard.postInit.calls.count()).toEqual(1);
        done();
      }, 500);
    },10);
  });
});

});