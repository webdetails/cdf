<%@ page session="true" contentType="text/html;"
	import="
	java.util.*,
	java.io.ByteArrayOutputStream,
	javax.sql.DataSource,
	org.dom4j.DocumentHelper,
	org.dom4j.Element,
	org.dom4j.Document,
	org.pentaho.platform.util.VersionHelper,
    org.pentaho.platform.api.engine.IPentahoSession,
    org.pentaho.platform.api.data.IDatasourceService,
    org.pentaho.platform.web.http.WebTemplateHelper,
	org.pentaho.platform.engine.services.solution.SimpleParameterSetter,
	org.pentaho.platform.engine.core.output.SimpleOutputHandler,
    org.pentaho.platform.api.engine.ISolutionEngine,
    org.pentaho.platform.web.http.request.HttpRequestParameterProvider,
   	org.pentaho.platform.web.http.session.HttpSessionParameterProvider,
    org.pentaho.platform.engine.core.solution.ActionInfo,
    org.pentaho.platform.util.StringUtil,
	org.pentaho.platform.api.engine.IRuntimeContext,
    org.pentaho.platform.util.web.SimpleUrlFactory,
	org.pentaho.platform.util.messages.LocaleHelper,
    org.pentaho.platform.web.jsp.messages.Messages,
	org.pentaho.platform.engine.core.system.PentahoSystem,
	org.pentaho.platform.plugin.action.mondrian.PivotViewComponent,
	org.pentaho.platform.plugin.action.mondrian.AnalysisSaver,
	org.pentaho.platform.plugin.action.mondrian.MissingParameterException,
	org.pentaho.platform.repository.subscription.SubscriptionHelper,
	com.tonbeller.jpivot.table.TableComponent,
	com.tonbeller.jpivot.olap.model.OlapModel,
	com.tonbeller.jpivot.tags.OlapModelProxy,
	com.tonbeller.jpivot.olap.model.OlapModelDecorator,
	com.tonbeller.jpivot.olap.query.MdxOlapModel,
	com.tonbeller.jpivot.mondrian.MondrianModel,
	com.tonbeller.jpivot.chart.ChartComponent,
	org.pentaho.platform.api.repository.ISubscriptionRepository,
	org.pentaho.platform.repository.subscription.Subscription,
  org.pentaho.platform.web.http.PentahoHttpSessionHelper"%>
<jsp:directive.page
	import="org.pentaho.platform.api.repository.ISolutionRepository" />
<%@ 
	 taglib uri="http://www.tonbeller.com/jpivot" prefix="jp"%>
<%@ 
	 taglib uri="http://www.tonbeller.com/wcf" prefix="wcf"%>
<%@ 
	 taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
<%

