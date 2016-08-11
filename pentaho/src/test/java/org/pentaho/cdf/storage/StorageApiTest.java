/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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

package org.pentaho.cdf.storage;

import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.anyObject;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;

import org.junit.Assert;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.ISecurityHelper;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.security.SecurityHelper;

import pt.webdetails.cpf.messaging.MockHttpServletRequest;
import pt.webdetails.cpf.messaging.MockHttpServletResponse;
import pt.webdetails.cpf.utils.CharsetHelper;

import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.util.HashMap;

import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.Response;

public class StorageApiTest {
  private static final String STORAGE_VALUE = "fake";
  private static final String USER = "fake";

  private static final JSONObject dummy = mock( JSONObject.class );

  private StorageApi storageApi;
  private MockHttpServletRequest servletRequest;
  private MockHttpServletResponse servletResponse;

  private StorageApi testee;
  StorageEngineInterface se;

  @Before
  public void setUp() throws Exception {
    storageApi = spy( new StorageApiForTests() );
    servletRequest = new MockHttpServletRequest( "/pentaho-cdf/api/storage", new HashMap<String, String[]>() );
    servletResponse = new MockHttpServletResponse( new ObjectOutputStream( new ByteArrayOutputStream() ) );
    servletResponse.setContentType( null );
    servletResponse.setCharacterEncoding( null );

    se = mock( StorageEngineInterface.class );
    when( se.delete( anyString() ) ).thenReturn( dummy );
    when( se.read( anyString() ) ).thenReturn( dummy );
    when( se.store( anyString(), anyString() ) ).thenReturn( dummy );

    StorageEngine.setMockInstance( se );
    testee = spy( new StorageApi() );
    doNothing().when( testee ).setCorsHeaders( anyObject(), anyObject() );
  }

  @After
  public void tearDown() {
    storageApi = null;
    servletRequest = null;
    servletResponse = null;
    StorageEngine.setMockInstance( null );
  }

  @Test
  public void storeTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    storageApi.store( STORAGE_VALUE, USER, servletRequest, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( storageApi, times( 1 ) ).store( STORAGE_VALUE, USER );
  }

  @Test
  public void readTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    storageApi.read( USER, servletRequest, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( storageApi, times( 1 ) ).read( USER );
  }

  @Test
  public void deleteTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    storageApi.delete( USER, servletRequest, servletResponse );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( storageApi, times( 1 ) ).delete( USER );
  }

  @Test
  public void testImpersonationSameUser() throws Exception {
    IPentahoSession thisUserSession = mock( IPentahoSession.class );
    when( thisUserSession.getName() ).thenReturn( "user" );

    PentahoSessionHolder.setSession( thisUserSession );
    testee.read( "user", servletRequest, servletResponse );
    verify( se ).read( "user" );

    testee.delete( "user", servletRequest, servletResponse );
    verify( se ).delete( "user" );

    testee.store( "value", "user", servletRequest, servletResponse );
    verify( se ).store( anyString(), eq( "user" ) );
  }

  @Test
  public void testImpersonationAdminSession() throws Exception {
    IPentahoSession adminUserSession = mock( IPentahoSession.class );
    when( adminUserSession.getName() ).thenReturn( "admin" );

    ISecurityHelper security = mock( ISecurityHelper.class );
    when( security.isPentahoAdministrator( adminUserSession ) ).thenReturn( true );
    SecurityHelper.setMockInstance( security );

    PentahoSessionHolder.setSession( adminUserSession );
    testee.read( "user", servletRequest, servletResponse );
    verify( se ).read( "user" );

    testee.delete( "user", servletRequest, servletResponse );
    verify( se ).delete( "user" );

    testee.store( "value", "user", servletRequest, servletResponse );
    verify( se ).store( anyString(), eq( "user" ) );
  }

  @Test
  public void testImpersonationOtherUser() throws Exception {
    IPentahoSession otherUserSession = mock( IPentahoSession.class );
    when( otherUserSession.getName() ).thenReturn( "other" );

    ISecurityHelper security = mock( ISecurityHelper.class );
    when( security.isPentahoAdministrator( otherUserSession ) ).thenReturn( false );
    SecurityHelper.setMockInstance( security );

    PentahoSessionHolder.setSession( otherUserSession );
    testee.read( "user", servletRequest, servletResponse );
    verify( se ).read( "other" );

    testee.delete( "user", servletRequest, servletResponse );
    verify( se ).delete( "other" );

    testee.store( "value", "user", servletRequest, servletResponse );
    verify( se ).store( anyString(), eq( "other" ) );
  }

  @Test
  public void testImpersonationNoUser() throws Exception {
    PentahoSessionHolder.setSession( null );

    HttpServletResponse resp = spy( servletResponse );
    Assert.assertNull( testee.read( "user", servletRequest, resp ) );
    verify( resp ).sendError( eq( HttpServletResponse.SC_FORBIDDEN ), anyString() );

    Response response = testee.delete( "user", servletRequest, servletResponse );
    Assert.assertEquals( Response.Status.FORBIDDEN.getStatusCode(), response.getStatus() );

    response = testee.store( "value", "user", servletRequest, servletResponse );
    Assert.assertEquals( Response.Status.FORBIDDEN.getStatusCode(), response.getStatus() );
  }
}
