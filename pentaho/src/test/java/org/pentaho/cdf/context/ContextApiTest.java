/*!
 * Copyright 2002 - 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
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

package org.pentaho.cdf.context;

import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static org.mockito.Mockito.*;

import junit.framework.Assert;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import pt.webdetails.cpf.messaging.MockHttpServletRequest;
import pt.webdetails.cpf.messaging.MockHttpServletResponse;
import pt.webdetails.cpf.utils.CharsetHelper;

import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.util.HashMap;
import java.util.Map;

public class ContextApiTest {
  private static final String PATH = "fakePath";
  private static final String USER = "fakeUserName";
  private static final String VIEW = "fakeViewName";
  private ContextApi contextApi;
  private MockHttpServletRequest servletRequest;
  private MockHttpServletResponse servletResponse;

  @Before
  public void setUp() throws Exception {
    contextApi = spy( new ContextApiForTests() );
    servletRequest = new MockHttpServletRequest( "/pentaho-cdf/api/context", (Map) new HashMap<String, String[]>() );
    servletResponse = new MockHttpServletResponse( new ObjectOutputStream( new ByteArrayOutputStream() ) );
    servletResponse.setContentType( null );
    servletResponse.setCharacterEncoding( null );
  }

  @After
  public void tearDown() {
    contextApi = null;
    servletRequest = null;
    servletResponse = null;
  }

  @Test
  public void getTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    contextApi.get( PATH, USER, servletRequest, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( contextApi, times( 1 ) ).buildContext( PATH, USER, servletRequest );
  }

  @Test
  public void getConfigTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    contextApi.getConfig( PATH, VIEW, servletRequest, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( contextApi, times( 1 ) ).writeConfig( PATH, servletRequest );
  }
}
