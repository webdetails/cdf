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

define(["cdf/Dashboard.Clean", "cdf/components/AutocompleteBoxComponent", "cdf/lib/jquery"],
  function(Dashboard, AutocompleteBoxComponent, $) {

  /**
   * ## The Autocomplete Box Component
   */
  describe("The Autocomplete Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    dashboard.addParameter("autocompleteBoxParameter", "");

    var MetaLayerHome2 = {
      clientSelectorDefinition: {
        queryType: "mdx",
        jndi: "SampleData",
        catalog: "mondrian:/SteelWheels",
        query: function() {
          return "select NON EMPTY {[Measures].[Sales]} ON COLUMNS," +
                 "NON EMPTY TopCount( Filter([Customers].[All Customers].Children," +
                 "(Left([Customers].CurrentMember.Name, Len(\"" +
                 dashboard.getParameterValue(dashboard.getComponentByName("autocompleteBox").parameter) + "\")) = \"" +
                 dashboard.getParameterValue(dashboard.getComponentByName("autocompleteBox").parameter) + "\"))," +
                 "100.0,[Measures].[Sales]) ON ROWS from [SteelWheelsSales]";
        }
      }
    };

    var autocompleteBox = new AutocompleteBoxComponent({
      name: "autocompleteBox",
      type: "autocompleteBox",
      matchType: "fromStart",
      queryDefinition: MetaLayerHome2.clientSelectorDefinition,
      selectMulti: true,
      showApplyButton: true,
      minTextLength: 0,
      scrollHeight: 250,
      parameter: "autocompleteBoxParameter",
      htmlObject: "sampleObject",
      reloadOnUpdate: true,
      autoUpdateTimeout: 3000,
      executeAtStart: true,
      autoUpdateFunction: function() {
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
     * ## The Autocomplete Box Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(autocompleteBox, 'update').and.callThrough();

      // listen to cdf:postExecution event
      autocompleteBox.once("cdf:postExecution", function() {
        expect(autocompleteBox.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(autocompleteBox);
    });

    /**
     * ## The Autocomplete Box Component # Trigger query called on input change
     */
    it("Trigger Called on input change", function() {
      spyOn(autocompleteBox, '_queryServer').and.callFake(function() {
        this.result = {
          "metadata": ["Sales"],
          "values": [["AV Stores, Co.", "157807.94"],
                     ["Anna's Decorations, Ltd", "153996.98"],
                     ["Auto Canal+ Petit", "93170.66"],
                     ["Alpha Cognac", "70488.99"],
                     ["Auto Associés & Cie.", "64834.01"],
                     ["Australian Collectables, Ltd", "64591.14"],
                     ["Australian Gift Network, Co", "59469.12"],
                     ["Auto-Moto Classics Inc.", "26479.02"],
                     ["Atelier graphique", "24179.96"]]
        }
      });
      
      spyOn(autocompleteBox, "_getTextBoxValue").and.returnValue("a");

      autocompleteBox.autoBoxOpt.getList(autocompleteBox.textbox, {});

      expect(autocompleteBox._queryServer).toHaveBeenCalledWith("a");
    });
  });
});
