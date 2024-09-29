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
  "cdf/components/PrptComponent"
], function(Dashboard, PrptComponent) {

  /**
   * ## The Pentaho Reporting Component
   */
  describe("The Pentaho Reporting Component #", function() {

    var dashboard;
    var optionData;
    var prptComponent;

    beforeEach(function() {
      dashboard = new Dashboard();

      optionData = {
        funcValue: 2,
        value: 'one',
        funcArray: [1, 'two'],
        array: [1, 'two'],
        path: "fakePath/report.prpt",
        paginate: true,
        usePost: false,
        showParameters: true,
        iframe: true,
        executeAtStart: true,
        staticValue: "staticValue"
      };

      dashboard.addParameter('funcValue', function() { return optionData.funcValue; });
      dashboard.addParameter('value', optionData.value);
      dashboard.addParameter('funcArray', function() { return optionData.funcArray; });
      dashboard.addParameter('array', optionData.array);

      prptComponent = new PrptComponent({
        name: "prptComponent",
        type: "prptComponent",
        htmlObject: "sampleObjectPrpt",
        path: optionData.path,
        parameters: [['funcValue', 'funcValue'],
          ['value', 'value'],
          ['funcArray', 'funcArray'],
          ['array', 'array'],
          ['staticValue', 'staticValue']],
        paginate: optionData.paginate,
        usePost:optionData.usePost,
        showParameters: optionData.showParameters,
        iframe: optionData.iframe,
        executeAtStart: optionData.executeAtStart
      });

      dashboard.addComponent(prptComponent);
    });

    /**
     * ## The Pentaho Reporting Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(prptComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      prptComponent.once("cdf:postExecution", function() {
        expect(prptComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(prptComponent);
    });

    /**
     * ## The Pentaho Reporting Component # setIframeUrl Called while updating
     */
    it("setIframeUrl Called while updating", function(done) {
      spyOn(prptComponent, 'update').and.callThrough();
      spyOn(prptComponent, 'setIframeUrl');

      // listen to cdf:postExecution event
      prptComponent.once("cdf:postExecution", function() {
        expect(prptComponent.update).toHaveBeenCalled();
        expect(prptComponent.setIframeUrl).toHaveBeenCalled();
        done();
      });

      dashboard.update(prptComponent);
    });

    /**
     * ## The prpt Component # verify returned value from getOptions
     */
    it("verify returned value from getOptions", function() {
      var options = prptComponent.getOptions();

      expect(options.path).toEqual(optionData.path);
      expect(options.showParameters).toEqual(optionData.showParameters);
      expect(options.paginate).toEqual(optionData.paginate);
      expect(options.autoSubmit).toEqual(optionData.autoSubmit || optionData.executeAtStart || false);
      expect(options['dashboard-mode']).toEqual(!optionData.iframe);
      expect(options.renderMode).toEqual('REPORT');
      expect(options.htmlProportionalWidth).toEqual(false);
      expect(options.funcValue).toEqual(optionData.funcValue);
      expect(options.value).toEqual(optionData.value);
      expect(options.funcArray).toEqual(optionData.funcArray);
      expect(options.array).toEqual(optionData.array);
      expect(options.staticValue).toEqual(optionData.staticValue);
      expect(options['output-target']).toEqual('table/html;page-mode=page');
      expect(options['accept-page']).toEqual(0);
    });

    /**
     * ## The prpt Component # verify returned value from getParams
     */
    it("verify returned value from getParams", function() {
      var params = prptComponent.getParams();

      expect(params['output-target']).toEqual('table/html;page-mode=page');
      expect(params['accept-page']).toEqual(0);
      expect(params.funcValue).toEqual(optionData.funcValue);
      expect(params.value).toEqual(optionData.value);
      expect(params.funcArray).toEqual(optionData.funcArray);
      expect(params.array).toEqual(optionData.array);
      expect(params.staticValue).toEqual(optionData.staticValue);
    });

    /**
     * ## The prpt Component # verify returned value from getReportOptions
     */
    it("verify returned value from getReportOptions", function() {
      var reportOptions = prptComponent.getReportOptions();

      expect(reportOptions.path).toEqual(optionData.path);
      expect(reportOptions.showParameters).toEqual(optionData.showParameters);
      expect(reportOptions.paginate).toEqual(optionData.paginate);
      expect(reportOptions.autoSubmit).toEqual(optionData.autoSubmit || optionData.executeAtStart || false);
      expect(reportOptions['dashboard-mode']).toEqual(!optionData.iframe);
      expect(reportOptions.renderMode ).toEqual('REPORT');
      expect(reportOptions.htmlProportionalWidth).toEqual(false);
      expect(reportOptions['output-target']).toEqual('table/html;page-mode=page');
      expect(reportOptions['accept-page']).toEqual(0);
    });
  });
});
