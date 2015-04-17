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

define(["cdf/Dashboard.Clean", "cdf/components/SelectComponent", 'cdf/dashboard/Query', 'cdf/lib/jquery'],
  function(Dashboard, SelectComponent, Query, $) {

  /**
   * ## The Select Component
   */
  describe("The Select Component #", function() {
  
    var dashboard = new Dashboard();
  
    dashboard.addParameter('selectComponentParameter',1);

    dashboard.init();
    
    var selectComponent = new SelectComponent({
      name: "selectComponent",
      type: "selectComponent",
      parameters:[],
      valuesArray:[["1", "Lisbon"],["2", "Dusseldorf"]],
      parameter: "selectComponentParameter",
      valueAsId: false,
      htmlObject: "sampleObject",
      executeAtStart: true,
      postChange: function() {
        alert("You chose: " + this.dashboard.getParameterValue(this.parameter));
      }
    });
  
    dashboard.addComponent(selectComponent);
  
    /**
     * ## The Select Component # Draws the options
     */
    it("Draws the options", function(done) {
      spyOn(selectComponent, 'update');
      dashboard.update(selectComponent);
      setTimeout(function() {
        expect(selectComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
    /**
     * ## The Select Component # Holds the correct value
     */
    it("Holds the correct value", function() {
      var comp = dashboard.getComponentByName("selectComponent");
      expect(dashboard.getParameterValue(comp.parameter)).toEqual(1);
    });
    /**
     * ## The Select Component # Allows overriding AJAX settings
     */
    it("Allows overriding AJAX settings", function() {
      var ajax = spyOn($,"ajax");
  
      var query = new Query({dataAccessId: "foo", path:"bar"}, null, dashboard);
      query.setAjaxOptions({
        type: "GET",
        async: true
      });
      query.fetchData({},function() {});
      var settings = ajax.calls.mostRecent().args[0];
  
      expect(settings.type).toEqual("GET");
      expect(settings.async).toBeTruthy();
    });
  
    /**
     * ## The Select Component # The externalPlugin
     */
    describe("The externalPlugin #", function() {
  
      var makeSelect = function(name, externalPlugin, extraOptions, dashboard) {
        return new SelectComponent({
          name: name,
          type: "SelectComponent",
          parameter: "selectParam",
          externalPlugin: externalPlugin,
          extraOptions: extraOptions,
          htmlObject: "htmlObject"
        });
      };
  
      var mySelect = {};
  
      var dataArray = [
        ["label1", "value1"],
        ["label2", "value2"],
        ["label3", "value3"],
        ["label4", "value4"]
      ];
      var dataInPlaceholder = "<option value = 'label1' >value1</option>"
      + "<option value = 'label2' >value2</option>"
      + "<option value = 'label3' >value3</option>"
      + "<option value = 'label4' >value4</option>";
      var mySelectPlaceHolder = {
        html: function(param) {
          mySelect.valuesTest = param.substring(param.indexOf("<option"), param.indexOf("</select>"));
        },
        find: function(param) {
          mySelect.placeholderTest = param;
          return {
            chosen: function(param) {
              mySelect.extraOpsTest = {
                plugin: "chosen",
                extraOps: param
              };
            },
            multiselect: function(param) {
              mySelect.extraOpsTest = {
                plugin: "hynds",
                extraOps: param
              };
            },
            select2: function(param) {
              mySelect.extraOpsTest = {
                plugin: "select2",
                extraOps: param
              };
            }
          }
        }
      };
      var mockDraw = function(plugin) {
        /**
         * ## The Select Component # The externalPlugin # Behaves correctly, @plugin
         */
        it("Behaves correctly, " + plugin, function(done) {
          switch (plugin) {
          case "chosen":
            mySelect = chosenSelect;
            break;
          case "hynds":
            mySelect = hyndsSelect;
            break;
          case "select2":
            mySelect = select2Select;
            break;
          }
          mySelect.extraOpsTest = {};
          mySelect.placeholderTest = "default";
          spyOn(mySelect, "_listenElement").and.returnValue(true);
          spyOn(mySelect, "placeholder").and.returnValue(mySelectPlaceHolder);
          spyOn(dashboard, "processChange").and.returnValue(true);
          mySelect.draw(dataArray);
          var currPlugin = mySelect.externalPlugin;
          var validateDraw = function() {
            expect(currPlugin).toEqual(mySelect.extraOpsTest.plugin);
            expect(mySelect.valuesTest).toEqual(dataInPlaceholder);
            switch (currPlugin) {
            case "chosen":
              expect(mySelect.extraOpsTest.extraOps).toEqual({
                opt1: "val1"
              });
              expect(mySelect.placeholderTest).toEqual("select.chzn-select");
              break;
            case "hynds":
              expect(mySelect.extraOpsTest.extraOps).toEqual({
                multiple: mySelect._allowMultipleValues()
              });
              expect(mySelect.placeholderTest).toEqual("select.hynds-select");
              break;
            case "select2":
              expect(mySelect.extraOpsTest.extraOps).toEqual({
                opt1: "val1",
                dropdownAutoWidth: true,
                width: "off"
              });
              expect(mySelect.placeholderTest).toEqual("select.select2-container");
              break;
            }
            done();
          };
          setTimeout(validateDraw, 100);
        });
      };
  
      var select2Select = makeSelect("mySelect", "select2", {
        opt1: "val1"
      }, dashboard);
      dashboard.addComponent(select2Select);
      mockDraw("select2");
  
      var chosenSelect = makeSelect("mySelect", "chosen", {
        opt1: "val1"
      }, dashboard);
      dashboard.addComponent(chosenSelect);
      mockDraw("chosen");
  
      var hyndsSelect = makeSelect("mySelect", "hynds", dashboard);
      dashboard.addComponent(hyndsSelect);
      mockDraw("hynds");
  
    });
  });
});
