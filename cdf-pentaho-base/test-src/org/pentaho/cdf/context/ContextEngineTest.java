package org.pentaho.cdf.context;

import junit.framework.TestCase;
import org.dom4j.Document;
import org.dom4j.Node;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.pentaho.cdf.context.autoinclude.AutoInclude;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.security.SecurityParameterProvider;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.api.IUserContentAccess;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static java.util.Arrays.asList;
import static junit.framework.Assert.assertEquals;
import static junit.framework.Assert.assertFalse;
import static junit.framework.Assert.assertTrue;
import static org.mockito.Mockito.*;


public class ContextEngineTest {

  ContextEngine contextEngine;


  @Before
  public void setUp() {
    contextEngine = spy( new ContextEngine(false) );
  }

  @Test
  public void buildContextTest() throws Exception {
    String path = "/public/admin/myDash.xcdf",
      username = "admin";
    int inactiveInterval = 1234;

    Document doc = mock( Document.class );
    doReturn( doc ).when( contextEngine ).getConfigFile();

    Locale locale = new Locale("EN");

    SecurityParameterProvider securityParams = mock( SecurityParameterProvider.class );
    List<String> roles = new ArrayList<String>( asList( "administrator", "master" ) );
    doReturn( roles ).when( securityParams ).getParameter( "principalRoles" );

    Map<String, String> params = new HashMap<String, String>(  );
    params.put( "paramTestParam1", "paramTestParam1" );
    params.put( "paramTestParam2", "paramTestParam2" );
    params.put( "paramTestParam3", "paramTestParam3" );

    JSONObject contextConfig = new JSONObject();
    doReturn( contextConfig ).when( contextEngine ).buildContextConfig( any( JSONObject.class ), eq( path ),
      eq( doc ), eq( username ) );
    doReturn( contextConfig ).when( contextEngine ).buildContextSessionTimeout( any( JSONObject.class ),
      eq( inactiveInterval ) );
    doReturn( contextConfig ).when( contextEngine ).buildContextDates( any( JSONObject.class ) );
    doReturn( locale ).when( contextEngine ).getLocale();
    doReturn( securityParams ).when( contextEngine ).getSecurityParams();
    doReturn( false ).when( contextEngine ).getLegacyStructure();

    JSONObject result = contextEngine.buildContext( path, username, params, inactiveInterval );

    assertTrue( result.has( "path" ) );
    assertEquals( result.get( "path" ), "/public/admin/myDash.xcdf" );
    assertTrue( result.has( "user" ) );
    assertEquals( result.get( "user" ), username );
    assertTrue( result.has( "locale" ) );
    assertEquals( result.get( "locale" ), new Locale( "EN" ) );
    assertTrue( result.has( "roles" ) );
    assertFalse( result.has( "solution" ) );
    assertFalse( result.has( "file" ) );
    assertTrue( result.has( "params" ) );

    doReturn( true ).when( contextEngine ).getLegacyStructure();
    result = contextEngine.buildContext( path, username, params, inactiveInterval );

    assertTrue( result.has( "solution" ) );
    assertTrue( result.has( "file" ) );
  }

  @Test
  public void buildContextConfigTest() throws Exception {
    String fullPath = "/public/admin/myDash.xcdf",
      user = "admin";
    Document config = mock( Document.class );

    JSONObject jsonObject1 = new JSONObject(  ),
      jsonObject2 = new JSONObject( "{}" ),
      jsonObject3 = new JSONObject( "{ user: 'admin'}" );

    doReturn( jsonObject2 ).when( contextEngine ).processAutoIncludes( fullPath, config );
    doReturn( jsonObject3 ).when( contextEngine ).processSessionAttributes( config, user );

    contextEngine.buildContextConfig( jsonObject1, fullPath, config, user );

    verify( contextEngine, times( 1 ) ).processAutoIncludes( fullPath, config );
    verify( contextEngine, times( 1 ) ).processSessionAttributes( config, user );
    assertTrue( jsonObject1.has( "queryData" ) );
    assertTrue( jsonObject1.has( "sessionAttributes" ) );
  }

  @Test
  public void processAutoIncludesTest() throws Exception {
    String fullPath = "/public/admin/myDash.xcdf";
    Document doc = mock( Document.class );

    doReturn( true ).when( contextEngine ).cdaExists();
    doReturn( "/public/cdf" ).when( contextEngine ).getPluginRepositoryDir();

    IReadAccess autoIncludesFolder = mock( IUserContentAccess.class );
    doReturn( true ).when( autoIncludesFolder ).fileExists( "/public/cdf/includes" );
    doReturn( autoIncludesFolder ).when( contextEngine ).getUserContentAccess( null );


    AutoInclude autoInclude1 = mock( AutoInclude.class );
    AutoInclude autoInclude2 = mock( AutoInclude.class );
    AutoInclude autoInclude3 = mock( AutoInclude.class );
    doReturn( true ).when( autoInclude1 ).canInclude( fullPath );
    doReturn( true ).when( autoInclude2 ).canInclude( fullPath );
    doReturn( true ).when( autoInclude3 ).canInclude( fullPath );
    doReturn( "/public/cdf/includes/myDash1.cda").when( autoInclude1 ).getCdaPath();
    doReturn( "/public/cdf/includes/myDash2.cda").when( autoInclude2 ).getCdaPath();
    doReturn( "/public/cdf/includes/myDash3.cda").when( autoInclude3 ).getCdaPath();
    List<AutoInclude> autoIncludeList = new ArrayList<AutoInclude>( asList(
      autoInclude1, autoInclude2, autoInclude3
    ) );
    doReturn( autoIncludeList ).when( contextEngine ).getAutoIncludes( doc );
    doNothing().when( contextEngine ).addCdaQuery( any( JSONObject.class), anyString() );

    contextEngine.processAutoIncludes( fullPath, doc );

    verify( contextEngine, times( 1 ) ).cdaExists();
    verify( autoIncludesFolder, times( 1 ) ).fileExists( "/public/cdf/includes" );
    verify( contextEngine, times( 3 ) ).addCdaQuery( any( JSONObject.class ), anyString() );
  }

