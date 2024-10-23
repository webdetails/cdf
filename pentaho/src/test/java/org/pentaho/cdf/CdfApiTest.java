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

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.pentaho.platform.api.engine.IPentahoRequestContext;
import org.pentaho.platform.engine.core.system.PentahoRequestContextHolder;
import pt.webdetails.cpf.messaging.MockHttpServletRequest;
import pt.webdetails.cpf.messaging.MockHttpServletResponse;
import pt.webdetails.cpf.utils.CharsetHelper;

import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.util.HashMap;
import java.util.Map;

import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON_TYPE;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;


public class CdfApiTest {
  private static final String SOLUTION = "";
  private static final String PATH = "fake";
  private static final String ACTION = "";
  private static final int DEPTH = 0;
  private static final boolean SHOW_HIDDEN_FILES = false;
  private static final String MODE = "fake";
  private CdfApi cdfApi;
  private MockHttpServletRequest servletRequest;
  private MockHttpServletResponse servletResponse;

  @Before
  public void setUp() throws Exception {
    cdfApi = spy( new CdfApiForTests() );
    servletRequest = new MockHttpServletRequest( "/pentaho-cdf/api/context", (Map) new HashMap<String, String[]>() );
    servletResponse = new MockHttpServletResponse( new ObjectOutputStream( new ByteArrayOutputStream() ) );
    servletResponse.setContentType( null );
    servletResponse.setCharacterEncoding( null );
  }

  @After
  public void tearDown() {
    cdfApi = null;
    servletRequest = null;
    servletResponse = null;
  }

  private MediaType getResponseContentType( Response response ) {
    return (MediaType) response.getMetadata().getFirst( HttpHeaders.CONTENT_TYPE );
  }

  @Test
  public void getJSONSolution() throws Exception {
    Map<String, String> mtParameters = new HashMap<>();
    mtParameters.put( "charset", CharsetHelper.getEncoding() );

    MediaType expectedMediaType = new MediaType( APPLICATION_JSON_TYPE.getType(), APPLICATION_JSON_TYPE.getSubtype(), mtParameters );

    Response response = cdfApi.getJSONSolution( SOLUTION, PATH, ACTION, DEPTH, SHOW_HIDDEN_FILES, MODE );

    MediaType actualMediaType = getResponseContentType( response );
    assertEquals( expectedMediaType, actualMediaType );

    verify( cdfApi, times( 1 ) ).writeJSONSolution( PATH, DEPTH, SHOW_HIDDEN_FILES, MODE );
  }

  @Test
  public void testBuildFullServerUrl() throws Exception {
    IPentahoRequestContext requestContext = mock( IPentahoRequestContext.class );
    when( requestContext.getContextPath( ) ).thenReturn( "/foobar" );

    PentahoRequestContextHolder.setRequestContext( requestContext );
    CdfApi cdf = new CdfApi();

    assertEquals( "http://my.domain.com/foobar",
      cdf.buildFullServerUrl( "HTTP/1.1", "my.domain.com", 80, false ) );
    assertEquals( "http://my.domain.com:8080/foobar",
      cdf.buildFullServerUrl( "HTTP/1.1", "my.domain.com", 8080, false ) );
    assertEquals( "http://my.domain.com:8088/foobar",
      cdf.buildFullServerUrl( "HTTP/1.1", "my.domain.com", 8088, false ) );

    assertEquals( "https://my.domain.com/foobar",
      cdf.buildFullServerUrl( "HTTP/1.1", "my.domain.com", 443, true ) );
    assertEquals( "https://my.domain.com:8443/foobar",
      cdf.buildFullServerUrl( "HTTP/1.1", "my.domain.com", 8443, true ) );
    assertEquals( "https://my.domain.com:8443/foobar",
      cdf.buildFullServerUrl( "HTTP/1.1", "my.domain.com", 8443, true ) );
  }
}
