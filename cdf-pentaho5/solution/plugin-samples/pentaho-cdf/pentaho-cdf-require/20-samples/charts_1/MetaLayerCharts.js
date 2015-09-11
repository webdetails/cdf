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

var MetaLayerCharts = {
  /*startDate: MetaLayer.getLastMonthDate(), // Default start date
   endDate: MetaLayer.getCurrentDate(), // Default end date
   startMonth: MetaLayer.getMonth(), // Default month date*/
};

MetaLayerCharts = {

  regionsMeasure: "[Region].[All Regions]",
  selectedRegionMeasure: "[Region].[All Regions]",
  departmentMeasure: "[Department].[All Departments]",

  pieChartClicked: function(value) {
    if(value == "All Regions") {
      MetaLayerCharts.regionsMeasure = "[Region].[All Regions].Children";
      dashboard.fireChange("MetaLayerCharts.regionsMeasure", MetaLayerCharts.regionsMeasure);
    } else {
      MetaLayerCharts.selectedRegionMeasure = "[Region].[All Regions].[" + value + "]";
      dashboard.fireChange("MetaLayerCharts.selectedRegionMeasure", MetaLayerCharts.selectedRegionMeasure);
    }
  },

  barChartClicked: function(value) {

    MetaLayerCharts.departmentMeasure = "[Department].[All Departments].[" + value + "]";
    dashboard.fireChange("MetaLayerCharts.departmentMeasure", MetaLayerCharts.departmentMeasure);
  },

  pieChartDataSource: {
    name: "pieChartDataSource",
    queryType: "mdx",
    jndi: "SampleData",
    catalog: "mondrian:/SampleData",
    query: function() {
      return "with member [Measures].[Variance Percent] as '([Measures].[Variance] / [Measures].[Budget])'," +
        " format_string = IIf(((([Measures].[Variance] / [Measures].[Budget]) * 100.0) > 2.0), \"|#.00%|style='green'\"," +
        " IIf(((([Measures].[Variance] / [Measures].[Budget]) * 100.0) < 0.0), \"|#.00%|style='red'\", \"#.00%\"))" +
        " select NON EMPTY {[Measures].[Actual], [Measures].[Budget], [Measures].[Variance], [Measures].[Variance Percent]} ON COLUMNS," +
        " NON EMPTY ( " + MetaLayerCharts.regionsMeasure + " ) ON ROWS " +
        " from [Quadrant Analysis]";
    }
  },

  pieChartDefinition: {
    dataSource: "pieChartDataSource",
    width: 300,
    height: 200,
    chartType: "PieChart",
    datasetType: "CategoryDataset",
    is3d: "true",
    isStacked: "true",
    includeLegend: "false",
    foregroundAlpha: 0.7,
    urlTemplate: "javascript: require(['cdf/dashboard/Utf8Encoder'], function(Utf8Encoder) { MetaLayerCharts.pieChartClicked( Utf8Encoder.encode_prepare('{region}') ) })",
    parameterName: "region",
    titleKey: "chartsamples.piechart.title"
  },

  barChartDataSource: {
    name: "barChartDataSource",
    queryType: "mdx",
    jndi: "SampleData",
    catalog: "mondrian:/SampleData",
    query: function() {
      return "with member [Measures].[Variance Percent] as '([Measures].[Variance] / [Measures].[Budget])'," +
        " format_string = IIf(((([Measures].[Variance] / [Measures].[Budget]) * 100.0) > 2.0), \"|#.00%|style='green'\"," +
        " IIf(((([Measures].[Variance] / [Measures].[Budget]) * 100.0) < 0.0), \"|#.00%|style='red'\", \"#.00%\"))" +
        " select NON EMPTY {[Measures].[Actual], [Measures].[Budget], [Measures].[Variance], [Measures].[Variance Percent]} ON COLUMNS," +
        " NON EMPTY ([Department].[All Departments].Children ) ON ROWS " +
        " from [Quadrant Analysis]" +
        " where (" + MetaLayerCharts.selectedRegionMeasure + ")";
    }
  },

  barChartDefinition: {
    dataSource: "barChartDataSource",
    width: 300,
    height: 250,
    chartType: "BarChart",
    datasetType: "CategoryDataset",
    is3d: "true",
    isStacked: "true",
    includeLegend: "false",
    foregroundAlpha: 0.7,
    titleKey: "chartsamples.barchart.title",
    urlTemplate: "javascript: require(['cdf/dashboard/Utf8Encoder'], function(Utf8Encoder) {MetaLayerCharts.barChartClicked( Utf8Encoder.encode_prepare('{department}') ) })",
    parameterName: "department"
  },

  dialChartDataSource: {
    name: "dialChartDataSource",
    queryType: "mdx",
    jndi: "SampleData",
    catalog: "mondrian:/SampleData",
    query: function() {
      return " select NON EMPTY [Measures].[Budget] ON COLUMNS," +
        " NON EMPTY (" + MetaLayerCharts.departmentMeasure + " ) ON ROWS " +
        " from [Quadrant Analysis]";
    }
  },

  dialChartDefinition: {
    dataSource: "dialChartDataSource",
    width: 300,
    height: 200,
    chartType: "DialChart",
    is3d: 'true',
    titleKey: "chartsamples.dialchart.title",
    //colors: ["#F16C3A","#FFFF00","#B0D837"],
    intervals: [7000000, 70000000, 150000000],
    includeLegend: true
  }
};