/*
 * Copyright 2006 Pentaho Corporation.  All rights reserved. 
 * This software was developed by Pentaho Corporation and is provided under the terms 
 * of the Mozilla Public License, Version 1.1, or any later version. You may not use 
 * this file except in compliance with the license. If you need a copy of the license, 
 * please go to http://www.mozilla.org/MPL/MPL-1.1.txt. The Original Code is the Pentaho 
 * BI Platform.  The Initial Developer is Pentaho Corporation.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS" 
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to 
 * the license for the specific language governing your rights and limitations.
*/

	response.setCharacterEncoding(LocaleHelper.getSystemEncoding());
	PentahoSystem.systemEntryPoint();
	try {
	IPentahoSession userSession = PentahoHttpSessionHelper.getPentahoSession( request );

	String pivotId = "01"; //$NON-NLS-1$
	if( pivotId == null ) {
		// TODO need to log an error here
		return;
	}

	int saveResult = 0;
	String saveMessage = "";
	String queryId = "query"+pivotId; //$NON-NLS-1$
	String titleId = PivotViewComponent.TITLE+pivotId; //$NON-NLS-1$
	String optionsId = "pivot-"+PivotViewComponent.OPTIONS+"-"+pivotId; //$NON-NLS-1$

	boolean authenticated = userSession.getName() != null;
	String pageName = "Pivot"; //$NON-NLS-1$

	String solutionName = request.getParameter( "solution" ); //$NON-NLS-1$
	String actionPath = request.getParameter( "path" ); //$NON-NLS-1$
	String actionName = request.getParameter( "action" ); //$NON-NLS-1$

	String actionReference = (String) session.getAttribute("pivot-action-"+pivotId); //$NON-NLS-1$

	String subscribeResult = null;
	String subscribeAction = request.getParameter( "subscribe" ); //$NON-NLS-1$
	String saveAction = request.getParameter( "save-action"); //$NON-NLS-1$

	String dataSource = null;
	String catalogUri = null;
	String query = null;	
	String role  = null;
	String pivotTitle = (String) session.getAttribute( "pivot-"+PivotViewComponent.TITLE+"-"+pivotId ); //$NON-NLS-1$
	String actionTitle = (String) session.getAttribute( "action-"+PivotViewComponent.TITLE+"-"+pivotId );;
	ArrayList options = (ArrayList) session.getAttribute( optionsId );
	boolean chartChange = false;
	boolean showGrid = true;
	
	if( session.getAttribute( "save-message-"+pivotId ) != null ) {
		saveMessage = ((String) session.getAttribute("save-message-"+pivotId));
	}
	
	if( session.getAttribute( "pivot-"+PivotViewComponent.SHOWGRID+"-"+pivotId ) != null ) {
		showGrid = ((Boolean) session.getAttribute("pivot-"+PivotViewComponent.SHOWGRID+"-"+pivotId)).booleanValue();
	}
	if (session.getAttribute( "pivot-"+PivotViewComponent.MODEL+"-"+pivotId ) != null ) { //$NON-NLS-1$
	    catalogUri = (String)session.getAttribute( "pivot-"+PivotViewComponent.MODEL+"-"+pivotId );
	}
	
	int chartType = 1;
	if ( session.getAttribute( "pivot-"+PivotViewComponent.CHARTTYPE+"-"+pivotId ) != null ) { //$NON-NLS-1$
		chartType = ((Integer) session.getAttribute( "pivot-"+PivotViewComponent.CHARTTYPE+"-"+pivotId )).intValue(); //$NON-NLS-1$
	}
	String chartLocation = "bottom"; //$NON-NLS-1$
	if ( session.getAttribute( "pivot-"+PivotViewComponent.CHARTLOCATION+"-"+pivotId ) != null ) { //$NON-NLS-1$
		chartLocation = (String) session.getAttribute( "pivot-"+PivotViewComponent.CHARTLOCATION+"-"+pivotId );
	}
	int chartWidth = -1;
	if ( session.getAttribute( "pivot-"+PivotViewComponent.CHARTWIDTH+"-"+pivotId ) != null ) {
		chartWidth = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTWIDTH+"-"+pivotId )).intValue();
	}
	int chartHeight = -1;
	if ( session.getAttribute( "pivot-"+PivotViewComponent.CHARTHEIGHT+"-"+pivotId ) != null ) {
		chartHeight = ((Integer) session.getAttribute( "pivot-"+PivotViewComponent.CHARTHEIGHT+"-"+pivotId )).intValue();
	}
	boolean chartDrillThroughEnabled = false;
	if ( session.getAttribute( "pivot-"+PivotViewComponent.CHARTDRILLTHROUGHENABLED+"-"+pivotId ) != null ) {
		chartDrillThroughEnabled = ((Boolean) session.getAttribute( "pivot-"+PivotViewComponent.CHARTDRILLTHROUGHENABLED+"-"+pivotId )).booleanValue();
	}
	String chartTitle = "";
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTTITLE+"-"+pivotId) != null ) {
		chartTitle = session.getAttribute( "pivot-"+PivotViewComponent.CHARTTITLE+"-"+pivotId).toString() ;
	}
	String chartTitleFontFamily = "";
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTTITLEFONTFAMILY+"-"+pivotId) != null ) {
		chartTitleFontFamily = session.getAttribute( "pivot-"+PivotViewComponent.CHARTTITLEFONTFAMILY+"-"+pivotId).toString();
	}
	int chartTitleFontStyle = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTTITLEFONTSTYLE+"-"+pivotId) != null ) {
		chartTitleFontStyle = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTTITLEFONTSTYLE+"-"+pivotId)).intValue();
	}
	int chartTitleFontSize = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTTITLEFONTSIZE+"-"+pivotId) != null ) {
		chartTitleFontSize = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTTITLEFONTSIZE+"-"+pivotId)).intValue();
	}
	String chartHorizAxisLabel = "";
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTHORIZAXISLABEL+"-"+pivotId) != null ) {
		chartHorizAxisLabel = session.getAttribute( "pivot-"+PivotViewComponent.CHARTHORIZAXISLABEL+"-"+pivotId).toString();
	}
	String chartVertAxisLabel = "";
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTVERTAXISLABEL+"-"+pivotId) != null ) {
		chartVertAxisLabel = session.getAttribute( "pivot-"+PivotViewComponent.CHARTVERTAXISLABEL+"-"+pivotId).toString();
	}
	String chartAxisLabelFontFamily = "";
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISLABELFONTFAMILY+"-"+pivotId) != null ) {
		chartAxisLabelFontFamily = session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISLABELFONTFAMILY+"-"+pivotId).toString();
	}
	int chartAxisLabelFontStyle = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISLABELFONTSTYLE+"-"+pivotId) != null ) {
		chartAxisLabelFontStyle = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISLABELFONTSTYLE+"-"+pivotId)).intValue();
	}
	int chartAxisLabelFontSize = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISLABELFONTSIZE+"-"+pivotId) != null ) {
		chartAxisLabelFontSize = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISLABELFONTSIZE+"-"+pivotId)).intValue();
	}
	String chartAxisTickFontFamily = "";
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKFONTFAMILY+"-"+pivotId) != null ) {
		chartAxisTickFontFamily = session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKFONTFAMILY+"-"+pivotId).toString();
	}
	int chartAxisTickFontStyle = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKFONTSTYLE+"-"+pivotId) != null ) {
		chartAxisTickFontStyle = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKFONTSTYLE+"-"+pivotId)).intValue();
	}
	int chartAxisTickFontSize = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKFONTSIZE+"-"+pivotId) != null ) {
		chartAxisTickFontSize = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKFONTSIZE+"-"+pivotId)).intValue();
	}
	int chartAxisTickLabelRotation = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKLABELROTATION+"-"+pivotId) != null ) {
		chartAxisTickLabelRotation = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKLABELROTATION+"-"+pivotId)).intValue();
	}
	boolean chartShowLegend = false;
	if ( session.getAttribute( "pivot-"+PivotViewComponent.CHARTSHOWLEGEND+"-"+pivotId ) != null ) {
		chartShowLegend = ((Boolean) session.getAttribute( "pivot-"+PivotViewComponent.CHARTSHOWLEGEND+"-"+pivotId )).booleanValue();
	}
	int chartLegendLocation = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDLOCATION+"-"+pivotId) != null ) {
		chartLegendLocation = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDLOCATION+"-"+pivotId)).intValue();
	}
	String chartLegendFontFamily = "";
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDFONTFAMILY+"-"+pivotId) != null ) {
		chartLegendFontFamily = session.getAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDFONTFAMILY+"-"+pivotId).toString();
	}
	int chartLegendFontStyle = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDFONTSTYLE+"-"+pivotId) != null ) {
		chartLegendFontStyle = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDFONTSTYLE+"-"+pivotId)).intValue();
	}
    int chartLegendFontSize = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDFONTSIZE+"-"+pivotId) != null ) {
		chartLegendFontSize = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDFONTSIZE+"-"+pivotId)).intValue();
	}
    boolean chartShowSlicer = false;
	if ( session.getAttribute( "pivot-"+PivotViewComponent.CHARTSHOWSLICER+"-"+pivotId ) != null ) {
		chartShowSlicer = ((Boolean) session.getAttribute( "pivot-"+PivotViewComponent.CHARTSHOWSLICER+"-"+pivotId )).booleanValue();
	}
    int chartSlicerLocation = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERLOCATION+"-"+pivotId) != null ) {
		chartSlicerLocation = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERLOCATION+"-"+pivotId)).intValue();
	}
	int chartSlicerAlignment = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERALIGNMENT+"-"+pivotId) != null ) {
		chartSlicerAlignment = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERALIGNMENT+"-"+pivotId)).intValue();
	}
	String chartSlicerFontFamily = "";
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERFONTFAMILY+"-"+pivotId) != null ) {
		chartSlicerFontFamily = session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERFONTFAMILY+"-"+pivotId).toString();
	}
	int chartSlicerFontStyle = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERFONTSTYLE+"-"+pivotId) != null ) {
		chartSlicerFontStyle = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERFONTSTYLE+"-"+pivotId)).intValue();
	}
    int chartSlicerFontSize = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERFONTSIZE+"-"+pivotId) != null ) {
		chartSlicerFontSize = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTSLICERFONTSIZE+"-"+pivotId)).intValue();
	}   
    int chartBackgroundR = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTBACKGROUNDR+"-"+pivotId) != null ) {
		chartBackgroundR = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTBACKGROUNDR+"-"+pivotId)).intValue();
	}	
    int chartBackgroundG = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTBACKGROUNDG+"-"+pivotId) != null ) {
		chartBackgroundG = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTBACKGROUNDG+"-"+pivotId)).intValue();
	}
    int chartBackgroundB = -1;
	if (session.getAttribute( "pivot-"+PivotViewComponent.CHARTBACKGROUNDB+"-"+pivotId) != null ) {
		chartBackgroundB = ((Integer)session.getAttribute( "pivot-"+PivotViewComponent.CHARTBACKGROUNDB+"-"+pivotId)).intValue();
	}
    	
	if( solutionName != null && actionPath != null && actionName != null ) {
	  	// we need to initialize from an action sequence document

		IRuntimeContext context = null;
		try {
			context = getRuntimeForQuery( solutionName, actionPath, actionName, request, userSession );
			if( context != null && context.getStatus() == IRuntimeContext.RUNTIME_STATUS_SUCCESS ) {
			    if (context.getOutputNames().contains(PivotViewComponent.MODEL)) {
			    	try {
			      		catalogUri = context.getOutputParameter( PivotViewComponent.MODEL ).getStringValue(); //$NON-NLS-1$
			      		session.setAttribute("pivot-"+PivotViewComponent.MODEL+"-"+pivotId, catalogUri);
			      	} catch (Exception e) {
			      	}
			    }
				
				dataSource = context.getOutputParameter( PivotViewComponent.CONNECTION ).getStringValue(); //$NON-NLS-1$
		
				if (context.getOutputNames().contains(PivotViewComponent.ROLE)) { //$NON-NLS-1$
				  role = context.getOutputParameter( PivotViewComponent.ROLE ).getStringValue(); //$NON-NLS-1$
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTTYPE ) ) { //$NON-NLS-1$
					try {
						chartType = Integer.parseInt( context.getOutputParameter( PivotViewComponent.CHARTTYPE ).getStringValue() ); //$NON-NLS-1$
						session.setAttribute( "pivot-"+PivotViewComponent.CHARTTYPE+"-"+pivotId, new Integer(chartType) ); //$NON-NLS-1$
						
					} catch (Exception e) {
					}
				} else {
					chartType = 1;
				}
				if (context.getOutputNames().contains(PivotViewComponent.SHOWGRID) ) {
					try {
						showGrid = Boolean.valueOf(context.getOutputParameter( PivotViewComponent.SHOWGRID ).getStringValue()).booleanValue();
						session.setAttribute("pivot-"+PivotViewComponent.SHOWGRID+"-"+pivotId, new Boolean(showGrid));
					} catch (Exception e) {
					}
				} else {
					showGrid = true;
				}
				if (context.getOutputNames().contains(PivotViewComponent.CHARTWIDTH) ) { //$NON-NLS-1$
					try {
						chartWidth = Integer.parseInt( context.getOutputParameter( PivotViewComponent.CHARTWIDTH ).getStringValue() ); //$NON-NLS-1$
						session.setAttribute( "pivot-"+PivotViewComponent.CHARTWIDTH+"-"+pivotId, new Integer(chartWidth) ); //$NON-NLS-1$
					} catch (Exception e) {
					}
				} else {
					chartWidth = 500;  // Default from ChartComponent
				}
				if (context.getOutputNames().contains(PivotViewComponent.CHARTHEIGHT) ) { //$NON-NLS-1$
					try {
						chartHeight = Integer.parseInt( context.getOutputParameter( PivotViewComponent.CHARTHEIGHT ).getStringValue() ); //$NON-NLS-1$
						session.setAttribute( "pivot-"+PivotViewComponent.CHARTHEIGHT+"-"+pivotId, new Integer(chartHeight) ); //$NON-NLS-1$
					} catch (Exception e) {
					}
				} else {
					chartHeight = 300; // Default from ChartComponent
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTLOCATION ) ) { //$NON-NLS-1$
					chartLocation = context.getOutputParameter( PivotViewComponent.CHARTLOCATION ).getStringValue(); //$NON-NLS-1$
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTLOCATION+"-"+pivotId, chartLocation ); //$NON-NLS-1$
				} else {
					chartLocation = "none"; //$NON-NLS-1$
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTDRILLTHROUGHENABLED )) {
					chartDrillThroughEnabled = Boolean.valueOf(context.getOutputParameter( PivotViewComponent.CHARTDRILLTHROUGHENABLED ).getStringValue()).booleanValue();
					session.setAttribute("pivot-"+PivotViewComponent.CHARTDRILLTHROUGHENABLED+"-"+pivotId, new Boolean(chartDrillThroughEnabled));
				} else {
					chartDrillThroughEnabled = false;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTTITLE ) ) {
					chartTitle = context.getOutputParameter( PivotViewComponent.CHARTTITLE ).getStringValue();
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTTITLE+"-"+pivotId, chartTitle );
				} else {
					chartTitle = "";
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTTITLEFONTFAMILY ) ) {
					chartTitleFontFamily = context.getOutputParameter( PivotViewComponent.CHARTTITLEFONTFAMILY ).getStringValue();
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTTITLEFONTFAMILY+"-"+pivotId, chartTitleFontFamily );
				} else {
					chartTitleFontFamily = "SansSerif";
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTTITLEFONTSTYLE ) ) {
					chartTitleFontStyle = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTTITLEFONTSTYLE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTTITLEFONTSTYLE+"-"+pivotId, new Integer(chartTitleFontStyle));
				} else {
					chartTitleFontStyle = java.awt.Font.BOLD;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTTITLEFONTSIZE ) ) {
					chartTitleFontSize = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTTITLEFONTSIZE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTTITLEFONTSIZE+"-"+pivotId, new Integer(chartTitleFontSize));
				} else {
					chartTitleFontSize = 18;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTHORIZAXISLABEL ) ) {
					chartHorizAxisLabel = context.getOutputParameter( PivotViewComponent.CHARTHORIZAXISLABEL ).getStringValue();
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTHORIZAXISLABEL+"-"+pivotId, chartHorizAxisLabel );
				} else {
					chartHorizAxisLabel = "";
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTVERTAXISLABEL ) ) {
					chartVertAxisLabel = context.getOutputParameter( PivotViewComponent.CHARTVERTAXISLABEL ).getStringValue();
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTVERTAXISLABEL+"-"+pivotId, chartVertAxisLabel );
				} else {
					chartVertAxisLabel = "";
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTAXISLABELFONTFAMILY ) ) {
					chartAxisLabelFontFamily = context.getOutputParameter( PivotViewComponent.CHARTAXISLABELFONTFAMILY ).getStringValue();
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTAXISLABELFONTFAMILY+"-"+pivotId, chartAxisLabelFontFamily );
				} else {
					chartAxisLabelFontFamily = "SansSerif";
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTAXISLABELFONTSTYLE ) ) {
					chartAxisLabelFontStyle = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTAXISLABELFONTSTYLE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTAXISLABELFONTSTYLE+"-"+pivotId, new Integer(chartAxisLabelFontStyle));
				} else {
					chartAxisLabelFontStyle = java.awt.Font.PLAIN;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTAXISLABELFONTSIZE ) ) {
					chartAxisLabelFontSize = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTAXISLABELFONTSIZE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTAXISLABELFONTSIZE+"-"+pivotId, new Integer(chartAxisLabelFontSize));
				} else {
					chartAxisLabelFontSize = 12;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTAXISTICKFONTFAMILY ) ) {
					chartAxisTickFontFamily = context.getOutputParameter( PivotViewComponent.CHARTAXISTICKFONTFAMILY ).getStringValue();
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKFONTFAMILY+"-"+pivotId, chartAxisTickFontFamily );
				} else {
					chartAxisTickFontFamily = "SansSerif";
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTAXISTICKFONTSTYLE ) ) {
					chartAxisTickFontStyle = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTAXISTICKFONTSTYLE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKFONTSTYLE+"-"+pivotId, new Integer(chartAxisTickFontStyle));
				} else {
					chartAxisTickFontStyle = java.awt.Font.PLAIN;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTAXISTICKFONTSIZE ) ) {
					chartAxisTickFontSize = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTAXISTICKFONTSIZE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKFONTSIZE+"-"+pivotId, new Integer(chartAxisTickFontSize));
				} else {
					chartAxisTickFontSize = 12;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTAXISTICKLABELROTATION ) ) {
					chartAxisTickLabelRotation = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTAXISTICKLABELROTATION ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTAXISTICKLABELROTATION+"-"+pivotId, new Integer(chartAxisTickLabelRotation));
				} else {
					chartAxisTickLabelRotation = 30;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTSHOWLEGEND )) {
					chartShowLegend = Boolean.valueOf(context.getOutputParameter( PivotViewComponent.CHARTSHOWLEGEND ).getStringValue()).booleanValue();
					session.setAttribute("pivot-"+PivotViewComponent.CHARTSHOWLEGEND+"-"+pivotId, new Boolean(chartShowLegend));
				} else {
					chartShowLegend = true;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTLEGENDLOCATION ) ) {
					chartLegendLocation = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTLEGENDLOCATION ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDLOCATION+"-"+pivotId, new Integer(chartLegendLocation));
				} else {
					chartLegendLocation = 3;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTLEGENDFONTFAMILY ) ) {
					chartLegendFontFamily = context.getOutputParameter( PivotViewComponent.CHARTLEGENDFONTFAMILY ).getStringValue();
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDFONTFAMILY+"-"+pivotId, chartLegendFontFamily );
				} else {
					chartLegendFontFamily = "SansSerif";
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTLEGENDFONTSTYLE ) ) {
					chartLegendFontStyle = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTLEGENDFONTSTYLE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDFONTSTYLE+"-"+pivotId, new Integer(chartLegendFontStyle));
				} else {
					chartLegendFontStyle = java.awt.Font.PLAIN;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTLEGENDFONTSIZE ) ) {
					chartLegendFontSize = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTLEGENDFONTSIZE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTLEGENDFONTSIZE+"-"+pivotId, new Integer(chartLegendFontSize));
				} else {
					chartLegendFontSize = 10;
				}
    			if( context.getOutputNames().contains( PivotViewComponent.CHARTSHOWSLICER )) {
					chartShowSlicer = Boolean.valueOf(context.getOutputParameter( PivotViewComponent.CHARTSHOWSLICER ).getStringValue()).booleanValue();
					session.setAttribute("pivot-"+PivotViewComponent.CHARTSHOWSLICER+"-"+pivotId, new Boolean(chartShowSlicer));
				} else {
					chartShowSlicer = true;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTSLICERLOCATION ) ) {
					chartSlicerLocation = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTSLICERLOCATION ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTSLICERLOCATION+"-"+pivotId, new Integer(chartSlicerLocation));
				} else {
					chartSlicerLocation = 1;
				}
    	    	if( context.getOutputNames().contains( PivotViewComponent.CHARTSLICERALIGNMENT ) ) {
					chartSlicerAlignment = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTSLICERALIGNMENT ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTSLICERALIGNMENT+"-"+pivotId, new Integer(chartSlicerAlignment));
				} else {
					chartSlicerAlignment = 3;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTSLICERFONTFAMILY ) ) {
					chartSlicerFontFamily = context.getOutputParameter( PivotViewComponent.CHARTSLICERFONTFAMILY ).getStringValue();
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTSLICERFONTFAMILY+"-"+pivotId, chartSlicerFontFamily );
				} else {
					chartSlicerFontFamily = "SansSerif";
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTSLICERFONTSTYLE ) ) {
					chartSlicerFontStyle = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTSLICERFONTSTYLE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTSLICERFONTSTYLE+"-"+pivotId, new Integer(chartSlicerFontStyle));
				} else {
					chartSlicerFontStyle = java.awt.Font.PLAIN;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTSLICERFONTSIZE ) ) {
					chartSlicerFontSize = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTSLICERFONTSIZE ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTSLICERFONTSIZE+"-"+pivotId, new Integer(chartSlicerFontSize));
				} else {
					chartSlicerFontSize = 12;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTBACKGROUNDR ) ) {
					chartBackgroundR = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTBACKGROUNDR ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTBACKGROUNDR+"-"+pivotId, new Integer(chartBackgroundR));
				} else {
					chartBackgroundR = 255;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTBACKGROUNDG ) ) {
					chartBackgroundG = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTBACKGROUNDG ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTBACKGROUNDG+"-"+pivotId, new Integer(chartBackgroundG));
				} else {
					chartBackgroundG = 255;
				}
				if( context.getOutputNames().contains( PivotViewComponent.CHARTBACKGROUNDB ) ) {
					chartBackgroundB = Integer.parseInt(context.getOutputParameter( PivotViewComponent.CHARTBACKGROUNDB ).getStringValue());
					session.setAttribute( "pivot-"+PivotViewComponent.CHARTBACKGROUNDB+"-"+pivotId, new Integer(chartBackgroundB));
				} else {
					chartBackgroundB = 255;
				}
				
				chartChange = true;
				query = context.getOutputParameter( "mdx" ).getStringValue(); //$NON-NLS-1$
				options = (ArrayList) context.getOutputParameter( PivotViewComponent.OPTIONS ).getValue(); //$NON-NLS-1$
				pivotTitle = context.getOutputParameter( PivotViewComponent.TITLE ).getStringValue(); //$NON-NLS-1$
				actionTitle = context.getActionTitle();
				if( options != null ) {
					session.setAttribute( optionsId, options );
				} else {
					session.removeAttribute( optionsId );
				}
				actionReference = solutionName+"/"+actionPath+"/"+actionName; //$NON-NLS-1$ //$NON-NLS-2$

				session.setAttribute( "pivot-action-"+pivotId, actionReference ); //$NON-NLS-1$
				session.setAttribute( "pivot-"+PivotViewComponent.TITLE+"-"+pivotId, pivotTitle ); //$NON-NLS-1$
				session.setAttribute( "action-"+PivotViewComponent.TITLE+"-"+pivotId, actionTitle ); //$NON-NLS-1$
			}
		} finally {
			if( context != null ) {
				context.dispose();
			}
		}

	}

	if( pivotTitle == null ) {
	  pivotTitle = Messages.getString("UI.USER_ANALYSIS_UNTITLED_PIVOT_NAME"); //$NON-NLS-1$
	}

	// Take care of saving this xaction
	if ( saveAction != null ) {
	  // Get the current mdx
	  TableComponent table = (TableComponent) session.getAttribute("table01"); //$NON-NLS-1$
	  String mdx = null;
	  String connectString = null;
	  if( table != null ) {
		OlapModel olapModel = table.getOlapModel();
		while( olapModel != null ) {
		  if( olapModel instanceof OlapModelProxy ) {
			OlapModelProxy proxy = (OlapModelProxy) olapModel;
			olapModel = proxy.getDelegate();
		  }
		  if( olapModel instanceof OlapModelDecorator) {
			OlapModelDecorator decorator = (OlapModelDecorator) olapModel;
			olapModel = decorator.getDelegate();
		  }
		  if( olapModel instanceof MdxOlapModel) {
			MdxOlapModel model = (MdxOlapModel) olapModel;
			mdx = model.getCurrentMdx();
			olapModel = null;
		  }
		}
	  }
	  	
	  ChartComponent chart = (ChartComponent) session.getAttribute( "chart01" );
	  
	  HashMap props = new HashMap();
	  	
	  props.put(PivotViewComponent.MODEL, catalogUri);
 	  props.put(PivotViewComponent.CONNECTION, dataSource);
	  props.put(PivotViewComponent.ROLE, role);
	  props.put(PivotViewComponent.SHOWGRID, new Boolean(showGrid));
	  props.put("mdx", mdx);
	  props.put(PivotViewComponent.OPTIONS, options);
	  props.put(PivotViewComponent.TITLE, request.getParameter("save-title"));
	  props.put("actionreference", actionReference);
	
	  if(chart != null){
		  props.put(PivotViewComponent.CHARTTYPE, new Integer(chart.getChartType()));
		  props.put(PivotViewComponent.CHARTWIDTH, new Integer(chart.getChartWidth()));
		  props.put(PivotViewComponent.CHARTHEIGHT, new Integer(chart.getChartHeight()));
		  if (chart.isVisible() && chartLocation.equalsIgnoreCase("none")){
		    chartLocation = "bottom";
		  }
		  props.put(PivotViewComponent.CHARTLOCATION, chart.isVisible() ? chartLocation : "none");
		  props.put(PivotViewComponent.CHARTDRILLTHROUGHENABLED, new Boolean(chart.isDrillThroughEnabled()));
		  props.put(PivotViewComponent.CHARTTITLE, chart.getChartTitle());
		  props.put(PivotViewComponent.CHARTTITLEFONTFAMILY, chart.getFontName());
		  props.put(PivotViewComponent.CHARTTITLEFONTSTYLE, new Integer(chart.getFontStyle()));
		  props.put(PivotViewComponent.CHARTTITLEFONTSIZE, new Integer(chart.getFontSize()));
		  props.put(PivotViewComponent.CHARTHORIZAXISLABEL, chart.getHorizAxisLabel());
		  props.put(PivotViewComponent.CHARTVERTAXISLABEL, chart.getVertAxisLabel());
		  props.put(PivotViewComponent.CHARTAXISLABELFONTFAMILY, chart.getAxisFontName());
		  props.put(PivotViewComponent.CHARTAXISLABELFONTSTYLE, new Integer(chart.getAxisFontStyle()));
		  props.put(PivotViewComponent.CHARTAXISLABELFONTSIZE, new Integer(chart.getAxisFontSize()));
		  props.put(PivotViewComponent.CHARTAXISTICKFONTFAMILY, chart.getAxisTickFontName());
		  props.put(PivotViewComponent.CHARTAXISTICKFONTSTYLE, new Integer(chart.getAxisTickFontStyle()));
		  props.put(PivotViewComponent.CHARTAXISTICKFONTSIZE, new Integer(chart.getAxisTickFontSize()));
		  props.put(PivotViewComponent.CHARTAXISTICKLABELROTATION, new Integer(chart.getTickLabelRotate()));
		  props.put(PivotViewComponent.CHARTSHOWLEGEND, new Boolean(chart.getShowLegend()));
		  props.put(PivotViewComponent.CHARTLEGENDLOCATION, new Integer(chart.getLegendPosition()));
		  props.put(PivotViewComponent.CHARTLEGENDFONTFAMILY, chart.getLegendFontName());
    	  props.put(PivotViewComponent.CHARTLEGENDFONTSTYLE, new Integer(chart.getLegendFontStyle()));
    	  props.put(PivotViewComponent.CHARTLEGENDFONTSIZE, new Integer(chart.getLegendFontSize()));
 		  props.put(PivotViewComponent.CHARTSHOWSLICER, new Boolean(chart.isShowSlicer()));
    	  props.put(PivotViewComponent.CHARTSLICERLOCATION, new Integer(chart.getSlicerPosition()));
    	  props.put(PivotViewComponent.CHARTSLICERALIGNMENT, new Integer(chart.getSlicerAlignment()));
   		  props.put(PivotViewComponent.CHARTSLICERFONTFAMILY, chart.getSlicerFontName());
    	  props.put(PivotViewComponent.CHARTSLICERFONTSTYLE, new Integer(chart.getSlicerFontStyle()));
    	  props.put(PivotViewComponent.CHARTSLICERFONTSIZE, new Integer(chart.getSlicerFontSize()));
 		  props.put(PivotViewComponent.CHARTBACKGROUNDR, new Integer(chart.getBgColorR()));
    	  props.put(PivotViewComponent.CHARTBACKGROUNDG, new Integer(chart.getBgColorG()));
    	  props.put(PivotViewComponent.CHARTBACKGROUNDB, new Integer(chart.getBgColorB()));
	  }

	  if (( "save".equals(saveAction)) || ("saveAs".equals(saveAction)))  {    
	    
	    // Overwrite is true, because the saveAs dialog checks for overwrite, and we never
	    // would have gotten here unless the user selected to overwrite the file. 
		try{
			saveResult = AnalysisSaver.saveAnalysis(userSession, props, request.getParameter("save-path"), request.getParameter("save-file"), true);
			switch (saveResult) {
				case ISolutionRepository.FILE_ADD_SUCCESSFUL: 
					saveMessage = Messages.getString("UI.USER_SAVE_SUCCESS");
					break;
				case ISolutionRepository.FILE_EXISTS:
					// Shouldn't ever get here, since we pass overwrite=true;
				  	break;
				case ISolutionRepository.FILE_ADD_FAILED:
					saveMessage = Messages.getString("UI.USER_SAVE_FAILED_GENERAL");
					break;
				case ISolutionRepository.FILE_ADD_INVALID_PUBLISH_PASSWORD:
					// There is no publish password on this save...
					break;
				case ISolutionRepository.FILE_ADD_INVALID_USER_CREDENTIALS:
					saveMessage = Messages.getString("UI.USER_SAVE_FAILED_INVALID_USER_CREDS");
					break;
				case 0:
				  	saveMessage="";
				  	session.setAttribute( "save-message-"+pivotId, saveMessage); //$NON-NLS-1$
				  	break;
			}	
	    } catch (Throwable e){
		  saveResult = ISolutionRepository.FILE_ADD_FAILED;
	      saveMessage = e.getMessage();
	    }
		session.setAttribute( "save-message-"+pivotId, saveMessage); //$NON-NLS-1$

	  } 	
	}
 
  if( query != null ) { 
    IDatasourceService datasourceService = (IDatasourceService) PentahoSystem.getObjectFactory().getObject(IDatasourceService.IDATASOURCE_SERVICE, null);
    DataSource currDataSource = null; 
    try {
      currDataSource = datasourceService.getDataSource(dataSource);
    } catch (Throwable t) {
      t.printStackTrace();
    }
    if (currDataSource != null) {
      request.setAttribute("currDataSource", currDataSource);
%>
	<jp:mondrianQuery id="<%=queryId%>" dataSource="${currDataSource}"
	dynResolver="mondrian.i18n.LocalizingDynamicSchemaProcessor"
	dynLocale="<%= userSession.getLocale().toString() %>"
	role="<%=role%>" catalogUri="<%=catalogUri%>">
	<%=query%>
	</jp:mondrianQuery> 
<% 
    } else {
%>
	<jp:mondrianQuery id="<%=queryId%>" dataSource="<%=dataSource%>"
	dynResolver="mondrian.i18n.LocalizingDynamicSchemaProcessor"
	dynLocale="<%= userSession.getLocale().toString() %>"
	role="<%=role%>" catalogUri="<%=catalogUri%>">
	<%=query%>
	</jp:mondrianQuery> 
<% 
    }
  }    
