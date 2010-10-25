<?xml version="1.0" encoding="UTF-8"?>
<action-sequence> 
	<title>Drillable Bar Chart sourced from OLAP Source</title>
	<version>1</version>
	<logging-level>WARN</logging-level>
	<documentation> 
	<author>Pedro Alves</author>  
		<description>This demonstrates a chart with the ChartComponent in the action sequence with data is sourced from an OLAP cube. Common settings are specified in the associated resource xml file.</description>  
		<help/>  
		<result-type/> 
	</documentation>

	<inputs> 
		<JNDI type="string"> 
			<sources> 
				<request>jndi</request> 
			</sources>  
			<default-value/> 
		</JNDI>  
		<QUERY type="string"> 
			<sources> 
				<request>query</request> 
			</sources>  
			<default-value/> 
		</QUERY>  
		<CUBE type="string"> 
			<sources> 
				<request>cube</request> 
			</sources>  
			<default-value/> 
		</CUBE>  
		<ROLE type="string"> 
			<sources> 
				<session>role</session> 
			</sources>  
			<default-value/> 
		</ROLE>  
		<CATALOG type="string"> 
			<sources> 
				<request>catalog</request> 
			</sources>  
			<default-value/>
		</CATALOG>  
		<WIDTH type="string"> 
			<sources> 
				<request>width</request> 
			</sources>  
			<default-value>200</default-value>
		</WIDTH>  
		<HEIGHT type="string"> 
			<sources> 
				<request>height</request> 
			</sources>  
			<default-value>200</default-value>
		</HEIGHT>  
		<BYROW type="string"> 
			<sources> 
				<request>byRow</request> 
			</sources>  
			<default-value>false</default-value>
		</BYROW>  
		<CHARTTYPE type="string">
			<sources>
				<request>chartType</request>
			</sources>
			<default-value>AreaChart</default-value>
		</CHARTTYPE>  
		
		<TITLE type="string">
			<sources>
				<request>title</request>
			</sources>
			<default-value/>
		</TITLE>
		<TITLEFONTFAMILY type="string">
			<sources>
				<request>titleFontFamily</request>
			</sources>
			<default-value>Helvetica</default-value>
		</TITLEFONTFAMILY>
		<TITLEFONTSIZE type="string">
			<sources>
				<request>titleFontSize</request>
			</sources>
			<default-value>12</default-value>
		</TITLEFONTSIZE>
		<TITLEFONTISBOLD type="string">
			<sources>
				<request>titleFontIsBold</request>
			</sources>
			<default-value>false</default-value>
		</TITLEFONTISBOLD> 
		<TITLEFONTISITALIC type="string">
			<sources>
				<request>titleFontIsItalic</request>
			</sources>
			<default-value>false</default-value>
		</TITLEFONTISITALIC> 
		
		<SUBTITLE type="string">
			<sources>
				<request>subtitle</request>
			</sources>
			<default-value></default-value>
		</SUBTITLE>  
		
		<DOMAINTITLE type="string">
			<sources>
				<request>domainTitle</request>
			</sources>
			<default-value></default-value>
		</DOMAINTITLE>  
		<DOMAINTITLEFONTFAMILY type="string">
			<sources>
				<request>domainTitleFontFamily</request>
			</sources>
			<default-value>Helvetica</default-value>
		</DOMAINTITLEFONTFAMILY>
		<DOMAINTITLEFONTSIZE type="string">
			<sources>
				<request>domainTitleFontSize</request>
			</sources>
			<default-value>10</default-value>
		</DOMAINTITLEFONTSIZE>
		<DOMAINTITLEFONTISBOLD type="string">
			<sources>
				<request>domainTitleFontIsBold</request>
			</sources>
			<default-value>false</default-value>
		</DOMAINTITLEFONTISBOLD> 
		<DOMAINTITLEFONTISITALIC type="string">
			<sources>
				<request>domainTitleFontIsItalic</request>
			</sources>
			<default-value>false</default-value>
		</DOMAINTITLEFONTISITALIC> 
		
		<RANGETITLE type="string">
			<sources>
				<request>rangeTitle</request>
			</sources>
			<default-value></default-value>
		</RANGETITLE> 
		<RANGETITLEFONTFAMILY type="string">
			<sources>
				<request>rangeTitleFontFamily</request>
			</sources>
			<default-value>Helvetica</default-value>
		</RANGETITLEFONTFAMILY>
		<RANGETITLEFONTSIZE type="string">
			<sources>
				<request>rangeTitleFontSize</request>
			</sources>
			<default-value>10</default-value>
		</RANGETITLEFONTSIZE>
		<RANGETITLEFONTISBOLD type="string">
			<sources>
				<request>rangeTitleFontIsBold</request>
			</sources>
			<default-value>false</default-value>
		</RANGETITLEFONTISBOLD> 
		<RANGETITLEFONTISITALIC type="string">
			<sources>
				<request>rangeTitleFontIsItalic</request>
			</sources>
			<default-value>false</default-value>
		</RANGETITLEFONTISITALIC> 
		
		<DATASETTYPE type="string">
			<sources>
				<request>datasetType</request>
			</sources>
			<default-value>CategoryDataset</default-value>
		</DATASETTYPE>  
		
		<DOMAINPERIODTYPE type="string">
			<sources>
				<request>domainPeriodType</request>
			</sources>
			<default-value>Day</default-value>
		</DOMAINPERIODTYPE>  
		
		<ORIENTATION type="string">
			<sources>
				<request>orientation</request>
			</sources>
			<default-value>vertical</default-value>
		</ORIENTATION>  
		<IS3D type="string">
			<sources>
				<request>is3d</request>
			</sources>
			<default-value>false</default-value>
		</IS3D>  
		<ISSTACKED type="string">
			<sources>
				<request>isStacked</request>
			</sources>
			<default-value>false</default-value>
		</ISSTACKED>
		
		<DOMAINTICKFONTFAMILY type="string">
			<sources>
				<request>domainTickFontFamily</request>
			</sources>
			<default-value>Helvetica</default-value>
		</DOMAINTICKFONTFAMILY>
		<DOMAINTICKFONTSIZE type="string">
			<sources>
				<request>domainTickFontSize</request>
			</sources>
			<default-value>10</default-value>
		</DOMAINTICKFONTSIZE>
		
		<DOMAINTICKFONTISBOLD type="string">
			<sources>
				<request>domainTickFontIsBold</request>
			</sources>
			<default-value>false</default-value>
		</DOMAINTICKFONTISBOLD> 
		<DOMAINTICKFONTISITALIC type="string">
			<sources>
				<request>domainTickFontIsItalic</request>
			</sources>
			<default-value>false</default-value>
		</DOMAINTICKFONTISITALIC> 

		<DOMAINLABELROTATIONDIR type="string">
			<sources>
				<request>domainLabelRotationDir</request>
			</sources>
			<default-value>down</default-value>
		</DOMAINLABELROTATIONDIR>  
		<DOMAINLABELROTATION type="string">
			<sources>
				<request>domainLabelRotation</request>
			</sources>
			<default-value>.9</default-value>
		</DOMAINLABELROTATION>
		
		
		<RANGETICKFONTFAMILY type="string">
			<sources>
				<request>rangeTickFontFamily</request>
			</sources>
			<default-value>Helvetica</default-value>
		</RANGETICKFONTFAMILY>
		<RANGETICKFONTSIZE type="string">
			<sources>
				<request>rangeTickFontSize</request>
			</sources>
			<default-value>10</default-value>
		</RANGETICKFONTSIZE>
		<RANGETICKFONTISBOLD type="string">
			<sources>
				<request>rangeTickFontIsBold</request>
			</sources>
			<default-value>false</default-value>
		</RANGETICKFONTISBOLD> 
		<RANGETICKFONTISITALIC type="string">
			<sources>
				<request>rangeTickFontIsItalic</request>
			</sources>
			<default-value>false</default-value>
		</RANGETICKFONTISITALIC> 
		
		<URLTEMPLATE type="string">
			<sources>
				<request>urlTemplate</request>
			</sources>
			<default-value>javascript:;</default-value>
		</URLTEMPLATE>  
		<USEBASEURL type="string">
			<sources>
				<request>useBaseUrl</request>
			</sources>
			<default-value>false</default-value>
		</USEBASEURL>  
		<URLTARGET type="string">
			<sources>
				<request>urlTarget</request>
			</sources>
			<default-value>_self</default-value>
		</URLTARGET>  
		<PARAMETERNAME type="string">
			<sources>
				<request>parameterName</request>
			</sources>
			<default-value></default-value>
		</PARAMETERNAME>
		<SERIESNAME type="string">
			<sources>
				<request>seriesName</request>
			</sources>
			<default-value></default-value>
		</SERIESNAME>
		<BARSERIES type="string">
			<sources>
				<request>barSeries</request>
			</sources>
			<default-value></default-value>
		</BARSERIES>
		<LINESERIES type="string">
			<sources>
				<request>lineSeries</request>
			</sources>
			<default-value></default-value>
		</LINESERIES>
		
		<INCLUDELEGEND type="string">
			<sources>
				<request>includeLegend</request>
			</sources>
			<default-value>true</default-value>
		</INCLUDELEGEND> 
		<LEGENDFONTFAMILY type="string">
			<sources>
				<request>legendFontFamily</request>
			</sources>
			<default-value>Helvetica</default-value>
		</LEGENDFONTFAMILY> 
		<LEGENDFONTSIZE type="string">
			<sources>
				<request>legendFontSize</request>
			</sources>
			<default-value>12</default-value>
		</LEGENDFONTSIZE>
		<LEGENDFONTISBOLD type="string">
			<sources>
				<request>legendFontIsBold</request>
			</sources>
			<default-value>false</default-value>
		</LEGENDFONTISBOLD> 
		<LEGENDFONTISITALIC type="string">
			<sources>
				<request>legendFontIsItalic</request>
			</sources>
			<default-value>false</default-value>
		</LEGENDFONTISITALIC> 
		
		<FOREGROUNDALPHA type="string">
			<sources>
				<request>foregroundAlpha</request>
			</sources>
			<default-value>1</default-value>
		</FOREGROUNDALPHA> 
		<BACKGROUNDALPHA type="string">
			<sources>
				<request>backgroundAlpha</request>
			</sources>
			<default-value>1</default-value>
		</BACKGROUNDALPHA> 
		
		<INTERIORGAP type="string">
			<sources>
				<request>interiorGap</request>
			</sources>
			<default-value>0.085</default-value>
		</INTERIORGAP> 
		
		<QUERY_TYPE type="string">
			<sources>
				<request>queryType</request>
			</sources>
			<default-value>mdx</default-value>
		</QUERY_TYPE> 
		
		<MAXBARWIDTH type="string">
			<sources>
				<request>maxBarWidth</request>
			</sources>
			<default-value>1</default-value>
		</MAXBARWIDTH>
		<BACKGROUND type="string">
			<sources>
				<request>backgroundColor</request>
			</sources>
			<default-value>#FFFFFF</default-value>
		</BACKGROUND> 
		<PLOTBACKGROUND type="string">
			<sources>
				<request>plotbgcolor</request>
			</sources>
			<default-value>#FFFFFF</default-value>
		</PLOTBACKGROUND> 
		<TOPCOUNT type="string">
			<sources>
				<request>topCount</request>
			</sources>
			<default-value>0</default-value>
		</TOPCOUNT> 
		<TOPCOUNTAXIS type="string">
			<sources>
				<request>topCountAxis</request>
			</sources>
			<default-value>rows</default-value>
		</TOPCOUNTAXIS> 
		<TOOLTIPCONTENT type="string">
			<sources>
				<request>tooltipContent</request>
			</sources>
			<default-value>({1},{0}) = {2})</default-value>
		</TOOLTIPCONTENT>
		<TOOLTIPYFORMAT type="string">
			<sources>
				<request>tooltipYContent</request>
			</sources>
			<default-value>###,###,##0.###</default-value>
		</TOOLTIPYFORMAT>
		<MARKERSVISIBLE type="string">
			<sources>
				<request>markersVisible</request>
			</sources>
			<default-value>false</default-value>
		</MARKERSVISIBLE>
		<DIRECTORY type="string">
			<sources>
				<request>directory</request>
			</sources>
			<default-value/>
		</DIRECTORY>
		<TRANSFORMATION type="string">
			<sources>
				<request>transformation</request>
			</sources>
			<default-value/>
		</TRANSFORMATION>
		<IMPORTSTEP type="string">
			<sources>
				<request>importStep</request>
			</sources>
			<default-value>Output</default-value>
		</IMPORTSTEP>
		<PARAMETER1 type="string">
			<sources>
				<request>parameter1</request>
			</sources>
			<default-value/>
		</PARAMETER1>
		<PARAMETER2 type="string">
			<sources>
				<request>parameter2</request>
			</sources>
			<default-value/>
		</PARAMETER2>
		<PARAMETER3 type="string">
			<sources>
				<request>parameter3</request>
			</sources>
			<default-value/>
		</PARAMETER3>
		<PARAMETER4 type="string">
			<sources>
				<request>parameter4</request>
			</sources>
			<default-value/>
		</PARAMETER4>
		<PARAMETER5 type="string">
			<sources>
				<request>parameter5</request>
			</sources>
			<default-value/>
		</PARAMETER5>
		<PARAMETER6 type="string">
			<sources>
				<request>parameter6</request>
			</sources>
			<default-value/>
		</PARAMETER6>
		<PARAMETER7 type="string">
			<sources>
				<request>parameter7</request>
			</sources>
			<default-value/>
		</PARAMETER7>
		<PARAMETER8 type="string">
			<sources>
				<request>parameter8</request>
			</sources>
			<default-value/>
		</PARAMETER8>
		<PARAMETER9 type="string">
			<sources>
				<request>parameter9</request>
			</sources>
			<default-value/>
		</PARAMETER9>
		<CDAFILE type ="string">
			<sources>
				<request>cdaFile</request>
			</sources>
			<default-value/>
		</CDAFILE>
		<DATAACCESSID type ="string">
			<sources>
				<request>dataAccessId</request>
			</sources>
			<default-value/>
		</DATAACCESSID>
		<CDAPARAMETERSTRING type ="string">
			<sources>
				<request>cdaParameterString</request>
			</sources>
			<default-value/>
		</CDAPARAMETERSTRING>
	</inputs>

	<outputs> 
		<image-tag type="string"> 
		</image-tag> 
	</outputs>

  <actions> 

	<actions>
		<condition><![CDATA[QUERY_TYPE == "mdx"]]></condition>
		
		<action-definition> 
			<component-name>MDXLookupRule</component-name>
			<action-type>OLAP</action-type>
			<action-inputs> 
				<QUERY type="string"/>  
				<JNDI type="string"/>  
				<CATALOG type="string"/>  
				<CUBE type="string"/>
				<ROLE type="string"/>
			</action-inputs>
			<action-resources/> 
			<action-outputs> 
				<query-results type="result-set" mapping="query_result"/> 
			</action-outputs>
			<component-definition> 
				<location><![CDATA[mondrian]]></location>  
				<query>{QUERY}</query>  
				<jndi>{JNDI}</jndi> 
				<cube>{CUBE}</cube>
				<role>{ROLE}</role>
				<catalog>{CATALOG}</catalog>
			</component-definition> 
		</action-definition>

		<action-definition> 
			<component-name>JavascriptRule</component-name>
			<action-type>Format MDX Results</action-type>
			<action-inputs> 
				<CHARTTYPE type="string"/>
				<URLTEMPLATE type="string"/>
				<DATASETTYPE type="string"/>
				<TOPCOUNT type="string" />
				<TOPCOUNTAXIS type="string" />
				<query_result type="result-set"/> 
			</action-inputs>
			<action-outputs> 
				<newResults type="result-set"/> 
				<URLTEMPLATE2 type="string"/>
			</action-outputs>
			<component-definition> 
				<script><![CDATA[

				// My code isn't usually this bad. Need to take some time to refactor it
				// On my defense, all I can say is that it works (at least for me :p )

				out.println("AXIS: " + TOPCOUNTAXIS);

				var newResults = new JavaScriptResultSet();

				var rsmd = query_result.getMetaData() ;
				var colHeaders = rsmd.getColumnHeaders() ;
				var rowHeaders = rsmd.getRowHeaders() ;
				var colCount = rsmd.getColumnCount() ;
				var rowCount = query_result.getRowCount() ;
				var colIteraction = colCount;
				var rowIteraction = rowCount;

				var resultSetHeader = new Array(colCount) ;
				//resultSetHeader[0] = 'Locations';
				//for(i = 0; i < colCount; i++){
				//	resultSetHeader[i+1] = colHeaders[0][i].toString() + '';
				//}
				//newResults.setColumnHeaders( resultSetHeader);

				if(DATASETTYPE == 'CategoryDataset'){

					out.println("CATEGORY DATASET");
					newResults.setColumnHeaders('Series','Date','Measure');

					if (query_result != null)
					{

						//Build Header
						var resultSetHeader = new Array(colCount) ;
						resultSetHeader[0] = 'Locations';

						for(i = 0; i < colCount; i++){

							resultSetHeader[i+1] = colHeaders[0][i].toString() + '';
							//out.println("HEADER: " + colHeaders[0][i].toString() );
						}
						newResults.setColumnHeaders( resultSetHeader);

						if (TOPCOUNTAXIS == 'rows'){
							rowIteraction = TOPCOUNT==0||TOPCOUNT > rowCount?rowCount:TOPCOUNT ;
							out.println("Rows: " + rowIteraction);
						}
						if (TOPCOUNTAXIS == 'columns'){
							colIteraction = TOPCOUNT==0||TOPCOUNT > colCount?colCount:TOPCOUNT ;
							out.println("Columns: Count = " + colCount + "; Iteraction: " + colIteraction);
						}

						for (i=0; i<rowIteraction; i++)
						{
							var a = new Array();
							a[0] = rowHeaders[i][0];
							a[1] = rowHeaders[i][1];

							for(j=0; j< colIteraction; j++){

								a[j+1] = query_result.getValueAt(i,j);
							}
							//out.println("a0: " + a[0] + "; a1: " + a[1] + "; a2: " + a[0] + "; Array: " + a);
							newResults.addRow(a);
						}

						// Other's block
						if (TOPCOUNTAXIS == 'columns' && colIteraction != colCount){
							// TODO: Make this work
							var a = new Array();
							for(i = 0 ; i < rowIteraction; i++){

								var value = 0;
								for (j=colIteraction; j<colCount; j++) {
									var localValue = query_result.getValueAt(i,j) - 0;
									value += localValue;
									//out.println("j: " + j + ", a1: " + a[1] + "; col: " + colHeaders[0][j] + "; Value: " + localValue);
								}
								a[0] = 'Others';
								a[colIteraction+1] = value;
								newResults.addRow(a);
							}
							//out.println("OTHERS: a0: " + a[0] + "; a1: " + a[1] + "; a2: " + a[2]);
						}
						else if (TOPCOUNTAXIS == 'rows' && rowIteraction != rowCount){

							// This will probably need a refactoring. All of this, actually :S
							var a = new Array();
							for(j = 0 ; j < colIteraction; j++){

								var value = 0;
								for (i=rowIteraction; i<rowCount; i++) {
									var localValue = query_result.getValueAt(i,j) - 0;
									value += localValue;
									//out.println("j: " + j + ", a1: " + a[1] + "; col: " + colHeaders[0][j] + "; Value: " + localValue);
								}
								a[0] = 'Others';
								a[j+1] = value;
							}
							//out.println("OTHERS: a0: " + a[0] + "; a1: " + a[1] + "; a2: " + a[2]);
							newResults.addRow(a);
						}

						//out.println("Success: New resultset with " + newResults.getRowCount() + " entries");
					}

				}
				else{

					// TIMESERIES
					out.println("TIMESERIES DATASET");
					newResults.setColumnHeaders('Series','Date','Measure');

					if (query_result != null)
					{

						var rowIteraction = rowCount;
						var colIteraction = colCount;

						if (TOPCOUNTAXIS == 'rows'){
							rowIteraction = TOPCOUNT==0||TOPCOUNT > rowCount?rowCount:TOPCOUNT ;
							out.println("Rows: " + rowIteraction);
						}
						if (TOPCOUNTAXIS == 'columns'){
							colIteraction = TOPCOUNT==0||TOPCOUNT > colCount?colCount:TOPCOUNT ;
							out.println("Columns: " + colIteraction + "; ColCount: " + colCount);
						}


						for(j = 0; j < colIteraction; j++){
							for (i=0; i<rowIteraction; i++) {
								var a = new Array();
								a[0] = colHeaders[0][j];
								a[1] = rowHeaders[i][0];
								a[2] = query_result.getValueAt(i,j) - 0;
								//out.println("a0: " + a[0] + "; a1: " + a[1] + "; a2: " + a[2]);

								newResults.addRow(a);
							}
						}

						// Other's block
						if (TOPCOUNTAXIS == 'columns' && colIteraction != colCount){
							for (i=0; i<rowIteraction; i++) {
								var a = new Array();
								a[0] = 'Others';
								a[1] = rowHeaders[i][0];
								var value = 0;
								for(j = colIteraction ; j < colCount; j++){
									var localValue = query_result.getValueAt(i,j) - 0;
									value += localValue;
									//out.println("a1: " + a[1] + "; col: " + colHeaders[0][j] + "; Value: " + localValue);
								}
								a[2] = value;
								//out.println("a0: " + a[0] + "; a1: " + a[1] + "; a2: " + a[2]);
								newResults.addRow(a);
							}
						}
						else if (TOPCOUNTAXIS == 'rows' && rowIteraction != rowCount){
							for (j=0; j<colIteraction; j++) {
								var a = new Array();
								a[0] = colHeaders[0][j];
								a[1] = 'Others';
								var value = 0;
								for(i = rowIteraction ; i < rowCount; i++){
									var localValue = query_result.getValueAt(i,j) - 0;
									value += localValue;
									//out.println("a1: " + a[1] + "; col: " + colHeaders[0][j] + "; Value: " + localValue);
								}
								a[2] = value;
								//out.println("a0: " + a[0] + "; a1: " + a[1] + "; a2: " + a[2]);
								newResults.addRow(a);
							}
						}

					}

				}

				URLTEMPLATE;

						]]></script> 
				</component-definition> 
		</action-definition>
		
	</actions> 

  <actions> 
    <condition><![CDATA[QUERY_TYPE == "cda"]]></condition>

    <!--<action-definition> 
      <component-name>CdaQueryComponent</component-name>
      <action-type>CDA Query</action-type>
      <action-inputs> 
				<CDAFILE type ="string"/>
				<DATAACCESSID type="string"/>  
				<CDAPARAMETERSTRING type="string" />
      </action-inputs>
      <action-outputs> 
        <resultSet type="result-set" mapping="newResults"/> 
      </action-outputs>
      <component-definition> 
        <file>{CDAFILE}</file>  
        <dataAccessId>{DATAACCESSID}</dataAccessId>
      </component-definition> 
    </action-definition>-->
 
  </actions> 
	
	<actions> 
		<condition><![CDATA[QUERY_TYPE == "sql"]]></condition>
			
			<action-definition> 
			  <component-name>SQLLookupRule</component-name>
			  <action-type>Relational</action-type>
			  <action-inputs>
				<QUERY type ="string"/>
				<JNDI type="string"/>  
			  </action-inputs>
			  <action-outputs> 
				<query-result type="result-set" mapping="newResults"/> 
			  </action-outputs>
			  <component-definition> 
				 <jndi>{JNDI}</jndi>  
				 <live><![CDATA[false]]></live>  
				 <query>{QUERY}</query> 
			  </component-definition> 
			</action-definition>
			
	</actions> 

	<actions>
		<condition><![CDATA[QUERY_TYPE == "kettle"]]></condition>
		<action-definition>
			<component-name>SubActionComponent</component-name>
			<action-type>Pentaho BI Process</action-type>
			<action-inputs>
				<PARAMETER1 type="string"/>
				<PARAMETER2 type="string"/>
				<PARAMETER3 type="string"/>
				<PARAMETER4 type="string"/>
				<PARAMETER5 type="string"/>
				<PARAMETER6 type="string"/>
				<PARAMETER7 type="string"/>
				<PARAMETER8 type="string"/>
				<PARAMETER9 type="string"/>
				<TRANSFORMATION type="string"/>
				<DIRECTORY type="string"/>
				<IMPORTSTEP type="string"/>
			</action-inputs>
			<action-outputs>
				<newResults type="result-set"/> 
			</action-outputs>
			<component-definition>
				<solution><![CDATA[cdf]]></solution>
				<path><![CDATA[components]]></path>
				<action><![CDATA[kettletransformation.xaction]]></action>
			</component-definition>
		</action-definition>
	</actions>

	<action-definition> 
		<component-name>ChartComponent</component-name>
		<action-type>Chart</action-type>
		<action-inputs> 
			<chart-data type="result-set" mapping="newResults"/> 
			<WIDTH type="string"/>
			<HEIGHT type="string"/>
			<BYROW type="string"/>
			<CHARTTYPE type="string"/>
			
			<TITLE type="string"/>
			<TITLEFONTFAMILY type="string"/> 
			<TITLEFONTSIZE type="string"/>
			<TITLEFONTISBOLD type="string"/>
			<TITLEFONTISITALIC type="string"/>
			
			<SUBTITLE type="string"/>
			
			<DOMAINTITLE type="string"/>
			<DOMAINTITLEFONTFAMILY type="string"/> 
			<DOMAINTITLEFONTSIZE type="string"/>
			<DOMAINTITLEFONTISBOLD type="string"/>
			<DOMAINTITLEFONTISITALIC type="string"/>
			
			<RANGETITLE type="string"/>
			<RANGETITLEFONTFAMILY type="string"/> 
			<RANGETITLEFONTSIZE type="string"/>
			<RANGETITLEFONTISBOLD type="string"/>
			<RANGETITLEFONTISITALIC type="string"/>

			<DATASETTYPE type="string"/>
			<DOMAINPERIODTYPE type="string"/>
			<ORIENTATION type="string"/>
			<IS3D type="string"/>
			<ISSTACKED type="string"/>
			
			<DOMAINTICKFONTSIZE type="string"/>
			<DOMAINTICKFONTFAMILY type="string"/>
			<DOMAINTICKFONTISBOLD type="string"/>
			<DOMAINTICKFONTISITALIC type="string"/>
			
			<DOMAINLABELROTATIONDIR type="string"/>
			<DOMAINLABELROTATION type="string"/>
			
			<RANGETICKFONTSIZE type="string"/>
			<RANGETICKFONTFAMILY type="string"/>
			<RANGETICKFONTISBOLD type="string"/>
			<RANGETICKFONTISITALIC type="string"/>
			
			<URLTEMPLATE type="string"/>
			<USEBASEURL type="string"/>
			<URLTARGET type="string"/>
			<PARAMETERNAME type="string"/>
			<SERIESNAME type="string"/>
			<BARSERIES type="string"/>
			<LINESERIES type="string"/>
			
			<INCLUDELEGEND type="string"/>
			<LEGENDFONTFAMILY type="string"/>
			<LEGENDFONTSIZE type="string"/>
			<LEGENDFONTISBOLD type="string"/>
			<LEGENDFONTISITALIC type="string"/>
			
			<FOREGROUNDALPHA type="string"/>
			<BACKGROUNDALPHA type="string"/>
			<MAXBARWIDTH type="string" />
			<BACKGROUND type="string"/>
			<PLOTBACKGROUND type="string"/>
			<INTERIORGAP type="string"/>
			<TOOLTIPCONTENT type="string"/>
			<TOOLTIPYFORMAT type="string"/>
			<MARKERSVISIBLE type="string"/>
		</action-inputs>
		<action-resources/>
		<action-outputs> 
			<chart-filename type="string"/>  
			<base-url type="string"/>  
			<chart-mapping type="string"/>  
			<image-tag type="string"/>  
			<chart-output type="content"/> 
		</action-outputs>
		<component-definition> 
			<width>{WIDTH}</width>  
			<height>{HEIGHT}</height>  
			<by-row>{BYROW}</by-row>  
			<chart-attributes> 
				<chart-type>{CHARTTYPE}</chart-type>
				
				<title>{TITLE}</title> 
				<title-font>
					<font-family>{TITLEFONTFAMILY}</font-family>
					<size>{TITLEFONTSIZE}</size>
					<is-bold>{TITLEFONTISBOLD}</is-bold>
					<is-italic>{TITLEFONTISITALIC}</is-italic>
				</title-font>
				
				<subtitles>
					<subtitle>{SUBTITLE}</subtitle>  
				</subtitles>
				
				<domain-title>{DOMAINTITLE}</domain-title> 
				<domain-title-font>
					<font-family>{DOMAINTITLEFONTFAMILY}</font-family>
					<size>{DOMAINTITLEFONTSIZE}</size>
					<is-bold>{DOMAINTITLEFONTISBOLD}</is-bold>
					<is-italic>{DOMAINTITLEFONTISITALIC}</is-italic>
				</domain-title-font>
				
				<range-title>{RANGETITLE}</range-title>
				<range-title-font>
					<font-family>{RANGETITLEFONTFAMILY}</font-family>
					<size>{RANGETITLEFONTSIZE}</size>
					<is-bold>{RANGETITLEFONTISBOLD}</is-bold>
					<is-italic>{RANGETITLEFONTISITALIC}</is-italic>
				</range-title-font>
				
				<dataset-type>{DATASETTYPE}</dataset-type>  
				<domain-period-type>{DOMAINPERIODTYPE}</domain-period-type>  
				<orientation>{ORIENTATION}</orientation>  
				<is-3D>{IS3D}</is-3D>  
				<is-stacked>{ISSTACKED}</is-stacked>  
				
				<domain-tick-font>
					<font-family>{DOMAINTICKFONTFAMILY}</font-family>
					<size>{DOMAINTICKFONTSIZE}</size>
					<is-bold>{DOMAINTICKFONTISBOLD}</is-bold>
					<is-italic>{DOMAINTICKFONTISITALIC}</is-italic>
				</domain-tick-font>
				
				<domain-label-rotation-dir>{DOMAINLABELROTATIONDIR}</domain-label-rotation-dir>  
				<domain-label-rotation>{DOMAINLABELROTATION}</domain-label-rotation>
				
				<range-tick-font>
					<font-family>{RANGETICKFONTFAMILY}</font-family>
					<size>{RANGETICKFONTSIZE}</size>
					<is-bold>{RANGETICKFONTISBOLD}</is-bold>
					<is-italic>{RANGETICKFONTISITALIC}</is-italic>
				</range-tick-font>
				
				<url-template>{URLTEMPLATE}</url-template> 
				<use-base-url>{USEBASEURL}</use-base-url>  
				<url-target>{URLTARGET}</url-target>
				<paramName>{PARAMETERNAME}</paramName>  
				<series-name>{SERIESNAME}</series-name>
				<bar-series><series>{BARSERIES}</series></bar-series>
				<line-series><series>{LINESERIES}</series></line-series>
				
				<include-legend>{INCLUDELEGEND}</include-legend> 
				<legend-font>
					<font-family>{LEGENDFONTFAMILY}</font-family>
					<size>{LEGENDFONTSIZE}</size>
					<is-bold>{LEGENDFONTISBOLD}</is-bold>
					<is-italic>{LEGENDFONTISITALIC}</is-italic>
				</legend-font>
				
				<interior-gap>{INTERIORGAP}</interior-gap> 
				<foreground-alpha>{FOREGROUNDALPHA}</foreground-alpha>
				<background-alpha>{BACKGROUNDALPHA}</background-alpha>
				<max-bar-width>{MAXBARWIDTH}</max-bar-width>
				<chart-background type="color">{BACKGROUND}</chart-background>
				<plot-background type="color">{PLOTBACKGROUND}</plot-background>
				<markers-visible>{MARKERSVISIBLE}</markers-visible>
				<tooltip-content>{TOOLTIPCONTENT}</tooltip-content>
				<tooltip-y-format>{TOOLTIPYFORMAT}</tooltip-y-format>
				<color-palette> 
					<color>#1b95d9</color>  
					<color>#caca9e</color>  
					<color>#6693b0</color>  
					<color>#f05e27</color>  
					<color>#a5bc4e</color>  
					<color>#e48701</color>  
					<color>#86d1e4</color>  
					<color>#e4f9a0</color>  
					<color>#ffd512</color>  
					<color>#75b000</color>  
					<color>#0662b0</color>  
					<color>#ede8c6</color>  
					<color>#cc3300</color>  
					<color>#d1dfe7</color> 
				</color-palette>  
			</chart-attributes> 
		</component-definition> 
	</action-definition>

</actions> 
</action-sequence>
