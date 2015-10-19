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
  "cdf/components/FilterComponent",
  "cdf/lib/jquery",
  "amd!cdf/lib/underscore"
], function(Dashboard, FilterComponent, $, _) {

  /**
   * ## The Filter Component
   */
  describe("The Filter Component #", function() {

    var dashboard, filterComponent, $htmlObject;

    filterComponent = new FilterComponent({
      type: "FilterComponent",
      name: "render_singleFilter_simple",
      priority: 5,
      executeAtStart: true,
      htmlObject: "sampleObjectFilter",
      listeners: [],
      parameter: "singleSelectionParam_simple",
      parameters: [],
      options: function() { return {}; },
      queryDefinition: {},
      componentInput: {
        valueAsId: false,
        valuesArray: [[1.1,"One","Ones"],[1.2,"Two","Ones"],[1.3,"Three","Ones"],[1.4,"Four","Ones"],[1.5,"Five","Ones"],[1.6,"Six","Ones"],[1.7,"Seven","Ones"],[1.8,"Eight","Ones"],[1.9,"Nine","Ones"],
                      [2.1,"One","Twos"],[2.2,"Two","Twos"],[2.3,"Three","Twos"],[2.4,"Four","Twos"],[2.5,"Five","Twos"],[2.6,"Six","Twos"],[2.7,"Seven","Twos"],[2.8,"Eight","Twos"],[2.9,"Nine","Twos"]]
      },
      componentOutput: {
        outputFormat: "lowestID"
      },
      componentDefinition: {
        title: "Single Selection: multiSelect = False",
        alwaysExpanded: false,
        multiselect: false,
        showIcons: true,
        showButtonOnlyThis: true,
        useOverlay: false,
        showFilter: true
      },
      addIns: {
        postUpdate: [],
        renderRootHeader: [],
        renderRootSelection: [],
        renderRootFooter: [],
        renderGroupSelection: [],
        renderItemSelection: [],
        sortGroup: [],
        sortItem: []
      }
    });

    $htmlObject = $('<div />').attr('id', filterComponent.htmlObject);

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
      dashboard.addParameter("singleSelectionParam_simple",_.bind(function() {
        return [];
      }, {"dashboard": dashboard}));
      $('body').append($htmlObject);
    });
    
    afterEach(function() {
      $htmlObject.remove();
    });

    /**
     * ## The Filter Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      dashboard.addComponent(filterComponent);

      spyOn(filterComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      filterComponent.once("cdf:postExecution", function() {
        expect(filterComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(filterComponent);
    });

    describe("Filter Component # RootCtl controller", function() {

      /**
       * ## The Filter Component # RootCtl controller # clears search input if no match is found and component is being expanded
       */
      it("clears search input if no match is found and component is being expanded", function(done) {
        dashboard.addComponent(filterComponent);
        dashboard.update(filterComponent);

        // listen to cdf:postExecution event
        filterComponent.once("cdf:postExecution", function() {
          // simulate a search term that doesn't have any matches
          expect(filterComponent.model.root().get('isCollapsed')).toEqual(true);
          $('.filter-filter-input:eq(0)').val("fake_search_text");
          _.map(filterComponent.model.nodes().models, function(model) {
            model.set('isVisible', false);
          });

          spyOn(filterComponent.manager.get("view"), "onFilterClear").and.callThrough();
          filterComponent.manager.get("controller").onToggleCollapse(filterComponent.model);
          expect(filterComponent.manager.get("view").onFilterClear).toHaveBeenCalled();
          expect($('.filter-filter-input:eq(0)').val()).toEqual("");

          done();
        });
      });
    });
  });
});
