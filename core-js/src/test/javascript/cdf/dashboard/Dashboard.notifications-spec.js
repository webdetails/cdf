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


define(["cdf/Dashboard.Clean", "amd!cdf/lib/jquery.blockUI"], function(Dashboard, $) {

  describe("The CDF framework #", function() {
    var dashboard;
    var blockUiOptions;
    var expectedOptions;

    beforeEach(function() {
      dashboard = new Dashboard();

      blockUiOptions = {
        message: "Test message",
        css: {
          color: 'red'
        },
        overlayCSS: {
          backgroundColor: 'blue'
        }
      };

      expectedOptions = $.extend({}, $.blockUI.defaults, blockUiOptions);
    });

    it("_setBlockUiOptions", function() {
      expect(dashboard.blockUiOptions).not.toBeDefined();
      dashboard._setBlockUiOptions(blockUiOptions);
      expect(dashboard.blockUiOptions).toEqual(expectedOptions);
    });

    it("blockUIwithDrag", function() {
      spyOn($, "blockUI");

      dashboard.blockUIwithDrag();
      expect($.blockUI).toHaveBeenCalledWith(undefined);

      dashboard._setBlockUiOptions(blockUiOptions);
      dashboard.blockUIwithDrag();
      expect($.blockUI).toHaveBeenCalledWith(expectedOptions);
    });

    it("should not blockUIwithDrag if the dashboard is in silent mode", function() {
      spyOn($, "blockUI");

      dashboard.isSilent = true;
      dashboard.blockUIwithDrag();
      expect($.blockUI).not.toHaveBeenCalled();

      dashboard._setBlockUiOptions(blockUiOptions);
      dashboard.blockUIwithDrag();
      expect($.blockUI).not.toHaveBeenCalled();
    });

    it("showProgressIndicator", function() {
      spyOn(dashboard, "blockUIwithDrag");
      dashboard.showProgressIndicator();
      expect(dashboard.blockUIwithDrag).toHaveBeenCalled();
    });

    it("should not showProgressIndicator if the dashboard is in silent mode", function() {
      spyOn(dashboard, "blockUIwithDrag");
      dashboard.isSilent = true;
      dashboard.showProgressIndicator();
      expect(dashboard.blockUIwithDrag).not.toHaveBeenCalled();
    });

    it("hideProgressIndicator", function() {
      spyOn($, "unblockUI");
      spyOn(dashboard, "resetRunningCalls");
      spyOn(dashboard, "showErrorTooltip");

      dashboard.hideProgressIndicator();
      expect($.unblockUI).toHaveBeenCalled();
      expect(dashboard.resetRunningCalls).not.toHaveBeenCalled();
      expect(dashboard.showErrorTooltip).toHaveBeenCalled();

      dashboard.hideProgressIndicator(true);
      expect($.unblockUI).toHaveBeenCalled();
      expect(dashboard.resetRunningCalls).toHaveBeenCalled();
      expect(dashboard.showErrorTooltip).toHaveBeenCalled();
    });

    it("should not call hideProgressIndicator if the dashboard is in silent mode", function() {
      spyOn($, "unblockUI");
      spyOn(dashboard, "resetRunningCalls");
      spyOn(dashboard, "showErrorTooltip");
      dashboard.isSilent = true;

      dashboard.hideProgressIndicator();
      expect($.unblockUI).not.toHaveBeenCalled();
      expect(dashboard.resetRunningCalls).not.toHaveBeenCalled();
      expect(dashboard.showErrorTooltip).not.toHaveBeenCalled();

      dashboard.hideProgressIndicator(true);
      expect($.unblockUI).not.toHaveBeenCalled();
      expect(dashboard.resetRunningCalls).not.toHaveBeenCalled();
      expect(dashboard.showErrorTooltip).not.toHaveBeenCalled();
    });
  });
});
