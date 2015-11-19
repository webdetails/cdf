package org.pentaho.cdf.render;

import java.io.IOException;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.Node;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.environment.CdfEngine;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.repository.api.FileAccess;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IUserContentAccess;
import pt.webdetails.cpf.utils.XmlDom4JUtils;

public class XcdfRenderer {

  private static final Log logger = LogFactory.getLog( XcdfRenderer.class );

  private static final String NODE_TEMPLATE = "/cdf/template";
  private static final String NODE_MESSAGES = "/cdf/messages";
  private static final String NODE_STYLES = "/cdf/style";
  private static final String NODE_REQUIRE = "/cdf/require";

  private String style;
  private String template;
  private String messagesBaseFilename;
  private boolean isRequire;

  /**
   * Determines the template based on the info stored in the xcdf file
   *
   * @param solution the dashboard file descriptor solution path part
   * @param path the dashboard file descriptor path part
   * @param action the dashboard file descriptor name
   * @param defaultTemplate the default template to use in case the defined is not available no if no template is
   *                        provided
   * @return boolean with the success of the operation
   * @throws InvalidCdfOperationException
   */
  public boolean determineDashboardTemplating( final String solution, final String path, final String action,
      String defaultTemplate ) throws InvalidCdfOperationException {
    return determineDashboardTemplating( FilenameUtils.separatorsToUnix( Util.joinPath( solution, path, action ) ),
        defaultTemplate );
  }

  /**
   * Determines the template based on the info stored in the xcdf file
   *
   * @param dashboard the dashboard file descriptor path
   * @param defaultTemplate the default template to use in case the defined is not available no if no template is
   *                        provided
   * @return boolean with the success of the operation
   * @throws InvalidCdfOperationException
   */
  public boolean determineDashboardTemplating( final String dashboard, String defaultTemplate )
    throws InvalidCdfOperationException {

    boolean success = false;
    IUserContentAccess access = getUserContentAccess( null );

    if ( access.fileExists( dashboard ) ) {
      // Check for access permissions
      if ( !access.hasAccess( dashboard, FileAccess.EXECUTE ) ) {
        throw new InvalidCdfOperationException( "Access denied" );
      }

      try {
        Document doc = getDocument( access.fetchFile( dashboard ) );
        if ( doc.selectSingleNode( NODE_TEMPLATE ) != null ) {
          template = getNodeText( NODE_TEMPLATE, doc, "" );
        } else {
          template = defaultTemplate;
        }
        // Get message file base name if any
        if ( doc.selectSingleNode( NODE_MESSAGES ) != null ) {
          messagesBaseFilename = getNodeText( NODE_MESSAGES, doc );
        }
        // If a "style" tag exists, use that one
        if ( doc.selectSingleNode( NODE_STYLES ) != null ) {
          style = getNodeText( NODE_STYLES, doc );
        } else {
          style = CdfConstants.DEFAULT_DASHBOARD_STYLE;
        }
        success = true;
      } catch ( IOException e ) {
        logger.error( e );
        throw new InvalidCdfOperationException( e );
      }
    }
    return success;
  }

  /**
   * Determines if a dashboard is to be rendered using require or using legacy javascript structure
   *
   * @param solution the dashboard file descriptor solution path part
   * @param path the dashboard file descriptor path part
   * @param action the dashboard file descriptor name
   * @return boolean with the success of the operation
   * @throws InvalidCdfOperationException
   */
  public boolean determineRequireDashboard( final String solution, final String path, final String action )
    throws InvalidCdfOperationException {
    return determineRequireDashboard( FilenameUtils.separatorsToUnix( Util.joinPath( solution, path, action ) ) );
  }

  /**
   * Determines if a dashboard is to be rendered using require or using legacy javascript structure
   *
   * @param dashboard the dashboard file descriptor path
   * @return boolean with the success of the operation
   * @throws InvalidCdfOperationException
   */
  public boolean determineRequireDashboard( final String dashboard ) throws InvalidCdfOperationException {
    boolean success = false;

    IUserContentAccess access = getUserContentAccess( null );
    if ( access.fileExists( dashboard ) ) {
      // Check for access permissions
      if ( !access.hasAccess( dashboard, FileAccess.EXECUTE ) ) {
        throw new InvalidCdfOperationException( "Access denied" );
      }
      try {
        Document doc = getDocument( access.fetchFile( dashboard ) );
        if ( doc.selectSingleNode( NODE_REQUIRE ) != null ) {
          isRequire = new Boolean( getNodeText( NODE_REQUIRE, doc, "false" ) );
        }
        success = true;
      } catch ( IOException e ) {
        logger.error( e );
        throw new InvalidCdfOperationException( e );
      }
    }
    return success;
  }

  /**
   *
   * @return the template name
   */
  public String getTemplate() {
    return template;
  }

  /**
   *
   * @return the style name
   */
  public String getStyle() {
    return style;
  }

  /**
   *
   * @return the messages file name
   */
  public String getMessagesBaseFilename() {
    return messagesBaseFilename;
  }

  /**
   *
   * @return boolean with the require activated or not
   */
  public boolean getIsRequire() {
    return isRequire;
  }

  protected IUserContentAccess getUserContentAccess( String path ) {
    return CdfEngine.getUserContentReader( path );
  }

  protected Document getDocument( IBasicFile file ) throws IOException {
    return XmlDom4JUtils.getDocumentFromFile( file );
  }

  protected String getNodeText( String xpath, Node node ) {
    return XmlDom4JUtils.getNodeText( xpath, node, null );
  }

  protected String getNodeText( String xpath, Node node, String defaultValue ) {
    return XmlDom4JUtils.getNodeText( xpath, node, defaultValue );
  }
}
