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


package org.pentaho.cdf.comments;

import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON;
import static org.mockito.Mockito.*;

import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.util.HashMap;
import java.util.Map;
import junit.framework.Assert;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import pt.webdetails.cpf.messaging.MockHttpServletRequest;
import pt.webdetails.cpf.messaging.MockHttpServletResponse;
import pt.webdetails.cpf.utils.CharsetHelper;


public class CommentsApiTest {
  private static final String PAGE = "generic";
  private static final String COMMENT = "test";
  private CommentsApi commentsApi;
  private MockHttpServletRequest servletRequest;
  private MockHttpServletResponse servletResponse;

  @Before
  public void setUp() throws Exception {
    commentsApi = spy( new CommentsApiForTests() );
    servletRequest = new MockHttpServletRequest( "/pentaho-cdf/api/comments", (Map) new HashMap<String, String[]>() );
    servletResponse = new MockHttpServletResponse( new ObjectOutputStream( new ByteArrayOutputStream() ) );
    servletResponse.setContentType( null );
    servletResponse.setCharacterEncoding( null );
  }

  @After
  public void tearDown() {
    commentsApi = null;
    servletRequest = null;
    servletResponse = null;
  }

  @Test
  public void addTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    commentsApi.add( PAGE, COMMENT, servletResponse, servletRequest );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( commentsApi, times( 1 ) ).addComment( PAGE, COMMENT );
  }

  @Test
  public void listTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    commentsApi.list( PAGE, 0, 100, false/*deleted*/, false/*archived*/, servletResponse, servletRequest );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( commentsApi, times( 1 ) ).listComments( PAGE, 0, 100, false/*deleted*/, false/*archived*/ );
  }

  @Test
  public void archiveTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    commentsApi.archive( 1, false/*value*/, servletResponse, servletRequest );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( commentsApi, times( 1 ) ).archiveComment( 1, false/*value*/ );
  }

  @Test
  public void deleteTest() throws Exception {
    Assert.assertEquals( servletResponse.getContentType(), null );
    Assert.assertEquals( servletResponse.getCharacterEncoding(), null );

    commentsApi.delete( 1, false/*value*/, servletResponse, servletRequest );

    Assert.assertTrue( servletResponse.getContentType().equals( APPLICATION_JSON ) );
    Assert.assertTrue( servletResponse.getCharacterEncoding().equals( CharsetHelper.getEncoding() ) );
    verify( commentsApi, times( 1 ) ).deleteComment( 1, false/*value*/ );
  }
}
