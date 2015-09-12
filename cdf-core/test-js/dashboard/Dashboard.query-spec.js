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

define(["cdf/Dashboard.Clean", "cdf/lib/jquery"], function(Dashboard, $) {

  /*
   * ## The CDF framework
   */
  describe("The CDF framework #", function() {

    var dashboard;

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
    });

    /**************************************
     * Test Query operations *
     **************************************/

    /*
     * Auxiliary objects
     */
    var sampleCdaDataSourceObj = {
      queryType: "cda",
      dataAccessId: "SampleData",
      path: "mondrian:/SampleData"
    };
    var sampleMdxDataSourceObj = {
      queryType: "mdx",
      jndi: "SampleData",
      catalog: "mondrian:/SampleData",
      query: function() { return "SELECT *"; }
    };

    /*
     * ## The CDF framework # generates queries given a query type and an options object
     */
    it("generates queries given a query type and an options object", function() {
      spyOn(dashboard.queryFactories, 'getNew').and.callThrough();
      dashboard.getQuery("cda", sampleCdaDataSourceObj);

      expect(dashboard.queryFactories.getNew).toHaveBeenCalledWith("Query", "cda", sampleCdaDataSourceObj);
    });

    /*
     * ## The CDF framework # generates queries given an options object with a queryType property
     */
    it("generates queries given an options object with a queryType property", function() {
      spyOn(dashboard.queryFactories, 'getNew').and.callThrough();
      dashboard.getQuery(sampleCdaDataSourceObj);

      expect(dashboard.queryFactories.getNew).toHaveBeenCalledWith("Query", "cda", sampleCdaDataSourceObj);

      dashboard.getQuery(undefined, sampleCdaDataSourceObj);

      expect(dashboard.queryFactories.getNew).toHaveBeenCalledWith("Query", "cda", sampleCdaDataSourceObj);
    });

    /*
     * ## The CDF framework # generates queries given an options object with a dataSource property
     */
    it("generates queries given an options object with a dataSource property", function() {
      dashboard.addDataSource("sampleCdaDataSourceObj", sampleCdaDataSourceObj);
      spyOn(dashboard.queryFactories, 'getNew').and.callThrough();
      dashboard.getQuery({dataSource: "sampleCdaDataSourceObj"});

      expect(dashboard.queryFactories.getNew).toHaveBeenCalledWith("Query", "cda", sampleCdaDataSourceObj);

      dashboard.getQuery(undefined, {dataSource: "sampleCdaDataSourceObj"});

      expect(dashboard.queryFactories.getNew).toHaveBeenCalledWith("Query", "cda", sampleCdaDataSourceObj);
    });

    /*
     * ## The CDF framework # detects and sets the queryType
     */
    it("detects and sets the queryType", function() {
      var obj = {};
      // if no query type detected returns undefined
      expect(dashboard.detectQueryType(obj)).toEqual(undefined);
      expect(obj.queryType).toEqual(undefined);

      // given a legacy definition object with a queryType property
      obj = {queryType: "mdx"};
      expect(dashboard.detectQueryType(obj)).toEqual("mdx");
      expect(obj.queryType).toEqual("mdx");

      // if no query type detected, when query property exists set it to legacy
      obj = {query: "select *"};
      expect(dashboard.detectQueryType(obj)).toEqual("legacy");
      expect(obj.queryType).toEqual("legacy");

      // if no query type detected, when path and dataAccessId properties exist set it to cda
      obj = {path: "p", dataAccessId: "dAId"};
      expect(dashboard.detectQueryType(obj)).toEqual("cda");
      expect(obj.queryType).toEqual("cda");

      // given a dataSource property containing a valid data source name
      dashboard.addDataSource("sampleMdxDataSourceObj", sampleMdxDataSourceObj);
      expect(dashboard.detectQueryType({dataSource: "sampleMdxDataSourceObj"})).toEqual("mdx");
      expect(dashboard.getDataSource("sampleMdxDataSourceObj").queryType).toEqual("mdx");

      // given a dataSource property containing a valid data source name with no query type
      obj = $.extend({}, sampleCdaDataSourceObj);
      obj.queryType = undefined;
      dashboard.addDataSource("sampleCdaDataSourceObj", obj);
      expect(dashboard.getDataSource("sampleCdaDataSourceObj").queryType).toEqual(undefined);
      expect(dashboard.detectQueryType({dataSource: "sampleCdaDataSourceObj"})).toEqual("cda");
      expect(dashboard.getDataSource("sampleCdaDataSourceObj").queryType).toEqual("cda");
    });
  });
});
