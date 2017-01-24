/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
  "cdf/components/MultiButtonComponent",
  "cdf/lib/jquery",
  "amd!cdf/lib/underscore"
], function(Dashboard, MultiButtonComponent, $, _) {

  /**
   * ## The Multi Button Component
   */
  describe("The Multi Button Component #", function() {

    var dashboard = new Dashboard();
    var htmlObject = "sampleMultiButtonComponentObject";
    var componentName = "multiButtonComponent";

    dashboard.addParameter("region", "");

    var multiButtonComponent = new MultiButtonComponent({
      name: componentName,
      type: "MultiButtonComponent",
      parameters: [],
      path: "/fake/regions.xaction",
      parameter: "region",
      separator: ",&nbsp;",
      valueAsId: true,
      valuesArray: [["Button1","b1"],["Button2","b2"],["Button3","b3"]],
      isMultiple: false,
      htmlObject: htmlObject,
      executeAtStart: true,
      postChange: function() {
        this.testCounter = this.testCounter ? this.testCounter + 1 : 1;
        return "you chose: " + this.dashboard.getParameterValue(this.parameter);
      }
    });

    dashboard.addComponent(multiButtonComponent);
    dashboard.init();

    var $htmlContainer = $("<div>");
    var $htmlObject = $("<div />").attr("id", htmlObject);
    // add an element where the button will be inserted
    $($htmlContainer).append($htmlObject);
    $("body").append($htmlContainer);

    /**
     * ## The Multi Button Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(multiButtonComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      multiButtonComponent.once("cdf:postExecution", function() {
        expect(multiButtonComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(multiButtonComponent);
    });

    /**
     * ## The Multi Button Component # doesn't trigger postChange N times for N clicks on the same button
     */
    it("doesn't trigger postChange N times for N clicks on the same button", function(done) {
      multiButtonComponent.clickButton(htmlObject, componentName, 1);
      multiButtonComponent.clickButton(htmlObject, componentName, 2);
      multiButtonComponent.clickButton(htmlObject, componentName, 0);
      multiButtonComponent.clickButton(htmlObject, componentName, 0);
      multiButtonComponent.clickButton(htmlObject, componentName, 0);
      multiButtonComponent.clickButton(htmlObject, componentName, 0);
      // sending the expect to the end of the call stack
      _.defer(function() {
        expect(multiButtonComponent.testCounter).toEqual(3);
        done();
      });
    });

    /**
     * ## The Multi Button Component # behaves correctly using a parameter with a null
     */
    it("behaves correctly using a parameter with a null", function(done) {
      dashboard.setParameter("region", null);
      spyOn(multiButtonComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      multiButtonComponent.once("cdf:postExecution", function() {
        expect(multiButtonComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(multiButtonComponent);
    });

    /**
     * ## The Multi Button Component # behaves correctly with parameter as undefined
     */
    it("behaves correctly with parameter as undefined", function(done) {
      dashboard.setParameter("region", undefined);
      spyOn(multiButtonComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      multiButtonComponent.once("cdf:postExecution", function() {
        expect(multiButtonComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(multiButtonComponent);
    });

    /**
     * ## The Multi Button Component # draw() function behaves correctly
     */
    describe("draw() function behaves correctly #", function() {
      beforeEach(function() {
        multiButtonComponent.isMultiple = false;
        spyOn($, "ajax").and.callFake(function() {
          return {responseXML: "<test/>"};
        });
      });

      /**
       * ## The Multi Button Component # draw() function behaves correctly # with one element in values array
       */
      describe("with one element in values array #", function() {
        beforeEach(function() {
          multiButtonComponent.valuesArray = [["Button1","b1"]];
        });

        /**
         * ## The Multi Button Component # draw() function behaves correctly # with one element in values array # with the current value equals to the first value
         */
        it("with the current value equals to the first value", function(done) {
          dashboard.setParameter("region", "b1");

          spyOn(dashboard, 'fireChange');

          // listen to cdf:postExecution event
          multiButtonComponent.once("cdf:postExecution", function() {
            expect(dashboard.fireChange).not.toHaveBeenCalled();
            done();
          });

          dashboard.update(multiButtonComponent);
        });

        /**
         * ## The Multi Button Component # draw() function behaves correctly # with one element in values array # with the current value does not equal to the first value
         */
        it("with the current value does not equal to the first value", function(done) {
          dashboard.setParameter("region", "b2");

          spyOn(dashboard, 'fireChange');

          // listen to cdf:postExecution event
          multiButtonComponent.once("cdf:postExecution", function() {
            expect(dashboard.fireChange).toHaveBeenCalled();
            done();
          });

          dashboard.update(multiButtonComponent);
        });
      });

      /**
       * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array
       */
      describe("with several elements in values array #", function() {
        beforeEach(function() {
          multiButtonComponent.valuesArray = [["Button1","b1"],["Button2","b2"],["Button3","b3"]];
        });

        /**
         * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array # with the current value equals to the first value
         */
        it("with the current value equals to the first value", function(done) {
          dashboard.setParameter("region", "b1");

          spyOn(dashboard, 'fireChange');

          // listen to cdf:postExecution event
          multiButtonComponent.once("cdf:postExecution", function() {
            expect(dashboard.fireChange).not.toHaveBeenCalled();
            done();
          });

          dashboard.update(multiButtonComponent);
        });

        /**
         * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array # with the current value does not equal to the first value
         */
        describe("with the current value does not equal to the first value", function() {
          /**
           * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array # with the current value does not equal to the first value # with the current value is present in values array
           */
          it("with the current value is present in values array", function(done) {
            dashboard.setParameter("region", "b2");

            spyOn(dashboard, 'fireChange');

            // listen to cdf:postExecution event
            multiButtonComponent.once("cdf:postExecution", function() {
              expect(dashboard.fireChange).not.toHaveBeenCalled();
              done();
            });

            dashboard.update(multiButtonComponent);
          });

          /**
           * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array # with the current value does not equal to the first value # with the current value is not present in values array
           */
          it("with the current value is not present in values array", function(done) {
            dashboard.setParameter("region", "b4");

            spyOn(dashboard, 'fireChange');

            // listen to cdf:postExecution event
            multiButtonComponent.once("cdf:postExecution", function() {
              expect(dashboard.fireChange).not.toHaveBeenCalled();
              done();
            });

            dashboard.update(multiButtonComponent);
          });
        });
      });

      /**
       * ## The Multi Button Component # draw() function behaves correctly # with no elements in values array
       */
      it("with no elements in values array", function(done) {
        multiButtonComponent.valuesArray = [];
        dashboard.setParameter("region", undefined);

        spyOn(dashboard, 'fireChange');

        // listen to cdf:postExecution event
        multiButtonComponent.once("cdf:postExecution", function() {
          expect(dashboard.fireChange).not.toHaveBeenCalled();
          done();
        });

        dashboard.update(multiButtonComponent);
      });
    });
  });
});
