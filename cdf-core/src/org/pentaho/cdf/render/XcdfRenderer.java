package org.pentaho.cdf.render;

import java.io.IOException;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.environment.CdfEngine;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.repository.api.FileAccess;
import pt.webdetails.cpf.repository.api.IUserContentAccess;
import pt.webdetails.cpf.utils.XmlDom4JUtils;

public class XcdfRenderer {

  private static final Log logger = LogFactory.getLog( XcdfRenderer.class );

  private static final String NODE_TEMPLATE = "/cdf/template";
  private static final String NODE_MESSAGES = "/cdf/messages";
  private static final String NODE_STYLES = "/cdf/style";

  private String template;
  private String templateName;
  private String messagesBaseFilename;

  public boolean determineDashboardTemplating( final String solution, final String path, final String action,
      String defaultTemplate ) throws InvalidCdfOperationException {
    return determineDashboardTemplating( FilenameUtils.separatorsToUnix( Util.joinPath( solution, path, action ) ),
        defaultTemplate );
  }

  public boolean determineDashboardTemplating( final String dashboard, String defaultTemplate )
    throws InvalidCdfOperationException {

    boolean success = false;

    IUserContentAccess access = CdfEngine.getUserContentReader( null );

    if ( access.fileExists( dashboard ) ) {

      // Check for access permissions
      if ( !access.hasAccess( dashboard, FileAccess.EXECUTE ) ) {
        throw new InvalidCdfOperationException( "Access denied" );
      }

      try {

        Document doc = XmlDom4JUtils.getDocumentFromFile( access.fetchFile( dashboard ) );

        templateName = XmlDom4JUtils.getNodeText( NODE_TEMPLATE, doc, "" );

        // Get message file base name if any
        if ( doc.selectSingleNode( NODE_MESSAGES ) != null ) {
          messagesBaseFilename = XmlDom4JUtils.getNodeText( NODE_MESSAGES, doc );
        }

        // If a "style" tag exists, use that one
        if ( doc.selectSingleNode( NODE_STYLES ) != null ) {
          template = XmlDom4JUtils.getNodeText( NODE_STYLES, doc );
        } else {
          template = defaultTemplate;
        }

        success = true;

      } catch ( IOException e ) {
        logger.error( e );
        throw new InvalidCdfOperationException( e );
      }
    }

    return success;
  }

  public String getTemplate() {
    return template;
  }

  public String getTemplateName() {
    return templateName;
  }

  public String getMessagesBaseFilename() {
    return messagesBaseFilename;
  }
}
