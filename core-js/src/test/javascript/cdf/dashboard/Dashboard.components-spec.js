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
  "cdf/components/BaseComponent"
], function(Dashboard, BaseComponent) {

  /*
   * ## The CDF framework
   */
  describe("The CDF framework #", function() {

    var dashboard,
        postInitComponent,
        postInitComponent2;

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();

      postInitComponent = new BaseComponent({
        name: "PostInitMarker",
        type: "unmanaged",
        lifecycle: {silent: true},
        executeAtStart: true,
        priority: 999999999
      });
      postInitComponent2 = new BaseComponent({
        name: "PostInitMarker2",
        type: "unmanaged",
        lifecycle: {silent: true},
        executeAtStart: true,
        priority: 999999999
      });
    });

    /**
     * ## The CDF framework # getComponent and aliases
     */
    describe("getComponent and aliases", function() {
      /*
       * ## The CDF framework # getComponent gets a component by name
       */
      it("gets a component by name", function() {
        dashboard.addComponent(postInitComponent);
        expect(dashboard.getComponent(postInitComponent.name)).toEqual(postInitComponent);
        expect(dashboard.getComp(postInitComponent.name)).toEqual(postInitComponent);
        expect(dashboard.getComponentByName(postInitComponent.name)).toEqual(postInitComponent);
        expect(dashboard.getComponent("fake")).toEqual(undefined);
        expect(dashboard.getComp("fake")).toEqual(undefined);
        expect(dashboard.getComponentByName("fake")).toEqual(undefined);
      });
    });

    /**
     * ## The CDF framework # addComponent
     */
    describe("addComponent", function() {
      /*
       * ## The CDF framework # addComponent adds a component
       */
      it("adds a component", function() {
        expect(dashboard.addComponent(postInitComponent)).toEqual(dashboard);
        expect(dashboard.components[0]).toEqual(postInitComponent);
      });
      /*
       * ## The CDF framework # addComponent doesn't add the same component twice
       */
      it("doesn't add the same component twice", function() {
        expect(dashboard.addComponent(postInitComponent)).toEqual(dashboard);
        expect(dashboard.components[0]).toEqual(postInitComponent);
        expect(dashboard.addComponent(postInitComponent)).toEqual(dashboard);
        expect(dashboard.components.length).toEqual(1);
      });
      /*
       * ## The CDF framework # addComponent doesn't add different components with the same name
       */
      it("doesn't add different components with the same name", function() {
        expect(dashboard.addComponent(postInitComponent)).toEqual(dashboard);
        var compWithSameName = new BaseComponent({
          name: "PostInitMarker",
          type: "unmanaged"
        });
        expect(function() {
          dashboard.addComponent(compWithSameName);
          }).toThrow(new Error("addComponent: duplicate component name '" + compWithSameName.name + "'"));
        expect(dashboard.components[0]).toEqual(postInitComponent);
        expect(dashboard.components.length).toEqual(1);
      });
      /*
       * ## The CDF framework # addComponent doesn't add a component with an invalid name property
       */
      it("doesn't add a component with an invalid name property", function() {
        //undefined
        postInitComponent.name = undefined;
        expect(function() {
          dashboard.addComponent(postInitComponent);
        }).toThrow(new Error("addComponent: invalid component"));
        expect(dashboard.components[0]).toEqual(undefined);
        expect(dashboard.components.length).toEqual(0);
        // null
        postInitComponent.name = null;
        expect(function() {
          dashboard.addComponent(postInitComponent);
        }).toThrow(new Error("addComponent: invalid component"));
        expect(dashboard.components[0]).toEqual(undefined);
        expect(dashboard.components.length).toEqual(0);
        // empty string
        postInitComponent.name = "";
        expect(function() {
          dashboard.addComponent(postInitComponent);
        }).toThrow(new Error("addComponent: invalid component"));
        expect(dashboard.components[0]).toEqual(undefined);
        expect(dashboard.components.length).toEqual(0);
        // 0
        postInitComponent.name = 0;
        expect(function() {
          dashboard.addComponent(postInitComponent);
        }).toThrow(new Error("addComponent: invalid component"));
        expect(dashboard.components[0]).toEqual(undefined);
        expect(dashboard.components.length).toEqual(0);
      });
      /*
       * ## The CDF framework # addComponent adds a component at a given index position
       */
      it("adds a component at a given index position", function() {
        expect(dashboard.addComponent(postInitComponent)).toEqual(dashboard);
        expect(dashboard.components[0]).toEqual(postInitComponent);
        expect(dashboard.addComponent(postInitComponent2, {index: 0})).toEqual(dashboard);
        expect(dashboard.components[0]).toEqual(postInitComponent2);
        expect(dashboard.components[1]).toEqual(postInitComponent);
        expect(dashboard.components.length).toEqual(2);
      });
      /*
       * ## The CDF framework # addComponent adds a component at the end of the components array if the given index is out of bounds
       */
      it("adds a component at the end of the components array if the given index is out of bounds", function() {
        expect(dashboard.addComponent(postInitComponent)).toEqual(dashboard);
        expect(dashboard.components[0]).toEqual(postInitComponent);
        expect(dashboard.addComponent(postInitComponent2, {index: 3})).toEqual(dashboard);
        expect(dashboard.components[0]).toEqual(postInitComponent);
        expect(dashboard.components[1]).toEqual(postInitComponent2);
        expect(dashboard.components.length).toEqual(2);
      });
    });

    /**
     * ## The CDF framework # addComponents
     */
    describe("addComponents", function() {
      /*
       * ## The CDF framework # addComponents adds an array of components
       */
      it("adds an array of components", function() {
        dashboard.addComponents([postInitComponent, postInitComponent2]);
        expect(dashboard.components[0]).toEqual(postInitComponent);
        expect(dashboard.components[1]).toEqual(postInitComponent2);
        expect(dashboard.components.length).toEqual(2);
      });
      /*
       * ## The CDF framework # addComponents doesn't add the same component twice given an array with duplicates
       */
      it("doesn't add the same component twice given an array with duplicates", function() {
        dashboard.addComponents([postInitComponent, postInitComponent2, postInitComponent]);
        expect(dashboard.components[0]).toEqual(postInitComponent);
        expect(dashboard.components[1]).toEqual(postInitComponent2);
        expect(dashboard.components[2]).toEqual(undefined);
        expect(dashboard.components.length).toEqual(2);
      });
    });

    /**
     * ## The CDF framework # getComponentIndex
     */
    describe("getComponentIndex", function() {
      /**
       * ## The CDF framework # getComponentIndex returns -1 if a string is provided with a name of an unexisting component
       */
      it("returns -1 if a string is provided with a name of an unexisting component", function() {
        expect(dashboard.getComponentIndex("unexistingComponent")).toEqual(-1);
      });
      /**
       * ## The CDF framework # getComponentIndex returns the number itself when a number is provided and in the array bounds
       */
      it("returns the number itself when a number is provided and in the array bounds", function() {
        dashboard.addComponents([postInitComponent, postInitComponent2]);
        expect(dashboard.getComponentIndex(1)).toEqual(1);
      });
      /**
       * ## The CDF framework # getComponentIndex returns -1 when a number is provided and out of the array bounds
       */
      it("returns the number itself when a number is provided and in the array bounds", function() {
        dashboard.addComponent(postInitComponent);
        expect(dashboard.getComponentIndex(1)).toEqual(-1);
      });
      /**
       * ## The CDF framework # getComponentIndex returns the index of a component in the components array if the component is provided
       */
      it("returns the index of a component in the components array if the component is provided", function() {
        dashboard.addComponent(postInitComponent);
        expect(dashboard.getComponentIndex(dashboard.components[0])).toEqual(0);
      });
      /**
       * ## The CDF framework # getComponentIndex returns the index of a component in the components array when the component's name is provided
       */
      it("returns the index of a component in the components array when the component's name is provided", function() {
        dashboard.addComponent(postInitComponent);
        expect(dashboard.getComponentIndex(postInitComponent.name)).toEqual(0);
      });
    });

    /**
     * ## The CDF framework # removeComponent
     */
    describe("removeComponent", function() {
      /**
       * ## The CDF framework # removeComponent returns undefined when removing a component that doesn't exist in the components array
       */
      it("returns undefined when removing a component that doesn't exist in the components array", function() {
        expect(dashboard.removeComponent("fakeComponent")).toEqual(undefined);
      });
      /**
       * ## The CDF framework # removeComponent returns undefined when removing a component at an invalid index of the components array
       */
      it("returns undefined when removing a component at an invalid index of the components array", function() {
        dashboard.addComponent(postInitComponent);
        expect(dashboard.removeComponent(dashboard.components.length)).toEqual(undefined);
      });
      /**
       * ## The CDF framework # removeComponent removes a component with the name equal to the property name of the provided component object
       */
      it("removes a component with the name equal to the name property of the provided component object",function() {
        dashboard.addComponent(postInitComponent);
        expect(dashboard.getComponent(postInitComponent.name)).toEqual(postInitComponent);
        expect(dashboard.removeComponent(postInitComponent)).toEqual(postInitComponent);
        expect(dashboard.getComponentIndex(postInitComponent)).toEqual(-1);
        expect(dashboard.getComponent(postInitComponent)).toEqual(undefined);
        expect(dashboard.getComponent(postInitComponent.name)).toEqual(undefined);
      });
      /**
       * ## The CDF framework # removeComponent removes a component with the same name as the name provided
       */
      it("removes a component with the same name as the name provided", function() {
        dashboard.addComponent(postInitComponent);
        expect(dashboard.getComponent(postInitComponent.name)).toEqual(postInitComponent);
        expect(dashboard.removeComponent(postInitComponent.name)).toEqual(postInitComponent);
        expect(dashboard.getComponentIndex(postInitComponent)).toEqual(-1);
        expect(dashboard.getComponent(postInitComponent.name)).toEqual(undefined);
      });
      /**
       * ## The CDF framework # removeComponent removes a component at a given index position
       */
      it("removes a component at a given index position", function() {
        dashboard.addComponents([postInitComponent, postInitComponent2]);
        expect(dashboard.components[0]).toEqual(postInitComponent);
        expect(dashboard.components.length).toEqual(2);
        expect(dashboard.removeComponent(0)).toEqual(postInitComponent);
        expect(dashboard.components[0]).toEqual(postInitComponent2);
        expect(dashboard.components.length).toEqual(1);
      });
    });
  });
});
