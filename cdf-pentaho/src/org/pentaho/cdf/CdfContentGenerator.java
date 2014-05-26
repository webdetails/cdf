/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 * 
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

package org.pentaho.cdf;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.lang.reflect.Method;
import java.security.InvalidParameterException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.comments.CommentsEngine;
import org.pentaho.cdf.comments.CommentsEngine.Operation;
import org.pentaho.cdf.context.ContextEngine;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.export.Export;
import org.pentaho.cdf.export.ExportCSV;
import org.pentaho.cdf.export.ExportExcel;
import org.pentaho.cdf.export.IExport;
import org.pentaho.cdf.render.CdfHtmlRenderer;
import org.pentaho.cdf.render.XcdfRenderer;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.JsonUtil;
import org.pentaho.cdf.views.ViewEngine;
import org.pentaho.cdf.xactions.ActionEngine;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.repository.ISchedule;
import org.pentaho.platform.api.repository.ISubscribeContent;
import org.pentaho.platform.api.repository.ISubscriptionRepository;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.security.SecurityHelper;
import org.pentaho.platform.engine.security.SecurityParameterProvider;

import pt.webdetails.cpf.SimpleContentGenerator;
import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.audit.CpfAuditHelper;
import pt.webdetails.cpf.repository.api.FileAccess;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.api.IUserContentAccess;
import pt.webdetails.cpf.resources.IResourceLoader;
import pt.webdetails.cpf.utils.CharsetHelper;
import pt.webdetails.cpf.utils.MimeTypes;
import pt.webdetails.cpf.utils.PluginIOUtils;

/**
 * This is the main class of the CDF plugin. It handles all requests to /pentaho/content/pentaho-cdf. These requests
 * include:
 * <p/>
 * - JSONSolution - GetCDFResource - .xcdf requests - js files - files within resources
 * 
 * @author Will Gorman (wgorman@pentaho.com)
 */
public class CdfContentGenerator extends SimpleContentGenerator {

  private static final long serialVersionUID = 5608691656289862706L;
  private static final Log logger = LogFactory.getLog( CdfContentGenerator.class );
  public static final String SOLUTION_DIR = "cdf";
  // Possible actions
  private static final String GET_SCHEDULES = "/getSchedules";
  private static final String RENDER_HTML = "/RenderHTML";
  private static final String VIEWS = "/Views";
  private static final String RENDER_XCDF = "/RenderXCDF";
  private static final String JSON_SOLUTION = "/JSONSolution"; //$NON-NLS-1$
  private static final String GET_CDF_RESOURCE = "/GetCDFResource"; //$NON-NLS-1$
  private static final String EXPORT = "/Export"; //$NON-NLS-1$
  private static final String SETTINGS = "/Settings"; //$NON-NLS-1$
  private static final String CALLACTION = "/CallAction"; //$NON-NLS-1$
  private static final String CLEAR_CACHE = "/ClearCache"; //$NON-NLS-1$
  private static final String COMMENTS = "/Comments"; //$NON-NLS-1$
  private static final String STORAGE = "/Storage"; //$NON-NLS-1$
  private static final String GETHEADERS = "/GetHeaders"; //$NON-NLS-1$
  private static final String CONTEXT = "/Context"; //$NON-NLS-1$
  private static final String PING = "/ping"; //$NON-NLS-1$

  private static final String MIME_XLS = "application/vnd.ms-excel";
  // CDF Resource Relative URL
  private static final String RELATIVE_URL_TAG = "@RELATIVE_URL@";
  public String RELATIVE_URL;

  private static final String PLUGIN_ID = CdfEngine.getEnvironment().getPluginId();

