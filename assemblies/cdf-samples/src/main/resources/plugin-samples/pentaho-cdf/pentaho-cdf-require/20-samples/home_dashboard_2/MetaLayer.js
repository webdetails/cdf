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

var MetaLayerHome2 = {


  filterMeasure : "",
  productLine : null,
  territory: null,
  title: "Top Ten Customers",
  
  pieChartClicked: function(measure, value) {

    if(measure == "productLine" && MetaLayerHome2.territory == null) {
      MetaLayerHome2.productLine = value;
      MetaLayerHome2.filterMeasure =  " where ([Product].[All Products].[" + MetaLayerHome2.productLine + "])";
      MetaLayerHome2.title = "Top Ten for " + MetaLayerHome2.productLine;
    }

    if(measure == "productLine" && MetaLayerHome2.territory != null) {
      MetaLayerHome2.productLine = value;
      MetaLayerHome2.filterMeasure =  " where ([Product].[All Products].[" + MetaLayerHome2.productLine + "],[Markets].[All Markets].[" + MetaLayerHome2.territory + "])";
      MetaLayerHome2.title = "Top Ten for " + MetaLayerHome2.territory + "," + MetaLayerHome2.productLine;
    }

    if(measure == "territory") {
      MetaLayerHome2.territory = value;
      MetaLayerHome2.filterMeasure =  " where ([Markets].[All Markets].[" + MetaLayerHome2.territory + "])";
      MetaLayerHome2.productLine = null;
      MetaLayerHome2.title = "Top Ten for " + MetaLayerHome2.territory;
    }
    dashboard.fireChange("MetaLayerHome2.filterMeasure",MetaLayerHome2.filterMeasure);

  },

  territorySalesDataSource: {
    name: "territorySalesDataSource",
    //queryType: "sql",
    queryType: "mdx",
    catalog: "mondrian:/SteelWheels",
    jndi: "SampleData",
    query: function() {
      // return "SELECT OFFICES.TERRITORY, SUM(ORDERDETAILS.QUANTITYORDERED*ORDERDETAILS.PRICEEACH) SOLD_PRICE FROM ORDERS INNER JOIN ORDERDETAILS ON ORDERS.ORDERNUMBER = ORDERDETAILS.ORDERNUMBER INNER JOIN PRODUCTS ON ORDERDETAILS.PRODUCTCODE =PRODUCTS.PRODUCTCODE  INNER JOIN CUSTOMERS ON ORDERS.CUSTOMERNUMBER =CUSTOMERS.CUSTOMERNUMBER  INNER JOIN EMPLOYEES ON CUSTOMERS.SALESREPEMPLOYEENUMBER = EMPLOYEES.EMPLOYEENUMBER INNER JOIN OFFICES ON EMPLOYEES.OFFICECODE=OFFICES.OFFICECODE  GROUP BY OFFICES.TERRITORY ORDER BY 2 DESC";
      return "select NON EMPTY{[Markets].children} ON ROWS, [Measures].[Sales] on columns from [SteelWheelsSales]";
    }
  },
  
  territorySalesDefinition: {
    dataSource: "territorySalesDataSource",
    width: 420,
    height: 240,
    chartType: "PieChart",
    datasetType: "CategoryDataset",
    is3d: "false",
    byRow: "false",
    isStacked: "false",
    includeLegend: "false",
    title: "Click on territory",
    urlTemplate: "javascript:MetaLayerHome2.pieChartClicked('territory','{TERRITORY}')",
    parameterName: "TERRITORY",
    foregroundAlpha: 1
  },

  productLineSalesDataSource: {
    name: "productLineSalesDataSource",
    //queryType: "sql",
    queryType: "mdx",
    jndi: "SampleData",
    catalog: "mondrian:/SteelWheels",
    query: function() {
      // return "SELECT PRODUCTS.PRODUCTLINE, SUM(ORDERDETAILS.QUANTITYORDERED*ORDERDETAILS.PRICEEACH) REVENUE FROM ORDERS INNER JOIN ORDERDETAILS ON ORDERS.ORDERNUMBER = ORDERDETAILS.ORDERNUMBER INNER JOIN PRODUCTS ON ORDERDETAILS.PRODUCTCODE =PRODUCTS.PRODUCTCODE  INNER JOIN CUSTOMERS ON ORDERS.CUSTOMERNUMBER =CUSTOMERS.CUSTOMERNUMBER  INNER JOIN EMPLOYEES ON CUSTOMERS.SALESREPEMPLOYEENUMBER = EMPLOYEES.EMPLOYEENUMBER INNER JOIN OFFICES ON EMPLOYEES.OFFICECODE=OFFICES.OFFICECODE GROUP BY PRODUCTS.PRODUCTLINE ORDER BY 2 DESC";
      return "select NON EMPTY{[Product].children} ON ROWS, [Measures].[Sales] on columns from [SteelWheelsSales]";
    }
  },

  productLineSalesDefinition: {
    dataSource: "productLineSalesDataSource",
    width: 420,
    height: 240,
    chartType: "PieChart",
    datasetType: "CategoryDataset",
    is3d: "false",
    byRow: "false",
    isStacked: "false",
    includeLegend: "false",
    title: "Click on territory",
    urlTemplate: "javascript:MetaLayerHome2.pieChartClicked('productLine', '{PRODUCTLINE}')",
    parameterName: "PRODUCTLINE",
    foregroundAlpha: 1
  },

  topTenCustomerDataSource: {
    name: "topTenCustomerDataSource",
    queryType: "mdx",
    catalog: "mondrian:/SteelWheels",
    jndi: "SampleData",
    query: function() {
      var query = "select NON EMPTY {[Measures].[Sales]} ON COLUMNS, NON EMPTY TopCount([Customers].[All Customers].Children, 10.0, [Measures].[Sales]) ON ROWS from [SteelWheelsSales]" +
      MetaLayerHome2.filterMeasure;
      return query;
    }
  },

  topTenCustomerDefinition: {
    dataSource: "topTenCustomerDataSource",
    width: 500,
    height: 600,
    chartType: "BarChart",
    datasetType: "CategoryDataset",
    is3d: "false",
    byRow: "false",
    isStacked: "false",
    includeLegend: "false",
    domainLabelRotation: "0",
    title: "Top 10 Customers",
    parameterName: "PRODUCTLINE",
    foregroundAlpha: 1,
    orientation: 'horizontal'
  }
}
