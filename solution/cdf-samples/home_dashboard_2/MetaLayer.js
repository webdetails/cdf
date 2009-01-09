var MetaLayerHome2 = {
	
	territorySalesDefinition : {
		width: 420,
		height: 240,
		chartType: "PieChart",
		datasetType: "CategoryDataset",
		is3d: "false",
		byRow: "false",
		isStacked: "false",
		includeLegend: "false",
        title: "Click on territory",
		urlTemplate: "javascript:clickOnTerritory('{TERRITORY}')",
		parameterName: "TERRITORY",
		foregroundAlpha: 1,
		queryType: 'sql',
		jndi: "SampleData",
		query: function(){

            var query = "SELECT OFFICES.TERRITORY, SUM(ORDERDETAILS.QUANTITYORDERED*ORDERDETAILS.PRICEEACH) SOLD_PRICE FROM ORDERS INNER JOIN ORDERDETAILS ON ORDERS.ORDERNUMBER = ORDERDETAILS.ORDERNUMBER INNER JOIN PRODUCTS ON ORDERDETAILS.PRODUCTCODE =PRODUCTS.PRODUCTCODE  INNER JOIN CUSTOMERS ON ORDERS.CUSTOMERNUMBER =CUSTOMERS.CUSTOMERNUMBER  INNER JOIN EMPLOYEES ON CUSTOMERS.SALESREPEMPLOYEENUMBER = EMPLOYEES.EMPLOYEENUMBER INNER JOIN OFFICES ON EMPLOYEES.OFFICECODE=OFFICES.OFFICECODE  GROUP BY OFFICES.TERRITORY ORDER BY 2 DESC";

			return query;
		}
	},

	productLineSalesDefinition : {
		width: 420,
		height: 240,
		chartType: "PieChart",
		datasetType: "CategoryDataset",
		is3d: "false",
		byRow: "false",
		isStacked: "false",
		includeLegend: "false",
        title: "Click on territory",
		urlTemplate: "javascript:Dashboards.fireChange('productLine', '{PRODUCTLINE}')",
		parameterName: "PRODUCTLINE",
		foregroundAlpha: 1,
		queryType: 'sql',
		jndi: "SampleData",
		query: function(){

            var query = "SELECT PRODUCTS.PRODUCTLINE, SUM(ORDERDETAILS.QUANTITYORDERED*ORDERDETAILS.PRICEEACH) REVENUE FROM ORDERS INNER JOIN ORDERDETAILS ON ORDERS.ORDERNUMBER = ORDERDETAILS.ORDERNUMBER INNER JOIN PRODUCTS ON ORDERDETAILS.PRODUCTCODE =PRODUCTS.PRODUCTCODE  INNER JOIN CUSTOMERS ON ORDERS.CUSTOMERNUMBER =CUSTOMERS.CUSTOMERNUMBER  INNER JOIN EMPLOYEES ON CUSTOMERS.SALESREPEMPLOYEENUMBER = EMPLOYEES.EMPLOYEENUMBER INNER JOIN OFFICES ON EMPLOYEES.OFFICECODE=OFFICES.OFFICECODE GROUP BY PRODUCTS.PRODUCTLINE ORDER BY 2 DESC";

			return query;
		}
	},


	topTenCustomerDefinition : {
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
		urlTemplate: "#",
        urlTarget: "_self",
		parameterName: "PRODUCTLINE",
		foregroundAlpha: 1,
		queryType: 'mdx',
        catalog: 'solution:sampes/steel-wheels/analysis/steelwheels.mondrian.xml',
        orientation: 'horizontal',
		jndi: "SampleData",
		query: function(){

            var query = "select NON EMPTY {[Measures].[Sales]} ON COLUMNS, NON EMPTY TopCount([Customers].[All Customers].Children, 10.0, [Measures].[Sales]) ON ROWS from [SteelWheelsSales]";

			return query;
		}
	}
}
