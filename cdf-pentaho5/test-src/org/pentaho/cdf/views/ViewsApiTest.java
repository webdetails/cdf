/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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

package org.pentaho.cdf.views;

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

public class ViewsApiTest {
  private static final String NAME = "fake";
  private static final String VIEW = "fake";
  private ViewsApi viewsApi;
  private MockHttpServletRequest servletRequest;
  private MockHttpServletResponse servletResponse;

  @Before
  public void setUp() throws Exception {
    viewsApi = spy( new ViewsApiForTests() );
    servletRequest = new MockHttpServletRequest( "/pentaho-cdf/api/views", (Map)new HashMap<String, String[]>() );
    servletResponse = new MockHttpServletResponse( new ObjectOutputStream( new ByteArrayOutputStream() ) );
    servletResponse.setContentType( null );
    servletResponse.setCharacterEncoding( null );
  }

  @After
  public void tearDown() {
    viewsApi = null;
    servletRequest = null;
    servletResponse = null;
  }

  @Test
  public void listViewsTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    viewsApi.listViews( servletRequest, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( viewsApi, times(1)).listViews( servletResponse );
  }

  @Test
  public void listTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    viewsApi.saveView( NAME, VIEW, servletRequest, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( viewsApi, times(1)).saveView( NAME, VIEW, servletResponse );
  }

  @Test
  public void archiveTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    viewsApi.deleteView( NAME, servletRequest, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( viewsApi, times(1)).deleteView( NAME, servletResponse );
  }

  @Test
  public void deleteTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    viewsApi.getView( NAME, servletRequest, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( viewsApi, times(1)).getView( NAME, servletResponse );
  }
}
