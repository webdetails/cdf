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


      // if no query type detected, when path and dataAccessId properties exist set it to cda
      obj = {path: "p", dataAccessId: "dAId"};
      expect(dashboard.detectQueryType(obj)).toEqual("cda");
      expect(obj.queryType).toEqual("cda");


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
