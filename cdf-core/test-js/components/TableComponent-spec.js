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

define(["cdf/Dashboard.Clean", "cdf/components/TableComponent", "cdf/lib/jquery"],
  function(Dashboard, TableComponent, $) {

  /**
   * ## The Table Component
   */
  describe("The Table Component #", function() {
    var dashboard = new Dashboard();
    dashboard.init();

    var tableComponent = new TableComponent({
      name: "tableComponent",
      type: "tableComponent",
      chartDefinition: {
        colHeaders: ["Customers", "Sales"],
        colTypes: ['string', 'numeric'],
        colFormats: [null, '%.0f'],
        colWidths: ['500px', null],
        queryType: 'mdx',
        displayLength: 10,
        catalog: 'mondrian:/SteelWheels',
        jndi: "SampleData",
        query: function() {
          return " select NON EMPTY {[Measures].[Sales]} ON COLUMNS," +
                 " NON EMPTY TopCount([Customers].[All Customers].Children, 10.0, [Measures].[Sales])" +
                 " ON ROWS from [SteelWheelsSales]";
        }
      },
      htmlObject: "tableSampleObject",
      executeAtStart: true
    });

    dashboard.addComponent(tableComponent);

    // DataTables manages it's own events, the event 'aoInitComplete' executes
    // the table component's fnInitComplete() callback function which executes postExec() and unblock() 
    $htmlObject = $('<div />').attr('id', tableComponent.htmlObject);

    /**
     * ## The Table Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      $('body').append($htmlObject);

      spyOn(tableComponent, 'update').and.callThrough();
      spyOn(tableComponent, 'triggerQuery').and.callThrough();
      spyOn($, 'ajax').and.callFake(function(params) {
        params.success('{"metadata":["Sales"],"values":[["Euro+ Shopping Channel","914.11"],["Mini Gifts Ltd.","6558.02"]]}');
      });

      // listen to cdf:postExecution event
      tableComponent.once("cdf:postExecution", function() {
        expect(tableComponent.update).toHaveBeenCalled();
        $htmlObject.remove();
        done();
      });

      dashboard.update(tableComponent);
    });
  });
});
