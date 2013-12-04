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

import java.io.StringReader;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Node;
import org.dom4j.io.SAXReader;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.context.autoinclude.AutoInclude;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.cdf.util.RequestParameters;
import org.pentaho.cdf.views.View;
import org.pentaho.cdf.views.ViewEngine;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.security.SecurityParameterProvider;

import pt.webdetails.cpf.InterPluginCall;
import pt.webdetails.cpf.repository.api.IContentAccessFactory;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.util.RepositoryHelper;
import pt.webdetails.cpf.utils.XmlDom4JUtils;

/**
 * 
 * @author pdpi
 */
public class DashboardContext {

  private static final Log logger = LogFactory.getLog( DashboardContext.class );

  private static String CONFIG_FILE = "dashboardContext.xml";

  private static List<AutoInclude> autoIncludes;
  private static Object autoIncludesLock = new Object();

  protected IPentahoSession userSession;

  public DashboardContext( IPentahoSession userSession ) {
    logger.debug( "Creating Context for user " + userSession.getName() );
    this.userSession = userSession;
  }

  private String getStorage() {
    try {
      JSONObject result = StorageEngine.getInstance().read( userSession.getName() );

      if ( result != null ) {
        return result.toString( 2 );
      }
    } catch ( Exception e ) {
      logger.error( e );
    }
    return "";
  }

  public String getContext( IParameterProvider requestParams, HttpServletRequest request ) {
    try {
      String solution = requestParams.getStringParameter( "solution", "" ),
             path = requestParams.getStringParameter( "path", "" ),
             file = requestParams.getStringParameter( "file", "" ),
             action = requestParams.getStringParameter( "action", "" ),
             viewId = requestParams.getStringParameter( "view", action );
      String fullPath = RepositoryHelper.joinPaths( solution, path, file );
      // old xcdf dashboards use solution + path + action 
      if ( RepositoryHelper.getExtension( action ).equals( "xcdf" ) ) {
        fullPath = RepositoryHelper.joinPaths( fullPath, action );
      }
      final JSONObject context = new JSONObject();

      Document configFile = getConfigFile();
      if ( configFile != null ) {
        context.put( "queryData", processAutoIncludes( fullPath, configFile ) );
        context.put( "sessionAttributes", processSessionAttributes( configFile ) );
      } else {
        logger
            .error( "Unable to read dashboardContext.xml; auto-includes and session attributes will not be available" );
      }
      if ( request != null && userSession.isAuthenticated() ) {
        context.put( "sessionTimeout", request.getSession().getMaxInactiveInterval() );
      }
      Calendar cal = Calendar.getInstance();

      long utcTime = cal.getTimeInMillis();
      context.put( "serverLocalDate", utcTime + cal.getTimeZone().getOffset( utcTime ) );
      context.put( "serverUTCDate", utcTime );
      context.put( "user", userSession.getName() );
      context.put( "locale", userSession.getLocale() );
      context.put( "solution", solution );
      context.put( "path", path );
      context.put( "file", file );
      context.put( "fullPath", fullPath );

      SecurityParameterProvider securityParams = new SecurityParameterProvider( userSession );
      context.put( "roles", securityParams.getParameter( "principalRoles" ) );
      context.put( "isAdmin", Boolean.valueOf( (String) securityParams.getParameter( "principalAdministrator" ) ) );

      JSONObject params = new JSONObject();

      @SuppressWarnings( "unchecked" )
      Iterator<String> it = requestParams.getParameterNames();
      while ( it.hasNext() ) {
        String p = it.next();
        if ( p.indexOf( "param" ) == 0 ) {
          params.put( p.substring( 5 ), requestParams.getParameter( p ) );
        }
      }
      context.put( "params", params );

      final StringBuilder s = new StringBuilder();
      s.append( "\n<script language=\"javascript\" type=\"text/javascript\">\n" );
      s.append( "  Dashboards.context = " );
      s.append( context.toString( 2 ) + "\n" );

      View view = ViewEngine.getInstance().getView( viewId, userSession.getName() );
      if ( view != null ) {
        s.append( "Dashboards.view = " );
        s.append( view.toJSON().toString( 2 ) + "\n" );
      }
      String storage = getStorage();
      if ( !StringUtils.isEmpty( storage ) ) {
        s.append( "Dashboards.initialStorage = " );
        s.append( storage );
        s.append( "\n" );
      }
      s.append( "</script>\n" );
      // setResponseHeaders(MIME_PLAIN,0,null);
      logger.info( "[Timing] Finished building context: "
          + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );

      return s.toString();
    } catch ( JSONException e ) {
      logger.error( "Error building dashboard context.", e );
      return "";
    }
  }

