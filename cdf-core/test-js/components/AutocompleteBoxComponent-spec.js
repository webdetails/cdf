/*!
 * Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
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

define(["cdf/Dashboard", "cdf/components/AutocompleteBoxComponent", "cdf/lib/jquery"],
  function(Dashboard, AutocompleteBoxComponent, $) {

  /**
   * ## The Autocomplete Box Component
   */
  describe("The Autocomplete Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    dashboard.addParameter("autocompleteBoxParameter", "");

    MetaLayerHome2 = {
      clientSelectorDefinition: {
        queryType: 'mdx',
        jndi: "SampleData",
        catalog: "mondrian:/SteelWheels",
        query: function() {
          return "select NON EMPTY {[Measures].[Sales]} ON COLUMNS," +
            "NON EMPTY TopCount( Filter([Customers].[All Customers].Children," +
            "(Left([Customers].CurrentMember.Name, Len(\"" +
            dashboard.getParameterValue(dashboard.getComponentByName("autocompleteBox").parameter) +"\")) = \"" +
            dashboard.getParameterValue(dashboard.getComponentByName("autocompleteBox").parameter) + "\"))," +
            "100.0,[Measures].[Sales]) ON ROWS from [SteelWheelsSales]";
        }
      }
    };

    var autocompleteBox = new AutocompleteBoxComponent(dashboard, {
      name: "autocompleteBox",
      type: "autocompleteBox",
      matchType: "fromStart",
      queryDefinition: MetaLayerHome2.clientSelectorDefinition,
      selectMulti: true,
      showApplyButton: true,
      minTextLenght: 0,
      scrollHeight: 250,
      parameter: "autocompleteBoxParameter",
      htmlObject: "sampleObject",
      reloadOnUpdate: true,
      autoUpdateTimeout: 3000,
      executeAtStart: true,
      autoUpdateFunction:function() {
        if(!this.dashboard.getParameterValue(this.parameter)) {
          this.dashboard.setParameter(this.parameter, "");
        }
        var inputValue = this._getTextBoxValue();
        if(this.dashboard.getParameterValue(this.parameter) != inputValue) {
          this.dashboard.setParameter(this.parameter, inputValue);
          this.dashboard.update(this);
        }
      }
    });

    dashboard.addComponent(autocompleteBox);

    /**
     * ## The Autocomplete Box Component # Update Called
     */
    it("Update Called", function() {
      spyOn(autocompleteBox, 'update').and.callThrough();
      dashboard.update(autocompleteBox);
      setTimeout(function() {
        expect(autocompleteBox.update).toHaveBeenCalled();
        done();
      }, 1000);
    });

    /**
     * ## The Autocomplete Box Component # Trigger query called on input change
     */
    it("Trigger Called on input change", function(done) {
      spyOn(autocompleteBox, '_queryServer').and.callFake(function() {
        this.result = {
          "metadata":["Sales"],
          "values":[
            ["AV Stores, Co.","157807.80999999994"],
            ["Anna's Decorations, Ltd","153996.12999999998"],
            ["Auto Canal+ Petit","93170.66"],
            ["Alpha Cognac","70488.43999999999"],
            ["Auto Associés & Cie.","64834.32000000001"],
            ["Australian Collectables, Ltd","64591.460000000014"],
            ["Australian Gift Network, Co","59469.12"],
            ["Auto-Moto Classics Inc.","26479.260000000002"],
            ["Atelier graphique","24179.96"]]
        }
      });
      
      spyOn(autocompleteBox, "_getTextBoxValue").and.returnValue("a");

      autocompleteBox.update();
      autocompleteBox.autoBoxOpt.getList(autocompleteBox.textbox, {});

      setTimeout(function() {
        expect(autocompleteBox._queryServer).toHaveBeenCalledWith("a");
        done();
      }, 100);

    });

  });

});
