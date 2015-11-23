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

define([
  "cdf/Dashboard.Clean",
  "cdf/components/AutocompleteBoxComponent",
  "cdf/lib/jquery"
], function(Dashboard, AutocompleteBoxComponent, $) {

  /**
   * ## The Autocomplete Box Component
   */
  describe("The Autocomplete Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    dashboard.addParameter("autocompleteBoxParameter", "");

    dashboard.addDataSource("clientQuery", {
      queryType: "mdx",
      jndi: "SampleData",
      catalog: "mondrian:/SteelWheels",
      query: function() {
        return "SELECT NON EMPTY {[Measures].[Sales]} ON COLUMNS,"
          + " NON EMPTY TopCount( Filter([Customers].[All Customers].Children,"
          + " (Left([Customers].CurrentMember.Name, Len(\""
          + dashboard.getParameterValue(dashboard.getComponentByName("autocompleteBox").parameter) +"\")) = \""
          + dashboard.getParameterValue(dashboard.getComponentByName("autocompleteBox").parameter) + "\")), 100.0, [Measures].[Sales]) ON ROWS"
          + " FROM [SteelWheelsSales]";
      }
    });

    var autocompleteBox = new AutocompleteBoxComponent({
      name: "autocompleteBox",
      type: "autocompleteBox",
      matchType: "fromStart",
      queryDefinition: {dataSource: "clientQuery"},
      selectMulti: true,
      showApplyButton: true,
      minTextLength: 0,
      scrollHeight: 250,
      parameter: "autocompleteBoxParameter",
      htmlObject: "sampleObjectAutocompleteBox",
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
    var $htmlObject = $('<div />').attr('id', autocompleteBox.htmlObject);

    dashboard.addComponent(autocompleteBox);

    beforeEach(function() {
      $('body').append($htmlObject);
    });

    afterEach(function() {
      $htmlObject.remove();
    });

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
     * ## The Autocomplete Component # List construction after autocomplete search
     */
    it("List construction after autocomplete search", function() {
      var expectedResult = [
        "AV Stores, Co.",
        "Anna's Decorations",
        "Auto Canal+ Petit"
      ];

      spyOn(autocompleteBox, '_queryServer').and.callFake(function(searchString, successCallback) {
        successCallback([
          ["AV Stores, Co."],
          ["Anna's Decorations"],
          ["Auto Canal+ Petit"],
          ["Euro+ Shopping Channel"],
          ["La Rochelle Gifts"]
        ]);
      });

      var returnedList = [];
      autocompleteBox._search({term:'a'}, function(list) {
        returnedList = list;
      });

      expect(autocompleteBox._queryServer).toHaveBeenCalled();
      expect(returnedList).toEqual(expectedResult);

    });

    /**
     * ## The Autocomplete Component # Select and Remove Values
     */
    it("Select and Remove Values", function() {
      autocompleteBox.selectedValues = [];

      autocompleteBox._selectValue("value1");
      expect(autocompleteBox.selectedValues).toEqual(["value1"]);

      autocompleteBox._selectValue("value2");
      expect(autocompleteBox.selectedValues).toEqual(["value1", "value2"]);

      autocompleteBox._removeValue("value1");
      expect(autocompleteBox.selectedValues).toEqual(["value2"]);

      autocompleteBox._removeValue("value2");
      expect(autocompleteBox.selectedValues).toEqual([]);
    });

    /**
     * ## The Autocomplete Component # Get Options
     */
    it("Get Options", function() {
      var options = autocompleteBox._getOptions();

      expect(options.appendTo.attr("class")).toMatch('autocomplete-container');
      expect(options.minLength).toEqual(autocompleteBox.minTextLength);
      expect(typeof options.source).toEqual('function');
      expect(typeof options.focus).toEqual('function');
      expect(typeof options.open).toEqual('function');
      expect(typeof options.close).toEqual('function');
    });

  });
});
