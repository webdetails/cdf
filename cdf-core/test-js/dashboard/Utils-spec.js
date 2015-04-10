/*!
* Copyright 2002 - 2015 Webdetails, a Pentaho company.  All rights reserved.
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

define(["cdf/dashboard/Utils"], function(Utils) {

  /**
   * ## The Utils class
   */
  describe("The Utils class #", function() {

    /**
     * ## The Utils class # Gets the Query parameters
     */
    it("Gets the Query parameters", function() {
      spyOn(Utils, "getLocationSearchString")
        .and.returnValue("?debug=true&randomName&noValue=&bug=false");

      expect(Utils.getQueryParameter("debug")).toBe("true");
      expect(Utils.getQueryParameter("bug")).toBe("false");
      expect(Utils.getQueryParameter("randomName")).toBe("");
      expect(Utils.getQueryParameter("noValue")).toBe("");
      expect(Utils.getQueryParameter("notThere")).toBe("");
    });

    /**
     * ## The Utils class # Date Parse
     */
    it("Date Parse", function() {
      function expectDateParse(date, mask, expectedResult) {
        var result = Utils.dateParse(date, mask).toString();
        expect(result.indexOf(expectedResult) > -1).toBe(true);
      }

      expectDateParse(null, 'DD-MM-YY', 'Invalid Date');
      expectDateParse('13-08-1983', 'DD-MM-YYYY', 'Sat Aug 13 1983');
      expectDateParse('Wednesday, February 18, 2015 12:00 AM', 'LLLL', 'Wed Feb 18 2015');
    });

  });

});
