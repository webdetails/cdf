/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


define([
  "cdf/Dashboard.Clean",
  "cdf/components/ButtonComponent",
  "cdf/lib/jquery"
], function(Dashboard, ButtonComponent, $) {

  /**
   * ## The Button Component
   */
  describe("The Button Component #", function() {

    /**
     * ## Global settings for all suites.
     * #begin
     * - beforeEach
     */
    var dashboard;
    var buttonComponent = new ButtonComponent({
      name: "buttonComponent",
      type: "button",
      listeners: ["productLine", "territory"],
      htmlObject: "sampleObjectButton",
      label: "A button",
      executeAtStart: true,
      preChange: function() { return true; },
      postChange: function() { return true; },
      successCallback: function() {},
      failureCallback: function() {},
      tooltip: "My first dashboard"
    });
    var $htmlContainer = $("<div>");
    var $htmlObject = $("<div />").attr("id", buttonComponent.htmlObject);

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
      dashboard.addDataSource("buttonQuery", {
        dataAccessId: "myDataSource",
        path: "/public/CDF-236/CDF-236.cda"
      });
      // add an element where the button will be inserted
      $htmlContainer.append($htmlObject);
      $("body").append($htmlContainer);
    });

    afterEach(function() {
      $htmlObject.remove();
      $htmlContainer.remove();
    });

    /**
     * ## The Button Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      dashboard.addComponent(buttonComponent);
      
      spyOn(buttonComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      buttonComponent.once("cdf:postExecution", function() {
        expect(buttonComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(buttonComponent);
    });

    /*
     * ## The Button Component # disables the button after it has been clicked
     */
    it("disables the button after it has been clicked", function(done) {
      var $btn;
      // create a new button with an expression based on the base buttonComponent
      var buttonComponentExpr = $.extend({}, buttonComponent);

      spyOn(buttonComponentExpr, 'update').and.callThrough();

      dashboard.addComponent(buttonComponentExpr);

      // listen to cdf:postExecution event
      buttonComponentExpr.once("cdf:postExecution", function() {
        expect(buttonComponentExpr.update).toHaveBeenCalled();

        // make sure expression executes after postExecution being triggered and button clicked
        buttonComponentExpr.expression = function() {
          expect($btn.attr('disabled')).toEqual('disabled');
          expect($btn.css('opacity')).toEqual('0.5');
          done();
        };
        $btn = $('div#' + buttonComponentExpr.htmlObject + ' > button');
        $btn.click();
      });

      dashboard.update(buttonComponentExpr);
    });

    /*
     * ## The Button Component # re-enables the button after the expression has executed when clicked
     */
    it("re-enables the button after the expression has executed when clicked", function(done) {
      // create a new button with an expression based on the base buttonComponent
      var buttonComponentExpr = $.extend({}, buttonComponent);
      buttonComponentExpr.expression = function() { };

      spyOn(buttonComponentExpr, 'update').and.callThrough();
      spyOn(buttonComponentExpr, 'expression').and.callThrough();

      dashboard.addComponent(buttonComponentExpr);

      // listen to cdf:postExecution event
      buttonComponentExpr.once("cdf:postExecution", function() {
        expect(buttonComponentExpr.update).toHaveBeenCalled();

        spyOn(buttonComponentExpr, 'enable').and.callFake(function() {
          expect(buttonComponentExpr.expression).toHaveBeenCalled();
          done();
        });

        $('div#' + buttonComponentExpr.htmlObject + ' > button').click();
      });

      dashboard.update(buttonComponentExpr);
    });

    /*
     * ## The Button Component # runs the expression when clicked
     */
    it("runs the expression when clicked", function(done) {
      // create a new button with an expression based on the base buttonComponent
      var buttonComponentExpr = $.extend({}, buttonComponent, {
        expression: function() {
          return true;
        }
      });

      spyOn(buttonComponentExpr, 'update').and.callThrough();
      spyOn(buttonComponentExpr, 'expression').and.callFake(function() {
        expect(buttonComponentExpr.expression).toHaveBeenCalled();
        done();
      });

      dashboard.addComponent(buttonComponentExpr);

      // listen to cdf:postExecution event
      buttonComponentExpr.once("cdf:postExecution", function() {
        expect(buttonComponentExpr.update).toHaveBeenCalled();
        $('div#' + buttonComponentExpr.htmlObject + ' > button').click();
      });

      dashboard.update(buttonComponentExpr);
    });

    /*
     * ## The Button Component # disables the button after it has been pressed and re-enables it after executing the action
     */
    it("disables the button after it has been pressed and re-enables it after executing the action", function(done) {
      var $btn;
      // create a new button with an expression based on the base buttonComponent
      var buttonComponentAct = $.extend({}, buttonComponent, {
        actionDefinition: {dataSource: "buttonQuery"},
        successCallback: function() {
          // this callback function will be called after the closure successCallback function
          // enables the button
          expect($btn.attr('disabled')).toEqual(undefined);
          expect($btn.css('opacity')).toEqual('1');
          done();
        }
      });

      spyOn(buttonComponentAct, 'triggerAction').and.callFake(function() {
        expect($btn.attr('disabled')).toEqual('disabled');
        // explicitly call the successCallback
        buttonComponentAct.successCallback();
      });

      spyOn(buttonComponentAct, 'update').and.callThrough();

      dashboard.addComponent(buttonComponentAct);

      // listen to cdf:postExecution event
      buttonComponentAct.once("cdf:postExecution", function() {
        expect(buttonComponentAct.update).toHaveBeenCalled();
        $btn = $('div#' + buttonComponentAct.htmlObject + ' > button');
        $btn.click();
      });

      dashboard.update(buttonComponentAct); 
    });

    /*
     * ## The Button Component # re-enables the button in error case after executing the action
     */
    it("re-enables the button in error case after executing the action", function(done) {
      var $btn;
      // create a new button with an expression based on the base buttonComponent
      var buttonComponentAct = $.extend({}, buttonComponent, {
        actionDefinition: {dataSource: "buttonQuery"},
        failureCallback: function() {
          // this callback function will be called after the closure failureCallback function
          // enables the button
          expect($btn.attr('disabled')).toEqual(undefined);
          expect($btn.css('opacity')).toEqual('1');
          done();
        }
      });

      spyOn(buttonComponentAct, 'triggerAction').and.callFake(function() {
        expect($btn.attr('disabled')).toEqual('disabled');
        // explicitly call the failureCallback
        buttonComponentAct.failureCallback();
      });

      spyOn(buttonComponentAct, 'update').and.callThrough();

      dashboard.addComponent(buttonComponentAct);

      // listen to cdf:postExecution event
      buttonComponentAct.once("cdf:postExecution", function() {
        expect(buttonComponentAct.update).toHaveBeenCalled();
        $btn = $('div#' + buttonComponentAct.htmlObject + ' > button');
        $btn.click();
      });

      dashboard.update(buttonComponentAct); 
    });
  });
});