  @Test
  public void getAutoIncludesTest() throws Exception {
    Document doc = mock( Document.class );
    IUserContentAccess readAccess = mock( IUserContentAccess.class );

    List<AutoInclude> autoIncludeList = new ArrayList<AutoInclude>();
    doReturn( autoIncludeList ).when( contextEngine ).buildAutoIncludeList( any( Document.class ),
      any( IReadAccess.class ) );
    doReturn( readAccess ).when( contextEngine ).getUserContentAccess( anyString() );
    doReturn( "/public/cdf" ).when( contextEngine ).getPluginRepositoryDir();

    contextEngine.getAutoIncludes( doc );
    verify( contextEngine, times( 1 ) ).getUserContentAccess( anyString() );
    verify( contextEngine, times( 1 ) ).buildAutoIncludeList( any( Document.class ), any( IReadAccess.class ) );

    contextEngine.getAutoIncludes( doc );
    verify( contextEngine, times( 1 ) ).getUserContentAccess( anyString() );
    verify( contextEngine, times( 1 ) ).buildAutoIncludeList( any( Document.class), any( IReadAccess.class ) );
  }

  @Test
  public void processSessionAttributesTest() throws Exception {
    Document doc = mock( Document.class );

    Node node = mock( Node.class );
    doReturn( "user" ).when( node ).getText();
    doReturn( node ).when( node ).selectSingleNode( "@name" );
    List<Node> nodeList = new ArrayList<Node>( asList( node ) );
    doReturn( nodeList ).when( doc ).selectNodes( "//sessionattributes/attribute" );

    JSONObject result = contextEngine.processSessionAttributes( doc, "admin" );

    assertTrue( result.has( "user" ) );
    assertEquals( result.get( "user" ), "admin" );
  }

  @Test
  public void buildContextSessionTimeoutTest() throws Exception {
    JSONObject jsonObject = new JSONObject(  );
    int inactiveInterval = 1234;

    IPentahoSession pentahoSession = mock( IPentahoSession.class );
    doReturn( true ).when( pentahoSession ).isAuthenticated();
    doReturn( pentahoSession ).when( contextEngine ).getUserSession();

    contextEngine.buildContextSessionTimeout( jsonObject, inactiveInterval );
    assertTrue( jsonObject.has( "sessionTimeout" ) );
    assertEquals( jsonObject.get( "sessionTimeout" ), 1234 );
  }

  @Test
  public void buildContextDatesTest() throws Exception {
    JSONObject jsonObject = new JSONObject(  );

    contextEngine.buildContextDates( jsonObject );

    assertTrue( jsonObject.has( "serverLocalDate" ) );
    assertTrue( jsonObject.has( "serverUTCDate" ) );
  }

  @Test
  public void buildContextPathsTest() throws Exception {
    JSONObject jsonObject = new JSONObject(  );
    String dashboardPath = "/public/admin/myDash.xcdf";

    Map<String, String> parameters = new HashMap<String, String>(  );
    parameters.put( "solution", "/public" );

    contextEngine.buildContextPaths( jsonObject, dashboardPath, parameters );

    assertTrue( jsonObject.has( "path" ) );
    assertEquals( jsonObject.get( "path" ), "/public/admin/myDash.xcdf" );
    assertTrue( jsonObject.has( "solution" ) );
    assertEquals( jsonObject.get( "solution" ), "/public" );
  }

  @Test
  public void buildLegacyStructureTest() throws Exception {
    JSONObject jsonObject = new JSONObject(  );
    String path = "/public/admin/myDash.xcdf";

    SecurityParameterProvider securityParams = mock( SecurityParameterProvider.class );
    doReturn( "" ).when( securityParams ).getParameter( "principalAdministrator" );

    contextEngine.buildLegacyStructure( jsonObject, path, securityParams );

    assertTrue( jsonObject.has( "fullPath" ) );
    assertEquals( jsonObject.get( "fullPath" ), "/public/admin/myDash.xcdf" );
    assertTrue( jsonObject.has( "solution" ) );
    assertEquals( jsonObject.get( "solution" ), "public" );
    assertTrue( jsonObject.has( "path" ) );
    assertEquals( jsonObject.get( "path" ), "admin" );
    assertTrue( jsonObject.has( "file" ) );
    assertEquals( jsonObject.get( "file" ), "myDash.xcdf" );
  }

  @Test
  public void buildContextParamsTest() throws Exception {
    JSONObject jsonObject = new JSONObject();
    Map<String, String> params = new HashMap<String, String>(  );
    params.put( "paramTestParam1", "paramTestParam1" );
    params.put( "paramTestParam2", "paramTestParam2" );
    params.put( "paramTestParam3", "paramTestParam3" );

    contextEngine.buildContextParams( jsonObject, params );

    assertTrue( jsonObject.has( "TestParam1" ) );
    assertTrue( jsonObject.has( "TestParam2" ) );
    assertTrue( jsonObject.has( "TestParam3" ) );
  }
}