%>
<c:set var="title01" scope="session">
	<%

	out.print( pivotTitle );

%>
</c:set>

<html>
<head>
<title><%= Messages.getString("UI.USER_ANALYSIS") %></title>
<meta http-equiv="Content-Type"
	content="text/html; charset=<%= LocaleHelper.getSystemEncoding() %>">
<link rel="stylesheet" type="text/css" href="jpivot/table/mdxtable.css">
<link rel="stylesheet" type="text/css" href="jpivot/navi/mdxnavi.css">
<link rel="stylesheet" type="text/css" href="wcf/form/xform.css">
<link rel="stylesheet" type="text/css" href="wcf/table/xtable.css">
<link rel="stylesheet" type="text/css" href="wcf/tree/xtree.css">
<link href="/pentaho-style/styles-new.css" rel="stylesheet"
	type="text/css" />
<link rel="shortcut icon" href="/pentaho-style/favicon.ico" />

<!-- ****************************************************************************************** -->
<!-- ****************        JAVASCRIPT FOR SAVE DIALOGS              ************************* -->
<!-- ****************************************************************************************** -->

	<link href="adhoc/styles/repositoryBrowserStyles.css" rel="stylesheet" type="text/css" />
    <link href="adhoc/styles/jpivot.css" rel="stylesheet" type="text/css" />
	<!--[if IE]>
      <link href="adhoc/styles/jpivotIE6.css" rel="stylesheet" type="text/css"/>	
    <![endif]-->
 
  
    <script src="wcf/scroller.js" type="text/javascript"></script> 
	<script src="js/ajaxslt0.7/xmltoken.js" type="text/javascript"></script>
	<script src="js/ajaxslt0.7/util.js" type="text/javascript"></script>	
	<script src="js/ajaxslt0.7/dom.js" type="text/javascript"></script>
	<script src="js/ajaxslt0.7/xpath.js" type="text/javascript"></script>
	<script src="js/ajaxslt0.7/xslt.js" type="text/javascript"></script>

	<script src="js/pentaho-ajax.js" type="text/javascript"></script>
	<script src="js/utils.js" type="text/javascript"></script>
	<script type="text/javascript">
		djConfig = { isDebug: false};
	</script>

	<script src="js/dojo.js" type="text/javascript"></script>
	
	<script type="text/javascript">
		dojo.registerModulePath("adhoc", "../adhoc/js");
	</script>
	
	<script src="adhoc/js/common/ui/messages/Messages.js" type="text/javascript"></script>
	
	<script type="text/javascript">
		Messages.addBundle("adhoc.ui.messages", "message_strings");
	</script>
	
  <script src="adhoc/js/common/ui/MessageCtrl.js" type="text/javascript"></script>
	<script src="adhoc/js/common/server/WebServiceProxy.js" type="text/javascript"></script>
	<script src="adhoc/js/common/util/StringUtils.js" type="text/javascript"></script>
	<script src="adhoc/js/common/util/Status.js" type="text/javascript"></script>
	<script src="adhoc/js/common/util/XmlUtil.js" type="text/javascript"></script>
	
	<script src="adhoc/js/model/SolutionRepository.js" type="text/javascript"></script>
	
	<script src="adhoc/js/common/ui/UIUtil.js" type="text/javascript"></script>	
	<script type="text/javascript">
		UIUtil.setImageFolderPath( "adhoc/images/" );
	</script>
	<script src="adhoc/js/common/ui/HTMLCtrl.js" type="text/javascript"></script>
	<script src="adhoc/js/common/ui/Logger.js" type="text/javascript"></script>
	<script src="adhoc/js/common/ui/BusyCtrl.js" type="text/javascript"></script>
	<script src="adhoc/js/common/ui/PickListCtrl.js" type="text/javascript"></script>
	<script src="adhoc/js/common/ui/ListCtrl.js" type="text/javascript"></script>
	<script src="adhoc/js/common/ui/ComboCtrl.js" type="text/javascript"></script>
	<script src="adhoc/js/common/ui/Dialog.js" type="text/javascript"></script>
	 
	<script src="adhoc/js/common/ui/ButtonCtrl.js" type="text/javascript"></script>
	<script src="adhoc/js/common/ui/MessageCtrl.js" type="text/javascript"></script>
	
	<script src="adhoc/js/ui/RepositoryBrowser.js" type="text/javascript"></script>
	<script src="js/pivot/PivotRepositoryBrowserController.js" type="text/javascript"></script>

	<script type="text/javascript">
		
		var controller = null;
		var newActionName = null;
		var newSolution = null;
		var newActionPath = null;
		
		function cursor_wait() {
			document.body.style.cursor = 'wait';
		}
		
		function cursor_clear() {
			document.body.style.cursor = 'default';
		}
		
		function load(){
			xScrollerScroll(); 
			cursor_wait();
			controller = new PivotRepositoryBrowserController();
			controller.setOnAfterSaveCallback( function()
			{
				var newActionName = encodeURI( controller.getActionName() );
				var newSolution = encodeURI( controller.getSolution() );
				var newActionPath = encodeURI( controller.getActionPath() );
				var newActionTitle = encodeURI( controller.getActionTitle()!=null?controller.getActionTitle():controller.getActionName() );
				document.location.href='<%= pageName %>?save-action=saveAs&save-path='+newSolution
				+'/'+newActionPath+'&save-file='+newActionName+'&save-title='+newActionTitle;
			});
			cursor_clear();
			if (saveMessage != null && "" != saveMessage) {
			  if (window.top != null && window.top.mantle_initialized) {
				window.top.mantle_refreshRepository();
			    window.top.mantle_showMessage("Info", saveMessage);
			  } else {
			    alert(saveMessage);
			  }
			}
			
			if (window.top != null && window.top.mantle_initialized) {
			  var tmpSaveButton = document.getElementById('folder-down');
			  var tmpSaveAsButton = document.getElementById('folder-up');
			  tmpSaveButton.parentNode.parentNode.removeChild(tmpSaveButton.parentNode);
			  tmpSaveAsButton.parentNode.parentNode.removeChild(tmpSaveAsButton.parentNode);
			}
			window.pivot_initialized = true;
		}
		
		function save()
		{
			cursor_wait();
		<%
			ActionInfo actionInfo = ActionInfo.parseActionString( actionReference );
		%>
			var newActionName = encodeURI( "<%= actionInfo.getActionName() %>" );
			var newSolution = encodeURI( "<%= actionInfo.getSolutionName() %>" );
			var newActionPath = encodeURI( "<%= actionInfo.getPath() %>" );
			var title = encodeURI( "<%= actionTitle %>" );
			document.location.href='<%= pageName %>?save-action=saveAs&save-path='+newSolution
			+'/'+newActionPath+'&save-file='+newActionName+'&save-title=' + title;
			cursor_clear();
		}

		function saveAs()
		{
			controller.save();
			
		}

	</script>

