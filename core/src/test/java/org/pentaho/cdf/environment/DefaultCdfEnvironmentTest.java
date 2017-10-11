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

package org.pentaho.cdf.environment;

import junit.framework.TestCase;
import org.junit.Before;
import org.junit.Test;

import static org.mockito.Mockito.*;

public class DefaultCdfEnvironmentTest extends TestCase {
  DefaultCdfEnvironment environment;

  @Before
  public void setUp() {
    environment = mock( DefaultCdfEnvironment.class );
  }

  @Test
  public void testGetPluginRepositoryDir() throws Exception {
    when( environment.getPluginRepositoryDir()).thenCallRealMethod();
    assertEquals( "cdf", environment.getPluginRepositoryDir() );
  }

  @Test
  public void testGetPluginId() throws Exception {
    when( environment.getPluginId()).thenCallRealMethod();
    assertEquals( "pentaho-cdf", environment.getPluginId() );
  }

  @Test
  public void testGetSystemDir() throws Exception {
    when( environment.getSystemDir()).thenCallRealMethod();
    assertEquals( "system", environment.getSystemDir() );
  }

  @Test
  public void testGetApplicationBaseContentUrl() throws Exception {
    when( environment.getApplicationBaseContentUrl()).thenCallRealMethod();
    assertEquals( "/content/", environment.getApplicationBaseContentUrl() );
  }

  @Test
  public void testGetRepositoryBaseContentUrl() throws Exception {
    when( environment.getRepositoryBaseContentUrl()).thenCallRealMethod();
    assertEquals( "/content/res/", environment.getRepositoryBaseContentUrl() );
  }
}


