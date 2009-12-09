<?xml version="1.0" encoding="UTF-8"?>
<action-sequence> 
  <title>Jtable</title>
  <version>1</version>
  <logging-level>ERROR</logging-level>
  <documentation> 
    <author/>  
    <description>Empty blank action sequence document</description>  
    <help/>  
    <result-type/>  
    <icon/> 
  </documentation>

  <inputs> 
	<QUERY type="string"> 
		<sources> 
			<request>query</request> 
		</sources>  
		<default-value/>
	</QUERY>  
	<CATALOG type="string">
		<sources>
			<request>catalog</request>
		</sources>
		<default-value/>
	</CATALOG>
	<JNDI type="string"> 
		<sources> 
			<request>jndi</request> 
		</sources>  
		<default-value/> 
	</JNDI>  
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
	<QUERY_TYPE type="string">
		<sources>
			<request>queryType</request>
		</sources>
		<default-value>mdx</default-value>
	</QUERY_TYPE> 
  </inputs>

  <outputs> 
	<results type="string"> 
      <destinations>
        <response>content</response>
      </destinations>
    </results>
    
  </outputs>
  
  <actions>
  
  	<actions>
		<condition><![CDATA[QUERY_TYPE == "mdx"]]></condition>
		    <action-definition> 
		      <component-name>MDXLookupRule</component-name>
		      <action-type>Query MDX</action-type>
		      <action-inputs> 
				<CATALOG type="string"/>
				<JNDI type="string"/>
				<QUERY type="string"/> 
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
		<condition><![CDATA[QUERY_TYPE == "sql"]]></condition>
			<action-definition> 
			  <component-name>SQLLookupRule</component-name>
			  <action-type>Relational</action-type>
			  <action-inputs>
				<QUERY type ="string"/>
				<JNDI type="string"/>  
			  </action-inputs>
			  <action-outputs> 
				<query-results type="result-set" mapping="query_result"/>  
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
      <action-type>JavaScript</action-type>
      <action-inputs> 
        <query_result type="result-set"/> 
		<QUERY_TYPE type="string"/>
      </action-inputs>
      <action-outputs> 
        <results type="string"/> 
      </action-outputs>
      <component-definition> 
        <script><![CDATA[// MDX to Relation result set, needed for the 

		var obj = new Packages.org.json.JSONStringer();	
		var metadata = new Packages.org.json.JSONArray();
		var values = new Packages.org.json.JSONArray();
		
		if (query_result != null)
		{
		
			var rsmd = query_result.getMetaData() ;
			var colHeaders = rsmd.getColumnHeaders() ;
			var rowHeaders = rsmd.getRowHeaders() ;
			
			var colCount = rsmd.getColumnCount() ;
			var rowCount = query_result.getRowCount() ;
			
			for(j = 0; j < colCount; j++){
				metadata.put(colHeaders[0][j].toString() + '');
			}
			
			if(rowCount> 0)
			{		
				for (i=0; i<rowCount; i++)
				{
					var value = new Packages.org.json.JSONArray();
					if(QUERY_TYPE == "mdx")
						//old 
						// value.put(rowHeaders[i][0]);
						//ingo: adding all rowheaders to result set
						var rowHeadersCount = rowHeaders[0].length;
						for (k=0; k<rowHeadersCount; k++)
						{
							value.put(rowHeaders[i][k]);
						}
						
					
					for(j=0; j< colCount; j++)
					{
					    var v = query_result.getValueAt(i,j)+"";
						value.put(v.replace(/Infinity/g,'0'));
					}
					
					values.put(value);
				}
				
			}
		}
		
		
		
		obj.object();
		obj.key("metadata").value(metadata);
		obj.key("values").value(values);
		obj.endObject();
		
		var results = new java.lang.String(obj.toString().getBytes("utf8"));
		results;
		]]></script> 
      </component-definition> 
    </action-definition>
  
   
 
  </actions> 
</action-sequence>
