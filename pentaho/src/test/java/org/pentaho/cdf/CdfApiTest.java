/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

package org.pentaho.cdf;

import junit.framework.Assert;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import org.pentaho.platform.api.engine.IPentahoRequestContext;
import org.pentaho.platform.engine.core.system.PentahoRequestContextHolder;
import pt.webdetails.cpf.messaging.MockHttpServletRequest;
import pt.webdetails.cpf.messaging.MockHttpServletResponse;
import pt.webdetails.cpf.utils.CharsetHelper;

import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.util.HashMap;
import java.util.Map;

import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static org.mockito.Mockito.*;


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

  @Test
  public void getJSONSolution() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    cdfApi.getJSONSolution( SOLUTION, PATH, ACTION, DEPTH, SHOW_HIDDEN_FILES, MODE, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( cdfApi, times( 1 ) ).writeJSONSolution( PATH, DEPTH, SHOW_HIDDEN_FILES, MODE, servletResponse );
  }
  @Test
  public void testBuildFullServerUrl() throws Exception {
    CdfApi cdfApi = new CdfApi();
    IPentahoRequestContext requestContext = Mockito.mock( IPentahoRequestContext.class );
    Mockito.when( requestContext.getContextPath( ) ).thenReturn( "/rootContext" );
    PentahoRequestContextHolder.setRequestContext( requestContext );
    Assert.assertTrue( cdfApi.buildFullServerUrl( "HTTP/1.1", "localhost", 8080, true ).startsWith( "https://" ) );
    Assert.assertTrue( cdfApi.buildFullServerUrl( "HTTP/1.1", "localhost", 8080, false ).startsWith( "http://" ) );
  }
}
