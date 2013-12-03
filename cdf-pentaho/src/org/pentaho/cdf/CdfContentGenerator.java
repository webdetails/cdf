/*!
 * Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
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

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.lang.reflect.Method;
import java.nio.charset.Charset;
import java.security.InvalidParameterException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.Locale;
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
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.export.Export;
import org.pentaho.cdf.export.ExportCSV;
import org.pentaho.cdf.export.ExportExcel;
import org.pentaho.cdf.localization.MessageBundlesHelper;
import org.pentaho.cdf.render.HtmlDashboardRenderer;
import org.pentaho.cdf.render.XcdfRenderer;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.cdf.util.RequestParameters;
import org.pentaho.cdf.utils.JsonUtil;
import org.pentaho.cdf.views.ViewEngine;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IUITemplater;
import org.pentaho.platform.api.repository.ISchedule;
import org.pentaho.platform.api.repository.ISubscribeContent;
import org.pentaho.platform.api.repository.ISubscriptionRepository;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.security.SecurityHelper;
import org.pentaho.platform.engine.security.SecurityParameterProvider;
import org.pentaho.platform.engine.services.solution.BaseContentGenerator;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.audit.CpfAuditHelper;
import pt.webdetails.cpf.repository.api.FileAccess;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.api.IUserContentAccess;
import pt.webdetails.cpf.resources.IResourceLoader;
import pt.webdetails.cpf.utils.CharsetHelper;
import pt.webdetails.cpf.utils.MimeTypes;

/**
 * This is the main class of the CDF plugin. It handles all requests to /pentaho/content/pentaho-cdf. These requests
 * include:
 * <p/>
 * - JSONSolution - GetCDFResource - .xcdf requests - js files - files within resources
 * 
 * @author Will Gorman (wgorman@pentaho.com)
 */
public class CdfContentGenerator extends BaseContentGenerator {

  private static final long serialVersionUID = 5608691656289862706L;
  private static final Log logger = LogFactory.getLog( CdfContentGenerator.class );
  private static final String MIMETYPE = "text/html"; //$NON-NLS-1$
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

  private static final String MIME_HTML = "text/html";
  private static final String MIME_CSV = "text/csv";
  private static final String MIME_XLS = "application/vnd.ms-excel";
  // CDF Resource Relative URL
  private static final String RELATIVE_URL_TAG = "@RELATIVE_URL@";
  public String RELATIVE_URL;

