package org.pentaho.cdf.render;

import junit.framework.TestCase;
import org.dom4j.Document;
import org.dom4j.Node;
import org.junit.Before;
import org.junit.Test;
import org.pentaho.cdf.InvalidCdfOperationException;
import pt.webdetails.cpf.repository.api.FileAccess;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IUserContentAccess;

import static org.mockito.Mockito.*;

public class XcdfRendererTest extends TestCase {

  private static final String NODE_TEMPLATE = "/cdf/template";
  private static final String NODE_MESSAGES = "/cdf/messages";
  private static final String NODE_STYLES = "/cdf/style";
  private static final String NODE_REQUIRE = "/cdf/require";

  XcdfRenderer xcdfRenderer;

  @Before
  public void setUp() {
    xcdfRenderer = spy( new XcdfRenderer() );
  }

  @Test
  public void testDetermineDashboardTemplating() throws Exception{
    String dashboardPath = "/public/admin/myDash.xcdf",
      defaultTemplate = "mantle";

    String template = "myTemplate",
      messages = "myMessage",
      style = "myStyle";

    IBasicFile file = mock( IBasicFile.class );
    Node simpleNode = mock( Node.class );

    IUserContentAccess userContentAccess = mock( IUserContentAccess.class );
    doReturn( true ).when( userContentAccess ).fileExists( dashboardPath );
    doReturn( true ).when( userContentAccess ).hasAccess( dashboardPath, FileAccess.EXECUTE );
    doReturn( file ).when( userContentAccess ).fetchFile( dashboardPath );
    doReturn( userContentAccess ).when( xcdfRenderer ).getUserContentAccess( null );

    Document doc = mock( Document.class );
    doReturn( simpleNode ).when( doc ).selectSingleNode( NODE_TEMPLATE );
    doReturn( simpleNode ).when( doc ).selectSingleNode( NODE_MESSAGES );
    doReturn( simpleNode ).when( doc ).selectSingleNode( NODE_STYLES );
    doReturn( doc ).when( xcdfRenderer ).getDocument( file );

    doReturn( template ).when( xcdfRenderer ).getNodeText( NODE_TEMPLATE, doc, "" );
    doReturn( messages ).when( xcdfRenderer ).getNodeText( NODE_MESSAGES, doc );
    doReturn( style ).when( xcdfRenderer ).getNodeText( NODE_STYLES, doc );

    xcdfRenderer.determineDashboardTemplating( dashboardPath, defaultTemplate );
    assertEquals( xcdfRenderer.getTemplate(), template );
    assertEquals( xcdfRenderer.getMessagesBaseFilename(), messages );
    assertEquals( xcdfRenderer.getStyle(), style );

    xcdfRenderer.determineDashboardTemplating( "public", "admin", "myDash.xcdf", defaultTemplate );
    assertEquals( xcdfRenderer.getTemplate(), template );
    assertEquals( xcdfRenderer.getMessagesBaseFilename(), messages );
    assertEquals( xcdfRenderer.getStyle(), style );

    verify( userContentAccess, times( 2 ) ).fileExists( dashboardPath );
    verify( userContentAccess, times( 2 ) ).hasAccess( dashboardPath, FileAccess.EXECUTE );
  }

  @Test
  public void testDetermineDashboardTemplatingException() throws Exception {
    String dashboardPath = "/public/admin/myDash.xcdf",
      defaultTemplate = "mantle";

    IUserContentAccess userContentAccess = mock( IUserContentAccess.class );
    doReturn( false ).when( userContentAccess ).fileExists( dashboardPath );
    doReturn( userContentAccess ).when( xcdfRenderer ).getUserContentAccess( null );

    assertFalse( xcdfRenderer.determineDashboardTemplating( dashboardPath, defaultTemplate ) );

    doReturn( true ).when( userContentAccess ).fileExists( dashboardPath );
    doReturn( false ).when( userContentAccess ).hasAccess( dashboardPath, FileAccess.EXECUTE );
    try {
      assertFalse( xcdfRenderer.determineDashboardTemplating( dashboardPath, defaultTemplate ) );
      fail();
    } catch ( InvalidCdfOperationException e ) {
      // Expected
    }

    verify( userContentAccess, times( 2 ) ).fileExists( dashboardPath );
    verify( userContentAccess, times( 1 ) ).hasAccess( dashboardPath, FileAccess.EXECUTE );
  }

  @Test
  public void testDetermineRequireDashboard() throws Exception {
    String dashboardPath = "/public/admin/myDash.xcdf";

    IBasicFile file = mock( IBasicFile.class );
    Node simpleNode = mock( Node.class );

    IUserContentAccess userContentAccess = mock( IUserContentAccess.class );
    doReturn( true ).when( userContentAccess ).fileExists( dashboardPath );
    doReturn( true ).when( userContentAccess ).hasAccess( dashboardPath, FileAccess.EXECUTE );
    doReturn( file ).when( userContentAccess ).fetchFile( dashboardPath );
    doReturn( userContentAccess ).when( xcdfRenderer ).getUserContentAccess( null );

    Document doc = mock( Document.class );
    doReturn( simpleNode ).when( doc ).selectSingleNode( NODE_REQUIRE );
    doReturn( doc ).when( xcdfRenderer ).getDocument( file );

    doReturn( "true" ).when( xcdfRenderer ).getNodeText( NODE_REQUIRE, doc, "false" );

    xcdfRenderer.determineRequireDashboard( dashboardPath );
    assertEquals( xcdfRenderer.getIsRequire(), true );

    xcdfRenderer.determineRequireDashboard( "public", "admin", "myDash.xcdf" );
    assertEquals( xcdfRenderer.getIsRequire(), true );

    verify( userContentAccess, times( 2 ) ).fileExists( dashboardPath );
    verify( userContentAccess, times( 2 ) ).hasAccess( dashboardPath, FileAccess.EXECUTE );
  }


  @Test
  public void testDetermineRequireDashboardException() throws Exception {
    String dashboardPath = "/public/admin/myDash.xcdf";

    IUserContentAccess userContentAccess = mock( IUserContentAccess.class );
    doReturn( false ).when( userContentAccess ).fileExists( dashboardPath );
    doReturn( userContentAccess ).when( xcdfRenderer ).getUserContentAccess( null );

    assertFalse( xcdfRenderer.determineRequireDashboard( dashboardPath ) );

    doReturn( true ).when( userContentAccess ).fileExists( dashboardPath );
    doReturn( false ).when( userContentAccess ).hasAccess( dashboardPath, FileAccess.EXECUTE );
    try {
      assertFalse( xcdfRenderer.determineRequireDashboard( dashboardPath ) );
      fail();
    } catch ( InvalidCdfOperationException e ) {
      // Expected
    }

    verify( userContentAccess, times( 2 ) ).fileExists( dashboardPath );
    verify( userContentAccess, times( 1 ) ).hasAccess( dashboardPath, FileAccess.EXECUTE );
  }
}