  private JSONObject processSessionAttributes( Document config ) {

    JSONObject result = new JSONObject();

    @SuppressWarnings( "unchecked" )
    List<Node> attributes = config.selectNodes( "//sessionattributes/attribute" );
    for ( Node attribute : attributes ) {

      String name = attribute.getText();
      String key = XmlDom4JUtils.getNodeText( "@name", attribute );
      if ( key == null ) {
        key = name;
      }

      try {
        result.put( key, userSession.getAttribute( name ) );
      } catch ( JSONException e ) {
        logger.error( e );
      }
    }

    return result;
  }

  /**
   * will add a json entry for each data access id in the cda queries applicable to currents dashboard.
   */
  private JSONObject processAutoIncludes( String dashboardPath, Document config ) {
    JSONObject queries = new JSONObject();
    /* Bail out immediately if CDA isn' available */
    if ( !( new InterPluginCall( InterPluginCall.CDA, "" ) ).pluginExists() ) {
      logger.warn( "Couldn't find CDA. Skipping auto-includes" );
      return queries;
    }

    List<AutoInclude> autoIncludes = getAutoIncludes( config );
    for ( AutoInclude autoInclude : autoIncludes ) {
      if ( autoInclude.canInclude( dashboardPath ) ) {
        String cdaPath = autoInclude.getCdaPath();
        addCdaQueries( queries, cdaPath );
      }
    }
    return queries;
  }

  private List<AutoInclude> getAutoIncludes( Document config ) {
    synchronized ( autoIncludesLock ) {
      if ( autoIncludes == null ) {
        IReadAccess cdaRoot = CdfEngine.getUserContentReader( "/" );
        autoIncludes = AutoInclude.buildAutoIncludeList( config, cdaRoot );
      }
      return autoIncludes;
    }
  }

  private void addCdaQueries( JSONObject queries, String cdaPath ) {
    List<String> dataAccessIds = listQueries( cdaPath );
    // String idPattern = (String) cda.selectObject("string(ids)");
    if ( logger.isDebugEnabled() ) {
      logger.debug(
          String.format( "data access ids for %s:( %s )",
              cdaPath, StringUtils.join( dataAccessIds.iterator(), ", " ) ) );
    }
    for ( String id : dataAccessIds ) {
      String reply = executeQuery( cdaPath, id );
      try {
        queries.put( id, new JSONObject( reply ) );
      } catch ( JSONException e ) {
        logger.error( "Failed to add query " + id + " to contex object" );
      }
    }
  }

  private String executeQuery( String path, String id ) {
    Map<String, Object> params = new HashMap<String, Object>();
    params.put( "dataAccessId", id );
    params.put( "path", path );
    logger.info( "[Timing] Executing autoinclude query: "
        + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );
    InterPluginCall ipc = new InterPluginCall( InterPluginCall.CDA, "doQuery", params );
    String reply = ipc.callInPluginClassLoader();
    logger.info( "[Timing] Done executing autoinclude query: "
        + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );
    return reply;
  }

  private List<String> listQueries( String cda ) {
    SAXReader reader = new SAXReader();
    List<String> queryOutput = new ArrayList<String>();
    try {
      // call listQueries on CDA
      Map<String, Object> params = new HashMap<String, Object>();
      params.put( "path", cda );
      params.put( "outputType", "xml" );
      InterPluginCall ipc = new InterPluginCall( InterPluginCall.CDA, "listQueries", params );
      String reply = ipc.call();
      Document queryList = reader.read( new StringReader( reply ) );
      @SuppressWarnings( "unchecked" )
      List<Node> queries = queryList.selectNodes( "//ResultSet/Row/Col[1]" );
      for ( Node query : queries ) {
        queryOutput.add( query.getText() );
      }
    } catch ( DocumentException e ) {
      logger.error( "Error reading listQueries result", e );
      return null;
    }
    return queryOutput;
  }

  private Document getConfigFile() {

    try {
      IContentAccessFactory factory = CdfEngine.getEnvironment().getContentAccessFactory();
      IReadAccess access = factory.getPluginRepositoryReader( null );

      if ( !access.fileExists( CONFIG_FILE ) ) {
        access = factory.getPluginSystemReader( null );
        if ( !access.fileExists( CONFIG_FILE ) ) {
          logger.error( CONFIG_FILE + " not found!" );
          return null;
        }
      }
      if ( logger.isDebugEnabled() ) {
        logger.debug( String.format( "Reading %s from %s", CONFIG_FILE, access )  );
      }
      return XmlDom4JUtils.getDocumentFromStream( access.getFileInputStream( CONFIG_FILE ) );

    } catch ( Exception e ) {
      logger.error( "Couldn't read context configuration file.", e );
      return null;
    }
  }

  public static void clearCache() {
    // TODO figure out what to clear
    synchronized ( autoIncludesLock ) {
      autoIncludes = null;
    }
  }
}
