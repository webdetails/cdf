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

define(["cdf/Dashboard.Clean", "cdf/components/ButtonComponent", "cdf/lib/jquery"],
  function(Dashboard, ButtonComponent, $) {

  /**
   * ## The Button Component
   */
  describe("The Button Component #", function() {

    var dashboard;
    var buttonComponent;
    
    /**
     * ## Global settings for all suites.
     * #begin
     * - beforeEach
     */

    dashboard = new Dashboard();
    dashboard.init();
      
    buttonComponent = new ButtonComponent({
      name: "buttonComponent",
      type: "button",
      listeners: ["productLine", "territory"],
      htmlObject: "sampleObject",
      label: "A button",
      //expression: function() { this.setLabel('Yes, a clickable button'); },
      executeAtStart: true,
      preChange: function() { return true; },
      postChange: function() { return true; },
      successCallback: function(data) {},
      failureCallback: function() {},
      tooltip: "My first dashboard",
      // actionDefinition:  {
      //   dataAccessId: "myDataSource",
      //   path: "/public/CDF-236/CDF-236.cda"
      // }
    });
    
    // add an element where the button will be inserted    
    $htmlObject = $('<div />').attr('id', buttonComponent.htmlObject);
    $('body').append($htmlObject);

    dashboard.addComponent(buttonComponent);
   


    /**
     * ## The Button Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      
      spyOn(buttonComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      buttonComponent.once("cdf:postExecution", function() {
        expect(buttonComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(buttonComponent);
    });


    /*
     * ## The Button Component # is disabled after being pressed 
     */
    it("disables the button after it has been pressed", function(done) {
      
      // create a new button with an expression based on the base buttonComponent
      var buttonComponentExpr = buttonComponent.extend({
        expression: function() { 
			this.setLabel('Yes, a clickable button'); 
		}
      });

      dashboard.update(buttonComponentExpr);

	  var btn = $('button');			
		
	  buttonComponentExpr.expression = function() {
		expect(btn.attr('disabled')).toEqual('disabled');
		expect(btn.css('opacity')).toEqual('0.5');
	  }
		
	  btn.click();	  
	  done();
    });
	
	
	/*
     * ## The Button Component # is disabled after being pressed 
     */
    it("re-enables the button after the expression has executed", function(done) {
      
      // create a new button with an expression based on the base buttonComponent
      var buttonComponentExpr = buttonComponent.extend({
        expression: function() { 
			this.setLabel('Yes, a clickable button'); 
		}
      });

      dashboard.update(buttonComponentExpr);

	  buttonComponentExpr.once("cdf:postExecution", function() {
		  var btn = $('button');
		  
		  expect(btn.attr('disabled')).toEqual(undefined);
          expect(btn.css('opacity')).toEqual('1');
	  });
		
	  $('button').click();
	  done();
    });


    /*
     * ## The Button Component # is disabled after being pressed and re-enabled 
     *    on the execution of the callback using an action
     */
    it("disables the button after it has been pressed and re-enables it after executing the action", function(done) {
     
      // create a new button with an expression based on the base buttonComponent
      var buttonComponentAct = buttonComponent.extend({
        actionDefinition:  {
          dataAccessId: "myDataSource",
          path: "/public/CDF-236/CDF-236.cda"
        }
      });

      dashboard.update(buttonComponentAct);

      buttonComponentAct.once("cdf:postExecution", function() {

        spyOn(buttonComponentAct, "triggerAction").and.callFake(function(params) {
          var btn = $('button');

          expect(btn.attr('disabled')).toEqual('disabled');
          buttonComponentAct.successCallback();        
          expect(btn.attr('disabled')).toEqual(undefined);
          expect(btn.css('opacity')).toEqual('1');
          done();
        });

        $('button').click();
      });  
    });


    it("re-enables the button in error case after executing the action", function(done) {
      
      // create a new button with an expression based on the base buttonComponent
      var buttonComponentAct = buttonComponent.extend({
        actionDefinition:  {
          dataAccessId: "myDataSource",
          path: "/public/CDF-236/CDF-236.cda"
        }
      });

      dashboard.update(buttonComponentAct);

      buttonComponentAct.once("cdf:postExecution", function() {

        spyOn(buttonComponentAct, "triggerAction").and.callFake(function(params) {
          var btn = $('button');

          expect(btn.attr('disabled')).toEqual('disabled');
          buttonComponentAct.failureCallback();        
          expect(btn.attr('disabled')).toEqual(undefined);
          expect(btn.css('opacity')).toEqual('1');
          done();
        });

        $('button').click();
      });
    })
  });
});