<!-- ****************************************************************************************** -->
<!-- ****************************************************************************************** -->
<!-- ****************************************************************************************** -->


	<script type="text/javascript">

		
		function doSubscribed() {
		    var submitUrl = '';
			var action= document.getElementById('subscription-action').value;
			var target='';
				
			if( action == 'load' ) {
				submitUrl += '<%= pageName %>?subscribe=load&query=SampleData';
			}
			else 
			if( action == 'delete' ) {
				submitUrl += '<%= pageName %>?subscribe=delete';
			}

			var name= document.getElementById('subscription').value;
			submitUrl += '&subscribe-name='+encodeURI(name);
			    document.location.href=submitUrl;
		    return false;
	  	}

		/***********************************************
		* Ajax Includes script-  Dynamic Drive DHTML code library (www.dynamicdrive.com)
		* This notice MUST stay intact for legal use
		* Visit Dynamic Drive at http://www.dynamicdrive.com/ for full source code
		***********************************************/

		//To include a page, invoke ajaxinclude("afile.htm") in the BODY of page
		//Included file MUST be from the same domain as the page displaying it.
		
		var rootdomain="http://"+window.location.hostname
		
		function ajaxinclude(url) {
			var page_request = false
			if (window.XMLHttpRequest) // if Mozilla, Safari etc
				page_request = new XMLHttpRequest()
			else if (window.ActiveXObject){ // if IE
				try {
					page_request = new ActiveXObject("Msxml2.XMLHTTP")
				} catch (e){
					try{
						page_request = new ActiveXObject("Microsoft.XMLHTTP")
					}catch (e){}
				}
			}
			else
				return false
			page_request.open('GET', url, false) //get page synchronously 
			page_request.send(null)
			writecontent(page_request)
		}
		
		function writecontent(page_request){
			if (window.location.href.indexOf("http")==-1 || page_request.status==200)
				document.write(page_request.responseText)
		}
		
	</script>

