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

define(["cdf/Dashboard"], function (Dashboard) {
  describe("The CDF storage", function () {
    it("Correctly calls the initContext", function () {
      var dashboard = new Dashboard();
      setTimeout(function () {
        expect(dashboard._initContext).toBeDefined();
        expect(dashboard.context).toEqual({});
      }, 100);
    });
  });
});