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
  "cdf/Dashboard.Clean",
  "cdf/lib/jquery",
  "amd!cdf/lib/underscore",
  "cdf/components/FreeformComponent"
], function(Dashboard, $, _, FreeformComponent) {

  /**
   * ## Freeform Component
   */
  describe("Freeform Component #", function() {
    var dashboard;
    var componentForTestValidation;
    var basic;
    var freeformQuery;
    var freeformAjax;
    
    /**
     * ## Global settings for all suites.
     * #begin
     * - beforeEach
     */
    beforeEach(function() {
      dashboard = new Dashboard();

      /**
       * ## Setting test data
       * #begin
       */
          // this component is used to validate if preExecution returning false cancels updates
          // should have the lowest priority allowing it to be executed last
      componentForTestValidation = new FreeformComponent({
            name: "componentForTestValidation",
            type: "freeform",
            testFlag: 0,
            executeAtStart: true,
            priority: 999,
            preExecution: function() {},
            customfunction: function() {},
            postExecution: function() {}
          });

      basic = new FreeformComponent({
        name: "basic",
        type: "freeform",
        testFlag: 0,
        executeAtStart: true,
        preExecution: function() {},
        customfunction: function() { this.testFlag = 0x1; },
        postExecution: function() {}
      });

      freeformQuery = new FreeformComponent({
        name: "freeformQuery",
        type: "freeform",
        testFlag: 0,
        executeAtStart: true,
        manageCallee: false,
        preExecution: function() {},
        customfunction: function() {
          var redraw = _.bind(this.redraw, this);
          this.triggerQuery({
            dataAccessId: "foo",
            path: "bar"
          }, redraw);
        },
        postFetch: function(d) { return d; },
        redraw: function() { this.testFlag = 0x2; },
        postExecution: function() {}
      });

      freeformAjax = new FreeformComponent({
        name: "freeformAjax",
        type: "freeform",
        testFlag: 0,
        executeAtStart: true,
        manageCallee: false,
        preExecution: function() {},
        customfunction: function() {
          var redraw = _.bind(this.redraw, this);
          this.triggerAjax({
            url: "foo",
            type: "json",
            method: "get",
            path: "bar"
          }, redraw);
        },
        postFetch: function(d) { return d; },
        redraw: function() { this.testFlag = 0x4; },
        postExecution: function() {}
      });

      //#end
    });
    //#end

    /**
     * ## Freeform Component # plays nicely with postInit
     */
    it("plays nicely with postInit", function(done) {
      var componentList = [basic, freeformQuery, freeformAjax];

      dashboard.addComponents(componentList);

      var expectedFlag = 0x7,
          testFlag = 0;

      dashboard.postInit = function() {
        for(var i = 0; i < componentList.length; i++) {
          testFlag |= componentList[i].testFlag;
        }

        expect(testFlag).toEqual(expectedFlag);
        expect(dashboard.postInit.calls.count()).toEqual(1);
        done();
      };

      spyOn(dashboard, "postInit").and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.success({resultset: [], metadata: []});
      });

      dashboard.init();
    });

    /**
     * ## Freeform Component # Synchronous Lifecycle #
     */
    describe("Synchronous Lifecycle #", function() {

      /**
       * ## Global settings for all suites.
       * #begin
       * - beforeEach
       */
      beforeEach(function() {
        dashboard.init()
        dashboard.addComponent(basic);
      });
      //#end
      
      /**
       * ## Freeform Component # Synchronous Lifecycle # calls each event handler exactly once
       * - event handler: preExecution -> customfunction -> postExecution
       */
      it("calls each event handler exactly once", function(done) {
        spyOn(basic, 'update').and.callThrough();
        spyOn(basic, 'preExecution').and.callThrough();
        spyOn(basic, 'customfunction').and.callThrough();
        spyOn(basic, 'postExecution').and.callThrough();

        // listen to cdf:postExecution event
        basic.once("cdf:postExecution", function() {
          expect(basic.update).toHaveBeenCalled();
          expect(basic.preExecution.calls.count()).toEqual(1);
          expect(basic.postExecution.calls.count()).toEqual(1);
          expect(basic.customfunction.calls.count()).toEqual(1);
          done();
        });

        dashboard.update(basic);
      });

      /**
       * ## Freeform Component # Synchronous Lifecycle # lets preExecution cancel updates
       */
      it("lets preExecution cancel updates", function(done) {
        dashboard.addComponent(componentForTestValidation);

        spyOn(basic, 'update').and.callThrough();
        spyOn(basic, 'preExecution').and.returnValue(false);
        spyOn(basic, 'customfunction').and.callThrough();
        spyOn(basic, 'postExecution').and.callThrough();

        // using a second component to validate if when the component's
        // preExecution returns false the update is canceled
        componentForTestValidation.once("cdf:postExecution", function() {
          expect(basic.update).toHaveBeenCalled();
          expect(basic.preExecution.calls.count()).toEqual(1);
          expect(basic.customfunction).not.toHaveBeenCalled();
          expect(basic.postExecution).not.toHaveBeenCalled();
          done();          
        });

        dashboard.updateAll([basic, componentForTestValidation]);
      });
    });

    /**
     * ## Freeform Component # Query Lifecycle
     */
    describe("Query Lifecycle #", function() {
      /**
       * ## Global settings for all suites.
       * #begin
       * - beforeEach
       */
      beforeEach(function() {
        dashboard.init()
        freeformQuery = new FreeformComponent({
          name: "freeformQuery",
          type: "freeform",
          testFlag: 0,
          executeAtStart: true,
          manageCallee: false,
          preExecution: function() {},
          customfunction: function() {
            var redraw = _.bind(this.redraw, this);
            this.triggerQuery({
              dataAccessId: "foo",
              path: "bar" 
            }, redraw);
          },
          postFetch: function(d) { return d; },
          redraw: function() { this.testFlag = 0x2; },
          postExecution: function() {}
        });
        componentForTestValidation = new FreeformComponent({
          name: "componentForTestValidation",
          type: "freeform",
          testFlag: 0,
          executeAtStart: true,
          priority: 999,
          preExecution: function() {},
          customfunction: function() {},
          postExecution: function() {}
        });
        dashboard.addComponent(freeformQuery);
      });
      //#end

      /**
       * ## Freeform Component # Query Lifecycle # calls each event handler exactly once
       */
      it("calls each event handler exactly once", function(done) {
        spyOn(freeformQuery, 'update').and.callThrough();
        spyOn(freeformQuery, 'preExecution').and.callThrough();
        spyOn(freeformQuery, 'customfunction').and.callThrough();
        spyOn(freeformQuery, 'postExecution').and.callThrough();
        spyOn(freeformQuery, 'postFetch').and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({resultset: [], metadata: []});
        });

        // listen to cdf:postExecution event
        freeformQuery.once("cdf:postExecution", function() {
          expect(freeformQuery.update).toHaveBeenCalled();
          expect(freeformQuery.preExecution.calls.count()).toEqual(1);
          expect(freeformQuery.customfunction.calls.count()).toEqual(1);
          expect(freeformQuery.postExecution.calls.count()).toEqual(1);
          expect(freeformQuery.postFetch.calls.count()).toEqual(1);
          done();
        });

        dashboard.update(freeformQuery);
      });

      /**
       * ## Freeform Component # Query Lifecycle # overwrites data from postFetch
       */
      it("overwrites data from postFetch", function(done) {
        spyOn(freeformQuery, "preExecution").and.callThrough();
        spyOn(freeformQuery, "block").and.callThrough();
        spyOn(freeformQuery, "customfunction").and.callThrough();
        spyOn(freeformQuery, "triggerQuery").and.callThrough();
        spyOn(freeformQuery, "postFetch").and.returnValue({test: true});
        spyOn(freeformQuery, "redraw").and.callThrough();
        spyOn(freeformQuery, "postExecution").and.callThrough();
        spyOn(freeformQuery, "unblock").and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({resultset: [], metadata: []});
        });

        // listen to cdf:postExecution event
        freeformQuery.once("cdf:postExecution", function() {
          expect(freeformQuery.block.calls.count()).toEqual(1);
          expect(freeformQuery.preExecution.calls.count()).toEqual(1);
          expect(freeformQuery.customfunction.calls.count()).toEqual(1);
          expect(freeformQuery.triggerQuery.calls.count()).toEqual(1);
          expect(freeformQuery.postFetch.calls.count()).toEqual(1);
          expect(freeformQuery.redraw.calls.count()).toEqual(1);
          expect(freeformQuery.redraw.calls.argsFor(0)[0].test).toBeTruthy();
          expect(freeformQuery.postExecution.calls.count()).toEqual(1);
          done();
        });

        dashboard.update(freeformQuery);
      });

      /**
       * ## Freeform Component # Query Lifecycle # doesn't overwrite data if postFetch returns undefined
       */
      it("doesn't overwrite data if postFetch returns undefined", function(done) {
        spyOn(freeformQuery, "update").and.callThrough();
        spyOn(freeformQuery, "block").and.callThrough();
        spyOn(freeformQuery, "preExecution").and.callThrough();
        spyOn(freeformQuery, "customfunction").and.callThrough();
        spyOn(freeformQuery, "postFetch").and.returnValue(undefined);
        spyOn(freeformQuery, "redraw").and.callThrough();
        spyOn(freeformQuery, "triggerQuery").and.callThrough();
        spyOn(freeformQuery, "postExecution").and.callThrough();
        spyOn(freeformQuery, "unblock").and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({resultset: [10], metadata: []});
        });

        // listen to cdf:postExecution event
        freeformQuery.once("cdf:postExecution", function() {
          expect(freeformQuery.block.calls.count()).toEqual(1);
          expect(freeformQuery.preExecution.calls.count()).toEqual(1);
          expect(freeformQuery.customfunction.calls.count()).toEqual(1);
          expect(freeformQuery.triggerQuery.calls.count()).toEqual(1);
          expect(freeformQuery.postFetch.calls.count()).toEqual(1);
          expect(freeformQuery.redraw.calls.count()).toEqual(1);
          expect(freeformQuery.redraw.calls.argsFor(0)[0].resultset[0]).toEqual(10);
          expect(freeformQuery.postExecution.calls.count()).toEqual(1);
          done();
        });

        dashboard.update(freeformQuery);
      });

      /**
       * ## Freeform Component # Query Lifecycle # only updates once if called concurrently
       */
      it("only updates once if called concurrently", function(done) {
        var success, firstRun = true;

        spyOn(freeformQuery, "update").and.callThrough();
        spyOn(freeformQuery, "block").and.callThrough();
        spyOn(freeformQuery, "preExecution").and.callThrough();
        spyOn(freeformQuery, "customfunction").and.callThrough();
        spyOn(freeformQuery, "postFetch").and.callThrough();
        spyOn(freeformQuery, "redraw").and.callThrough();
        spyOn(freeformQuery, "postExecution").and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          if(!success) {
            // store success callback to be called after the second update's callback runs
            success = params.success;
          } else {
            // call second update's ajax success callback
            params.success({resultset: ["second"], metadata: ["second"]});
            // call first update's ajax success callback
            // UnmanagedComponent.getSuccessHandler condition counter >= this.runCounter
            // will be false and only always() will execute
            success({resultset: ["first"], metadata: ["first"]});
          }
        });

        spyOn(freeformQuery, "unblock").and.callFake(function() {

          if(firstRun) { return firstRun = false; }

          expect(freeformQuery.update.calls.count()).toEqual(2);
          expect(freeformQuery.block.calls.count()).toEqual(2);
          expect(freeformQuery.preExecution.calls.count()).toEqual(2);
          expect(freeformQuery.customfunction.calls.count()).toEqual(2);
          expect(freeformQuery.postFetch.calls.count()).toEqual(1);
          expect(freeformQuery.redraw.calls.count()).toEqual(1);
          expect(freeformQuery.redraw.calls.argsFor(0)[0]).toEqual({resultset: ["second"], metadata: ["second"]});
          expect(freeformQuery.postExecution.calls.count()).toEqual(1);
          done();
        });

        dashboard.update(freeformQuery);
        dashboard.update(freeformQuery);
      });

      /**
       * ## Freeform Component # Query Lifecycle # updates multiple times when not called concurrently
       */
      it("updates multiple times when not called concurrently", function(done) {
        spyOn(freeformQuery, "preExecution").and.callThrough();
        spyOn(freeformQuery, "customfunction").and.callThrough();
        spyOn(freeformQuery, "redraw").and.callThrough();
        spyOn(freeformQuery, "postExecution").and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({resultset: [], metadata: []});
        });

        var firstRun = true;
        var callback = function() {
          if(firstRun) { return firstRun = false; }

          freeformQuery.off("cdf:postExecution", callback);

          expect(freeformQuery.preExecution.calls.count()).toEqual(2);
          expect(freeformQuery.customfunction.calls.count()).toEqual(2);
          expect(freeformQuery.redraw.calls.count()).toEqual(2);
          expect(freeformQuery.postExecution.calls.count()).toEqual(2);
          done();
        }
        // listen to cdf:postExecution event
        freeformQuery.on("cdf:postExecution", callback);

        // update twice
        dashboard.update(freeformQuery);
        dashboard.update(freeformQuery);
      });

      /**
       * ## Freeform Component # Query Lifecycle # lets preExecution cancel updates
       */
      it("lets preExecution cancel updates", function(done) {
        dashboard.addComponent(componentForTestValidation);

        spyOn(freeformQuery, 'update').and.callThrough();
        spyOn(freeformQuery, 'preExecution').and.returnValue(false);
        spyOn(freeformQuery, 'customfunction').and.callThrough();
        spyOn(freeformQuery, 'postExecution').and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({resultset: [], metadata: []});
        });

        // using a second component to validate if when the component's
        // preExecution function returns false the update is canceled
        componentForTestValidation.once("cdf:postExecution", function() {
          expect(freeformQuery.update).toHaveBeenCalled();
          expect(freeformQuery.preExecution.calls.count()).toEqual(1);
          expect(freeformQuery.customfunction.calls.count()).toEqual(1);
          expect(freeformQuery.postExecution).not.toHaveBeenCalled();
          done();          
        });

        dashboard.updateAll([freeformQuery, componentForTestValidation]);
      });
    });

    /**
     * ## Freeform Component # AJAX Lifecycle
     */
    describe("AJAX Lifecycle #", function() {
      beforeEach(function() {
        dashboard.init();
        freeformAjax = new FreeformComponent({
          name: "freeformAjax",
          type: "freeform",
          testFlag: 0,
          executeAtStart: true,
          manageCallee: false,
          preExecution: function() {},
          customfunction: function() {
            var redraw = _.bind(this.redraw, this);
            this.triggerAjax({
              url: "foo",
              type: "json",
              method: "get",
              path: "bar" 
            }, redraw);
          },
          postFetch: function(d) { return d; },
          redraw: function() { this.testFlag = 0x4; },
          postExecution: function() {}
        });
        componentForTestValidation = new FreeformComponent({
          name: "componentForTestValidation",
          type: "freeform",
          testFlag: 0,
          executeAtStart: true,
          priority: 999,
          preExecution: function() {},
          customfunction: function() {},
          postExecution: function() {}
        });
        dashboard.addComponent(freeformAjax);
      });

      /**
       * ## Freeform Component # AJAX Lifecycle # calls each event handler exactly once
       */
      it("calls each event handler exactly once", function(done) {
        spyOn(freeformAjax, 'update').and.callThrough();
        spyOn(freeformAjax, 'preExecution').and.callThrough();
        spyOn(freeformAjax, 'block').and.callThrough();
        spyOn(freeformAjax, 'customfunction').and.callThrough();
        spyOn(freeformAjax, 'postFetch').and.callThrough();
        spyOn(freeformAjax, 'redraw').and.callThrough();
        spyOn(freeformAjax, 'postExecution').and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({resultset: [], metadata: []});
        });
        // unblock called last
        spyOn(freeformAjax, 'unblock').and.callFake(function(params) {
          expect(freeformAjax.update).toHaveBeenCalled();
          expect(freeformAjax.preExecution.calls.count()).toEqual(1);
          expect(freeformAjax.postExecution.calls.count()).toEqual(1);
          expect(freeformAjax.customfunction.calls.count()).toEqual(1);
          expect(freeformAjax.postFetch.calls.count()).toEqual(1);
          expect(freeformAjax.block.calls.count()).toEqual(1);
          expect(freeformAjax.redraw.calls.count()).toEqual(1);
          expect(freeformAjax.unblock.calls.count()).toEqual(1);
          done();
        });

        // update
        dashboard.update(freeformAjax);
      });

      /**
       * ## Freeform Component # AJAX Lifecycle # only updates once if called concurrently
       */
      it("only updates once if called concurrently", function(done) {
        var success, firstRun = true;

        spyOn(dashboard, 'updateComponent').and.callThrough();
        spyOn(freeformAjax, 'update').and.callThrough();
        spyOn(freeformAjax, 'preExecution').and.callThrough();
        spyOn(freeformAjax, 'block').and.callThrough();
        spyOn(freeformAjax, 'customfunction').and.callThrough();
        spyOn(freeformAjax, 'redraw').and.callThrough();
        spyOn(freeformAjax, 'triggerAjax').and.callThrough();
        spyOn(freeformAjax, 'postFetch').and.callThrough();
        spyOn(freeformAjax, 'postExecution').and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          if(!success) {
            // store success callback to be called after the second update's callback runs
            success = params.success;
          } else {
            // call second update's ajax success callback
            params.success({resultset: ["second"], metadata: ["second"]});
            // call first update's ajax success callback
            // UnmanagedComponent.getSuccessHandler condition counter >= this.runCounter
            // will be false and only always() will execute
            success({resultset: ["first"], metadata: ["first"]});
          }
        });

        spyOn(freeformAjax, 'unblock').and.callFake(function(params) {

          if(firstRun) { return firstRun = false; }

          expect(dashboard.updateComponent.calls.count()).toEqual(2);
          expect(freeformAjax.update.calls.count()).toEqual(2);
          expect(freeformAjax.preExecution.calls.count()).toEqual(2);
          expect(freeformAjax.block.calls.count()).toEqual(2);
          expect(freeformAjax.customfunction.calls.count()).toEqual(2);
          expect(freeformAjax.postFetch.calls.count()).toEqual(1);
          expect(freeformAjax.redraw.calls.count()).toEqual(1);
          expect(freeformAjax.redraw.calls.argsFor(0)[0]).toEqual({resultset: ["second"], metadata: ["second"]});
          expect(freeformAjax.postExecution.calls.count()).toEqual(1);
          expect(freeformAjax.unblock.calls.count()).toEqual(2);
          done();
        });

        // update twice
        dashboard.update(freeformAjax);
        dashboard.update(freeformAjax);
      });

      /**
       * ## Freeform Component # AJAX Lifecycle # lets preExecution cancel updates
       */
      it("lets preExecution cancel updates", function(done) {
        dashboard.addComponent(componentForTestValidation);

        spyOn(freeformAjax, 'update').and.callThrough();
        spyOn(freeformAjax, 'preExecution').and.returnValue(false);
        spyOn(freeformAjax, 'customfunction').and.callThrough();
        spyOn(freeformAjax, 'redraw');
        spyOn(freeformAjax, 'postExecution');
        spyOn($, "ajax").and.callFake(function(options) {
          options.success({resultset: [], metadata: []});
        });

        // using a second component to validate if when the component's
        // preExecution function returns false the update is canceled
        componentForTestValidation.once("cdf:postExecution", function() {
          expect(freeformAjax.update).toHaveBeenCalled();
          expect(freeformAjax.preExecution.calls.count()).toEqual(1);
          expect(freeformAjax.customfunction.calls.count()).toEqual(1);
          expect(freeformAjax.redraw).not.toHaveBeenCalled();
          expect(freeformAjax.postExecution).not.toHaveBeenCalled();
          done();        
        });

        dashboard.updateAll([freeformAjax, componentForTestValidation]);
      });
    });
  });
});
