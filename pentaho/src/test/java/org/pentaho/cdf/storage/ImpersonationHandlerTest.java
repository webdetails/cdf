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


package org.pentaho.cdf.storage;

import org.junit.Test;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.ISecurityHelper;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.security.SecurityHelper;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class ImpersonationHandlerTest {
  @Test
  public void getUserNameTest() throws Exception {
    IPentahoSession thisUserSession = mock( IPentahoSession.class );
    when( thisUserSession.getName() ).thenReturn( "user" );

    IPentahoSession adminUserSession = mock( IPentahoSession.class );
    when( adminUserSession.getName() ).thenReturn( "admin" );

    IPentahoSession otherUserSession = mock( IPentahoSession.class );
    when( otherUserSession.getName() ).thenReturn( "other" );

    ISecurityHelper security = mock( ISecurityHelper.class );
    when( security.isPentahoAdministrator( adminUserSession ) ).thenReturn( true );
    SecurityHelper.setMockInstance( security );

    PentahoSessionHolder.setSession( thisUserSession );
    assertEquals( "user", ImpersonationHandler.getUserName( "user" ) );

    PentahoSessionHolder.setSession( adminUserSession );
    assertEquals( "impersonat", ImpersonationHandler.getUserName( "impersonat" ) );

    PentahoSessionHolder.setSession( otherUserSession );
    assertEquals( "other", ImpersonationHandler.getUserName( "user" ) );

    PentahoSessionHolder.setSession( null );
    boolean gotException = false;
    try {
      assertEquals( "other", ImpersonationHandler.getUserName( "user" ) );
    } catch ( ImpersonationHandler.CdfStorageApiImpersonationException e ) {
      gotException = true;
    }

    assertTrue( gotException );
  }
}
