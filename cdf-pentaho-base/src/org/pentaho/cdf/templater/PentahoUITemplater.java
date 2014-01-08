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
