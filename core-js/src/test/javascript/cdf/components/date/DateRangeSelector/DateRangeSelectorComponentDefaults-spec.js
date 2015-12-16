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
  "cdf/components/date/DateRangeSelector/DateRangeSelectorComponentDefaults",
  "cdf/lib/jquery"
], function(Dashboard, DateRangeSelectorComponentDefaults, $) {

  /**
   * ## The Date Range Selector Defaults
   */
  describe("The Date Range Selector Defaults #", function() {

    it("returns proper defaults object", function() {
      
      var attributes = DateRangeSelectorComponentDefaults.attributes;

      expect(attributes.inputFormat).toBe("YYYY-MM-DD");
      expect(attributes.inputParameters.length).toBe(4);
      expect(attributes.inputParameters[0]).toBe("granularity");
      expect(attributes.inputParameters[1]).toBe("precision");
      expect(attributes.inputParameters[2]).toBe("start");
      expect(attributes.inputParameters[3]).toBe("end");
    });
  });
});