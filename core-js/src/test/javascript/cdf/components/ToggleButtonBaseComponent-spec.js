/*!
 * Copyright 2016 Webdetails, a Pentaho company. All rights reserved.
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
  "cdf/components/ToggleButtonBaseComponent"
], function(Dashboard, ToggleButtonBaseComponent) {

  describe("The Toggle Button Base Component #", function() {

    describe("Should check drawing function", function() {
      var comp;
      var dashboard;

      beforeEach(function() {
        dashboard = new Dashboard();
        spyOn(dashboard, "getParameterValue");
        spyOn(dashboard, "setParameter");
        spyOn(dashboard, "processChange");
      });

      it("Should draw radio component", function() {
        comp = new ToggleButtonBaseComponent({
          name: "RadioComponent",
          type: "RadioComponent",
          parameter: "test",
          separator: ",&nbsp;",
          valueAsId: true,
          htmlObject: "sampleObject",
          defaultIfEmpty: true
        });
        dashboard.addComponent(comp);

        spyOn(comp, "callAjaxAfterRender");
        var placeholder = jasmine.createSpyObj("placeholder", ["html"]);
        spyOn(comp, "placeholder").and.returnValue(placeholder);
        spyOn(comp, "_doAutoFocus");

        var sourceArray = [
          ["Anna's Decorations", "Anna&#39;s Decorations"],
          ["Amica Models & Co.", "Amica Models &amp; Co."]
        ];
        comp.draw(sourceArray);

        var expectedResult = '<ul class="toggleGroup horizontal">' +
          '<li class="toggleGroup horizontal">' +
          '<input type="radio" class="RadioComponent" name="RadioComponent" id="RadioComponent0" value="Anna&amp;#39;s Decorations">' +
          '<label for="RadioComponent0">Anna\'s Decorations</label></li>,&nbsp;' +
          '<li class="toggleGroup horizontal">' +
          '<input type="radio" class="RadioComponent" name="RadioComponent" id="RadioComponent1" value="Amica Models &amp;amp; Co.">' +
          '<label for="RadioComponent1">Amica Models &amp; Co.</label></li>,&nbsp;</ul>';

        expect(dashboard.getParameterValue).toHaveBeenCalledWith(comp.parameter);
        expect(dashboard.setParameter).toHaveBeenCalledWith(comp.parameter, ["Anna&#39;s Decorations"]);
        expect(dashboard.processChange).toHaveBeenCalledWith(comp.name);
        expect(comp.placeholder).toHaveBeenCalled();
        expect(placeholder.html).toHaveBeenCalled();
        var realCompNode = placeholder.html.calls.argsFor(0);
        expect(realCompNode[0][0].outerHTML).toEqual(expectedResult);
        expect(realCompNode[0].find("input[name=RadioComponent]:checked").val()).toBe("Anna&#39;s Decorations");
        expect(comp.currentVal).toBeNull();
        expect(comp.callAjaxAfterRender).not.toHaveBeenCalled();
        expect(comp._doAutoFocus).toHaveBeenCalled();
      });

      it("Should draw radio component with existing current value", function() {
        comp = new ToggleButtonBaseComponent({
          name: "RadioComponent",
          type: "RadioComponent",
          parameter: "test",
          valueAsId: false,
          htmlObject: "sampleObject",
          verticalOrientation: true,
          defaultIfEmpty: true
        });
        dashboard.addComponent(comp);

        spyOn(comp, "callAjaxAfterRender");
        var placeholder = jasmine.createSpyObj("placeholder", ["html"]);
        spyOn(comp, "placeholder").and.returnValue(placeholder);
        spyOn(comp, "_doAutoFocus");
        dashboard.getParameterValue.and.returnValue(["EMEA"]);

        var sourceArray = [
          ["APAC", "APAC"],
          ["EMEA", "EMEA"]
        ];
        comp.draw(sourceArray);

        var expectedResult = '<ul class="toggleGroup vertical">' +
          '<li class="toggleGroup vertical">' +
          '<input type="radio" class="RadioComponent" name="RadioComponent" id="RadioComponent0" value="APAC">' +
          '<label for="RadioComponent0">APAC</label></li>' +
          '<li class="toggleGroup vertical">' +
          '<input type="radio" class="RadioComponent" name="RadioComponent" id="RadioComponent1" value="EMEA">' +
          '<label for="RadioComponent1">EMEA</label></li></ul>';

        expect(dashboard.getParameterValue).toHaveBeenCalledWith(comp.parameter);
        expect(dashboard.setParameter).not.toHaveBeenCalled();
        expect(dashboard.processChange).not.toHaveBeenCalled();
        expect(comp.placeholder).toHaveBeenCalled();
        expect(placeholder.html).toHaveBeenCalled();
        var realCompNode = placeholder.html.calls.argsFor(0);
        expect(realCompNode[0][0].outerHTML).toEqual(expectedResult);
        expect(realCompNode[0].find("input[name=RadioComponent]:checked").val()).toBe("EMEA");
        expect(comp.currentVal).toBeNull();
        expect(comp.callAjaxAfterRender).not.toHaveBeenCalled();
        expect(comp._doAutoFocus).toHaveBeenCalled();
      });

      it("Should draw check component", function() {
        comp = new ToggleButtonBaseComponent({
          name: "CheckComponent",
          type: "CheckComponent",
          parameter: "test",
          valueAsId: false,
          htmlObject: "sampleObject",
          executeAtStart: true,
          verticalOrientation: true,
          defaultIfEmpty: true
        });
        dashboard.addComponent(comp);

        spyOn(comp, "callAjaxAfterRender");
        var placeholder = jasmine.createSpyObj("placeholder", ["html"]);
        spyOn(comp, "placeholder").and.returnValue(placeholder);
        spyOn(comp, "_doAutoFocus");

        var sourceArray = [
          ["APAC", "APAC"],
          ["EMEA", "EMEA"]
        ];
        comp.draw(sourceArray);

        var expectedResult = '<ul class="toggleGroup vertical">' +
          '<li class="toggleGroup vertical">' +
          '<input type="checkbox" class="CheckComponent" name="CheckComponent" id="CheckComponent0" value="APAC">' +
          '<label for="CheckComponent0">APAC</label></li>' +
          '<li class="toggleGroup vertical">' +
          '<input type="checkbox" class="CheckComponent" name="CheckComponent" id="CheckComponent1" value="EMEA">' +
          '<label for="CheckComponent1">EMEA</label></li></ul>';

        expect(dashboard.getParameterValue).toHaveBeenCalledWith(comp.parameter);
        expect(dashboard.setParameter).toHaveBeenCalledWith(comp.parameter, ["APAC"]);
        expect(dashboard.processChange).toHaveBeenCalledWith(comp.name);
        expect(comp.placeholder).toHaveBeenCalled();
        expect(placeholder.html).toHaveBeenCalled();
        var realCompNode = placeholder.html.calls.argsFor(0);
        expect(realCompNode[0][0].outerHTML).toEqual(expectedResult);
        expect(realCompNode[0].find("input[name=CheckComponent]:checked").val()).toBe("APAC");
        expect(comp.currentVal).toBeNull();
        expect(comp.callAjaxAfterRender).not.toHaveBeenCalled();
        expect(comp._doAutoFocus).toHaveBeenCalled();
      });
    });
  });
});
