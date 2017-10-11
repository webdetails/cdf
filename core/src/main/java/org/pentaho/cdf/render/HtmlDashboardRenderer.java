/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

package org.pentaho.cdf.render;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.environment.CdfEngine;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.repository.api.FileAccess;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.api.IUserContentAccess;

public class HtmlDashboardRenderer {

  private static final Log logger = LogFactory.getLog( HtmlDashboardRenderer.class );

  public static IBasicFile getDashboardTemplate( String solution, String path, String templateName ) {

    templateName = FilenameUtils.separatorsToUnix( templateName );

    String fullTemplatePath = null;

    if ( !StringUtils.isEmpty( templateName ) ) {
      if ( templateName.startsWith( "/" ) ) { //$NON-NLS-1$
        fullTemplatePath = templateName;
      } else {
        fullTemplatePath = Util.joinPath( solution, path, templateName );
      }
    }

    return getDashboardTemplate( fullTemplatePath );
  }

  public static IBasicFile getDashboardTemplate( String templatePath ) {

    templatePath = FilenameUtils.separatorsToUnix( templatePath );

    IUserContentAccess repoAccess = CdfEngine.getUserContentReader( null );
    IReadAccess systemAccess = CdfEngine.getPluginSystemReader( null );
    IBasicFile dashboardTemplateFile = null;

    if ( !StringUtils.isEmpty( templatePath ) && repoAccess.fileExists( templatePath ) ) {

      // Check for access permissions
      if ( repoAccess.hasAccess( templatePath, FileAccess.EXECUTE ) ) {
        dashboardTemplateFile = repoAccess.fetchFile( templatePath );
      } else {
        logger.error( "Access Denied to " + templatePath );
      }
    } else {
      dashboardTemplateFile = systemAccess.fetchFile( CdfConstants.DEFAULT_DASHBOARD_TEMPLATE_HTML );
    }

    return dashboardTemplateFile;
  }
}