  @Override
  public void createContent() throws Exception {
    OutputStream out = null;
    final IParameterProvider pathParams;
    final String method;
    final String payload;
    logger.info( "[Timing] CDF content generator took over: "
        + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );
    try {

      if ( parameterProviders.get( RequestParameters.PATH ) != null
          && parameterProviders.get( RequestParameters.PATH ).getParameter( "httpresponse" ) != null ) {
        out =
            ( (HttpServletResponse) parameterProviders.get( RequestParameters.PATH ).getParameter( "httpresponse" ) )
                .getOutputStream();
      }

      if ( parameterProviders.get( RequestParameters.PATH ) != null
          && parameterProviders.get( RequestParameters.PATH ).getParameter( "httprequest" ) != null
          && ( (HttpServletRequest) parameterProviders.get( RequestParameters.PATH ).getParameter( "httprequest" ) )
              .getContextPath() != null ) {
        RELATIVE_URL =
            ( (HttpServletRequest) parameterProviders.get( RequestParameters.PATH ).getParameter( "httprequest" ) )
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
        pathParams = parameterProviders.get( RequestParameters.PATH );
        method = "/" + (String) iface.get( "method" );
        payload = (String) iface.get( "payload" );
        this.userSession = this.userSession != null ? this.userSession : (IPentahoSession) iface.get( "usersession" );
      } else { // if not, we handle the request normally
        pathParams = parameterProviders.get( RequestParameters.PATH );
        method = pathParams.getStringParameter( RequestParameters.PATH, null );
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

    final IParameterProvider requestParams = parameterProviders.get( IParameterProvider.SCOPE_REQUEST );

    if ( urlPath.equals( RENDER_XCDF ) ) {
      renderXcdf( out, requestParams );
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
      callAction( requestParams, out );
    } else if ( urlPath.equals( COMMENTS ) ) {
      processComments( requestParams, out );
    } else if ( urlPath.equals( STORAGE ) ) {
      processStorage( requestParams, out );
    } else if ( urlPath.equals( CONTEXT ) ) {
      generateContext( requestParams, out );
    } else if ( urlPath.equals( CLEAR_CACHE ) ) {
      clearCache( requestParams, out );
    } else if ( urlPath.equals( VIEWS ) ) {
      views( requestParams, out );
    } else if ( urlPath.equals( GETHEADERS ) ) {
      if ( !payload.equals( "" ) ) {
        getHeaders( payload, requestParams, out );
      } else {
        getHeaders( requestParams, out );
      }
    } else if ( urlPath.equalsIgnoreCase( PING ) ) {
      out.write( "{\"ping\":\"ok\"}".getBytes( "UTF8" ) );
    } else if ( urlPath.equalsIgnoreCase( GET_SCHEDULES ) )
      processGetSchedules( requestParams, out );
    else {
      // we'll be providing the actual content with cache
      logger.warn( "Getting resources via content generator is deprecated, please use static resources: " + urlPath );
      returnResource( urlPath, out );
    }
  }

  private void processGetSchedules( final IParameterProvider requestParams, final OutputStream out ) throws Exception {

    final String solution = requestParams.getStringParameter( RequestParameters.SOLUTION, null ); //$NON-NLS-1$
    final String path = requestParams.getStringParameter( RequestParameters.PATH, null ); //$NON-NLS-1$
    final String action = requestParams.getStringParameter( RequestParameters.ACTION, null ); //$NON-NLS-1$

    final String fullPath = FilenameUtils.separatorsToUnix( Util.joinPath( solution, path, action ) );

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

  private void generateContext( final IParameterProvider requestParams, final OutputStream out ) throws Exception {
    HttpServletRequest request =
        ( (HttpServletRequest) parameterProviders.get( RequestParameters.PATH ).getParameter( "httprequest" ) );
    DashboardContext context = new DashboardContext( userSession );
    out.write( context.getContext( requestParams, request ).getBytes( CharsetHelper.getEncoding() ) );

  }

  private void generateStorage( final OutputStream out ) throws Exception {

    JSONObject result = StorageEngine.getInstance().read( userSession.getName() );

    StringBuilder s = new StringBuilder();
    s.append( "\n<script language=\"javascript\" type=\"text/javascript\">\n" );
    s.append( "  Dashboards.storage = " );
    s.append( result.toString( 2 ) ).append( "\n" );
    s.append( "</script>\n" );
    // setResponseHeaders(MIME_PLAIN,0,null);
    out.write( s.toString().getBytes( CharsetHelper.getEncoding() ) );
  }

  private void renderXcdf( final OutputStream out, final IParameterProvider requestParams ) throws Exception {
    long start = System.currentTimeMillis();

    final String solution = requestParams.getStringParameter( RequestParameters.SOLUTION, null ); //$NON-NLS-1$
    final String path = requestParams.getStringParameter( RequestParameters.PATH, null ); //$NON-NLS-1$
    final String template = requestParams.getStringParameter( RequestParameters.TEMPLATE, null ); //$NON-NLS-1$
    final String action = requestParams.getStringParameter( RequestParameters.ACTION, null ); //$NON-NLS-1$

    final String pluginId = CdfEngine.getEnvironment().getPluginId();

    UUID uuid = CpfAuditHelper.startAudit( pluginId, action, getObjectName(), this.userSession, this, requestParams );

    try {
      renderXCDFDashboard( requestParams, out, solution, path, action, template );

      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit( pluginId, action, getObjectName(), this.userSession, this, start, uuid, end );

    } catch ( Exception e ) {
      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit( pluginId, action, getObjectName(), this.userSession, this, start, uuid, end );
      throw e;
    }
  }

  private void jsonSolution( final OutputStream out, final IParameterProvider requestParams ) throws JSONException,
    ParserConfigurationException {
    if ( requestParams == null ) {
      error( Messages.getErrorString( "CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS" ) ); //$NON-NLS-1$
      throw new InvalidParameterException( Messages.getString( "CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS" ) ); //$NON-NLS-1$
    }

    final String solution = requestParams.getStringParameter( RequestParameters.SOLUTION, null ); //$NON-NLS-1$
    final String path = requestParams.getStringParameter( RequestParameters.PATH, null ); //$NON-NLS-1$
    final String mode = requestParams.getStringParameter( RequestParameters.MODE, null ); //$NON-NLS-1$

    final String contextPath =
        ( (HttpServletRequest) parameterProviders.get( RequestParameters.PATH ).getParameter( "httprequest" ) )
            .getContextPath();
    final NavigateComponent nav = new NavigateComponent( userSession, contextPath );
    final String json = nav.getNavigationElements( mode, solution, path );

    final PrintWriter pw = new PrintWriter( out );

    // jsonp?
    String callback = requestParams.getStringParameter( RequestParameters.CALLBACK, null );
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

    final String resource = requestParams.getStringParameter( RequestParameters.RESOURCE, null ); //$NON-NLS-1$

    final HttpServletResponse response =
        (HttpServletResponse) parameterProviders.get( RequestParameters.PATH ).getParameter( "httpresponse" );
    try {
      response.setContentType( MimeTypes.getMimeType( resource ) );
      getSolutionFile( resource, out );
    } catch ( SecurityException e ) {
      response.sendError( HttpServletResponse.SC_FORBIDDEN );
    }
  }

  private void renderHtml( final OutputStream out, final IParameterProvider requestParams ) throws Exception {

    final String solution = requestParams.getStringParameter( RequestParameters.SOLUTION, null ); //$NON-NLS-1$
    final String template = requestParams.getStringParameter( RequestParameters.TEMPLATE, null ); //$NON-NLS-1$
    final String path = requestParams.getStringParameter( RequestParameters.PATH, null ); //$NON-NLS-1$
    final String templateName = requestParams.getStringParameter( RequestParameters.DASHBOARD, null );
    // Get messages base filename from url if given otherwise defaults to Messages
    String messageBaseFilename = requestParams.getStringParameter( "messages", null );
    renderHtmlDashboard( requestParams, out, solution, path, templateName == null ? "template.html" : templateName,
        template, messageBaseFilename );
  }

  private void returnResource( final String urlPath, final OutputStream out ) throws Exception {
    final IParameterProvider pathParams = parameterProviders.get( RequestParameters.PATH ); //$NON-NLS-1$

    final IResourceLoader resLoader = CdfEngine.getEnvironment().getResourceLoader();
    final String maxAge = resLoader.getPluginSetting( CdfContentGenerator.class, "settings/max-age" );
    final HttpServletResponse response = (HttpServletResponse) pathParams.getParameter( "httpresponse" );
    if ( maxAge != null && response != null ) {
      response.setContentType( MimeTypes.getMimeType( urlPath ) );
      response.setHeader( "Cache-Control", "max-age=" + maxAge );
    }

    getContent( urlPath, out );
  }

  public void renderXCDFDashboard( final IParameterProvider requestParams, final OutputStream out,
      final String solution, final String path, final String action, String defaultTemplate ) throws Exception {

    XcdfRenderer renderer = new XcdfRenderer();

    boolean success = renderer.determineDashboardTemplating( solution, path, action, defaultTemplate );

    if ( success ) {
      renderHtmlDashboard( requestParams, out, solution, path, renderer.getTemplateName(), renderer.getTemplate(),
          renderer.getMessagesBaseFilename() );

    } else {
      out.write( "Unable to render dashboard".getBytes( CharsetHelper.getEncoding() ) );
    }
  }

  public void renderHtmlDashboard( final IParameterProvider requestParams, final OutputStream out,
      final String solution, final String path, String templateName, String template,
      String dashboardsMessagesBaseFilename ) throws Exception {

    IBasicFile dashboardTemplateFile = HtmlDashboardRenderer.getDashboardTemplate( solution, path, templateName );

    String intro = ""; //$NON-NLS-1$
    String footer = ""; //$NON-NLS-1$

    IReadAccess systemAccess = CdfEngine.getPluginSystemReader( null );
    template = StringUtils.isEmpty( template ) ? "" : "-" + template;

    final String dashboardTemplate = "template-dashboard" + template + ".html"; //$NON-NLS-1$

    final IUITemplater templater = PentahoSystem.get( IUITemplater.class, userSession );
    ArrayList<String> i18nTagsList = new ArrayList<String>();
    if ( templater != null ) {

      IBasicFile templateResourceFile = null;
      IReadAccess pluginRepoAccess = CdfEngine.getPluginRepositoryReader( "templates/" );

      if ( pluginRepoAccess.fileExists( dashboardTemplate ) ) {
        templateResourceFile = pluginRepoAccess.fetchFile( dashboardTemplate );

      } else if ( systemAccess.fileExists( dashboardTemplate ) ) {
        // then try in system
        templateResourceFile = systemAccess.fetchFile( dashboardTemplate );
      }

      String templateContent = Util.toString( templateResourceFile.getContents() );
      // Process i18n on dashboard outer template
      templateContent = updateUserLanguageKey( templateContent );
      templateContent = processi18nTags( templateContent, i18nTagsList );
      // Process i18n on dashboard outer template - end
      final String[] sections = templater.breakTemplateString( templateContent, "", userSession ); //$NON-NLS-1$
      if ( sections != null && sections.length > 0 ) {
        intro = sections[0];
      }
      if ( sections != null && sections.length > 1 ) {
        footer = sections[1];
      }
    } else {
      intro = Messages.getErrorString( "CdfContentGenerator.ERROR_0005_BAD_TEMPLATE_OBJECT" );
    }

    final String dashboardContent;

    InputStream is = dashboardTemplateFile.getContents();

    // Fixed ISSUE #CDF-113
    // BufferedReader reader = new BufferedReader(new InputStreamReader(is));
    BufferedReader reader =
        new BufferedReader(
            new InputStreamReader( is, Charset.forName( CdfEngine.getEnvironment().getSystemEncoding() ) ) );

    StringBuilder sb = new StringBuilder();
    String line = null;
    while ( ( line = reader.readLine() ) != null ) {
      // Process i18n for each line of the dashboard output
      line = processi18nTags( line, i18nTagsList );
      // Process i18n - end
      sb.append( line ).append( "\n" );
    }
    is.close();
    dashboardContent = sb.toString();

    String messageSetPath = null;
    // Merge dashboard related message file with global message file and save it in the dashboard cache
    MessageBundlesHelper mbh = new MessageBundlesHelper( solution, path, dashboardsMessagesBaseFilename );
    mbh.saveI18NMessageFilesToCache();
    messageSetPath = mbh.getMessageFilesCacheUrl() + "/";

    // If dashboard specific files aren't specified set message filename in cache to the global messages file filename
    if ( dashboardsMessagesBaseFilename == null ) {
      dashboardsMessagesBaseFilename = CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME;
    }

    intro = intro.replaceAll( "\\{load\\}", "onload=\"load()\"" ); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
    intro = intro.replaceAll( "\\{body-tag-unload\\}", "" );
    intro = intro.replaceAll( "#\\{GLOBAL_MESSAGE_SET_NAME\\}", dashboardsMessagesBaseFilename );
    intro = intro.replaceAll( "#\\{GLOBAL_MESSAGE_SET_PATH\\}", messageSetPath );
    intro = intro.replaceAll( "#\\{GLOBAL_MESSAGE_SET\\}", buildMessageSetCode( i18nTagsList ) );

    /*
     * Add cdf libraries
     */
    // final Date startDate = new Date();
    final int headIndex = intro.indexOf( "<head>" );
    final int length = intro.length();
    // final Hashtable addedFiles = new Hashtable();

    out.write( intro.substring( 0, headIndex + 6 ).getBytes( CharsetHelper.getEncoding() ) );
    // Concat libraries to html head content
    getHeaders( dashboardContent, requestParams, out );
    out.write( intro.substring( headIndex + 6, length ).getBytes( CharsetHelper.getEncoding() ) );
    // Add context
    try {
      generateContext( requestParams, out );
    } catch ( Exception e ) {
      logger.error( "Error generating cdf context.", e );
    }
    // Add storage
    try {
      generateStorage( out );
    } catch ( Exception e ) {
      logger.error( "Error in cdf storage.", e );
    }

    out.write( "<div id=\"dashboardContent\">".getBytes( CharsetHelper.getEncoding() ) );

    out.write( dashboardContent.getBytes( CharsetHelper.getEncoding() ) );
    out.write( "</div>".getBytes( CharsetHelper.getEncoding() ) );
    out.write( footer.getBytes( CharsetHelper.getEncoding() ) );

    setResponseHeaders( MIME_HTML, 0, null );
  }

  private String buildMessageSetCode( ArrayList<String> tagsList ) {
    StringBuilder messageCodeSet = new StringBuilder();
    for ( String tag : tagsList ) {
      messageCodeSet.append( "\\$('#" ).append( updateSelectorName( tag ) ).append( "').html(jQuery.i18n.prop('" )
          .append( tag ).append( "'));\n" );
    }
    return messageCodeSet.toString();
  }

  private String processi18nTags( String content, ArrayList<String> tagsList ) {
    String tagPattern = "CDF.i18n\\(\"";
    String[] test = content.split( tagPattern );
    if ( test.length == 1 ) {
      return content;
    }
    StringBuilder resBuffer = new StringBuilder();
    int i;
    String tagValue;
    resBuffer.append( test[0] );
    for ( i = 1; i < test.length; i++ ) {

      // First tag is processed differently that other because is the only case where I don't
      // have key in first position
      resBuffer.append( "<span id=\"" );
      if ( i != 0 ) {
        // Right part of the string with the value of the tag herein
        tagValue = test[i].substring( 0, test[i].indexOf( "\")" ) );
        tagsList.add( tagValue );
        resBuffer.append( updateSelectorName( tagValue ) );
        resBuffer.append( "\"></span>" );
        resBuffer.append( test[i].substring( test[i].indexOf( "\")" ) + 2, test[i].length() ) );
      }
    }
    return resBuffer.toString();
  }

  private String updateSelectorName( String name ) {
    // If we've the character . in the message key substitute it conventionally to _
    // when dynamically generating the selector name. The "." character is not permitted in the
    // selector id name
    return name.replace( ".", "_" );
  }

  private String updateUserLanguageKey( String intro ) {

    // Fill the template with the correct user locale
    Locale locale = CdfEngine.getEnvironment().getLocale();
    if ( logger.isDebugEnabled() ) {
      logger.debug( "Current Pentaho user locale: " + locale.getLanguage() );
    }
    intro = intro.replaceAll( "#\\{LANGUAGE_CODE\\}", locale.getLanguage() );
    return intro;
  }

  private void exportFile( final IParameterProvider requestParams, final OutputStream output ) {

    try {

      final ByteArrayOutputStream out = new ByteArrayOutputStream();

      final ServiceCallAction serviceCallAction = ServiceCallAction.getInstance();
      if ( serviceCallAction.execute( requestParams, userSession, out ) ) {

        final String exportType = requestParams.getStringParameter( "exportType", "excel" );

        Export export;

        if ( exportType.equals( "csv" ) ) {
          export = new ExportCSV( output );
          setResponseHeaders( MIME_CSV, 0, "export" + export.getExtension() );
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

    final String method = requestParams.getStringParameter( "method", null );
    final String key = requestParams.getStringParameter( "key", null );

    if ( method.equals( "set" ) ) {
      CdfSettings.getInstance().setValue( key, requestParams.getParameter( "value" ), userSession );
    } else {
      final Object value = CdfSettings.getInstance().getValue( key, userSession );
      final PrintWriter pw = new PrintWriter( out );
      pw.println( value != null ? value.toString() : "" );
      pw.flush();
    }
  }

  private void callAction( final IParameterProvider requestParams, final OutputStream out ) {
    ServiceCallAction.getInstance().execute( requestParams, userSession, out );
  }

  private void processComments( final IParameterProvider params, final OutputStream out ) throws JSONException {

    JSONObject result = null;

    SecurityParameterProvider securityParams = new SecurityParameterProvider( userSession );
    boolean isAdministrator = Boolean.valueOf( (String) securityParams.getParameter( "principalAdministrator" ) );
    boolean isAuthenticated = userSession.isAuthenticated();

    try {
      final CommentsEngine engine = CommentsEngine.getInstance();

      final String action = params.getStringParameter( RequestParameters.ACTION, "" );

      final CommentsEngine.Operation operation = CommentsEngine.Operation.get( action );

      if ( Operation.DELETE == operation || Operation.ARCHIVE == operation ) {

        if ( !isAdministrator || !isAuthenticated ) {

          final PrintWriter pw = new PrintWriter( out );
          pw.println( JsonUtil.makeJsonErrorResponse( "Operation not authorized: requires administrator priviledges",
              false ).toString( 2 ) );
          pw.flush();
          return;
        }
      }

      switch ( operation ) {
        case ADD:
          result =
              engine.add( params.getStringParameter( RequestParameters.PAGE, "" ), params.getStringParameter(
                  RequestParameters.COMMENT, "" ), userSession.getName() );
          break;
        case DELETE:
          result =
              engine.delete( Integer.parseInt( params.getStringParameter( RequestParameters.COMMENT_ID, "-1" ) ),
                  Boolean.valueOf( params.getStringParameter( RequestParameters.VALUE, "true" ) ), userSession
                      .getName() );
          break;
        case ARCHIVE:
          result =
              engine.archive( Integer.parseInt( params.getStringParameter( RequestParameters.COMMENT_ID, "-1" ) ),
                  Boolean.valueOf( params.getStringParameter( RequestParameters.VALUE, "true" ) ), userSession
                      .getName() );
          break;
        case LIST:
          result =
              engine.list( params.getStringParameter( RequestParameters.PAGE, "" ), Integer.parseInt( params
                  .getStringParameter( RequestParameters.FIRST_RESULT, "0" ) ), Integer.parseInt( params
                  .getStringParameter( RequestParameters.MAX_RESULTS, "20" ) ), ( isAdministrator ? Boolean
                  .valueOf( params.getStringParameter( RequestParameters.DELETED, "false" ) ) : false ),
                  ( isAdministrator ? Boolean
                      .valueOf( params.getStringParameter( RequestParameters.ARCHIVED, "false" ) ) : false ),
                  userSession.getName() );
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

      final String action = params.getStringParameter( RequestParameters.ACTION, "" );

      final StorageEngine.Operation operation = StorageEngine.Operation.get( action );

      switch ( operation ) {
        case READ:
          result = engine.read( userSession.getName() );
          break;
        case DELETE:
          result = engine.delete( userSession.getName() );
          break;
        case STORE:
          result =
              engine.store( params.getStringParameter( RequestParameters.STORAGE_VALUE, "" ), userSession.getName() );
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

  public String concatFiles( String includeString, final Hashtable filesAdded, final Hashtable files ) {
    // TODO: is this used?
    final String newLine = System.getProperty( "line.separator" );
    final Enumeration keys = files.keys();
    while ( keys.hasMoreElements() ) {

      final String key = (String) keys.nextElement();
      final String[] includeFiles = (String[]) files.get( key );

      for ( int i = 0; i < includeFiles.length; i++ ) {
        if ( !filesAdded.containsKey( includeFiles[i] ) ) {

          filesAdded.put( includeFiles[i], '1' );
          if ( key.equals( "script" ) ) {
            includeString +=
                "<script language=\"javascript\" type=\"text/javascript\" src=\""
                    + includeFiles[i].replaceAll( RELATIVE_URL_TAG, RELATIVE_URL ) + "\"></script>" + newLine;
          } else {
            includeString +=
                "<link rel=\"stylesheet\" href=\"" + includeFiles[i].replaceAll( RELATIVE_URL_TAG, RELATIVE_URL )
                    + "\" type=\"text/css\" />";
          }
        }
      }
    }

    return includeString;
  }

  public boolean matchComponent( int keyIndex, final String key, final String content ) {

    for ( int i = keyIndex - 1; i > 0; i-- ) {
      if ( content.charAt( i ) == ':' || content.charAt( i ) == '"' || ( "" + content.charAt( i ) ).trim().equals( "" ) ) {
        // no inspection UnnecessaryContinue
        continue;
      } else {
        if ( ( i - 3 ) > 0 && content.substring( ( i - 3 ), i + 1 ).equals( "type" ) ) {
          return true;
        }

        break;
      }
    }

    keyIndex = content.indexOf( key, keyIndex + key.length() );
    if ( keyIndex != -1 ) {
      return matchComponent( keyIndex, key, content );
    }

    return false;
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
    final String formats = resLoader.getPluginSetting( this.getClass(), "settings/resources/downloadable-formats" );

    List<String> allowedFormats = Arrays.asList( StringUtils.split( formats, ',' ) );
    String extension = resourcePath.replaceAll( ".*\\.(.*)", "$1" );
    if ( allowedFormats.indexOf( extension ) < 0 ) {
      // We can't provide this type of file
      throw new SecurityException( "Not allowed" );
    }

    IUserContentAccess access = CdfEngine.getUserContentReader( null );

    if ( access.fileExists( resourcePath ) && access.hasAccess( resourcePath, FileAccess.EXECUTE ) ) {
      IOUtils.copy( access.getFileInputStream( resourcePath ), out );
    }
  }

  private void setResponseHeaders( final String mimeType, final int cacheDuration, final String attachmentName ) {
    // Make sure we have the correct mime type
    final HttpServletResponse response =
        (HttpServletResponse) parameterProviders.get( "path" ).getParameter( "httpresponse" );
    response.setHeader( "Content-Type", mimeType );

    if ( attachmentName != null ) {
      response.setHeader( "content-disposition", "attachment; filename=" + attachmentName );
    }

    // Cache?
    if ( cacheDuration > 0 ) {
      response.setHeader( "Cache-Control", "max-age=" + cacheDuration );
    } else {
      response.setHeader( "Cache-Control", "max-age=0, no-store" );
    }
  }

  public void views( final IParameterProvider requestParams, final OutputStream out ) {

    String result = null;

    try {

      final ViewEngine engine = ViewEngine.getInstance();

      String method = requestParams.getStringParameter( RequestParameters.METHOD, "" );

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
              engine.getView( requestParams.getStringParameter( RequestParameters.NAME, "" ),
                  PentahoSessionHolder.getSession().getName() ).toJSON().toString();
          break;
        case SAVE_VIEW:
          result =
              engine.saveView( requestParams.getStringParameter( RequestParameters.VIEW, "" ), PentahoSessionHolder
                  .getSession().getName() );
          break;
        case DELETE_VIEW:
          result =
              engine.deleteView( requestParams.getStringParameter( RequestParameters.NAME, "" ), PentahoSessionHolder
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

  public void clearCache( final IParameterProvider requestParams, final OutputStream out ) {
    try {
      DashboardContext.clearCache();
      out.write( "Cache cleared".getBytes( CharsetHelper.getEncoding() ) );
    } catch ( IOException e ) {
      logger.error( "failed to clear CDFcache" );
    }
  }

  private void getHeaders( IParameterProvider requestParams, OutputStream out ) throws Exception {

    String dashboardContent = requestParams.getStringParameter( "dashboardContent", null );
    getHeaders( dashboardContent, requestParams, out );
  }

  private void getHeaders( String dashboardContent, IParameterProvider requestParams, OutputStream out )
    throws Exception {
    org.pentaho.cdf.environment.packager.ICdfHeadersProvider cdfHeaders =
        CdfEngine.getEnvironment().getCdfHeadersProvider();
    boolean includeAll = dashboardContent != null;
    final String dashboardType = requestParams.getStringParameter( "dashboardType", "blueprint" );
    final boolean isDebugMode = Boolean.parseBoolean( requestParams.getStringParameter( RequestParameters.DEBUG, "" ) );
    String root = requestParams.getStringParameter( "root", null );
    String headers;
    if ( !StringUtils.isEmpty( root ) ) {
      String scheme = requestParams.getStringParameter( "scheme", "http" );
      // some dashboards need full absolute urls
      if ( root.contains( "/" ) ) {
        // file paths are already absolute, which didn't happen before
        root = root.substring( 0, root.indexOf( "/" ) );
      }
      String absRoot = scheme + "://" + root;
      headers = cdfHeaders.getHeaders( dashboardType, isDebugMode, absRoot, includeAll );
    } else {
      headers = cdfHeaders.getHeaders( dashboardType, isDebugMode, includeAll );
    }
    out.write( headers.getBytes( CharsetHelper.getEncoding() ) );
  }
}
