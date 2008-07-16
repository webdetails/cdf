<%@ page language="java"
  import="java.util.ArrayList,
    java.util.Locale,
    org.pentaho.core.ui.SimpleUrlFactory,
    org.pentaho.core.system.PentahoSystem,
    org.pentaho.core.solution.HttpRequestParameterProvider,
    org.pentaho.core.solution.HttpSessionParameterProvider,
    org.pentaho.core.session.IPentahoSession,
    org.pentaho.messages.Messages,
    org.pentaho.core.util.UIUtil,
    org.pentaho.core.util.IUITemplater,
	org.pentaho.util.VersionHelper,
	org.pentaho.messages.util.LocaleHelper,
    org.pentaho.core.solution.ActionResource,
    org.pentaho.core.solution.IActionResource,
    org.pentaho.ui.component.INavigationComponent,
    org.pentaho.ui.component.NavigationComponentFactory,
    org.pentaho.core.repository.ISolutionRepository,
	java.io.*"
	 %><%

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
	HttpSession httpSession = request.getSession();

	String baseUrl = PentahoSystem.getApplicationContext().getBaseUrl();

	IPentahoSession userSession = UIUtil.getPentahoSession( request );

	HttpRequestParameterProvider requestParameters = new HttpRequestParameterProvider( request );
	HttpSessionParameterProvider sessionParameters = new HttpSessionParameterProvider( userSession );

	String solution = "dashboards";

	requestParameters.setParameter("solution",solution);
	requestParameters.setParameter("path","");
	String hrefUrl = baseUrl; //$NON-NLS-1$
	String onClick = ""; //$NON-NLS-1$

	SimpleUrlFactory urlFactory = new SimpleUrlFactory( hrefUrl );
	ArrayList messages = new ArrayList();


	// Is googleMaps enabled?
    boolean isGoogleMapsEnabled = false;
    if (requestParameters.getParameter("maps") != null)
    	isGoogleMapsEnabled = true;

	boolean allowBackNavigation = solution != null;

	INavigationComponent navigate = NavigationComponentFactory.getNavigationComponent();
	navigate.setHrefUrl(hrefUrl);
	navigate.setOnClick(onClick);
	navigate.setSolutionParamName("solution");
	navigate.setPathParamName("path");
	navigate.setAllowNavigation(new Boolean(allowBackNavigation));
	navigate.setOptions("");
	navigate.setUrlFactory(urlFactory);
	navigate.setMessages(messages);
	// This line will override the default setting of the navigate component
	// to allow debugging of the generated HTML.
	navigate.setLoggingLevel( org.pentaho.util.logging.ILogger.DEBUG );
	navigate.validate( userSession, null );
	navigate.setParameterProvider( "request", requestParameters ); //$NON-NLS-1$
	navigate.setParameterProvider( "session", sessionParameters ); //$NON-NLS-1$


	//	Set to XING-XSL for link bar
	navigate.setXsl( "text/html", "dashboard-links.xsl" ); //$NON-NLS-1$



	String navigation = navigate.getContent( "text/html" ); //$NON-NLS-1$
	if( navigation == null ) {
		StringBuffer buffer = new StringBuffer();
		UIUtil.formatErrorMessage( "text/html", Messages.getErrorString( "NAVIGATE.ERROR_0001_NAVIGATE_ERROR" ), messages, buffer ); //$NON-NLS-1$ //$NON-NLS-2$
		navigation = buffer.toString();
	}

	String intro = "";
	String footer = "";

	IUITemplater templater = PentahoSystem.getUITemplater( userSession );
	if( templater != null ) {
		String sections[] = templater.breakTemplate( "template-dashboard.html", "", userSession ); //$NON-NLS-1$ //$NON-NLS-2$
		if( sections != null && sections.length > 0 ) {
			intro = sections[0];
		}
		if( sections != null && sections.length > 1 ) {
			footer = sections[1];
		}
	} else {
		intro = Messages.getString( "UI.ERROR_0002_BAD_TEMPLATE_OBJECT" );
	}

	String dashboardContent = "";

	if(requestParameters.getParameter("dashboard") != null){
		String dashboard = requestParameters.getParameter("dashboard").toString();
		ActionResource resource = new ActionResource( "", IActionResource.SOLUTION_FILE_RESOURCE, "text/xml", "dashboards/" + dashboard +"/template.html" ); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
		try {
			dashboardContent = PentahoSystem.getSolutionRepository(userSession).getResourceAsString( resource );
			//intro= intro.replaceAll( "\\{load\\}", "onload=\"navigationMarker('"+dashboard+"'),load()\"" ); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			intro= intro.replaceAll( "\\{load\\}", "onload=\"load()\"" ); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
		} catch (Throwable t) {
		}
	}else{
		intro = intro.replaceAll( "\\{body-tag\\}", "onload=\"navigationMarker(),emptyLoad()\"" ); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
	}

    if(isGoogleMapsEnabled){
    
    	
		String googleMapsApiKey = PentahoSystem.getSystemSetting("google/googlesettings.xml", "google_maps_api_key", null); 
        // insert the Pentaho AJAX, Google Maps, and demo script references into the document header
        intro = intro.replaceAll( "\\{googlemaps-header\\}", "</script>\n<script src=\"http://maps.google.com/maps?file=api&amp;v=2&amp;key="+googleMapsApiKey+"\" type=\"text/javascript\"></script>\n" ); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        intro = intro.replaceAll( "\\{body-tag-unload\\}", "onunload=\"GUnload()\"" ); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
    }
    else{
    	intro = intro.replaceAll( "\\{googlemaps-header\\}","");
    	intro = intro.replaceAll( "\\{body-tag-unload\\}","");
    }



%><%= intro %>
<%= navigation %>
<!-- %=navigate.getXmlContent().asXML() %-->
<%= dashboardContent %>
<%= footer %>



