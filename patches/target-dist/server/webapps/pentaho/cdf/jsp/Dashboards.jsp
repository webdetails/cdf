<%@ page language="java"
         import="java.util.ArrayList,
		 java.util.*,
		 java.text.*,
		 java.util.regex.Pattern,
         java.util.Locale,
		 java.util.Hashtable,
		 java.util.Enumeration,	
    org.pentaho.platform.util.web.SimpleUrlFactory,
    org.pentaho.platform.engine.core.system.PentahoSystem,
    org.pentaho.platform.web.http.request.HttpRequestParameterProvider,
    org.pentaho.platform.web.http.session.HttpSessionParameterProvider,
    org.pentaho.platform.api.engine.IPentahoSession,
    org.pentaho.platform.api.engine.IUITemplater,
	org.pentaho.platform.util.VersionHelper,
    org.pentaho.platform.util.messages.LocaleHelper,
    org.pentaho.platform.engine.services.actionsequence.ActionResource,
    org.pentaho.platform.api.ui.INavigationComponent,
    org.pentaho.platform.web.http.PentahoHttpSessionHelper,
    org.pentaho.platform.api.repository.ISolutionRepository,
    org.pentaho.platform.engine.core.system.PentahoSystem,
    org.pentaho.platform.api.engine.IActionSequenceResource,
    org.pentaho.platform.web.jsp.messages.Messages,
    org.pentaho.platform.engine.core.solution.SimpleParameterProvider,
		 java.net.URL,
         java.io.*"
         %>
		 
		 
		 <%! 

			public String concatFiles(String includeString, Hashtable filesAdded, Hashtable files){
				
				String newLine = System.getProperty("line.separator");
				Enumeration keys = files.keys();
				while (keys.hasMoreElements()) {
					
					String key = (String) keys.nextElement();
					String includeFiles[] = (String[]) files.get(key);
					
					for(int i = 0; i < includeFiles.length; i++){
						if(! filesAdded.containsKey(includeFiles[i])){
							
							filesAdded.put(includeFiles[i],'1');
							if(key.equals("script"))
								includeString += "<script language=\"javascript\" type=\"text/javascript\" src=\"" +  includeFiles[i] + "\"></script>" + newLine;
							else
								includeString += "<link rel=\"stylesheet\" href=\"" + includeFiles[i] + "\" type=\"text/css\" />";
								
						}
					}
				}
				
				return includeString;
			}

			public boolean matchComponent(int keyIndex, String key, String content){
			
				for(int i = keyIndex-1; i > 0; i--){
					if(content.charAt(i) == ':' || content.charAt(i) == '"' || new String(""+ content.charAt(i)).trim().equals(""))
						continue;
					else{
						if( (i-3) > 0 && content.substring((i-3),i+1).equals("type"))
							return true;
							
						break;
					}
				}
					
				keyIndex = content.indexOf(key,keyIndex +  key.length());
				if(keyIndex != -1) 
					return matchComponent(keyIndex,key,content);
						
				return false;
			}
			
			
		 
		 %>
		 
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
        HttpSession httpSession = request.getSession();

        String baseUrl = PentahoSystem.getApplicationContext().getBaseUrl();

       IPentahoSession userSession = PentahoHttpSessionHelper.getPentahoSession( request );
		
        HttpRequestParameterProvider requestParameters = new HttpRequestParameterProvider(request);
        HttpSessionParameterProvider sessionParameters = new HttpSessionParameterProvider(userSession);

        String solution = request.getParameter("solution");
        String path = request.getParameter("path");
        String template = request.getParameter("template");

        if ("".equals(solution)) {
            solution = null;
        }
        if (path == null) {
            path = "";
        }

        if (template == null || template.equals("")) {
            template = "";
        }
        else{
            template = "-"+template;
        }


        String hrefUrl = baseUrl + "Dashboards?"; //$NON-NLS-1$
        String onClick = ""; //$NON-NLS-1$

        SimpleUrlFactory urlFactory = new SimpleUrlFactory(hrefUrl);
        ArrayList messages = new ArrayList();

        String intro = "";
        String footer = "";
		
        IUITemplater templater = PentahoSystem.getUITemplater(userSession);
        if (templater != null) {
            String sections[] = templater.breakTemplate("template-dashboard" + template + ".html", "", userSession); //$NON-NLS-1$ //$NON-NLS-2$
            if (sections != null && sections.length > 0) {
                intro = sections[0];
            }
            if (sections != null && sections.length > 1) {
                footer = sections[1];
            }
        } else {
            intro = Messages.getString("UI.ERROR_0002_BAD_TEMPLATE_OBJECT");
        }

        String dashboardContent = "";

        if (path != null) {
            ActionResource resource;

            if (PentahoSystem.getSolutionRepository(userSession).resourceExists(solution + "/" + path + "/template.html")) {
                resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", solution + "/" + path + "/template.html"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
            } else {
                resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", "system/custom/default-dashboard-template.html"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
            }
            dashboardContent = PentahoSystem.getSolutionRepository(userSession).getResourceAsString(resource);

            intro = intro.replaceAll("\\{load\\}", "onload=\"load()\""); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        }
	
		
        intro = intro.replaceAll("\\{body-tag-unload\\}", "");
		
		
		/************************************************/
		/*			Add cdf libraries 
		/************************************************/
		
		Date startDate = new Date();
		int headIndex = intro.indexOf("<head>");
		int length = intro.length();
		Hashtable addedFiles = new Hashtable();
		
		//Read resource file properties
		URL myURL = application.getResource("/cdf/resources.txt");
		Properties resources = new Properties();
		resources.load(myURL.openStream());
			
		//Add common libraries
		Hashtable commonLibraries = new Hashtable();
		commonLibraries.put("script",resources.getProperty("commonLibrariesScript","").split(","));
		commonLibraries.put("link",resources.getProperty("commonLibrariesLink","").split(","));
		String javaScriptLibrary = concatFiles("",addedFiles, commonLibraries);
		
		//Add extra components libraries
		Enumeration resourceKeys = resources.propertyNames();
		while (resourceKeys.hasMoreElements()) {
		
			String scriptkey = (String) resourceKeys.nextElement();

            String key = null;
            String type = null;

			if(scriptkey.indexOf("Script") != -1 && scriptkey.indexOf("commonLibraries") == -1 ){
				key = scriptkey.replaceAll("Script$","");
                type = "script";
            }
			else if(scriptkey.indexOf("Link") != -1 && scriptkey.indexOf("commonLibraries") == -1 ){
				key = scriptkey.replaceAll("Link$","");
                type = "link";
            }
            else{
                continue;
            }
			
            int keyIndex = dashboardContent.indexOf(key);
            if(keyIndex != -1) {
                if(matchComponent(keyIndex, key, dashboardContent)){
                    Hashtable component = new Hashtable();
                    component.put(type,resources.getProperty(scriptkey).split(","));
                    javaScriptLibrary  = concatFiles(javaScriptLibrary,addedFiles,component);
                }
            }
		}
		
		//Concat libraries to html head content
		intro = intro.substring(0,headIndex-1) + javaScriptLibrary + intro.substring(headIndex,length-1);
		
		System.out.println("*** Finish: " + (new Date().getTime() - startDate.getTime()));
		

%><%= intro%>
<div id = "dashboardContent">
    <%= dashboardContent%>
</div>
<%= footer%>



