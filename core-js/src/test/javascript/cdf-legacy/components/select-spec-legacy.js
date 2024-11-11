/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
/**
 * ## The Select Component
 */
describe("The Select Component #", function() {

  var myDashboard = _.extend({},Dashboards);

  myDashboard.addParameter('selectorTestParameter',1);
  myDashboard.addParameter('multiSelectTestParameter',[1,2,3]);

  var selectComponent = window.selectComponent = {
    name: "selectComponent",
    type: "selectComponent",
    htmlObject: 'selectComponent',
    parameter: "selectorTestParameter"
  };

  var multiSelectComponent = window.multiSelectComponent = {
    name: "multiSelectComponent",
    type: "selectComponent",
    htmlObject: 'multiSelectComponent',
    parameter: "multiSelectTestParameter"
  };

  var components = [
    window.selectComponent,
    window.multiSelectComponent
  ];

  myDashboard.addComponents(components);

  /**
   * ## The Select Component # Draws the options
   */
  it("Draws the options", function(done) {
    spyOn(selectComponent, 'update');
    myDashboard.update(selectComponent);
    setTimeout(function(){
      expect(selectComponent.update).toHaveBeenCalled();
      done();
    }, 100);
  });
  /**
   * ## The Select Component # Holds the correct value
   */
  it("Holds the correct value", function() {
    var comp = myDashboard.getComponentByName("selectComponent");
    expect(myDashboard.getParameterValue(comp.parameter)).toEqual(1);
  });
  /**
   * ## The Select Component # Allows overriding AJAX settings
   */
  it("Allows overriding AJAX settings", function() {
    var ajax = spyOn(jQuery,"ajax");

    var query = new Query({dataAccessId: "foo", path:"bar"});
    query.setAjaxOptions({
      type: "GET",
      async: true
    });
    query.fetchData({},function(){});
    var settings = ajax.calls.mostRecent().args[0];

    expect(settings.type).toEqual("GET");
    expect(settings.async).toBeTruthy();
  });

  /**
   * ## The Select Component # The externalPlugin
   */
  describe("The externalPlugin #", function () {

    var makeSelect = function (name, externalPlugin, extraOptions) {
      return {
        name: name,
        type: "SelectBaseComponent",
        parameter: "selectParam",
        externalPlugin: externalPlugin,
        extraOptions: extraOptions,
        htmlObject: "htmlObject"
      }
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
      html: function (param) {
        mySelect.valuesTest = param.substring(param.indexOf("<option"), param.indexOf("</select>"));
      },
      find: function (param) {
        mySelect.placeholderTest = param;
        return {
          chosen: function (param) {
            mySelect.extraOpsTest = {
              plugin: "chosen",
              extraOps: param
            };
          },
          multiselect: function (param) {
            mySelect.extraOpsTest = {
              plugin: "hynds",
              extraOps: param
            };
          },
          select2: function (param) {
            mySelect.extraOpsTest = {
              plugin: "select2",
              extraOps: param
            };
          }
        }
      }
    };
    var mockDraw = function (plugin) {
      /**
       * ## The Select Component # The externalPlugin # Behaves correctly, @plugin
       */
      it("Behaves correctly, " + plugin, function (done) {
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
        spyOn(Dashboards, "processChange").and.returnValue(true);
        mySelect.draw(dataArray);
        var currPlugin = mySelect.externalPlugin;
        var validateDraw = function () {
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
    });
    myDashboard.addComponent(select2Select);
    mockDraw("select2");

    var chosenSelect = makeSelect("mySelect", "chosen", {
      opt1: "val1"
    });
    myDashboard.addComponent(chosenSelect);
    mockDraw("chosen");

    var hyndsSelect = makeSelect("mySelect", "hynds");
    myDashboard.addComponent(hyndsSelect);
    mockDraw("hynds");

  });


});

