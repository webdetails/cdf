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

define(["cdf/Dashboard", "cdf/components/AutocompleteBoxComponent", "cdf/lib/jquery"], function(Dashboard, AutocompleteBoxComponent, $){
  /**
   * ## The Autocomplete Component
   */
  describe("The Autocomplete Component #", function() {

    var myDashboard = new Dashboard();
    myDashboard.init();

    myDashboard.addParameter('autocompleteTestParameter', 1);

    var autocompleteComponent = window.AutocompleteBoxComponent = new AutocompleteBoxComponent(myDashboard, {
      name: "autocompleteComponent",
      type: "AutoCompleteBoxComponent",
      htmlObject: 'autocompleteComponent',
      parameter: "autocompleteTestParameter",
      matchType: "fromStart",
      selectMulti: true,
      showApplyButton: true,
      minTextLenght: 0,
      scrollHeight: 250,
      reloadOnUpdate:true,
      autoUpdateTimeout:3000,
      executeAtStart: true,
      autoUpdateFunction: function(){
        if(!autocompleteTestParameter){
          autocompleteTestParameter="";
        }
        console.log("!update");
        var inputValue=$("#autoboxInput").val();
        console.log("inputValue;"+inputValue);
        console.log("clients;"+autocompleteTestParameter);
        if(autocompleteTestParameter!=inputValue){
          autocompleteTestParameter=inputValue;
          Dashboards.update(autocompleteComponent);
        }
      }
    });

    myDashboard.addComponent(autocompleteComponent);

    /**
     * ## The Autocomplete Component # Update Called
     */
    it("Update Called", function(){
      spyOn(autocompleteComponent, 'update').and.callThrough();
      myDashboard.update(autocompleteComponent);
      setTimeout(function(){
        expect(autocompleteComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });

    /**
     * ## The Autocomplete Component # Trigger query called on input change
     */
    it("Trigger Called on input change", function(done){
      spyOn(autocompleteComponent, '_queryServer').and.callFake(function(){
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
      myDashboard.update(autocompleteComponent);
      spyOn(autocompleteComponent.textbox, "val").and.returnValue("a");
      autocompleteComponent.autoBoxOpt.getList(autocompleteComponent.textbox, {});

      setTimeout(function(){
        expect(autocompleteComponent._queryServer).toHaveBeenCalled();
        done();
      }, 100);
    });

  });

});

