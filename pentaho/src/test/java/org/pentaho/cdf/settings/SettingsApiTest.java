/*!
 * Copyright 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
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

package org.pentaho.cdf.settings;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.Mock;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.powermock.reflect.Whitebox;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.Response;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.powermock.api.mockito.PowerMockito.when;

@RunWith( PowerMockRunner.class )
@PrepareForTest( { SettingsEngine.class, PentahoSessionHolder.class, CorsUtil.class } )
public class SettingsApiTest {
  @Mock
  SettingsEngine fakeSettingsEngineSingleton;

  @Mock
  CorsUtil fakeCorsUtilSingleton;

  @Mock
  HttpServletRequest servletRequest;

  @Mock
  HttpServletResponse servletResponse;


  @Before
  public void prepareMocks() {
    Whitebox.setInternalState( SettingsEngine.class, "cdfSettings", fakeSettingsEngineSingleton );
    Whitebox.setInternalState( CorsUtil.class, "instance", fakeCorsUtilSingleton );
    PowerMockito.mockStatic( PentahoSessionHolder.class );
    when( PentahoSessionHolder.getSession() ).thenReturn( null );
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