<!-- ****************************************************************************************** -->
<!-- ****************************************************************************************** -->
<!-- ****************************************************************************************** -->

</head>
<body class="body_dialog01" dir="<%= LocaleHelper.getTextDirection() %>" onload="javascript:load();">
<div class="dialog01_content">

<%
	if( subscribeResult != null ) {
		out.println( subscribeResult );
		out.println( "<br/>" ); //$NON-NLS-1$
	}
%>

<table border="0" width="100%" class="content_container2"
	cellpadding="0" cellspacing="0">
	<tr>
		<td class="content_body">

		<form action="<%= pageName %>" method="post"><c:if
			test="${query01 == null}">
			<%= Messages.getString("UI.USER_ANALYSIS_INVALID_PAGE") %>
		</c:if> <c:if test="${query01 != null}">

			<%-- define table, navigator and forms --%>
			<wcf:scroller/> 
			<jp:table id="table01" query="#{query01}" />
			<jp:navigator id="navi01" query="#{query01}" visible="false" />
			<wcf:form id="mdxedit01" xmlUri="/WEB-INF/jpivot/table/mdxedit.xml"
				model="#{query01}" visible="false" />
			<wcf:form id="sortform01" xmlUri="/WEB-INF/jpivot/table/sortform.xml"
				model="#{table01}" visible="false" />

			<jp:print id="print01" />
			<wcf:form id="printform01"
				xmlUri="/WEB-INF/jpivot/print/printpropertiesform.xml"
				model="#{print01}" visible="false" />

			<jp:chart id="chart01" query="#{query01}" visible="false" />
			<% 
	ChartComponent thischart = (ChartComponent) session.getAttribute( "chart01" );
	if( chartChange ) {
		thischart.setChartType( chartType );
		thischart.setVisible( (chartLocation != null) && !chartLocation.equals( "none" ) );
		if (chartWidth > 0) {
			thischart.setChartWidth(chartWidth);
		} else {
			thischart.setChartWidth(500);		// 500 is the default that the ChartCompoent uses
		}
		if (chartHeight > 0) {
			thischart.setChartHeight(chartHeight);
		} else {
			thischart.setChartHeight(300);	// 300 is the default that the ChartComponent uses
		}
		thischart.setChartTitle(chartTitle);
		thischart.setDrillThroughEnabled(chartDrillThroughEnabled);
		thischart.setFontName(chartTitleFontFamily);
		thischart.setFontStyle(chartTitleFontStyle);
		thischart.setFontSize(chartTitleFontSize);
		thischart.setHorizAxisLabel(chartHorizAxisLabel);
		thischart.setVertAxisLabel(chartVertAxisLabel);
		thischart.setAxisFontName(chartAxisLabelFontFamily);
		thischart.setAxisFontStyle(chartAxisLabelFontStyle);
		thischart.setAxisFontSize(chartAxisLabelFontSize);
		thischart.setAxisTickFontName(chartAxisTickFontFamily);
		thischart.setAxisTickFontStyle(chartAxisTickFontStyle);
		thischart.setAxisTickFontSize(chartAxisTickFontSize);
		thischart.setTickLabelRotate(chartAxisTickLabelRotation);
		thischart.setShowLegend(chartShowLegend);
		thischart.setLegendPosition(chartLegendLocation);
		thischart.setLegendFontName(chartLegendFontFamily);
		thischart.setLegendFontStyle(chartLegendFontStyle);
		thischart.setLegendFontSize(chartLegendFontSize);
    	thischart.setShowSlicer(chartShowSlicer);
    	thischart.setSlicerPosition(chartSlicerLocation);
    	thischart.setSlicerAlignment(chartSlicerAlignment);
    	thischart.setSlicerFontName(chartSlicerFontFamily);
    	thischart.setSlicerFontStyle(chartSlicerFontStyle);
    	thischart.setSlicerFontSize(chartSlicerFontSize);
    	thischart.setBgColorR(chartBackgroundR);
    	thischart.setBgColorG(chartBackgroundG);
    	thischart.setBgColorB(chartBackgroundB);   	
    }
