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


package org.pentaho.cdf.settings;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.MockitoAnnotations;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.core.Response;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.test.util.ReflectionTestUtils;


public class SettingsApiTest {
  private MockedStatic<PentahoSessionHolder> pentahoSessionHolderMockedStatic;

  private static SettingsEngine fakeSettingsEngineSingleton;

  private static CorsUtil fakeCorsUtilSingleton;

  private static HttpServletRequest servletRequest;

  private static HttpServletResponse servletResponse;


  @Before
  public void prepareMocks() {
    fakeSettingsEngineSingleton = mock( SettingsEngine.class );
    fakeCorsUtilSingleton = mock( CorsUtil.class );
    servletRequest = mock( HttpServletRequest.class );
    servletResponse = mock( HttpServletResponse.class );
    ReflectionTestUtils.setField( SettingsEngine.class, "cdfSettings", fakeSettingsEngineSingleton );
    ReflectionTestUtils.setField( CorsUtil.class, "instance", fakeCorsUtilSingleton );
    pentahoSessionHolderMockedStatic = mockStatic( PentahoSessionHolder.class );
    when( PentahoSessionHolder.getSession() ).thenReturn( null );
  }

  @After
  public void afterEach() {
    pentahoSessionHolderMockedStatic.close();
  }

  private void verifyNumberOfCallsToSetValueWithKeyValue( String key, String value, int numberOfTimes ) {
    SettingsApi settings = new SettingsApi();

    settings.set( key, value );

    verify( fakeSettingsEngineSingleton, times( numberOfTimes ) ).setValue( key, value, null );
  }

  private void assertSetValueNotCalledWithKeyValue( String key, String value ) {
    verifyNumberOfCallsToSetValueWithKeyValue( key, value, 0 );
  }

  private void assertSetValueCalledWithKeyValue( String key, String value ) {
    verifyNumberOfCallsToSetValueWithKeyValue( key, value, 1 );
  }

  @Test
  public void testSetValueCallsSettingEngine() {
    final String key = "potato";
    final String value = "nice";

    assertSetValueCalledWithKeyValue( key, value );
  }

  @Test
  public void testSetNotCalledOnEmptyKey() {
    final String key = null;
    final String value = "nice";

    assertSetValueNotCalledWithKeyValue( key, value );
  }

  @Test
  public void testSetNotCalledOnEmptyValue() {
    final String key = "potato";
    final String value = null;

    assertSetValueNotCalledWithKeyValue( key, value );
  }

  private void assertSetCorsHeadersCalled() {
    verify( fakeCorsUtilSingleton, times( 1 ) ).setCorsHeaders( servletRequest, servletResponse );
  }

  @Test
  public void testGetReturnsBadRequestOnEmptyKey() {

    SettingsApi settings = new SettingsApi();

    Response response = settings.get( null, servletRequest, servletResponse );

    assertEquals( Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus() );
    verify( fakeSettingsEngineSingleton, never() ).getValue( null, null );
    assertSetCorsHeadersCalled();
  }

  @Test
  public void testGetReturnsNotFoundOnUnknownKey() {
    final String key = "unknown";

    when( fakeSettingsEngineSingleton.getValue( key, null ) ).thenReturn( null );

    SettingsApi settings = new SettingsApi();

    Response response = settings.get( key, servletRequest, servletResponse );

    assertEquals( Response.Status.NOT_FOUND.getStatusCode(), response.getStatus() );
    verify( fakeSettingsEngineSingleton, times( 1 ) ).getValue( key, null );
    assertSetCorsHeadersCalled();
  }

  @Test
  public void testGetReturnsValueOnKnownKey() {
    final String key = "known";
    final String value = "value";

    when( fakeSettingsEngineSingleton.getValue( key, null ) ).thenReturn( value );

    SettingsApi settings = new SettingsApi();

    Response response = settings.get( key, servletRequest, servletResponse );

    assertEquals( Response.Status.OK.getStatusCode(), response.getStatus() );
    verify( fakeSettingsEngineSingleton, times( 1 ) ).getValue( key, null );
    assertEquals( value, response.getEntity() );
    assertSetCorsHeadersCalled();
  }
}
