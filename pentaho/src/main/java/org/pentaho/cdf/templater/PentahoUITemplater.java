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

package org.pentaho.cdf.templater;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.Messages;
import org.pentaho.cdf.environment.templater.ITemplater;
import org.pentaho.platform.api.engine.IUITemplater;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;

public class PentahoUITemplater implements ITemplater {

  private static Log logger = LogFactory.getLog( PentahoUITemplater.class );

  private static PentahoUITemplater instance;
  private final IUITemplater templater;

  private PentahoUITemplater() {
    templater = PentahoSystem.get( IUITemplater.class, PentahoSessionHolder.getSession() );

    if ( templater == null ) {
      logger.error( "IUITemplater is not defined" );
    }
  }

  public static PentahoUITemplater getInstance() {
    if ( instance == null ) {
      instance = new PentahoUITemplater();
    }
    return instance;
  }

  @Override
  public String getTemplateSection( String templateContent, Section section ) {

    if ( templater != null && !StringUtils.isEmpty( templateContent ) ) {

      final String[] sections =
          templater.breakTemplateString( templateContent, StringUtils.EMPTY, PentahoSessionHolder.getSession() );

      if ( sections != null && !StringUtils.isEmpty( sections[section.ordinal()] ) ) {
        return sections[section.ordinal()];
      }
    }

    // bad templater class or no template content
    return Messages.getErrorString( "CdfContentGenerator.ERROR_0005_BAD_TEMPLATE_OBJECT" );
  }
}
