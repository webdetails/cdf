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

    var dashboard, filterComponent, $htmlObject, testFilterDefaults;

    testFilterDefaults = {
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
    };

    filterComponent = new FilterComponent(testFilterDefaults);

    $htmlObject = $('<div />').attr('id', filterComponent.htmlObject);

    var getNewDashboard = function() {
      var dashboard = new Dashboard();
      dashboard.init();
      dashboard.addParameter("singleSelectionParam_simple",_.bind(function() {
        return [];
      }, {"dashboard": dashboard}));
      return dashboard;
    };

    beforeEach(function() {
      dashboard = getNewDashboard();
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

    describe("RootCtrl controller #", function() {

      /**
       * ## The Filter Component # RootCtrl controller # clears search input if no match is found and component is being expanded
       */
      it("clears search input if no match is found and component is being expanded", function(done) {
        dashboard.addComponent(filterComponent);

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

        dashboard.update(filterComponent);
      });
    });

    describe("Get Page Mechanism #", function() {

      var testMetadata = [
        {
          colIndex: 0,
          colType: "Numeric",
          colName: "group"
        },
        {
          colIndex: 1,
          colType: "String",
          colName: "type"
        },
        {
          colIndex: 2,
          colType: "String",
          colName: "empty"
        }
      ];

      var getCdaJson = function(resultset) {
        return {
          resultset: resultset,
          metadata: testMetadata,
          status: "success"
        };
      };
      var defaultCdaJson = getCdaJson([[1.1, "Default1", ""], [1.2, "Default2", ""]]);
      var onFilterChangeCdaJson = getCdaJson([[1.3, "ServerSide", ""], [1.4, "PageSize", ""]]);
      var testPageSize = 10;

      it("works with searchServerSide = true and pageSize > 0", function(done) {
        runGetPageMechanismTest(true, testPageSize, done);
      });

      it("works with searchServerSide = false and pageSize > 0", function(done) {
        runGetPageMechanismTest(false, testPageSize, done);
      });

      it("works with searchServerSide = true and pageSize = 0", function(done) {
        runGetPageMechanismTest(true, 0, done);
      });

      it("works with searchServerSide = false and pageSize = 0", function(done) {
        runGetPageMechanismTest(false, 0, done);
      });

      var runGetPageMechanismTest = function(serverSide, pageSize, done) {
        var dashboard = getNewDashboard();
        var testFilterComponent = getTestFilterComponent(serverSide, pageSize);

        makeAjaxSpy();

        dashboard.addComponent(testFilterComponent);

        testFilterComponent.once("getData:success", function() {
          if(serverSide) {
            addEvaluateExpectationsAfterGetPage(testFilterComponent, serverSide, pageSize, done);
          } else {
            addEvaluateExpectationsInsteadOfFilter(testFilterComponent, serverSide, pageSize, done);
          }
          testFilterComponent.manager.onFilterChange('');
        });

        dashboard.update(testFilterComponent);
      };

      var getTestFilterComponent = function(serverSide, pageSize) {
        return new FilterComponent($.extend(true, {}, testFilterDefaults, {
          queryDefinition: {
            dataAccessId: "testId",
            path: "/test.cda",
            // BaseQuery will not accept pageSize <= 0, it will default to it though
            pageSize: (pageSize > 0) ? pageSize : null
          },
          componentInput: {
            valuesArray: []
          },
          options: function() {
            return {
              component: {
                search: {
                  serverSide: serverSide
                }
              }
            };
          }
        }));
      };

      var makeAjaxSpy = function() {
        var firstCallToServer = true;
        spyOn($, 'ajax').and.callFake(function(params) {
          if(firstCallToServer) {
            params.success(defaultCdaJson);
            firstCallToServer = false;
          } else {
            params.success(onFilterChangeCdaJson);
          }
        });
      };

      addEvaluateExpectationsAfterGetPage = function(component, serverSide, pageSize, done) {
        component.manager.get('configuration').pagination.getPage =
          (function(originalGetPage) {
            return function() {
              return originalGetPage.apply(component, arguments).then(function(json) {
                evaluateExpectations(serverSide, pageSize, component.manager.get("model").children().models,
                  component.manager.get('configuration'));
                done();
                return json;
              });
            };
          })(component.manager.get('configuration').pagination.getPage);
      };

      addEvaluateExpectationsInsteadOfFilter = function(component, serverSide, pageSize, done) {
        component.manager.filter = function() {
          evaluateExpectations(serverSide, pageSize, component.manager.get("model").children().models,
            component.manager.get('configuration'));
          done();
        };
      };

      var evaluateExpectations = function(serverSide, pageSize, models, configuration) {
        expect(models[0].get("label")).toEqual("Default1");
        expect(models[1].get("label")).toEqual("Default2");
        expect(configuration.search.serverSide).toEqual(serverSide);
        expect(configuration.pagination.pageSize).toEqual((pageSize > 0) ? pageSize : Infinity );
        if (serverSide) {
          expect(models.length).toEqual(4);
          expect(models[2].get("label")).toEqual("ServerSide");
          expect(models[3].get("label")).toEqual("PageSize");
        } else {
          expect(models.length).toEqual(2);
        }
      };
    });
  });
});
