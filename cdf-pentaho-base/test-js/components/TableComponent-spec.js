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

define(["cdf/Dashboard.Clean", "cdf/components/TableComponent"],
  function(Dashboard, TableComponent) {

  /**
   * ## The Table Component
   */
  describe("The Table Component #", function() {

    var myDashboard = new Dashboard();

    myDashboard.init();

    var tableComponent = new TableComponent(myDashboard, {
      name: "tableComponent",
      type: "tableComponent",
      chartDefinition: {
        colHeaders: ["Customers","Sales"],
        colTypes: ['string','numeric'],
        colFormats: [null,'%.0f'],
        colWidths: ['500px',null],
        queryType: 'mdx',
        displayLength: 10,
        catalog: 'mondrian:/SteelWheels',
        jndi: "SampleData",
        query: function(){
          return "select NON EMPTY {[Measures].[Sales]} ON COLUMNS,"+
            " NON EMPTY TopCount([Customers].[All Customers].Children, 10.0, [Measures].[Sales])" +
            " ON ROWS from [SteelWheelsSales]";
        }
      },
      htmlObject: "sampleObject",
      executeAtStart: true
    });

    myDashboard.addComponent(tableComponent);

    /**
     * ## The Table Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(tableComponent, 'update').and.callThrough();
      spyOn($, 'ajax').and.callFake(function(options) {
          options.success('{"metadata":["Sales"],"values":[["Euro+ Shopping Channel","912294.1100000001"],["Mini Gifts Distributors Ltd.","654858.0600000002"],["Australian Collectors, Co.","200995.41000000006"],["Muscle Machine Inc","197736.93999999997"],["La Rochelle Gifts","180124.90000000008"],["Down Under Souveniers, Inc","174139.77000000002"],["Dragon Souveniers, Ltd.","172989.68000000008"],["Land of Toys Inc.","164069.43999999997"],["The Sharp Gifts Warehouse","160010.27000000005"],["Kelly\'s Gift Shop","158344.79"]]}');
        });
      myDashboard.update(tableComponent);
      setTimeout(function() {
        expect(tableComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
