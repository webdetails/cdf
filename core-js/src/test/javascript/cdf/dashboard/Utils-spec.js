/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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

define(["cdf/dashboard/Utils", "cdf/lib/CCC/cdo"], function(Utils, cdo) {

  /**
   * ## The Utils class
   */
  describe("The Utils class #", function() {

    /**
     * ## The Utils class # gets the Query parameters
     */
    it("gets the Query parameters", function() {
      spyOn(Utils, "getLocationSearchString")
        .and.returnValue("?debug=true&randomName&noValue=&bug=false");

      expect(Utils.getQueryParameter("debug")).toBe("true");
      expect(Utils.getQueryParameter("bug")).toBe("false");
      expect(Utils.getQueryParameter("randomName")).toBe("");
      expect(Utils.getQueryParameter("noValue")).toBe("");
      expect(Utils.getQueryParameter("notThere")).toBe("");
    });

    /**
     * ## The Utils class # formats numbers
     */
    it("formats numbers", function() {
      var defaultMask = cdo.format.language().number().mask();
      var defaultMask_en_us = cdo.format.language('en-us').number().mask();
      var defaultMask_en_gb = cdo.format.language('en-gb').number().mask();
      var defaultMask_pt_pt = cdo.format.language('pt-pt').number().mask();

      expect(Utils.numberFormat(123456, "#AC")).toEqual("123k$");
      expect(Utils.numberFormat(123456, "#AC", 'en-us')).toEqual("123k$");
      expect(Utils.numberFormat(123456, "#AC", 'en-gb')).toEqual("123k£");
      expect(Utils.numberFormat(123456, "#AC", 'pt-pt')).toEqual("123k€");

      //check if default mask values were not changed by numberFormat
      expect(cdo.format.language().number().mask()).toEqual(defaultMask);
      expect(cdo.format.language('en-us').number().mask()).toEqual(defaultMask_en_us);
      expect(cdo.format.language('en-gb').number().mask()).toEqual(defaultMask_en_gb);
      expect(cdo.format.language('pt-pt').number().mask()).toEqual(defaultMask_pt_pt);
    });

    /**
     * ## The Utils class # parses dates
     */
    it("parses dates", function() {
      function expectDateParse(date, mask, expectedResult) {
        var result = Utils.dateParse(date, mask).toString();
        expect(result.indexOf(expectedResult) > -1).toBe(true);
      }

      expectDateParse(null, 'DD-MM-YY', 'Invalid Date');
      expectDateParse('13-08-1983', 'DD-MM-YYYY', 'Sat Aug 13 1983');
      expectDateParse('Wednesday, February 18, 2015 12:00 AM', 'LLLL', 'Wed Feb 18 2015');
    });

    var expectEscapeHtml = function(value, expected) {
      expect(Utils.escapeHtml(value)).toEqual(expected);
    };

    /**
     * ## The Utils class # properly escapes html
     */
    it("properly escapes html", function() {
      var script = "<script>alert('Gotcha!')</script>";
      var escapedScript = "&lt;script&gt;alert(&#39;Gotcha!&#39;)&lt;/script&gt;";
      var unescapedHtml = "<p>Hello \"person\" && 'being'</p>";
      var fullyEscapedHtml = "&lt;p&gt;Hello &#34;person&#34; &amp;&amp; &#39;being&#39;&lt;/p&gt;";
      var halfEscapedHtml = fullyEscapedHtml + script;

      expectEscapeHtml(Utils.escapeHtml(unescapedHtml), fullyEscapedHtml);
      expectEscapeHtml(Utils.escapeHtml(halfEscapedHtml), fullyEscapedHtml + escapedScript);
      expectEscapeHtml(Utils.escapeHtml(fullyEscapedHtml), fullyEscapedHtml);
    });

    /**
     * ## The Utils class # doesn't re-escape html
     */
    it("already escaped html is not re-escaped", function() {
      var alphabeticText = "&lt;&quot;&lsaquo;&Yuml;";
      var numericText = "&#09;&#55203;";
      var hexText = "&#x09;#D7A3;";

      expectEscapeHtml(alphabeticText, alphabeticText);
      expectEscapeHtml(numericText, numericText);
      expectEscapeHtml(hexText, hexText);
    });

    it("returns an empty string if it receives anything other than a string", function() {
      var nonStringArray = [{question: "answer"}, 42, 42.7, null, undefined, function(){}, false];
      for(var i = 0; i < nonStringArray.length; i++) {
        expectEscapeHtml(nonStringArray[i], "");
      }
    });
  });
});
