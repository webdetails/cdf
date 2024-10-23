/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


package org.pentaho.cdf;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.security.InvalidParameterException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.context.ContextEngine;
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

  private boolean cdfResource; // legacy resource feching support

  @Override
  public void createContent() throws Exception {

    String filePath = "";
    String template = "";
    boolean loadTheme = false;

    logger.info( "[Timing] CDF content generator took over: "
        + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );
    try {
      if ( getPathParameters() != null ) {

        // legacy resource feching support
        if ( isCdfResource() ) {
          new CdfApi().getResource( getPathParameterAsString( "cmd", null ), null );
          return;
        }

        filePath = getPathParameterAsString( Parameter.PATH, null );
        template = getRequestParameterAsString( Parameter.TEMPLATE, null );
        loadTheme = new Boolean( getRequestParameterAsString( Parameter.LOAD_THEME, "false" ) );

        Object parameter = getRequest();

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
        throw new InvalidParameterException(
          Messages.getString( "CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER" ) ); //$NON-NLS-1$
      } else if ( out == null ) {
        error( Messages.getErrorString( "CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM" ) ); //$NON-NLS-1$
        throw new InvalidParameterException(
          Messages.getString( "CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM" ) ); //$NON-NLS-1$
      }

      if ( filePath.isEmpty() ) {
        logger.error( "Calling cdf with an empty method" );
      }

      if ( getRequestParameters() != null ) {
        renderXcdfDashboard(
            out,
            getRequestParameters(),
            FilenameUtils.separatorsToUnix( filePath ),
            template,
            loadTheme );
      }

    } catch ( Exception e ) {
      logger.error( "Error creating cdf content: ", e );
    }
  }

  public void renderXcdfDashboard( final OutputStream out, final IParameterProvider requestParams, String xcdfFilePath,
                                   String defaultTemplate, boolean loadTheme ) throws Exception {
    long start = System.currentTimeMillis();

    UUID uuid =
        CpfAuditHelper.startAudit( PLUGIN_ID, xcdfFilePath, getObjectName(), this.userSession, this, requestParams );
    try {

      XcdfRenderer renderer = new XcdfRenderer();

      boolean success = renderer.determineDashboardTemplating( xcdfFilePath, defaultTemplate )
          && renderer.determineRequireDashboard( xcdfFilePath );

      if ( success ) {

        String templatePath = Util.joinPath( FilenameUtils.getPath( xcdfFilePath ), renderer.getTemplate() );

        if ( !StringUtils.isEmpty( defaultTemplate ) ) { // If style defined in URL parameter 'template'
          renderHtmlDashboard(
              out,
              xcdfFilePath,
              templatePath,
              defaultTemplate,
              renderer.getMessagesBaseFilename(),
              renderer.getIsRequire(),
              loadTheme );
        } else { // use style provided via .xcdf or default
          renderHtmlDashboard(
              out,
              xcdfFilePath,
              templatePath,
              renderer.getStyle(),
              renderer.getMessagesBaseFilename(),
              renderer.getIsRequire(),
              loadTheme );
        }

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

  public void renderHtmlDashboard( final OutputStream out, final String xcdfFilePath, final String templatePath,
                                   String defaultTemplate,
                                   String dashboardsMessagesBaseFilename ) throws Exception {
    renderHtmlDashboard(
        out,
        xcdfFilePath,
        templatePath,
        defaultTemplate,
        dashboardsMessagesBaseFilename,
        false,
        false );
  }

  public void renderHtmlDashboard( final OutputStream out, final String xcdfFilePath, final String templatePath,
                                   String defaultTemplate,
                                   String dashboardsMessagesBaseFilename, boolean isRequire, boolean loadTheme )
    throws Exception {

    HttpServletRequest request = getRequest();

    CdfHtmlRenderer renderer = new CdfHtmlRenderer();

    HashMap<String, String> paramMap = Parameter.asHashMap( request );
    if ( paramMap.get( Parameter.FILE ) == null || paramMap.get( Parameter.FILE ).isEmpty() ) {
      paramMap.put( Parameter.FILE, xcdfFilePath );
    }

    int inactiveInterval = request.getSession().getMaxInactiveInterval();
    renderer
        .execute(
          out,
          templatePath,
          defaultTemplate,
          dashboardsMessagesBaseFilename,
          paramMap,
          userSession.getName(),
          inactiveInterval,
          isRequire,
          loadTheme );
  }

  public String getPluginName() {
    return PLUGIN_ID;
  }

  // InterPluginBroker calls this method within bean id 'xcdf'
  public String getContext( @QueryParam( Parameter.PATH ) @DefaultValue( StringUtils.EMPTY ) String path,
                            @QueryParam( Parameter.ACTION ) @DefaultValue( StringUtils.EMPTY ) String action,
                            @DefaultValue( StringUtils.EMPTY ) @QueryParam( Parameter.VIEW ) String view,
                            @Context HttpServletRequest servletRequest ) {
    int inactiveInterval = servletRequest.getSession().getMaxInactiveInterval();
    return ContextEngine.getInstance()
      .getContext( path, Parameter.asHashMap( servletRequest ), inactiveInterval );
  }

  // InterPluginBroker calls this method within bean id 'xcdf'
  public String getHeaders( @QueryParam( Parameter.DASHBOARD_CONTENT ) String dashboardContent,
                            @QueryParam( Parameter.DASHBOARD_TYPE ) String dashboardType,
                            @QueryParam( Parameter.ABSOLUTE ) @DefaultValue( "false" ) String absolute,
                            @QueryParam( Parameter.ROOT ) String root,
                            @QueryParam( Parameter.SCHEME ) String scheme,
                            @QueryParam( Parameter.DEBUG ) @DefaultValue( "false" ) String debug,
                            @Context HttpServletRequest servletRequest,
                            @Context HttpServletResponse servletResponse ) throws Exception {
    try {
      CdfHtmlRenderer.getHeaders(
          dashboardContent,
          dashboardType,
          Boolean.parseBoolean( absolute ),
          root,
          scheme,
          Boolean.parseBoolean( debug ),
          servletResponse.getOutputStream() );
    } catch ( IOException ex ) {
      logger.error( "getHeaders: " + ex.getMessage(), ex );
      throw ex;
    }
    return null;
  }

  // legacy resource fetching support
  public boolean isCdfResource() {
    return cdfResource;
  }

  // legacy resource fetching support
  public void setCdfResource( boolean cdfResource ) {
    this.cdfResource = cdfResource;
  }
}