  @Override
  public void createContent() throws Exception {
    OutputStream out = null;
    final IParameterProvider pathParams;
    final String method;
    final String payload;
    logger.info( "[Timing] CDF content generator took over: "
        + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );
    try {

      out = getResponseOutputStream( MimeTypes.HTML );

      if ( parameterProviders.get( Parameter.PATH ) != null
          && parameterProviders.get( Parameter.PATH ).getParameter( "httprequest" ) != null
          && ( (HttpServletRequest) parameterProviders.get( Parameter.PATH ).getParameter( "httprequest" ) )
              .getContextPath() != null ) {
        RELATIVE_URL =
            ( (HttpServletRequest) parameterProviders.get( Parameter.PATH ).getParameter( "httprequest" ) )
                .getContextPath();
      } else {
        RELATIVE_URL = CdfEngine.getEnvironment().getApplicationBaseContentUrl();
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

      // If callbacks is properly setup, we assume we're being called from another plugin
      if ( this.callbacks != null && callbacks.size() > 0 && HashMap.class.isInstance( callbacks.get( 0 ) ) ) {
        HashMap<String, Object> iface = (HashMap<String, Object>) callbacks.get( 0 );
        pathParams = parameterProviders.get( Parameter.PATH );
        method = "/" + (String) iface.get( "method" );
        payload = (String) iface.get( "payload" );
        this.userSession = this.userSession != null ? this.userSession : (IPentahoSession) iface.get( "usersession" );
      } else { // if not, we handle the request normally
        pathParams = parameterProviders.get( Parameter.PATH );
        method = pathParams.getStringParameter( Parameter.PATH, null );
        payload = "";
      }

      // make sure we have a workable state
      if ( outputHandler == null ) {
        error( Messages.getErrorString( "CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER" ) ); //$NON-NLS-1$
        throw new InvalidParameterException( Messages.getString( "CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER" ) ); //$NON-NLS-1$
      } else if ( out == null ) {
        error( Messages.getErrorString( "CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM" ) ); //$NON-NLS-1$
        throw new InvalidParameterException( Messages.getString( "CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM" ) ); //$NON-NLS-1$
      }

      findMethod( method, out, payload );

    } catch ( Exception e ) {
      logger.error( "Error creating cdf content: ", e );
      HttpServletResponse response =
          (HttpServletResponse) parameterProviders.get( "path" ).getParameter( "httpresponse" );
      response.sendError( HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getLocalizedMessage() );
    }
  }

  private void findMethod( final String urlPath, final OutputStream out, String payload ) throws Exception {

    // Each block will call a different method. If in the future this extends a lot we can think
    // about using reflection for class loading, but I don't expect that to happen.

    HttpServletRequest request =
        ( (HttpServletRequest) parameterProviders.get( Parameter.PATH ).getParameter( "httprequest" ) );
    final IParameterProvider requestParams = parameterProviders.get( IParameterProvider.SCOPE_REQUEST );

    if ( urlPath.equals( RENDER_XCDF ) ) {
      renderXcdfDashboard( out, requestParams );
    } else if ( urlPath.equals( JSON_SOLUTION ) ) {
      jsonSolution( out, requestParams );
    } else if ( urlPath.equals( GET_CDF_RESOURCE ) ) {
      getCDFResource( urlPath, out, requestParams );
    } else if ( urlPath.equals( RENDER_HTML ) ) {
      renderHtml( out, requestParams );
    } else if ( urlPath.equals( EXPORT ) ) {
      exportFile( requestParams, out );
    } else if ( urlPath.equals( SETTINGS ) ) {
      cdfSettings( requestParams, out );
    } else if ( urlPath.equals( CALLACTION ) ) {
      ActionEngine.getInstance().execute( requestParams, userSession, out );
    } else if ( urlPath.equals( COMMENTS ) ) {
      processComments( requestParams, out );
    } else if ( urlPath.equals( STORAGE ) ) {
      processStorage( requestParams, out );
    } else if ( urlPath.equals( CONTEXT ) ) {
      ContextEngine.generateContext( out, Parameter.asHashMap( request ) );
    } else if ( urlPath.equals( CLEAR_CACHE ) ) {
      clearCache( out );
    } else if ( urlPath.equals( VIEWS ) ) {
      views( requestParams, out );
    } else if ( urlPath.equals( GETHEADERS ) ) {
      if ( !StringUtils.isEmpty( payload ) ) {
        CdfHtmlRenderer.getHeaders( payload, Parameter.asHashMap( requestParams ), out );
      } else {
        CdfHtmlRenderer.getHeaders( requestParams.getStringParameter( Parameter.DASHBOARD_CONTENT, null ), Parameter
            .asHashMap( requestParams ), out );
      }
    } else if ( urlPath.equalsIgnoreCase( PING ) ) {
      out.write( "{\"ping\":\"ok\"}".getBytes( CharsetHelper.getEncoding() ) );
    } else if ( urlPath.equalsIgnoreCase( GET_SCHEDULES ) )
      processGetSchedules( requestParams, out );
    else {
      // we'll be providing the actual content with cache
      logger.warn( "Getting resources via content generator is deprecated, please use static resources: " + urlPath );
      returnResource( urlPath, out );
    }
  }

  private void processGetSchedules( final IParameterProvider requestParams, final OutputStream out ) throws Exception {

    final String solution = requestParams.getStringParameter( Parameter.SOLUTION, null ); //$NON-NLS-1$
    final String path;
    final String action;
    if ( requestParams.getStringParameter( Parameter.PATH, null ).startsWith( "/" ) ) {
      path = requestParams.getStringParameter( Parameter.PATH, null ); //$NON-NLS-1$
    } else {
      path = "/" + requestParams.getStringParameter( Parameter.PATH, null ); //$NON-NLS-1$
    }
    if ( requestParams.getStringParameter( Parameter.ACTION, null ).startsWith( "/" ) ) {
      action = requestParams.getStringParameter( Parameter.ACTION, null ); //$NON-NLS-1$
    } else {
      action = "/" + requestParams.getStringParameter( Parameter.ACTION, null ); //$NON-NLS-1$
    }

    final String fullPath = FilenameUtils.separatorsToUnix( solution + path + action );

    ISubscriptionRepository subscriptionRepository = PentahoSystem.get( ISubscriptionRepository.class, userSession );
    ISubscribeContent subscribeContent = subscriptionRepository.getContentByActionReference( fullPath ); //$NON-NLS-1$

    List<ISchedule> schedules = subscribeContent.getSchedules();

    String result = "[";
    for ( ISchedule schedule : schedules ) {
      if ( result.length() > 1 )
        result += ",";
      result += "{";
      result += " \"id\": \"" + schedule.getId() + "\",";
      result += " \"name\": \"" + schedule.getTitle() + "\"";
      result += "}";
    }

    result += "]";
    out.write( result.getBytes( CharsetHelper.getEncoding() ) );

  }

  private void renderXcdfDashboard( final OutputStream out, final IParameterProvider requestParams ) throws Exception {
    long start = System.currentTimeMillis();

    final String solution = requestParams.getStringParameter( Parameter.SOLUTION, null ); //$NON-NLS-1$
    final String path = requestParams.getStringParameter( Parameter.PATH, null ); //$NON-NLS-1$
    final String template = requestParams.getStringParameter( Parameter.TEMPLATE, null ); //$NON-NLS-1$
    final String action = requestParams.getStringParameter( Parameter.ACTION, null ); //$NON-NLS-1$

    UUID uuid = CpfAuditHelper.startAudit( PLUGIN_ID, action, getObjectName(), this.userSession, this, requestParams );

    try {
      XcdfRenderer renderer = new XcdfRenderer();

      boolean success = renderer.determineDashboardTemplating( solution, path, action, template );

      if ( success ) {
        renderHtmlDashboard( out, solution, path, renderer.getTemplate(), renderer.getStyle(), renderer
            .getMessagesBaseFilename() );

        setResponseHeaders( MimeTypes.HTML, 0, null );

      } else {
        out.write( "Unable to render dashboard".getBytes( CharsetHelper.getEncoding() ) );
      }

      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit( PLUGIN_ID, action, getObjectName(), this.userSession, this, start, uuid, end );

    } catch ( Exception e ) {
      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit( PLUGIN_ID, action, getObjectName(), this.userSession, this, start, uuid, end );
      throw e;
    }
  }

  private void jsonSolution( final OutputStream out, final IParameterProvider requestParams ) throws JSONException,
    ParserConfigurationException {
    if ( requestParams == null ) {
      error( Messages.getErrorString( "CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS" ) ); //$NON-NLS-1$
      throw new InvalidParameterException( Messages.getString( "CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS" ) ); //$NON-NLS-1$
    }

    final String solution = requestParams.getStringParameter( Parameter.SOLUTION, null ); //$NON-NLS-1$
    final String path = requestParams.getStringParameter( Parameter.PATH, null ); //$NON-NLS-1$
    final String mode = requestParams.getStringParameter( Parameter.MODE, null ); //$NON-NLS-1$

    final String contextPath =
        ( (HttpServletRequest) parameterProviders.get( Parameter.PATH ).getParameter( "httprequest" ) )
            .getContextPath();
    final NavigateComponent nav = new NavigateComponent( userSession, contextPath );
    final String json = nav.getNavigationElements( mode, solution, path );

    final PrintWriter pw = new PrintWriter( out );

    // jsonp?
    String callback = requestParams.getStringParameter( Parameter.CALLBACK, null );
    if ( callback != null ) {
      pw.println( callback + "(" + json + ");" );

    } else {
      pw.println( json );
    }

    pw.flush();
  }

  private void getCDFResource( String urlPath, OutputStream out, IParameterProvider requestParams ) throws Exception {
    if ( requestParams == null ) {
      error( Messages.getErrorString( "CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS" ) ); //$NON-NLS-1$
      throw new InvalidParameterException( Messages.getString( "CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS" ) ); //$NON-NLS-1$
    }

    final String resource = requestParams.getStringParameter( Parameter.RESOURCE, null ); //$NON-NLS-1$

    final HttpServletResponse response =
        (HttpServletResponse) parameterProviders.get( Parameter.PATH ).getParameter( "httpresponse" );
    try {
      response.setContentType( MimeTypes.getMimeType( resource ) );
      getSolutionFile( resource, out );
    } catch ( SecurityException e ) {
      response.sendError( HttpServletResponse.SC_FORBIDDEN );
    }
  }

  private void renderHtml( final OutputStream out, final IParameterProvider requestParams ) throws Exception {

    final String solution = requestParams.getStringParameter( Parameter.SOLUTION, null ); //$NON-NLS-1$
    final String template = requestParams.getStringParameter( Parameter.TEMPLATE, null ); //$NON-NLS-1$
    final String path = requestParams.getStringParameter( Parameter.PATH, null ); //$NON-NLS-1$
    final String templateName = requestParams.getStringParameter( Parameter.DASHBOARD, null );
    // Get messages base filename from url if given otherwise defaults to Messages
    String messageBaseFilename = requestParams.getStringParameter( "messages", null );
    renderHtmlDashboard( out, solution, path, templateName == null ? "template.html" : templateName, template,
        messageBaseFilename );
  }

  private void returnResource( final String urlPath, final OutputStream out ) throws Exception {
    final IParameterProvider pathParams = parameterProviders.get( Parameter.PATH ); //$NON-NLS-1$

    final IResourceLoader resLoader = CdfEngine.getEnvironment().getResourceLoader();
    final String maxAge = resLoader.getPluginSetting( CdfContentGenerator.class, "settings/max-age" );
    final HttpServletResponse response = (HttpServletResponse) pathParams.getParameter( "httpresponse" );
    if ( maxAge != null && response != null ) {
      response.setContentType( MimeTypes.getMimeType( urlPath ) );
      response.setHeader( "Cache-Control", "max-age=" + maxAge );
    }

    getContent( urlPath, out );
  }

  public void renderHtmlDashboard( final OutputStream out, final String solution, final String path,
      String templateName, String template, String dashboardsMessagesBaseFilename ) throws Exception {

    HttpServletRequest request =
        ( (HttpServletRequest) parameterProviders.get( Parameter.PATH ).getParameter( "httprequest" ) );

    CdfHtmlRenderer renderer = new CdfHtmlRenderer();
    renderer.execute( out, solution, path, templateName, template, dashboardsMessagesBaseFilename, Parameter
        .asHashMap( request ), userSession.getName() );
  }

  private void exportFile( final IParameterProvider requestParams, final OutputStream output ) {

    try {

      final ByteArrayOutputStream out = new ByteArrayOutputStream();

      final ActionEngine actionEngine = ActionEngine.getInstance();
      if ( actionEngine.execute( requestParams, userSession, out ) ) {

        final String exportType = requestParams.getStringParameter( Parameter.EXPORT_TYPE, IExport.EXPORT_TYPE_EXCEL );

        Export export;

        if ( exportType.equals( IExport.EXPORT_TYPE_CSV ) ) {
          export = new ExportCSV( output );
          setResponseHeaders( MimeTypes.CSV, 0, "export" + export.getExtension() );
        } else {
          export = new ExportExcel( output );
          setResponseHeaders( MIME_XLS, 0, "export" + export.getExtension() );
        }

        export.exportFile( new JSONObject( out.toString() ) );
      }

    } catch ( IOException e ) {
      logger.error( "IOException  exporting file", e );
    } catch ( JSONException e ) {
      logger.error( "JSONException exporting file", e );
    }

  }

  private void cdfSettings( final IParameterProvider requestParams, final OutputStream out ) {

    final String method = requestParams.getStringParameter( Parameter.METHOD, null );
    final String key = requestParams.getStringParameter( Parameter.KEY, null );

    if ( method.equals( "set" ) ) {
      CdfSettings.getInstance().setValue( key, requestParams.getParameter( Parameter.VALUE ), userSession );
    } else {
      final Object value = CdfSettings.getInstance().getValue( key, userSession );
      final PrintWriter pw = new PrintWriter( out );
      pw.println( value != null ? value.toString() : "" );
      pw.flush();
    }
  }

  private void processComments( final IParameterProvider params, final OutputStream out ) throws JSONException {

    JSONObject result = null;

    SecurityParameterProvider securityParams = new SecurityParameterProvider( userSession );
    boolean isAdministrator = Boolean.valueOf( (String) securityParams.getParameter( "principalAdministrator" ) );
    boolean isAuthenticated = userSession.isAuthenticated();

    try {
      final CommentsEngine engine = CommentsEngine.getInstance();

      final String action = params.getStringParameter( Parameter.ACTION, "" );

      final CommentsEngine.Operation operation = CommentsEngine.Operation.get( action );

      if ( Operation.DELETE == operation || Operation.ARCHIVE == operation ) {

        if ( !isAuthenticated ) {

          final PrintWriter pw = new PrintWriter( out );
          pw.println( JsonUtil.makeJsonErrorResponse( "Operation not authorized: requires authentication",
              false ).toString( 2 ) );
          pw.flush();
          return;
        }
      }

      switch ( operation ) {
        case ADD:
          result =
              engine.add( params.getStringParameter( Parameter.PAGE, "" ), params.getStringParameter(
                  Parameter.COMMENT, "" ), userSession.getName() );
          break;
        case DELETE:
          result =
              engine.delete( Integer.parseInt( params.getStringParameter( Parameter.COMMENT_ID, "-1" ) ), Boolean
                  .valueOf( params.getStringParameter( Parameter.VALUE, "true" ) ), userSession.getName(), isAdministrator );
          break;
        case ARCHIVE:
          result =
              engine.archive( Integer.parseInt( params.getStringParameter( Parameter.COMMENT_ID, "-1" ) ), Boolean
                  .valueOf( params.getStringParameter( Parameter.VALUE, "true" ) ), userSession.getName(), isAdministrator );
          break;
        case LIST:
          result =
              engine.list( params.getStringParameter( Parameter.PAGE, "" ), Integer.parseInt( params
                  .getStringParameter( Parameter.FIRST_RESULT, "0" ) ), Integer.parseInt( params.getStringParameter(
                  Parameter.MAX_RESULTS, "20" ) ), ( isAdministrator ? Boolean.valueOf( params.getStringParameter(
                  Parameter.DELETED, "false" ) ) : false ), ( isAdministrator ? Boolean.valueOf( params
                  .getStringParameter( Parameter.ARCHIVED, "false" ) ) : false ), userSession.getName() );
          break;

        default:
          result = JsonUtil.makeJsonErrorResponse( "Unknown Comments operation: " + action, true );
          break;
      }

    } catch ( Exception ex ) {
      final String errorMessage = ex.getCause().getClass().getName() + " - " + ex.getMessage();
      result = JsonUtil.makeJsonErrorResponse( "Error processing comment: " + errorMessage, true );
    }

    final PrintWriter pw = new PrintWriter( out );
    pw.println( result.toString( 2 ) );
    pw.flush();
  }

  private void processStorage( final IParameterProvider params, final OutputStream out ) throws JSONException {

    JSONObject result = null;

    try {

      final StorageEngine engine = StorageEngine.getInstance();

      final String action = params.getStringParameter( Parameter.ACTION, "" );

      final StorageEngine.Operation operation = StorageEngine.Operation.get( action );

      switch ( operation ) {
        case READ:
          result = engine.read( userSession.getName() );
          break;
        case DELETE:
          result = engine.delete( userSession.getName() );
          break;
        case STORE:
          result = engine.store( params.getStringParameter( Parameter.STORAGE_VALUE, "" ), userSession.getName() );
          break;
        default:
          result = JsonUtil.makeJsonErrorResponse( "Unknown Storage operation: " + action, true );
          break;
      }

    } catch ( Exception ex ) {
      final String errorMessage = ex.getCause().getClass().getName() + " - " + ex.getMessage();
      result = JsonUtil.makeJsonErrorResponse( "Error processing comment: " + errorMessage, true );
    }

    final PrintWriter pw = new PrintWriter( out );
    pw.println( result.toString( 2 ) );
    pw.flush();

  }

  @Override
  public Log getLogger() {
    // TODO Auto-generated method stub
    return null;
  }

  public void getContent( final String fileName, final OutputStream out ) throws Exception {

    // write out the scripts
    // TODO support caching
    IReadAccess access = CdfEngine.getPluginSystemReader( null );

    if ( access.fileExists( fileName ) ) {
      IOUtils.copy( access.getFileInputStream( fileName ), out );
    }
  }

  public void getSolutionFile( final String resourcePath, final OutputStream out ) throws Exception {

    final IResourceLoader resLoader = CdfEngine.getEnvironment().getResourceLoader();
    final String formats =
        resLoader.getPluginSetting( this.getClass(), CdfConstants.PLUGIN_SETTINGS_DOWNLOADABLE_FORMATS );

    List<String> allowedFormats = Arrays.asList( StringUtils.split( formats, ',' ) );
    String extension = resourcePath.replaceAll( ".*\\.(.*)", "$1" );
    if ( allowedFormats.indexOf( extension ) < 0 ) {
      // We can't provide this type of file
      throw new SecurityException( "Not allowed" );
    }

    IUserContentAccess contentAccess = CdfEngine.getUserContentReader( null );
    IReadAccess systemAccess = CdfEngine.getPluginSystemReader( null );

    if ( contentAccess.fileExists( resourcePath ) && contentAccess.hasAccess( resourcePath, FileAccess.EXECUTE ) ) {
      PluginIOUtils.writeOutAndFlush( out, contentAccess.getFileInputStream( resourcePath ) );
    }else if ( systemAccess.fileExists( resourcePath ) ){
      PluginIOUtils.writeOutAndFlush( out, systemAccess.getFileInputStream( resourcePath ) );
    }else{
      logger.info( " resource not found: " + resourcePath );
    }
  }

  public void views( final IParameterProvider requestParams, final OutputStream out ) {

    String result = null;

    try {

      final ViewEngine engine = ViewEngine.getInstance();

      String method = requestParams.getStringParameter( Parameter.METHOD, "" );

      final ViewEngine.Operation operation = ViewEngine.Operation.get( method );

      if ( ViewEngine.Operation.LIST_ALL_VIEWS == operation ) {

        if ( !SecurityHelper.isPentahoAdministrator( PentahoSessionHolder.getSession() ) ) {
          out.write( "You need to be an administrator to poll all views".getBytes( CharsetHelper.getEncoding() ) );
          return;
        }
      }

      switch ( operation ) {
        case GET_VIEW:
          result =
              engine.getView( requestParams.getStringParameter( Parameter.NAME, "" ),
                  PentahoSessionHolder.getSession().getName() ).toJSON().toString();
          break;
        case SAVE_VIEW:
          result =
              engine.saveView( requestParams.getStringParameter( Parameter.VIEW, "" ), PentahoSessionHolder
                  .getSession().getName() );
          break;
        case DELETE_VIEW:
          result =
              engine.deleteView( requestParams.getStringParameter( Parameter.NAME, "" ), PentahoSessionHolder
                  .getSession().getName() );
          break;
        case LIST_VIEWS:
          result = engine.listViews( PentahoSessionHolder.getSession().getName() ).toString( 2 );
          break;
        case LIST_ALL_VIEWS:
          result = engine.listAllViews( PentahoSessionHolder.getSession().getName() ).toString( 2 );
          break;
        default:
          result = JsonUtil.makeJsonErrorResponse( "Unknown View operation: " + method, true ).toString( 2 );
          break;
      }

      out.write( result.getBytes( CharsetHelper.getEncoding() ) );

    } catch ( Exception ex ) {
      logger.error( ex );
    }
  }

  public void clearCache( final OutputStream out ) {
    try {
      ContextEngine.clearCache();
      out.write( "Cache cleared".getBytes( CharsetHelper.getEncoding() ) );
    } catch ( IOException e ) {
      logger.error( "failed to clear CDFcache" );
    }
  }

  @Override
  public String getPluginName() {
    return PLUGIN_ID;
  }
}
