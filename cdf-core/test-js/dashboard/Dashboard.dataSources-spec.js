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

define(["cdf/Dashboard.Clean", "amd!cdf/lib/underscore"], function(Dashboard, _) {

  /*
   * ## The CDF framework
   */
  describe("The CDF framework #", function() {

    var dashboard;

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
    });

    var sampleDataSourceObj = {
      queryType: "mdx",
      jndi: "SampleData",
      catalog: "mondrian:/SampleData",
      query: function() {
        return " SELECT NON EMPTY [Measures].[Budget] ON COLUMNS,"
          + " NON EMPTY ([Department].[All Departments]) ON ROWS"
          + " FROM [Quadrant Analysis]";
      }
    };

    /*
     * ## The CDF framework # initializes the dataSources holder object
     */
    it("initializes the dataSources holder object", function() {
      expect(dashboard.dataSources).toBeTruthy();
    });

    /*
     * ## The CDF framework # adds a data source when a name and a data source object is provided
     */
    it("adds a data source when a name and a data source object is provided", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);

      expect(dashboard.dataSources.sampleDataSource).toEqual(sampleDataSourceObj);
    });

    /*
     * ## The CDF framework # gets a data source given a data source name
     */
    it("gets a data source given a data source name", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);

      expect(dashboard.getDataSource("sampleDataSource")).toEqual(sampleDataSourceObj);
    });

    /*
     * ## The CDF framework # gets a data source given a definition object with a dataSource property holding a data source name
     */
    it("gets a data source given a definition object with a dataSource property holding a data source name", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);

      expect(dashboard.getDataSource({dataSource: "sampleDataSource"})).toEqual(sampleDataSourceObj);
    });

    /*
     * ## The CDF framework # by default doesn't override a data source when another with the same name exists
     */
    it("by default doesn't override a data source when another with the same name exists", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);
      var modSampleDataSourceObj = _.extend({}, sampleDataSourceObj, {queryType: "sql"});
      dashboard.addDataSource("sampleDataSource", modSampleDataSourceObj);

      expect(_.size(dashboard.dataSources)).toEqual(1);
      expect(dashboard.dataSources.sampleDataSource.queryType).toEqual("mdx");
    });

    /*
     * ## The CDF framework # overrides a data source when another with the same name exists and the override flag is true
     */
    it("overrides a data source when another with the same name exists and the override flag is true", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);
      var modSampleDataSourceObj = _.extend({}, sampleDataSourceObj, {queryType: "sql"});
      dashboard.addDataSource("sampleDataSource", modSampleDataSourceObj, true);

      expect(_.size(dashboard.dataSources)).toEqual(1);
      expect(dashboard.dataSources.sampleDataSource.queryType).toEqual("sql");
      expect(dashboard.dataSources.sampleDataSource).toEqual(modSampleDataSourceObj);
    });

    /*
     * ## The CDF framework # adds a data source when the data source name is contained in the data source object
     */
    it("adds a data source when the data source name is contained in the data source object", function() {
      var namedSampleDataSourceObj = _.extend({}, sampleDataSourceObj, {name: "namedSampleDataSource"});
      dashboard.addDataSource(namedSampleDataSourceObj);
      // name property is not included in the stored data source
      delete namedSampleDataSourceObj.name;

      expect(dashboard.dataSources.namedSampleDataSource).toEqual(namedSampleDataSourceObj);
    });

    /*
     * ## The CDF framework # by default doesn't override a data source with the same name when the name is contained in the data source object
     */
    it("by default doesn't override a data source with the same name when the name is contained in the data source object", function() {
      var namedSampleDataSourceObj = _.extend({}, sampleDataSourceObj, {name: "namedSampleDataSource"});
      dashboard.addDataSource(namedSampleDataSourceObj);
      var modNamedSampleDataSourceObj = _.extend({}, namedSampleDataSourceObj, {queryType: "sql"});
      dashboard.addDataSource(modNamedSampleDataSourceObj);
      // name property is not included in the stored data source
      delete namedSampleDataSourceObj.name;

      expect(_.size(dashboard.dataSources)).toEqual(1);
      expect(dashboard.dataSources.namedSampleDataSource).toEqual(namedSampleDataSourceObj);
      expect(dashboard.dataSources.namedSampleDataSource.queryType).toEqual("mdx");
    });

    /*
     * ## The CDF framework # overrides a data source with the same name when the name is contained in the data source object and the override flag is true
     */
    it("overrides a data source with the same name when the name is contained in the data source object and the override flag is true", function() {
      var namedSampleDataSourceObj = _.extend({}, sampleDataSourceObj, {name: "namedSampleDataSource"});
      dashboard.addDataSource(namedSampleDataSourceObj);
      var modNamedSampleDataSourceObj = _.extend({}, namedSampleDataSourceObj, {queryType: "sql"});
      dashboard.addDataSource(modNamedSampleDataSourceObj, true);
      // name property is not included in the stored data source
      delete modNamedSampleDataSourceObj.name;

      expect(_.size(dashboard.dataSources)).toEqual(1);
      expect(dashboard.dataSources.namedSampleDataSource).toEqual(modNamedSampleDataSourceObj);
      expect(dashboard.dataSources.namedSampleDataSource.queryType).toEqual("sql");
    });

    /*
     * ## The CDF framework # sets a data source, overiding any previous with the same name
     */
    it("sets a data source, overiding any previous with the same name", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);
      var modSampleDataSourceObj = _.extend({}, sampleDataSourceObj, {queryType: "sql"});
      dashboard.setDataSource("sampleDataSource", modSampleDataSourceObj);

      expect(_.size(dashboard.dataSources)).toEqual(1);
      expect(dashboard.dataSources.sampleDataSource).toEqual(modSampleDataSourceObj);
      expect(dashboard.dataSources.sampleDataSource.queryType).toEqual("sql");
    });

    /*
     * ## The CDF framework # sets a data source when the name is contained in the data source object, overiding any previous with the same name
     */
    it("sets a data source, overiding any previous with the same name", function() {
      var namedSampleDataSourceObj = _.extend({}, sampleDataSourceObj, {name: "namedSampleDataSource"});
      dashboard.addDataSource(namedSampleDataSourceObj);
      var modNamedSampleDataSourceObj = _.extend({}, namedSampleDataSourceObj, {queryType: "sql"});
      dashboard.setDataSource(modNamedSampleDataSourceObj);
      // name property is not included in the stored data source
      delete modNamedSampleDataSourceObj.name;

      expect(_.size(dashboard.dataSources)).toEqual(1);
      expect(dashboard.dataSources.namedSampleDataSource).toEqual(modNamedSampleDataSourceObj);
      expect(dashboard.dataSources.namedSampleDataSource.queryType).toEqual("sql");
    });

    /*
     * ## The CDF framework # generates a new query object given a data source name
     */
    it("generates a new query object given a data source name", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);

      var query = dashboard.getDataSourceQuery("sampleDataSource");

      expect(query.getOption("queryDef").queryType).toEqual(sampleDataSourceObj.queryType);
      expect(query.getOption("queryDef").catalog).toEqual(sampleDataSourceObj.catalog);
      expect(query.getOption("queryDef").jndi).toEqual(sampleDataSourceObj.jndi);
      expect(query.getOption("queryDef").query()).toEqual(sampleDataSourceObj.query());
    });

    /*
     * ## The CDF framework # generates a new query object given a definition object with a dataSource property holding an existing data source name
     */
    it("generates a new query object given a definition object with a dataSource property holding an existing data source name", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);

      var query = dashboard.getDataSourceQuery({dataSource: "sampleDataSource"});

      expect(query.getOption("queryDef").queryType).toEqual(sampleDataSourceObj.queryType);
      expect(query.getOption("queryDef").catalog).toEqual(sampleDataSourceObj.catalog);
      expect(query.getOption("queryDef").jndi).toEqual(sampleDataSourceObj.jndi);
      expect(query.getOption("queryDef").query()).toEqual(sampleDataSourceObj.query());
    });

    /*
     * ## The CDF framework # removes a data source given a data source name
     */
    it("removes a data source given a data source name", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);
      expect(dashboard.getDataSource("sampleDataSource")).toEqual(sampleDataSourceObj);

      dashboard.removeDataSource("sampleDataSource");
      expect(dashboard.getDataSource("sampleDataSource")).toEqual(undefined);
    });

    /*
     * ## The CDF framework # removes a data source given a definition object with a dataSource property holding a data source name
     */
    it("removes a data source given a definition object with a dataSource property holding a data source name", function() {
      dashboard.addDataSource("sampleDataSource", sampleDataSourceObj);
      expect(dashboard.getDataSource({dataSource: "sampleDataSource"})).toEqual(sampleDataSourceObj);

      dashboard.removeDataSource({dataSource: "sampleDataSource"});
      expect(dashboard.getDataSource("sampleDataSource")).toEqual(undefined);
    });
  });
});
