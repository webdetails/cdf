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

define(["cdf/Dashboard", "cdf/lib/jquery", "cdf/lib/underscore", "cdf/components/ManagedFreeformComponent"],
  function(Dashboard, $, _, FreeformComponent) {

    /**
     * ## The CDF framework
     */
    describe("The CDF framework #", function() {
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
    
    
      var myDashboard = new Dashboard();
    
      /*
       * Our setup consists of adding a bunch of components to CDF.
       */
      myDashboard.init();
      var shouldUpdate = new FreeformComponent(myDashboard, {
        name: "shouldUpdate",
        type: "managedFreeform",
        preExecution: function() {},
        customfunction: function() {},
        postExecution: function(){}
      });


      var shouldNotUpdate =  new FreeformComponent(myDashboard, {
        name: "shouldNotUpdate",
        type: "managedFreeform",
        preExecution: function() {return false;},
        customfunction: function() {},
        postExecution: function(){}
      });
    
        
    
      myDashboard.addComponents([shouldUpdate, shouldNotUpdate]);
    
      /************************
       * Test Core Lifecycle  *
       ************************/
      /**
       * ## The CDF framework # Updates Components
       */
      it("Updates Components",function(done) {
        spyOn(shouldUpdate,"preExecution").and.callThrough();
        spyOn(shouldUpdate,"customfunction").and.callThrough();
        spyOn(shouldUpdate,"postExecution").and.callThrough();
    
        //Update
        myDashboard.update(shouldUpdate);
    
        //Data to validate
        var dataToValidate = function(){
          expect(shouldUpdate.preExecution).toHaveBeenCalled();
          expect(shouldUpdate.postExecution).toHaveBeenCalled();
          expect(shouldUpdate.customfunction).toHaveBeenCalled();
          done();
        };
    
        setTimeout(dataToValidate, 100);
      });
      /**
       * ## The CDF framework # Lets preExecution cancel updates
       */
      it("Lets preExecution cancel updates",function(done) {
        spyOn(shouldNotUpdate,"preExecution").and.callThrough();
        spyOn(shouldNotUpdate,"customfunction").and.callThrough();
        spyOn(shouldNotUpdate,"postExecution").and.callThrough();
    
        //Update
        myDashboard.update(shouldNotUpdate);
    
        //Data to validate
        var dataToValidate = function(){
          expect(shouldNotUpdate.preExecution).toHaveBeenCalled();
          expect(shouldNotUpdate.postExecution).not.toHaveBeenCalled();
          expect(shouldNotUpdate.customfunction).not.toHaveBeenCalled();
          done();
        };
    
        setTimeout(dataToValidate, 100);
      });

      /**
       * ## The CDF framework # Triggers postInit when all components have finished rendering
       */
     it("Triggers postInit when all components have finished rendering", function(done) {
       spyOn(myDashboard, "_handlePostInit");
    
       myDashboard.waitingForInit = null;
       myDashboard.finishedInit = false;
       myDashboard.init();
    
       //Data to validate
       var dataToValidate = function(){
         expect(myDashboard._handlePostInit).toHaveBeenCalled();
         done();
       };
    
       setTimeout(dataToValidate, 500);
      })
    });

});
