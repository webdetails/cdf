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
  "cdf/components/SelectComponent",
  "cdf/dashboard/Query",
  "cdf/lib/jquery"
], function(Dashboard, SelectComponent, Query, $) {

  /**
   * ## The Select Component
   */
  describe("The Select Component #", function() {
  
    var dashboard = new Dashboard();
  
    dashboard.addParameter("selectComponentParameter", "1");

    dashboard.init();
    
    var selectComponent = new SelectComponent({
      name: "selectComponent",
      type: "selectComponent",
      parameters: [],
      valuesArray: [["1", "Lisbon"], ["2", "Dusseldorf"]],
      parameter: "selectComponentParameter",
      valueAsId: false,
      htmlObject: "sampleObjectSelect",
      executeAtStart: true,
      postChange: function() {
        return "You chose: " + this.dashboard.getParameterValue(this.parameter);
      }
    });
  
    dashboard.addComponent(selectComponent);
  
    /**
     * ## The Select Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(selectComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      selectComponent.once("cdf:postExecution", function() {
        expect(selectComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(selectComponent);
    });

    /**
     * ## The Select Component # has a string parameter
     */
    it("has a string parameter", function() {
      expect(dashboard.getParameterValue(selectComponent.parameter)).toEqual("1");
    });

    /**
     * ## The Select Component # allows executing a postChange function
     */
    it("allows executing a postChange function", function() {
      spyOn(selectComponent, 'postChange').and.callThrough();

      // listen to selectComponentParameter:fireChange event
      selectComponent.once(selectComponent.parameter + ":fireChange", function() {
        expect(selectComponent.postChange).toHaveBeenCalled();
        done();
      });

      dashboard.processChange(selectComponent.name);
    });
  
    /**
     * ## The Select Component # external plugin
     */
    describe("external plugin", function() {
  
      var makeSelect = function(name, externalPlugin, extraOptions, dashboard) {
        return new SelectComponent({name: name,
                                    type: "SelectComponent",
                                    parameter: "selectParam",
                                    externalPlugin: externalPlugin,
                                    extraOptions: extraOptions,
                                    htmlObject: "htmlObject"});
      };
  
      var mySelect = {};
  
      var dataArray = [["label1", "value1"],
                       ["label2", "value2"],
                       ["label3", "value3"],
                       ["label4", "value4"]];

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
         * ## The Select Component # external plugin supports @plugin
         */
        it("supports " + plugin, function(done) {
          switch(plugin) {
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
          // validateDraw
          expect(currPlugin).toEqual(mySelect.extraOpsTest.plugin);
          expect(mySelect.valuesTest).toEqual(dataInPlaceholder);
          switch(currPlugin) {
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
        });
      };
  
      var select2Select = makeSelect("select2Select", "select2", {opt1: "val1"}, dashboard);
      dashboard.addComponent(select2Select);
      mockDraw("select2");
  
      var chosenSelect = makeSelect("chosenSelect", "chosen", {opt1: "val1"}, dashboard);
      dashboard.addComponent(chosenSelect);
      mockDraw("chosen");
  
      var hyndsSelect = makeSelect("hyndsSelect", "hynds", dashboard);
      dashboard.addComponent(hyndsSelect);
      mockDraw("hynds");
  
    });
  });
});