%>
		 	<wcf:form id="chartform01"
				xmlUri="/WEB-INF/jpivot/chart/chartpropertiesform.xml"
				model="#{chart01}" visible="false" />
			<wcf:table id="query01.drillthroughtable" visible="false"
				selmode="none" editable="true" />

			<%-- define a toolbar --%>

			<% if( options != null ) {
	session.removeAttribute( "toolbar01" ); //$NON-NLS-1$
   }
 %>
			<wcf:toolbar id="toolbar01"
				bundle="com.tonbeller.jpivot.toolbar.resources">
				<% if( options == null ) { %>
				<wcf:scriptbutton id="cubeNaviButton" tooltip="toolb.cube"
					img="cube" model="#{navi01.visible}" />
				<wcf:scriptbutton id="mdxEditButton" tooltip="toolb.mdx.edit"
					img="mdx-edit" model="#{mdxedit01.visible}" />
				<wcf:scriptbutton id="sortConfigButton" tooltip="toolb.table.config"
					img="sort-asc" model="#{sortform01.visible}" />
				<wcf:separator />
				<wcf:scriptbutton id="levelStyle" tooltip="toolb.level.style"
					img="level-style"
					model="#{table01.extensions.axisStyle.levelStyle}" />
				<wcf:scriptbutton id="hideSpans" tooltip="toolb.hide.spans"
					img="hide-spans" model="#{table01.extensions.axisStyle.hideSpans}" />
				<wcf:scriptbutton id="propertiesButton" tooltip="toolb.properties"
					img="properties"
					model="#{table01.rowAxisBuilder.axisConfig.propertyConfig.showProperties}" />
				<wcf:scriptbutton id="nonEmpty" tooltip="toolb.non.empty"
					img="non-empty"
					model="#{table01.extensions.nonEmpty.buttonPressed}" />
				<wcf:scriptbutton id="swapAxes" tooltip="toolb.swap.axes"
					img="swap-axes"
					model="#{table01.extensions.swapAxes.buttonPressed}" />
				<wcf:separator />
				<wcf:scriptbutton model="#{table01.extensions.drillMember.enabled}"
					tooltip="toolb.navi.member" radioGroup="navi" id="drillMember"
					img="navi-member" />
				<wcf:scriptbutton
					model="#{table01.extensions.drillPosition.enabled}"
					tooltip="toolb.navi.position" radioGroup="navi" id="drillPosition"
					img="navi-position" />
				<wcf:scriptbutton model="#{table01.extensions.drillReplace.enabled}"
					tooltip="toolb.navi.replace" radioGroup="navi" id="drillReplace"
					img="navi-replace" />
				<wcf:scriptbutton model="#{table01.extensions.drillThrough.enabled}"
					tooltip="toolb.navi.drillthru" id="drillThrough01"
					img="navi-through" />
				<wcf:separator />
				<wcf:scriptbutton id="chartButton01" tooltip="toolb.chart"
					img="chart" model="#{chart01.visible}" />
				<wcf:scriptbutton id="chartPropertiesButton01"
					tooltip="toolb.chart.config" img="chart-config"
					model="#{chartform01.visible}" />
				<wcf:separator />
				<wcf:scriptbutton id="printPropertiesButton01"
					tooltip="toolb.print.config" img="print-config"
					model="#{printform01.visible}" />
				<wcf:imgbutton id="printpdf" tooltip="toolb.print" img="print"
					href="./Print?cube=01&type=1" />
				<wcf:imgbutton id="printxls" tooltip="toolb.excel" img="excel"
					href="./Print?cube=01&type=0" />
				<% } else {
	Iterator iterator = options.iterator();
	while( iterator.hasNext() ) {
		String optionName = (String) iterator.next();
		if( "cube-nav".equals( optionName ) ) { %>
				<wcf:scriptbutton id="cubeNaviButton" tooltip="toolb.cube"
					img="cube" model="#{navi01.visible}" />
				<%  } else
		if( "mdx-edit".equals( optionName ) ) { %>
				<wcf:scriptbutton id="mdxEditButton" tooltip="toolb.mdx.edit"
					img="mdx-edit" model="#{mdxedit01.visible}" />
				<%  } else
		if( "sort-conf".equals( optionName ) ) { %>
				<wcf:scriptbutton id="sortConfigButton" tooltip="toolb.table.config"
					img="sort-asc" model="#{sortform01.visible}" />
				<%  } else
		if( "spacer".equals( optionName ) ) { %>
				<wcf:separator />
				<%  } else
		if( "level-style".equals( optionName ) ) { %>
				<wcf:scriptbutton id="levelStyle" tooltip="toolb.level.style"
					img="level-style"
					model="#{table01.extensions.axisStyle.levelStyle}" />
				<%  } else
		if( "hide-spans".equals( optionName ) ) { %>
				<wcf:scriptbutton id="hideSpans" tooltip="toolb.hide.spans"
					img="hide-spans" model="#{table01.extensions.axisStyle.hideSpans}" />
				<%  } else
		if( "properties".equals( optionName ) ) { %>
				<wcf:scriptbutton id="propertiesButton" tooltip="toolb.properties"
					img="properties"
					model="#{table01.rowAxisBuilder.axisConfig.propertyConfig.showProperties}" />
				<%  } else
		if( "non-empty".equals( optionName ) ) { %>
				<wcf:scriptbutton id="nonEmpty" tooltip="toolb.non.empty"
					img="non-empty"
					model="#{table01.extensions.nonEmpty.buttonPressed}" />
				<%  } else
		if( "swap-axes".equals( optionName ) ) { %>
				<wcf:scriptbutton id="swapAxes" tooltip="toolb.swap.axes"
					img="swap-axes"
					model="#{table01.extensions.swapAxes.buttonPressed}" />
				<%  } else
		if( "drill-member".equals( optionName ) ) { %>
				<wcf:scriptbutton model="#{table01.extensions.drillMember.enabled}"
					tooltip="toolb.navi.member" radioGroup="navi" id="drillMember"
					img="navi-member" />
				<%  } else
		if( "drill-position".equals( optionName ) ) { %>
				<wcf:scriptbutton
					model="#{table01.extensions.drillPosition.enabled}"
					tooltip="toolb.navi.position" radioGroup="navi" id="drillPosition"
					img="navi-position" />
				<%  } else
		if( "drill-replace".equals( optionName ) ) { %>
				<wcf:scriptbutton model="#{table01.extensions.drillReplace.enabled}"
					tooltip="toolb.navi.replace" radioGroup="navi" id="drillReplace"
					img="navi-replace" />
				<%  } else
		if( "drill-thru".equals( optionName ) ) { %>
				<wcf:scriptbutton model="#{table01.extensions.drillThrough.enabled}"
					tooltip="toolb.navi.drillthru" id="drillThrough01"
					img="navi-through" />
				<%  } else
		if( "chart".equals( optionName ) ) { %>
				<wcf:scriptbutton id="chartButton01" tooltip="toolb.chart"
					img="chart" model="#{chart01.visible}" />
				<%  } else
		if( "chart-conf".equals( optionName ) ) { %>
				<wcf:scriptbutton id="chartPropertiesButton01"
					tooltip="toolb.chart.config" img="chart-config"
					model="#{chartform01.visible}" />
				<%  } else
		if( "print-conf".equals( optionName ) ) { %>
				<wcf:scriptbutton id="printPropertiesButton01"
					tooltip="toolb.print.config" img="print-config"
					model="#{printform01.visible}" />
				<%  } else
		if( "print-pdf".equals( optionName ) ) { %>
				<wcf:imgbutton id="printpdf" tooltip="toolb.print" img="print"
					href="./Print?cube=01&type=1" />
				<%  } else
		if( "excel".equals( optionName ) ) { %>
				<wcf:imgbutton id="printxls" tooltip="toolb.excel" img="excel"
					href="./Print?cube=01&type=0" />
				<%  } 

	}
   } 
