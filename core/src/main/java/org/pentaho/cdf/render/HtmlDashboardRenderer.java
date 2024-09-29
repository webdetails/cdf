/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


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
