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
  "cdf/queries/BaseQuery",
  "cdf/lib/jquery",
  "cdf/Logger"
], function(BaseQuery, $, Logger) {

  var unprocessedData = {data: 0},
      processedData = {data: [1, 2, 3]},
      baseQuery;

  beforeEach(function() {
    baseQuery = new BaseQuery();
  });

  /**
   * ## Base query #
   */
  describe("Base query #", function() {

    /**
     * ## Base query # getSuccessHandler
     */
    describe("getSuccessHandler", function() {

      /**
       * ## Base query # getSuccessHandler persists the last result and the post fetch processed result
       */
      it("persists the last result and the post fetch processed result", function() {

        baseQuery.getSuccessHandler(function(data) { return processedData; })(unprocessedData);

        expect(baseQuery.getOption("lastResultSet")).toEqual(unprocessedData);
        expect(baseQuery.getOption("lastProcessedResultSet")).toEqual(processedData);
      });
    });

    /**
     * ## Base query # lastResults
     */
    describe("lastResults", function() {

      /**
       * ## Base query # lastResults throws an exception if the lastResultSet option value wasn't set
       */
      it("throws an exception if the lastResultSet option value wasn't set", function() {
        expect(function() { baseQuery.lastResults(); }).toThrow("NoCachedResults");
      });

      /**
       * ## Base query # lastResults returns a copy of the lastResultSet option value
       */
      it("returns a copy of the lastResults option value", function() {

        baseQuery.setOption('lastResultSet', unprocessedData);

        expect(baseQuery.lastResults()).toEqual(unprocessedData);
      });
    });

    /**
     * ## Base query # lastProcessedResults
     */
    describe("lastProcessedResults", function() {

      /**
       * ## Base query # lastProcessedResults throws an exception if the lastProcessedResultSet option value wasn't set
       */
      it("throws an exception if the lastProcessedResultSet option value wasn't set", function() {
        expect(function() { baseQuery.lastProcessedResults(); }).toThrow("NoCachedResults");
      });

      /**
       * ## Base query # lastProcessedResults returns a copy of the lastProcessedResultSet option value
       */
      it("returns a copy of the lastProcessedResultSet option value", function() {

        baseQuery.setOption('lastProcessedResultSet', processedData);

        expect(baseQuery.lastProcessedResults()).toEqual(processedData);
      });
    });

    /**
     * ## Base query # callbacks
     */
    describe("callbacks", function() {
      beforeEach(function() {
        baseQuery.buildQueryDefinition = function() {};
      });

      /**
       * ## Base query # has a default success callback
       */
      it("has a default success callback", function() {
        spyOn(baseQuery._optionsManager._options.successCallback, "value").and.callThrough();
        spyOn(Logger, "log").and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({result: true});
        });
        baseQuery.doQuery();
        expect(baseQuery._optionsManager._options.successCallback.value.calls.count()).toEqual(1);
        expect(baseQuery._optionsManager._options.successCallback.value).toHaveBeenCalledWith({result: true});
        expect(Logger.log.calls.count()).toEqual(1);
        expect(Logger.log).toHaveBeenCalledWith("Query success callback not defined. Override.");
      });

      /**
       * ## Base query # has a default error callback
       */
      it("has a default error callback", function() {
        spyOn(baseQuery._optionsManager._options.errorCallback, "value").and.callThrough();
        spyOn($, "ajax").and.callFake(function(params) {
          params.error({result: false}, "ajax error", "test error");
        });

        spyOn(Logger, "log").and.callThrough();
        baseQuery.doQuery();
        expect(baseQuery._optionsManager._options.errorCallback.value.calls.count()).toEqual(1);
        expect(baseQuery._optionsManager._options.errorCallback.value).toHaveBeenCalledWith({result: false}, "ajax error", "test error");
        expect(Logger.log.calls.count()).toEqual(1);
        expect(Logger.log).toHaveBeenCalledWith("Query error callback not defined. Override.");

        baseQuery.dashboard = {
          handleServerError: function() {
            this.errorNotification();
          },
          errorNotification: function(err, ph) { return; }
        };
        spyOn(baseQuery.dashboard, "handleServerError").and.callThrough();
        spyOn(baseQuery.dashboard, "errorNotification").and.callThrough();
        baseQuery.doQuery();
        expect(baseQuery._optionsManager._options.errorCallback.value.calls.count()).toEqual(2);
        expect(baseQuery.dashboard.handleServerError).toHaveBeenCalledWith({result: false}, "ajax error", "test error");
        expect(baseQuery.dashboard.errorNotification).toHaveBeenCalled();
      });

      /**
       * ## Base query # supports a custom success callback
       */
      it("supports a custom success callback", function(done) {
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({result: true});
        });
        baseQuery.doQuery(
          function(data) { /* success callback */
            expect(data).toEqual({result: true});
            done();
          }
        );
      });

      /**
       * ## Base query # supports a custom error callback
       */
      it("supports a custom error callback", function(done) {
        spyOn($, "ajax").and.callFake(function(params) {
          params.error({result: false}, "ajax error", "test error");
        });
        baseQuery.doQuery(
          function(data) { /* success callback */ },
          function(jqXHR, textStatus, errorThrown) { /* error callback */
            expect(jqXHR).toEqual({result: false});
            expect(textStatus).toEqual("ajax error");
            expect(errorThrown).toEqual("test error");
            done();
          }
        );
      });
    });

   /**
    * ## Base query # fetchData
    */
    describe("fetchData", function () {

    /**
     * ## fetchData # sets the success callback option if called with two arguments the first being a function and second being undefined
     */
     it("sets the success callback option if called with two arguments the first being a function and second being undefined", function() {
        spyOn(baseQuery, "doQuery").and.callFake(function(params) {
          return "query";
        });
        var errorCallback = baseQuery._optionsManager._options.errorCallback.value;
        var successCallback = function () {
            return "ill be back";
        };
        baseQuery.fetchData(successCallback,undefined);
        expect(baseQuery._optionsManager._options.successCallback.value).toEqual(successCallback);
        expect(baseQuery._optionsManager._options.errorCallback.value).toEqual(errorCallback);
        
      });

    /**
     * ## fetchData # sets the success callback and error callback if called with two arguments
     */
     it("sets the success callback and error callback if called with two arguments", function() {
        spyOn(baseQuery, "doQuery").and.callFake(function(params) {
          return "query";
        });
        var errorCallback = function () {
            return "i will not be back";
        }
        var successCallback = function () {
            return "ill be back";
        }
        baseQuery.fetchData(successCallback,errorCallback);
        expect(baseQuery._optionsManager._options.successCallback.value).toEqual(successCallback);
        expect(baseQuery._optionsManager._options.errorCallback.value).toEqual(errorCallback);
      });
    });

    /**
     * ## Base query # dispose
     */
    describe("dispose", function () {
      it("base query has a dispose method", function() {
        expect(baseQuery.dispose).toBeDefined();
      });
    });

  });
});
