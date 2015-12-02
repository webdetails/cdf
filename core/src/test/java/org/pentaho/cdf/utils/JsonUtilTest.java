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

package org.pentaho.cdf.utils;

import junit.framework.TestCase;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;

public class JsonUtilTest extends TestCase {
  @Test
  public void testMakeJsonErrorResponse() throws Exception {
    JSONObject json = JsonUtil.makeJsonErrorResponse( "error message", true );
    assertNotNull( json );
    assertEquals( 2, json.length() );
    assertEquals( "error message", json.get( "message" ) );
    assertEquals( "error", json.get( "status" ) );
  }
  @Test
  public void testMakeJsonErrorResponseEmpty() throws Exception {
    JSONObject json = JsonUtil.makeJsonErrorResponse( "", false );
    assertNotNull( json );
    assertEquals( 1, json.length() );
    assertEquals( "error", json.get( "status" ) );
  }

  @Test
  public void testMakeJsonSuccessResponseNull() throws Exception {
    JSONObject json = JsonUtil.makeJsonSuccessResponse( null );
    assertNotNull( json );
    assertEquals( 0, json.length() );
    assertEquals( "{}", json.toString() );
  }

  @Test
  public void testMakeJsonSuccessResponseString() throws Exception {
    JSONObject json =
      JsonUtil.makeJsonSuccessResponse( "{\"field 1\": \"value for field 1\", \"field 2\": \"value for field 2\"}" );
    assertNotNull( json );
    assertEquals( 2, json.length() );
    assertEquals( "value for field 1", json.get( "field 1" ) );
    assertEquals( "value for field 2", json.get( "field 2" ) );
  }

  @Test
  public void testMakeJsonSuccessResponseObject() throws Exception {
    String jsonString = "{\"field 1\":\"value for field 1\",\"field 2\":\"value for field 2\"}";
    JSONObject obj = new JSONObject( jsonString );
    JSONObject json = JsonUtil.makeJsonSuccessResponse( obj );
    assertNotNull( json );
    assertEquals( 2, json.length() );
    assertNotNull( json.get( "status" ) );
    assertNotNull( json.get( "result" ) );
    assertEquals( "success", json.get( "status" ) );
    assertEquals( jsonString, json.get( "result" ).toString() );
  }

  @Test
  public void testMakeJsonSuccessResponseException() throws Exception {
    try {
      JsonUtil.makeJsonSuccessResponse( "{\"field 1\": }" );
    } catch (JSONException ex ) {
      assertTrue( true );
    }
  }

  @Test
  public void testIsSuccessResponse() throws Exception {
    String json = "{\"status\":\"success\"}";
    JSONObject jsonObject = new JSONObject( json );
    assertTrue( JsonUtil.isSuccessResponse( jsonObject ) );
  }

  @Test
  public void testIsSuccessResponseNull() throws Exception {
    assertFalse( JsonUtil.isSuccessResponse( null ) );
  }
}