%>
			</wcf:toolbar>

<!-- ****************************************************************************************** -->
<!-- ******************                   SAVE BUTTONS               ************************** -->
<!-- ****************************************************************************************** -->

		<div id="folder-options" style="display:block">
			<table cellpadding="0" cellspacing="0">
				<tr>
					<% if( authenticated ) { %>
					<td>
						<span id="folder-down" style="display:block">
						<img
							src="./jpivot/toolbar/jpivot_save.png"
							onclick="javascript:save();"
							alt="Save" title="Save"/>
						</span>			
					</td>
					<td>
						<span id="folder-up" style="display:block">
						<img 
							src="./jpivot/toolbar/jpivot_saveas.png"
							onclick="javascript:saveAs();"
							alt="Save As" title="Save As"/>
						</span>
					</td>					
					<% } %>

<!-- ****************************************************************************************** -->
<!-- ****************************************************************************************** -->
<!-- ****************************************************************************************** -->


					<td>
						<%-- render toolbar --%> 
						<wcf:render ref="toolbar01"	xslUri="/WEB-INF/jpivot/toolbar/htoolbar.xsl" xslCache="true" />
					</td>
				</tr>
			</table>
		</div>


 <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX -->

<div id="browser.modalDiv" class='browser'>
	<!-- ======================================================
		 ==  SAVEAS DIALOG                                   ==
		 ====================================================== -->
	<div id="browser.saveasDialog" style="display:none; position:absolute; top:100px; left:200px; height:25px;">
		<table border="0" cellspacing="0" cellpadding="0" class="popupDialog_table">
			<tr>
				<td class="popupDialog_header">
					<div id="browser.titleBar" class="popupDialogTitleBar" onmouseover="this.onmousedown=Dialog.dragIsDown;" ondragstart="return false;" onselectstart="return false;"></div>
				</td>
			</tr>
			<tr>
				<td valign="top" style="padding: 15px;">
					<table style="width:40em;height:100%;" border="0" cellspacing="2px" cellpadding="2px">
						<tr>
							<td id="saveDlgSaveAsPrompt" style='width:25%'>Save As:</td>
							<td style='width:75%'><input type="text" id="browser.saveAsNameInputText" tabindex='0' name="textfield" class="browserSaveAsText"/></td>
						</tr>
						<tr>
							<td id="saveDlgWherePrompt">Where:</td>
							<td>
								<table style='width:100%;' border="0" cellspacing="0" cellpadding="0">
									<tr>
										<td style="width:100%;padding-right:5px;" id="browser.comboContainer"></td>
										<td><img id='browser.upImg' src="adhoc/images/up.png" alt="up"/></td>
									</tr>
								</table>
							</td>
						</tr>
						<tr>
							<td id="saveDlgSelectSltnTitle" colspan='2'>Select a Solution</td>
						</tr>
						<tr>
							<td id="browser.solutionFolderListTd" height="100%" colspan='2'>
							</td>
						</tr>
					</table>
				</td>
			</tr>
			<tr>
				<td style="border-top: 1px solid #818f49; background-color: #ffffff;">
					<table border="0" cellpadding="0" cellspacing="0" align="right">
						<tr>
							<td id="browser.saveBtnContainer" width="75">
							</td>
							<td id="browser.cancelBtnContainer" width="85">
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</div>
	<!-- ======================================================
		 ==  END SAVEAS DIALOG                               ==
		 ====================================================== -->
 </div>
 <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX -->

			
    <script type="text/javascript">
      var saveMessage = '<%= saveMessage %>';
    </script>
    
	<% 
	
	switch (saveResult) {
		case ISolutionRepository.FILE_ADD_SUCCESSFUL: 

		  if ("saveAs".equals(saveAction)){
		    
		    	// If performing a save as.. , we need to reload the view with the newly saved 
		    	// action sequence.
				ActionInfo info = ActionInfo.parseActionString(request.getParameter("save-path")+ "/" + request.getParameter("save-file"));
				String fileName = info.getActionName();
				fileName = fileName.endsWith(AnalysisSaver.SUFFIX) ? fileName : fileName+AnalysisSaver.SUFFIX;

	%> 
		   
				<script type="text/javascript">
					var path = encodeURI( "<%= info.getPath() %>" );
					var fileName = encodeURI( "<%= fileName %>" );
					var solutionName = encodeURI( "<%= info.getSolutionName() %>" );
					var uri = "ViewAction?solution=" + solutionName + "&path=" + path + "&action=" + fileName;
					document.location.href = uri;
				</script>

	<%
			}
			break;
		case ISolutionRepository.FILE_EXISTS:
		break;
		case ISolutionRepository.FILE_ADD_FAILED:
		  break;
		case ISolutionRepository.FILE_ADD_INVALID_PUBLISH_PASSWORD:
		  break;
		case ISolutionRepository.FILE_ADD_INVALID_USER_CREDENTIALS:
		  break;
		case 0:
		  saveMessage="";
		  session.setAttribute( "save-message-"+pivotId, saveMessage); //$NON-NLS-1$
		  break;
	}	
    %>

	    
			<div id="internal_content"><%-- if there was an overflow, show error message --%> 
			<%-- note, if internal error is caused by query01.getResult(),
			     no usable log messages make it to the user or the log system
			     
			  --%>
			  <%
			Object _testQuery01 = session.getAttribute("query01");
			if (_testQuery01 != null) {
			  OlapModel _testQuery01OlapModel = (OlapModel)_testQuery01;
			  try {
    			  _testQuery01OlapModel.getResult();
    			  
    			%><c:if
    				test="${query01.result.overflowOccured}">
    				<p><strong style="color:red">Resultset overflow occured</strong>
    				<p>
    			</c:if><%
    			  
			  } catch (Throwable t) {
			    	t.printStackTrace();
			    %><p><strong style="color:red">Error Occurred While getting Resultset</strong></p><%
			  }
			}	
			%><%-- render navigator --%> 
			
			<div id="navi01div">
			<wcf:render ref="navi01"
				xslUri="/WEB-INF/jpivot/navi/navigator.xsl" xslCache="true" /> 
			</div>
			
			
				<%-- edit mdx --%>
			<c:if test="${mdxedit01.visible}">
				<h3>MDX Query Editor</h3>
				<wcf:render ref="mdxedit01" xslUri="/WEB-INF/wcf/wcf.xsl"
					xslCache="true" />
			</c:if> <%-- sort properties --%> <wcf:render ref="sortform01"
				xslUri="/WEB-INF/wcf/wcf.xsl" xslCache="true" /> <%-- chart properties --%>
			<wcf:render ref="chartform01" xslUri="/WEB-INF/wcf/wcf.xsl"
				xslCache="true" /> <%-- print properties --%> <wcf:render
				ref="printform01" xslUri="/WEB-INF/wcf/wcf.xsl" xslCache="true" />

			<table border="0">
				<tr>
					<td></td>
					<td>
					<% 
						boolean chartRendered = false;
					    if("top".equals(chartLocation) ) { %> <wcf:render ref="chart01"
							xslUri="/WEB-INF/jpivot/chart/chart.xsl" xslCache="true" /> <% 
							chartRendered = true;
						} 
					%>
					</td>
					<td></td>
				</tr>
				<tr>
					<td valign="top">
					<% if("left".equals(chartLocation) && !chartRendered) { %> <wcf:render ref="chart01"
						xslUri="/WEB-INF/jpivot/chart/chart.xsl" xslCache="true" /> <% 
						chartRendered = true;
					} %>
					</td>
					<td valign="top"><!-- render the table --> <% if (showGrid) { %>
					<p><wcf:render ref="table01"
						xslUri="/WEB-INF/jpivot/table/mdxtable.xsl" xslCache="true" /> <% } %>
					
					<p><font size="2"> Slicer: <wcf:render ref="table01"
						xslUri="/WEB-INF/jpivot/table/mdxslicer.xsl" xslCache="true" /> </font>
					<p><!-- drill through table --> <wcf:render
						ref="query01.drillthroughtable" xslUri="/WEB-INF/wcf/wcf.xsl"
						xslCache="true" />
					</td>
					<td valign="top">
					<% if("right".equals(chartLocation) && !chartRendered) { %> <wcf:render ref="chart01"
						xslUri="/WEB-INF/jpivot/chart/chart.xsl" xslCache="true" /> <% 
						chartRendered = true;
					} %>
					</td>
				</tr>
				<tr>
					<td></td>
					<td>
					<% 
					ChartComponent chart = (ChartComponent) session.getAttribute( "chart01" );
					if(("bottom".equals(chartLocation) || chart.isVisible()) && !chartRendered) { %> <wcf:render ref="chart01"
						xslUri="/WEB-INF/jpivot/chart/chart.xsl" xslCache="true" /> <% 
						chartRendered = true;
					} %>
					</td>
					<td></td>
				</tr>
				<table>
					</c:if>

				</table>
				
				
