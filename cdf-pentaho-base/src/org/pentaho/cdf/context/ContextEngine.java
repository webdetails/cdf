/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf.context;

import java.io.OutputStream;
import java.io.StringReader;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.views.View;
import org.pentaho.cdf.views.ViewsEngine;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.security.SecurityParameterProvider;

import pt.webdetails.cpf.InterPluginCall;
import pt.webdetails.cpf.repository.api.IContentAccessFactory;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.util.RepositoryHelper;
import pt.webdetails.cpf.utils.PluginIOUtils;
import pt.webdetails.cpf.utils.XmlDom4JUtils;

/**
 * 
 * @author diogomariano
 */
public class ContextEngine {

  private static final Log logger = LogFactory.getLog( ContextEngine.class );
  private static final String PREFIX_PARAMETER = "param";
  static final String SESSION_PRINCIPAL = "SECURITY_PRINCIPAL";
  private static ContextEngine instance;

  private static String CONFIG_FILE = "dashboardContext.xml";

  private static List<AutoInclude> autoIncludes;
  private static Object autoIncludesLock = new Object();

  protected IPentahoSession userSession;

  public ContextEngine() {
  }

  public static synchronized ContextEngine getInstance() {
    if ( instance == null ) {
      instance = new ContextEngine();
    }
    return instance;
  }

  protected IPentahoSession getUserSession() {
	return PentahoSessionHolder.getSession();
  }

  public String getContext( String path, String viewId, String action, Map<String, String> parameters ) {
    final JSONObject contextObj = new JSONObject();

    Document config = getConfigFile();

    try {

      String username = getUserSession().getName();

      buildContextConfig( contextObj, path, config, username );
      buildContextDates( contextObj );

      contextObj.put( "user", getUserSession().getName() );
      contextObj.put( "locale", CdfEngine.getEnvironment().getLocale() );

      buildContextPaths( contextObj, path, parameters );

      SecurityParameterProvider securityParams = new SecurityParameterProvider( getUserSession() );
      contextObj.put( "roles", securityParams.getParameter( "principalRoles" ) );

      final JSONObject params = new JSONObject();
      buildContextParams( params, parameters );
      contextObj.put( "params", params );

      logger.info( "[Timing] Finished building context: "
          + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );

      return buildContextScript( contextObj, viewId, action, username );

    } catch ( JSONException e ) {
      return "";
    }
  }

  private JSONObject buildContextPaths( final JSONObject contextObj, String dashboardPath, Map<String, String> parameters ) throws JSONException {
    contextObj.put( "path", dashboardPath );
    
    if( parameters != null && parameters.containsKey( Parameter.SOLUTION )){
    	contextObj.put( Parameter.SOLUTION, parameters.get( Parameter.SOLUTION ) ); 
    } // TODO redo this
    
    return contextObj;
  }

  private JSONObject buildContextDates( final JSONObject contextObj ) throws JSONException {
    Calendar cal = Calendar.getInstance();

    long utcTime = cal.getTimeInMillis();
    contextObj.put( "serverLocalDate", utcTime + cal.getTimeZone().getOffset( utcTime ) );
    contextObj.put( "serverUTCDate", utcTime );
    return contextObj;
  }

  private JSONObject buildContextConfig( final JSONObject contextObj, String fullPath, Document config, String user )
    throws JSONException {
    contextObj.put( "queryData", processAutoIncludes( fullPath, config ) );
    contextObj.put( "sessionAttributes", processSessionAttributes( config, user ) );

    return contextObj;
  }

  private String buildContextScript( JSONObject contextObj, String viewId, String action, String user )
    throws JSONException {
    final StringBuilder s = new StringBuilder();
    s.append( "\n<script language=\"javascript\" type=\"text/javascript\">\n" );
    s.append( "  Dashboards.context = " );
    s.append( contextObj.toString( 2 ) + "\n" );

    View view = ViewsEngine.getInstance().getView( ( viewId.isEmpty() ? action : viewId ), user );
    if ( view != null ) {
      s.append( "Dashboards.view = " );
      s.append( view.toJSON().toString( 2 ) + "\n" );
    }
    String storage = getStorage();
    if ( !"".equals( storage ) ) {
      s.append( "Dashboards.initialStorage = " );
      s.append( storage );
      s.append( "\n" );
    }
    s.append( "</script>\n" );

    return s.toString();
  }

  private JSONObject buildContextParams( final JSONObject contextObj, Map<String, String> params ) throws JSONException {
    for ( String param : params.values() ) {
      if ( param.startsWith( PREFIX_PARAMETER ) ) {
        contextObj.put( param.substring( PREFIX_PARAMETER.length() ), params.get( param ) );
      }
    }
    return contextObj;
  }

  public JSONObject processSessionAttributes( Document config, String user ) {

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
        result.put( key, user );
      } catch ( JSONException e ) {
        logger.error( e );
      }
    }

    return result;
  }

  private List<String> listQueries( String cda ) {
    SAXReader reader = new SAXReader();
    List<String> queryOutput = new ArrayList<String>();
    try {
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
      return null;
    }
    return queryOutput;
  }

  private String getStorage() {
    try {
      return StorageEngine.getInstance().read( getUserSession().getName() ).toString( 2 );
    } catch ( Exception e ) {
      logger.error( e );
      return "";
    }
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
      logger.debug( String.format( "data access ids for %s:( %s )", cdaPath, StringUtils.join(
          dataAccessIds.iterator(), ", " ) ) );
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
        logger.debug( String.format( "Reading %s from %s", CONFIG_FILE, access ) );
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
      logger.debug( "auto-includes cleared." );
    }
  }

  public static void generateContext( final OutputStream out, HashMap<String, String> paramMap ) throws Exception {

    String solution = StringUtils.defaultIfEmpty( paramMap.get( Parameter.SOLUTION ), StringUtils.EMPTY );
    String path = StringUtils.defaultIfEmpty( paramMap.get( Parameter.PATH ), StringUtils.EMPTY );
    String file = StringUtils.defaultIfEmpty( paramMap.get( Parameter.FILE ), StringUtils.EMPTY );
    String action = StringUtils.defaultIfEmpty( paramMap.get( Parameter.ACTION ), StringUtils.EMPTY );
    // TODO: why does view default to action?
    String viewId = StringUtils.defaultIfEmpty( paramMap.get( Parameter.VIEW ), action );
    String fullPath = RepositoryHelper.joinPaths( solution, path, file );

    // old xcdf dashboards use solution + path + action
    if ( RepositoryHelper.getExtension( action ).equals( "xcdf" ) ) {
      fullPath = RepositoryHelper.joinPaths( fullPath, action );
    }

    String dashboardContext = ContextEngine.getInstance().getContext( fullPath, viewId, action, paramMap );

    if ( StringUtils.isEmpty( dashboardContext ) ) {
      logger.error( "empty dashboardContext" );
    }

    PluginIOUtils.writeOut( out, dashboardContext );
  }
}
