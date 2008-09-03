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
         pt.webdetails.cdf.test.*,
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

        IPentahoSession userSession = UIUtil.getPentahoSession(request);

        HttpRequestParameterProvider requestParameters = new HttpRequestParameterProvider(request);
        HttpSessionParameterProvider sessionParameters = new HttpSessionParameterProvider(userSession);

        String solution = request.getParameter("solution");
        String path = request.getParameter("path");

        if ("".equals(solution)) {
            solution = null;
        }
        if (path == null) {
            path = "";
        }

        String hrefUrl = baseUrl + "Dashboards?"; //$NON-NLS-1$
        String onClick = ""; //$NON-NLS-1$

        SimpleUrlFactory urlFactory = new SimpleUrlFactory(hrefUrl);
        ArrayList messages = new ArrayList();

        String intro = "";
        String footer = "";

        IUITemplater templater = PentahoSystem.getUITemplater(userSession);
        if (templater != null) {
            String sections[] = templater.breakTemplate("template-dashboard.html", "", userSession); //$NON-NLS-1$ //$NON-NLS-2$
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
                resource = new ActionResource("", IActionResource.SOLUTION_FILE_RESOURCE, "text/xml", solution + "/" + path + "/template.html"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
            } else {
                resource = new ActionResource("", IActionResource.SOLUTION_FILE_RESOURCE, "text/xml", "system/custom/default-dashboard-template.html"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
            }
            dashboardContent = PentahoSystem.getSolutionRepository(userSession).getResourceAsString(resource);

            intro = intro.replaceAll("\\{load\\}", "onload=\"load()\""); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        }

        intro = intro.replaceAll("\\{body-tag-unload\\}", "");


%><%= intro%>
<div id = "dashboardContent">
    <%= dashboardContent%>
</div>
<%= footer%>