</body>

</html>
<% 
   } catch (Throwable t ) {
     %> An error occurred while rendering Pivot.jsp.  Please see the log for details. <%
	// TODO log an error
	t.printStackTrace();
   } finally {
      PentahoSystem.systemExitPoint();      
   }
%>
<%!

	private IRuntimeContext getRuntimeForQuery( String actionReference, HttpServletRequest request, IPentahoSession userSession ) {

		ActionInfo actionInfo = ActionInfo.parseActionString( actionReference );
		if( actionInfo == null ) {
			return null;
		}
		return getRuntimeForQuery( actionInfo.getSolutionName(), actionInfo.getPath(), actionInfo.getActionName(), request, userSession );

	}

	private IRuntimeContext getRuntimeForQuery( String solutionName, String actionPath, String actionName, HttpServletRequest request, IPentahoSession userSession ) {
  		String processId = "PivotView"; //$NON-NLS-1$
  		String instanceId = request.getParameter( "instance-id" ); //$NON-NLS-1$
  		boolean doMessages = "true".equalsIgnoreCase( request.getParameter("debug" ) ); //$NON-NLS-1$ //$NON-NLS-2$

		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		SimpleOutputHandler outputHandler = new SimpleOutputHandler( outputStream, true );
		ISolutionEngine solutionEngine = PentahoSystem.getSolutionEngineInstance( userSession );
		solutionEngine.init( userSession );
		IRuntimeContext context = null;
		ArrayList messages = new ArrayList();
		HttpRequestParameterProvider requestParameters = new HttpRequestParameterProvider( request );
		HttpSessionParameterProvider sessionParameters = new HttpSessionParameterProvider( userSession );
		HashMap parameterProviders = new HashMap();
		requestParameters.setParameter( PivotViewComponent.MODE, PivotViewComponent.EXECUTE ); //$NON-NLS-1$ //$NON-NLS-2$
		parameterProviders.put( HttpRequestParameterProvider.SCOPE_REQUEST, requestParameters ); //$NON-NLS-1$
		parameterProviders.put( HttpSessionParameterProvider.SCOPE_SESSION, sessionParameters ); //$NON-NLS-1$
		SimpleUrlFactory urlFactory = new SimpleUrlFactory( "" ); //$NON-NLS-1$

		context = solutionEngine.execute( solutionName, actionPath, actionName, Messages.getString("BaseTest.DEBUG_JUNIT_TEST"), false, true, instanceId, false, parameterProviders, outputHandler, null, urlFactory, messages ); //$NON-NLS-1$

		if( context != null && context.getStatus() == IRuntimeContext.RUNTIME_STATUS_SUCCESS ) {
			return context;
		} else {
			return null;
		}
	}

%>
