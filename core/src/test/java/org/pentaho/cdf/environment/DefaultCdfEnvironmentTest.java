/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

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


