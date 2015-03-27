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

define(["cdf/Dashboard.Clean", "cdf/components/SimpleAutoCompleteComponent"],
  function(Dashboard, SimpleAutoCompleteComponent) {

  /**
   * ## The SimpleAutoComplete Component
   */
  describe("The SimpleAutoComplete Component #", function() {

    var dashboard = new Dashboard();
    
    //dashboard.addParameter('searching', "A");
    dashboard.addParameter('param1', "value1");

    dashboard.init();

    var simpleAC = new SimpleAutoCompleteComponent({
      name: "simpleAC",
      type: "SimpleAutoComplete",
      htmlObject: 'simpleAC',
      searchParam: "searching",
      parameters: [["arg1", "param1"]],
      minTextLength: 2,
      queryDefinition: {
        dataAccessId: "dataAccessTestId",
        path: "/test/path",
        showValue: true
      },
      executeAtStart: true
    });

    dashboard.addComponent(simpleAC);

    /**
     * ## The SimpleAutoComplete Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(simpleAC, 'update').and.callThrough();
      dashboard.update(simpleAC);
      setTimeout(function() {
        expect(simpleAC.update).toHaveBeenCalled();
        done();
      }, 100);
    });

    /**
     * ## The SimpleAutoComplete Component # FetchData called
     */
    it("fetchData called", function() {
      spyOn(simpleAC, 'handleQuery').and.callFake(function() { return ""; });
      spyOn(simpleAC.query, 'fetchData').and.callFake(function() {});
      spyOn(simpleAC.query, 'setSearchPattern');
      var searchValue = "Do";

      simpleAC.triggerQuery(searchValue, function() {});
      expect(simpleAC.query.fetchData).toHaveBeenCalledWith([["arg1", "param1"], ["searching", searchValue]], "");
      expect(simpleAC.query.setSearchPattern).not.toHaveBeenCalled();

      simpleAC.searchParam = undefined;
      simpleAC.triggerQuery(searchValue, function() {});
      expect(simpleAC.query.fetchData).toHaveBeenCalledWith([["arg1", "param1"]], "");
      expect(simpleAC.query.setSearchPattern).toHaveBeenCalledWith(searchValue);

    });

    /**
     * ## The SimpleAutoComplete Component # FetchData not called
     */
    it("fetchData not called", function() {
      spyOn(simpleAC, 'handleQuery').and.callFake(function() { return ""; });
      spyOn(simpleAC.query, 'fetchData').and.callFake(function() {});
      var searchValue = "D";

      simpleAC.triggerQuery(searchValue, function() {});
      expect(simpleAC.query.fetchData).not.toHaveBeenCalled();
    });

    /**
     * ## The SimpleAutoComplete Component # getList return values
     */
    it("getList return values", function() {
      var data = {
        "metadata":["Sales"],
        "resultset":[
          ["AV Stores, Co.","157807.80999999994"],
          ["Anna's Decorations, Ltd","153996.12999999998"],
          ["Auto Canal+ Petit","93170.66"],
          ["Alpha Cognac","70488.43999999999"],
          ["Auto Associés & Cie.","64834.32000000001"],
          ["Australian Collectables, Ltd","64591.460000000014"],
          ["Australian Gift Network, Co","59469.12"],
          ["Auto-Moto Classics Inc.","26479.260000000002"],
          ["Atelier graphique","24179.96"]]
      };
      var result = ["AV Stores, Co.", "Anna's Decorations, Ltd", "Auto Canal+ Petit",
        "Alpha Cognac", "Auto Associés & Cie.", "Australian Collectables, Ltd",
        "Australian Gift Network, Co", "Auto-Moto Classics Inc.", "Atelier graphique"];

      var values = simpleAC.getList(data);
      for(var i = 0, len = data.resultset.length; i < len; i++) {
        expect(values[i]).toBe(data.resultset[i][0]);
      }
    });

  });
});
