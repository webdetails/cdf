package org.pentaho.cdf;

import java.io.OutputStream;
import java.lang.reflect.Method;
import java.security.InvalidParameterException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.render.CdfHtmlRenderer;
import org.pentaho.cdf.render.XcdfRenderer;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSystem;

import pt.webdetails.cpf.SimpleContentGenerator;
import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.audit.CpfAuditHelper;
import pt.webdetails.cpf.utils.CharsetHelper;
import pt.webdetails.cpf.utils.MimeTypes;

public class CdfContentGenerator extends SimpleContentGenerator {

  private static final long serialVersionUID = 319509966121604058L;
  private static final Log logger = LogFactory.getLog( CdfContentGenerator.class );
  private static final String PLUGIN_ID = CdfEngine.getEnvironment().getPluginId();

  public String RELATIVE_URL;

  @Override
  public void createContent() throws Exception {

    IParameterProvider pathParams;
    IParameterProvider requestParams = null;
    String filePath = "";
    String template = "";

    logger.info( "[Timing] CDF content generator took over: "
        + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );
    try {
      if ( parameterProviders.get( Parameter.PATH ) != null ) {
        pathParams = parameterProviders.get( Parameter.PATH );
        requestParams = parameterProviders.get( IParameterProvider.SCOPE_REQUEST );
        filePath = pathParams.getStringParameter( Parameter.PATH, null );
        template = requestParams.getStringParameter( Parameter.TEMPLATE, null );

        Object parameter = pathParams.getParameter( "httprequest" );

        if ( parameter != null && ( (HttpServletRequest) parameter ).getContextPath() != null ) {
          RELATIVE_URL = ( (HttpServletRequest) parameter ).getContextPath();
        }
      } else {
        RELATIVE_URL = CdfEngine.getEnvironment().getApplicationBaseUrl();
        /*
         * If we detect an empty string, things will break. If we detect an absolute url, things will *probably* break.
         * In either of these cases, we'll resort to Catalina's context, and its getContextPath() method for better
         * results.
         */
        if ( "".equals( RELATIVE_URL ) || RELATIVE_URL.matches( "^http://.*" ) ) {
          Object context = PentahoSystem.getApplicationContext().getContext();
          Method getContextPath = context.getClass().getMethod( "getContextPath", null );
          if ( getContextPath != null ) {
            RELATIVE_URL = getContextPath.invoke( context, null ).toString();
          }
        }
      }

      if ( RELATIVE_URL.endsWith( "/" ) ) {
        RELATIVE_URL = RELATIVE_URL.substring( 0, RELATIVE_URL.length() - 1 );
      }

      OutputStream out = getResponseOutputStream( MimeTypes.HTML );

      // If callbacks is properly setup, we assume we're being called from another plugin
      if ( this.callbacks != null && callbacks.size() > 0 && HashMap.class.isInstance( callbacks.get( 0 ) ) ) {
        HashMap<String, Object> iface = (HashMap<String, Object>) callbacks.get( 0 );
        out = (OutputStream) iface.get( "output" );
        filePath = "/" + (String) iface.get( "method" );
        this.userSession = this.userSession != null ? this.userSession : (IPentahoSession) iface.get( "usersession" );
      }

      // make sure we have a workable state
      if ( outputHandler == null ) {
        error( Messages.getErrorString( "CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER" ) ); //$NON-NLS-1$
        throw new InvalidParameterException( Messages.getString( "CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER" ) ); //$NON-NLS-1$
      } else if ( out == null ) {
        error( Messages.getErrorString( "CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM" ) ); //$NON-NLS-1$
        throw new InvalidParameterException( Messages.getString( "CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM" ) ); //$NON-NLS-1$
      }

      if ( filePath.isEmpty() ) {
        logger.error( "Calling cdf with an empty method" );
      }

      if ( requestParams != null ) {
        renderXcdfDashboard( out, requestParams, FilenameUtils.separatorsToUnix( filePath ), template );
      }

    } catch ( Exception e ) {
      logger.error( "Error creating cdf content: ", e );
    }
  }

  public void renderXcdfDashboard( final OutputStream out, final IParameterProvider requestParams, String xcdfFilePath,
      String defaultTemplate ) throws Exception {
    long start = System.currentTimeMillis();

    UUID uuid =
        CpfAuditHelper.startAudit( PLUGIN_ID, xcdfFilePath, getObjectName(), this.userSession, this, requestParams );
    try {

      XcdfRenderer renderer = new XcdfRenderer();

      boolean success = renderer.determineDashboardTemplating( xcdfFilePath, defaultTemplate );

      if ( success ) {

        String templatePath = Util.joinPath( FilenameUtils.getPath( xcdfFilePath ), renderer.getTemplate() );

        renderHtmlDashboard( out, templatePath, renderer.getStyle(), renderer.getMessagesBaseFilename() );

        setResponseHeaders( MimeTypes.HTML, 0, null );

      } else {
        out.write( "Unable to render dashboard".getBytes( CharsetHelper.getEncoding() ) ); //$NON-NLS-1$ //$NON-NLS-2$
      }
      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit( PLUGIN_ID, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end );

    } catch ( Exception e ) {
      e.printStackTrace();
      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit( PLUGIN_ID, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end );
      throw e;
    }
  }

  public void renderHtmlDashboard( final OutputStream out, final String xcdfPath, String defaultTemplate,
      String dashboardsMessagesBaseFilename ) throws Exception {

    HttpServletRequest request =
        ( (HttpServletRequest) parameterProviders.get( Parameter.PATH ).getParameter( "httprequest" ) );

    CdfHtmlRenderer renderer = new CdfHtmlRenderer();
    renderer.execute( out, xcdfPath, defaultTemplate, dashboardsMessagesBaseFilename, Parameter.asHashMap( request ),
        userSession.getName() );
  }

  public String getPluginName() {
    return PLUGIN_ID;
  }
}
