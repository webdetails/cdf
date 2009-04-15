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
		<QUERY_TYPE type="string">
			<sources>
				<request>queryType</request>
			</sources>
			<default-value>mdx</default-value>
		</QUERY_TYPE> 
		<ROLE type="string"> 
			<sources> 
				<session>role</session> 
			</sources> 
			<default-value/>
		</ROLE>  
		<INTERVALS type="string"> 
			<sources> 
				<request>intervals</request> 
			</sources>  
			<default-value/> 
		</INTERVALS>  
		<COLORS type="string">
			<sources> 
				<request>colors</request> 
			</sources>  
			<default-value/>
		</COLORS>
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
		<BY-ROW type="string"> 
			<sources> 
				<request>by-row</request> 
			</sources>  
			<default-value>false</default-value>
		</BY-ROW>  
		<CHART-TYPE type="string">
			<sources>
				<request>chartType</request>
			</sources>
			<default-value>AreaChart</default-value>
		</CHART-TYPE>  
		<TITLE type="string">
			<sources>
				<request>title</request>
			</sources>
			<default-value/>
		</TITLE>  
		<SUBTITLE type="string">
			<sources>
				<request>subtitle</request>
			</sources>
			<default-value></default-value>
		</SUBTITLE>  
		<RANGE-TITLE type="string">
			<sources>
				<request>rangeTitle</request>
			</sources>
			<default-value></default-value>
		</RANGE-TITLE>  
		<DATASET-TYPE type="string">
			<sources>
				<request>datasetType</request>
			</sources>
			<default-value>CategoryDataset</default-value>
		</DATASET-TYPE>  
		<DOMAIN-PERIOD-TYPE type="string">
			<sources>
				<request>domainPeriodType</request>
			</sources>
			<default-value>Day</default-value>
		</DOMAIN-PERIOD-TYPE>  
		<ORIENTATION type="string">
			<sources>
				<request>orientation</request>
			</sources>
			<default-value>vertical</default-value>
		</ORIENTATION>  
		<IS-3D type="string">
			<sources>
				<request>is3d</request>
			</sources>
			<default-value>false</default-value>
		</IS-3D>  
		<IS-STACKED type="string">
			<sources>
				<request>isStacked</request>
			</sources>
			<default-value>false</default-value>
		</IS-STACKED>  
		<DOMAIN-TICK-FONT-SIZE type="string">
			<sources>
				<request>domainTickFontSize</request>
			</sources>
			<default-value>10</default-value>
		</DOMAIN-TICK-FONT-SIZE>  
		<DOMAIN-LABEL-ROTATION-DIR type="string">
			<sources>
				<request>domainLabelRotationDir</request>
			</sources>
			<default-value>down</default-value>
		</DOMAIN-LABEL-ROTATION-DIR>  
		<DOMAIN-LABEL-ROTATION type="string">
			<sources>
				<request>domainLabelRotation</request>
			</sources>
			<default-value>.95</default-value>
		</DOMAIN-LABEL-ROTATION>  
		<URL-TEMPLATE type="string">
			<sources>
				<request>urlTemplate</request>
			</sources>
			<default-value></default-value>
		</URL-TEMPLATE>  
		<USE-BASE-URL type="string">
			<sources>
				<request>useBaseUrl</request>
			</sources>
			<default-value>false</default-value>
		</USE-BASE-URL>  
		<URL-TARGET type="string">
			<sources>
				<request>urlTarget</request>
			</sources>
			<default-value>_self</default-value>
		</URL-TARGET>  
		<INCLUDE-LEGEND type="string">
			<sources>
				<request>includeLegend</request>
			</sources>
			<default-value>true</default-value>
		</INCLUDE-LEGEND> 
		<FOREGROUND-ALPHA type="string">
			<sources>
				<request>foregroundAlpha</request>
			</sources>
			<default-value>1</default-value>
		</FOREGROUND-ALPHA> 
		<BACKGROUND-COLOR type="string">
			<sources>
				<request>backgroundColor</request>
			</sources>
			<default-value>#FFFFFF</default-value>
		</BACKGROUND-COLOR> 

	</inputs>

	<outputs> 
		<image-tag type="string"/> 
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
		</actions>
		<actions>
			<condition><![CDATA[QUERY_TYPE != "mdx"]]></condition>
			<action-definition>
				<component-name>SQLLookupRule</component-name>
				<action-type>Relational</action-type>
				<action-inputs>
					<QUERY type ="string"/>
					<JNDI type="string"/>
				</action-inputs>
				<action-outputs>
					<query-result type="result-set" mapping="query_result"/>
				</action-outputs>
				<component-definition>
					<jndi>{JNDI}</jndi>
					<live><![CDATA[false]]></live>
					<query>{QUERY}</query>
				</component-definition>
			</action-definition>
		</actions>

		<action-definition> 
			<component-name>JavascriptRule</component-name>
			<action-type>Format MDX Results</action-type>
			<action-inputs> 
				<query_result type="result-set"/> 
				<TITLE type="string"/>
			</action-inputs>
			<action-outputs> 
				<newResults type="result-set"/> 
				<maxValue type="string"/> 
				<firstInterval type="string"/> 
				<secondInterval type="string"/> 
				<thirdInterval type="string"/> 
				<lastInterval type="string"/> 
				<VALUE type="string"/>
			</action-outputs>
			<component-definition> 
				<script><![CDATA[

					// MDX to Relation result set, needed for the 

					var VALUE;
					var newResults = new JavaScriptResultSet();
					newResults.setColumnHeaders('Value');


					if (query_result != null)
					{
					var rsmd = query_result.getMetaData() ;
					var a = new Array();
					a[0] = Math.round(query_result.getValueAt(0,0));
					VALUE = a[0];
					

					newResults.addRow(a);

					};

					newResults;

					]]></script> 
			</component-definition> 
		</action-definition>

		<action-definition> 
			<component-name>JavascriptRule</component-name>
			<action-type>Chart display logic</action-type>
			<action-inputs> 
				<INTERVALS type="string"/>
				<COLORS type="string"/>
				<VALUE type="string"/>
				<WIDTH type="string"/>
				<HEIGHT type="string"/>
			</action-inputs>
			<action-outputs> 
				<TICKINTERVAL type="string"/>
				<INTERVAL0 type="string"/>
				<INTERVAL1 type="string"/>
				<INTERVAL2 type="string"/>
				<INTERVAL3 type="string"/>
				<INTERVALCOLOR0 type="string"/>
				<INTERVALCOLOR1 type="string"/>
				<INTERVALCOLOR2 type="string"/>
				<INTERVALCOLOR3 type="string"/>
				<INTERVALGRADIENT0X1 type="int"/>
				<INTERVALGRADIENT0Y1 type="string"/>
				<INTERVALGRADIENT0X2 type="string"/>
				<INTERVALGRADIENT0Y2 type="string"/>
				<INTERVALGRADIENT1X1 type="string"/>
				<INTERVALGRADIENT1Y1 type="string"/>
				<INTERVALGRADIENT1X2 type="string"/>
				<INTERVALGRADIENT1Y2 type="string"/>
				<INTERVALGRADIENT2X1 type="string"/>
				<INTERVALGRADIENT2Y1 type="string"/>
				<INTERVALGRADIENT2X2 type="string"/>
				<INTERVALGRADIENT2Y2 type="string"/>
				<INTERVALGRADIENT3X1 type="string"/>
				<INTERVALGRADIENT3Y1 type="string"/>
				<INTERVALGRADIENT3X2 type="string"/>
				<INTERVALGRADIENT3Y2 type="string"/>				
			</action-outputs>
			<component-definition> 
				<script><![CDATA[

				var intervals = INTERVALS;
				if(COLORS == "") {
					out.println("Setting default colors #FF3E3E,#FFFF53,#5EFF5E,#53FF53 ");
					colors = "#FF3E3E,#FFFF53,#5EFF5E,#53FF53".split(",");
				}
				else	
					colors = COLORS;
				
				var last;
				out.println("Inntervals length: " + intervals.length);
				
				var initalGradientPointX1 = WIDTH/4;
				var initalGradientPointY1 = HEIGHT/4;
				var initalGradientPointX2 = WIDTH ;
				var initalGradientPointY2 = HEIGHT ;
				
				var INTERVALGRADIENT0X1=initalGradientPointX1, INTERVALGRADIENT2X1=initalGradientPointX1, INTERVALGRADIENT1X1=initalGradientPointX1, INTERVALGRADIENT3X1=initalGradientPointX1;
				var INTERVALGRADIENT0Y1=initalGradientPointY1, INTERVALGRADIENT2Y1=initalGradientPointY1, INTERVALGRADIENT1Y1=initalGradientPointY1, INTERVALGRADIENT3Y1=initalGradientPointY1;
				var INTERVALGRADIENT0X2=initalGradientPointX2, INTERVALGRADIENT1X2=initalGradientPointX2, INTERVALGRADIENT2X2=initalGradientPointX2, INTERVALGRADIENT3X2=initalGradientPointX2;  
				var INTERVALGRADIENT0Y2=initalGradientPointY2, INTERVALGRADIENT1Y2=initalGradientPointY2, INTERVALGRADIENT2Y2=initalGradientPointY2, INTERVALGRADIENT3Y2=initalGradientPointY2;

				if (intervals.length==1){
					last = VALUE>intervals[0]?VALUE:intervals[0];
					var INTERVAL0 = last;
					var INTERVAL1 = last;
					var INTERVAL2 = last;
					var INTERVAL3 = last;
					var INTERVALCOLOR0 = COLORS == "" ? colors[2] : colors[0];
					var INTERVALCOLOR1 = INTERVALCOLOR0;
					var INTERVALCOLOR2 = INTERVALCOLOR0;
					var INTERVALCOLOR3 = INTERVALCOLOR0;
				}
				else if (intervals.length == 2){
					last = VALUE>intervals[1]?VALUE:intervals[1];
					var INTERVAL0 = intervals[0];
					var INTERVAL1 = last;
					var INTERVAL2 = last;
					var INTERVAL3 = last;
					var INTERVALCOLOR0 = colors[0];
					var INTERVALCOLOR1 = COLORS == "" ? colors[2] : colors[1];
					var INTERVALCOLOR2 = INTERVALCOLOR1;
					var INTERVALCOLOR3 = INTERVALCOLOR1;
					if(VALUE < intervals[0]) {
						INTERVALGRADIENT0X1 = - WIDTH;
						INTERVALGRADIENT0Y1 = - HEIGHT;
					}
					else{
						INTERVALGRADIENT1X1 = - WIDTH;
						INTERVALGRADIENT1Y1 = - HEIGHT;
					}
				}
				else if (intervals.length == 3){
					last = VALUE>intervals[2]?VALUE:intervals[2];
					var INTERVAL0 = intervals[0];
					var INTERVAL1 = intervals[1];
					var INTERVAL2 = last;
					var INTERVAL3 = last;					
					var INTERVALCOLOR0 = colors[0];
					var INTERVALCOLOR1 = colors[1];
					var INTERVALCOLOR2 = colors[2];
					var INTERVALCOLOR3 = INTERVALCOLOR2;
					if(VALUE < intervals[0]) {
						INTERVALGRADIENT0X1 = - WIDTH;
						INTERVALGRADIENT0Y1 = - HEIGHT;
					}
					else if(VALUE >= intervals[1]){
						INTERVALGRADIENT2X1 = - WIDTH;
						INTERVALGRADIENT2Y1 = - HEIGHT;
					}
					else{
						INTERVALGRADIENT1X1 = - WIDTH;
						INTERVALGRADIENT1Y1 = - HEIGHT;
					}
				}
				else if (intervals.length >= 4){
					last = VALUE>intervals[3]?VALUE:intervals[3];
					var INTERVAL0 = intervals[0];
					var INTERVAL1 = intervals[1];
					var INTERVAL2 = intervals[2];
					var INTERVAL3 = last;
					var INTERVALCOLOR0 = colors[0];
					var INTERVALCOLOR1 = colors[1];
					var INTERVALCOLOR2 = colors[2];
					var INTERVALCOLOR3 = colors[3];
					if(VALUE < intervals[0]) {
						INTERVALGRADIENT0X1 = - WIDTH;
						INTERVALGRADIENT0Y1 = - HEIGHT;
					}
					else if(VALUE >= intervals[2]){
						INTERVALGRADIENT3X1 = - WIDTH;
						INTERVALGRADIENT3Y1 = - HEIGHT;
					}
					else if(VALUE >= intervals[1] &&  VALUE < intervals[2]){
						INTERVALGRADIENT2X1 = - WIDTH;
						INTERVALGRADIENT2Y1 = - HEIGHT;
					}
					else {
						INTERVALGRADIENT1X1 = - WIDTH;
						INTERVALGRADIENT1Y1 = - HEIGHT;
					}
				}
				else if (intervals.length == 0){
					var INTERVAL0 = 0;
					var INTERVAL1 = 0;
					var INTERVAL2 = 0;
					var INTERVAL3 = 0;
					var INTERVALCOLOR0 = COLORS == "" ? colors[2] : colors[0];
					var INTERVALCOLOR1 = INTERVALCOLOR0;
					var INTERVALCOLOR2 = INTERVALCOLOR0;
					var INTERVALCOLOR3 = INTERVALCOLOR0;
				}
				
				var TICKINTERVAL = Math.round(last/20,0) + "";
				out.println("Done, printing chart: " + TICKINTERVAL);
									

				]]></script> 
			</component-definition> 
		</action-definition>

		<action-definition> 
			<component-name>ChartComponent</component-name>
			<action-type>Chart</action-type>
			<action-inputs> 
				<TICKINTERVAL type="string"/>
				<INTERVAL0 type="string"/>
				<INTERVAL1 type="string"/>
				<INTERVAL2 type="string"/>
				<INTERVAL3 type="string"/>
				<INTERVALCOLOR0 type="string"/>
				<INTERVALCOLOR1 type="string"/>
				<INTERVALCOLOR2 type="string"/>
				<INTERVALCOLOR3 type="string"/>
				<INTERVALGRADIENT0X1 type="string"/>
				<INTERVALGRADIENT0Y1 type="string"/>
				<INTERVALGRADIENT0X2 type="string"/>
				<INTERVALGRADIENT0Y2 type="string"/>
				<INTERVALGRADIENT1X1 type="string"/>
				<INTERVALGRADIENT1Y1 type="string"/>
				<INTERVALGRADIENT1X2 type="string"/>
				<INTERVALGRADIENT1Y2 type="string"/>
				<INTERVALGRADIENT2X1 type="string"/>
				<INTERVALGRADIENT2Y1 type="string"/>
				<INTERVALGRADIENT2X2 type="string"/>
				<INTERVALGRADIENT2Y2 type="string"/>
				<INTERVALGRADIENT3X1 type="string"/>
				<INTERVALGRADIENT3Y1 type="string"/>
				<INTERVALGRADIENT3X2 type="string"/>
				<INTERVALGRADIENT3Y2 type="string"/>
				<chart-data type="result-set" mapping="newResults"/> 
				<WIDTH type="string"/>
				<HEIGHT type="string"/>
				<BY-ROW type="string"/>
				<CHART-TYPE type="string"/>
				<TITLE type="string"/>
				<SUBTITLE type="string"/>
				<RANGE-TITLE type="string"/>
				<DATASET-TYPE type="string"/>
				<DOMAIN-PERIOD-TYPE type="string"/>
				<ORIENTATION type="string"/>
				<IS-3D type="string"/>
				<IS-STACKED type="string"/>
				<DOMAIN-TICK-FONT-SIZE type="string"/> 
				<DOMAIN-LABEL-ROTATION-DIR type="string"/>
				<DOMAIN-LABEL-ROTATION type="string"/>
				<URL-TEMPLATE type="string"/>
				<USE-BASE-URL type="string"/>
				<URL-TARGET type="string"/>
				<INCLUDE-LEGEND type="string"/>
				<FOREGROUND-ALPHA type="string"/>
				<BACKGROUND-ALPHA type="string"/>
				<BACKGROUND-COLOR type="string"/>
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
				<by-row>{BY-ROW}</by-row>  
				<chart-attributes> 
					<chart-type>{CHART-TYPE}</chart-type>  
					<chart-background type="gradient"><x1>0</x1><y1>0</y1><x2>0</x2><y2>0</y2><color1>{BACKGROUND-COLOR}</color1>
						<color2>{BACKGROUND-COLOR}</color2></chart-background>
					<plot-background type="gradient">
						<color1>#AAAAAA</color1>
						<color2>#FFFFFF</color2>
						<cyclic>true</cyclic>
					</plot-background>
					<include-legend>true</include-legend>
					<title>{TITLE}</title>  
					<subtitles>
						<subtitle>{SUBTITLE}</subtitle>  
					</subtitles>
					<value-color>#000000</value-color>
					<range-title>{RANGE-TITLE}</range-title>  
					<dataset-type>{DATASET-TYPE}</dataset-type>  
					<domain-period-type>{DOMAIN-PERIOD-TYPE}</domain-period-type>  
					<orientation>{ORIENTATION}</orientation>  
					<is-3D>{IS-3D}</is-3D>  
					<value-color>#DDDDDD</value-color>
					<is-stacked>{IS-STACKED}</is-stacked>  
					<title-font>
						<font>Helvetica</font>
					</title-font>  
					<domain-tick-font>
						<font>Helvetica</font>
						<size>{DOMAIN-TICK-FONT-SIZE}</size> 
					</domain-tick-font>
					<domain-label-rotation-dir>{DOMAIN-LABEL-ROTATION-DIR}</domain-label-rotation-dir>  
					<domain-label-rotation>{DOMAIN-LABEL-ROTATION}</domain-label-rotation>  
					<url-template>{URL-TEMPLATE}</url-template>
					<use-base-url>{USE-BASE-URL}</use-base-url>  
					<url-target>{URL-TARGET}</url-target>
					<include-legend>true</include-legend> 
					<markers-visible>true</markers-visible>
					<tick-interval>{TICKINTERVAL}</tick-interval>
					<needle-color>#0000CC</needle-color>
					<intervals>
						<interval>
							<label>Interval0</label><minimum>0</minimum><maximum>{INTERVAL0}</maximum>
							<interval-background type="gradient">
								<x1>{INTERVALGRADIENT0X1}</x1><y1>{INTERVALGRADIENT0Y1}</y1>
								<x2>{INTERVALGRADIENT0X2}</x2><y2>{INTERVALGRADIENT0Y2}</y2>
								<color1>#FFFFFF</color1>
								<color2>{INTERVALCOLOR0}</color2>
								<cyclic>true</cyclic>
							</interval-background>
							<text-font>Helvetica</text-font><text-color>#ffffff</text-color>
						</interval>
						<interval>
							<label>Interval1</label><minimum>{INTERVAL0}</minimum><maximum>{INTERVAL1}</maximum>
							<interval-background type="gradient">
								<x1>{INTERVALGRADIENT1X1}</x1><y1>{INTERVALGRADIENT1Y1}</y1>
								<x2>{INTERVALGRADIENT1X2}</x2><y2>{INTERVALGRADIENT1Y2}</y2>
								<color1>#FFFFFF</color1>
								<color2>{INTERVALCOLOR1}</color2>
								<cyclic>true</cyclic>
							</interval-background>
							<text-font>Helvetica</text-font><text-color>#ffffff</text-color>
						</interval>
						<interval>
							<label>Interval2</label><minimum>{INTERVAL1}</minimum><maximum>{INTERVAL2}</maximum>
							<interval-background type="gradient">
								<x1>{INTERVALGRADIENT2X1}</x1><y1>{INTERVALGRADIENT2Y1}</y1>
								<x2>{INTERVALGRADIENT2X2}</x2><y2>{INTERVALGRADIENT2Y2}</y2>
								<color1>#FFFFFF</color1>
								<color2>{INTERVALCOLOR2}</color2>
								<cyclic>true</cyclic>
							</interval-background>
							<text-font>Helvetica</text-font><text-color>#ffffff</text-color>
						</interval>
						<interval>
							<label>Interval3</label><minimum>{INTERVAL2}</minimum><maximum>{INTERVAL3}</maximum>
							<interval-background type="gradient">
								<x1>{INTERVALGRADIENT3X1}</x1><y1>{INTERVALGRADIENT3Y1}</y1>
								<x2>{INTERVALGRADIENT3X2}</x2><y2>{INTERVALGRADIENT3Y2}</y2>
								<color1>#FFFFFF</color1>
								<color2>{INTERVALCOLOR3}</color2>
								<cyclic>true</cyclic>
							</interval-background>
							<text-font>SansSerif</text-font><text-color>#ffffff</text-color>
						</interval>
					</intervals>			  
				</chart-attributes> 
			</component-definition> 
		</action-definition>

	</actions> 
</action-sequence>
