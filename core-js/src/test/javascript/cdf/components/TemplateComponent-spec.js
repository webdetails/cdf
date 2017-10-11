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
  "cdf/components/TemplateComponent",
  "cdf/dashboard/Utils",
  "amd!cdf/lib/underscore",
  "cdf/lib/jquery"
], function(Dashboard, TemplateComponent, Utils, _, $) {

  /**
   * ## The Template Component
   */
  describe("The Template Component #", function() {
    var dashboard = new Dashboard();
    dashboard.init();

    dashboard.addDataSource("templateQuery", {
      queryType: "cda",
      dataAccessId: "1",
      path: "samplePath",
      catalog: "mondrian:/SteelWheels",
      jndi: "SampleData",
      query: function() {
        return "select NON EMPTY {[Measures].[Sales]} ON COLUMNS, "
             + "NON EMPTY TopCount([Customers].[All Customers].Children, 6.0, [Measures].[Sales]) "
             + "ON ROWS from [SteelWheelsSales]";
      }
    });

    var templateComponent = new TemplateComponent({
      name: "template_component",
      type: "TemplateComponent",
      parameters: [],
      modelHandler: "",
      template: function() {
        return '' +
            '<div class="templateWrapper clearfix">'+
            '   {{#items}} '+
            '       <div class="templateRow">' +
            '           <div class="desc"> {{0}} </div>' +
            '           <div class="value"> {{1}} </div>' +
            '       </div>'+
            '   {{/items}} '+
            '</div>';
      },
      templateType: "mustache",
      formatters: [["testF", function(value) { return value.toUpperCase(); }]],

      rootElement: "items",
      extendableOptions: "",
      chartDefinition: {dataSource: "templateQuery"},
      htmlObject: "sampleObjectTemplate",
      executeAtStart: true,
      preExecution: function() {},
      postFetch: function() {},
      postExecution: function(){}
    });

    dashboard.addComponent(templateComponent, {});

    /**
     * ## The Template Component # allows a dashboard to execute update
     **/
    it("allows a dashboard to execute update", function(done) {
      spyOn(templateComponent, 'update').and.callThrough();
      spyOn(templateComponent, 'init').and.callThrough();
      spyOn(templateComponent, 'triggerQuery').and.callThrough();
      spyOn($, 'ajax').and.callFake(function(params) {
        params.success({"metadata":[{"colName":"Product","colType":"String","colIndex":0}, {"colName":"Sales","colType":"Numeric","colIndex":1}],"resultset":[["Euro+ Shopping Channel","914.11"],["Mini Gifts Ltd.","6558.02"]]});
      });

      // listen to cdf:postExecution event
      templateComponent.once("cdf:postExecution", function() {
        expect(templateComponent.update).toHaveBeenCalled();
        done();
      });
      dashboard.update(templateComponent);
    });


    /**
     * ## The Template Component # apply a custom formatter to a value
     */
    it("apply a custom formatter to a value", function() {
      expect(templateComponent.applyFormatter("lowcase", "testF")).toEqual("LOWCASE");
    });

    /**
     * ## The Template Component # process the data return by the query
     */
    it("process the data return by the query", function() {
      var queryResult = {
        resultset: [["Hello", "1"],["World", "2"]]
      };
      var expectedResult = {items: [{0: "Hello", 1: "1"},{0: "World", 1: "2"}]};

      expect(templateComponent.processData(queryResult)).toEqual(expectedResult)
    });

    /**
     * ## The Template Component # render a template with the processed data using mustache
     */
    it("render a template with the processed data using mustache", function() {
      var template = templateComponent.template;
      var data = {items: [{0: "Hello", 1: "1"},{0: "World", 1: "2"}]};
      var expectedResult = '<div class="templateWrapper clearfix"> <div class="templateRow"> <div class="desc"> Hello </div> <div class="value"> 1 </div> </div> <div class="templateRow"> <div class="desc"> World </div> <div class="value"> 2 </div> </div> </div>';
      var result = templateComponent.renderTemplate(template, "mustache", data);

      expect(result.replace(/\s+/g, ' ')).toEqual(expectedResult)
    });

    /**
     * ## The Template Component # processes a predefined message to be displayed to the user
     */
    it("processes a predefined message to be displayed to the user", function() {
      var result = templateComponent.processMessage('noData', 'error');
      var expectedResult = "<div class='alert alert-danger' role='alert'> <span class='glyphicon glyphicon-remove-sign' aria-hidden='true'></span> <span> No data available. </span></div>";
      expect(result.replace(/\s+/g, ' ')).toEqual(expectedResult);
    });

    /**
     * ## The Template Component # processes a custom message to be displayed to the user
     */
    it("processes a custom message to be displayed to the user", function() {
      var result = templateComponent.processMessage('Error Message', 'error');
      var expectedResult = "<div class='alert alert-danger' role='alert'> <span class='glyphicon glyphicon-remove-sign' aria-hidden='true'></span> <span> Error Message </span></div>";
      expect(result.replace(/\s+/g, ' ')).toEqual(expectedResult);
    });
  });
});
