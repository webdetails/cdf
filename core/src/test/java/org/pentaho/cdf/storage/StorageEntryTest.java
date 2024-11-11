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

import junit.framework.TestCase;
import org.junit.Before;
import org.junit.Test;

import java.util.Date;

public class StorageEntryTest extends TestCase {
  StorageEntry storageEntry;

  @Before
  public void setUp() {
    storageEntry = new StorageEntry();
  }

  @Test
  public void testConstructorWithParames() throws Exception {
    StorageEntry storageEntryWithParams = new StorageEntry( "user", "storageValue" );
    assertEquals( "user", storageEntryWithParams.getUser() );
    assertEquals( "storageValue", storageEntryWithParams.getStorageValue() );
  }

  @Test
  public void testSetStorageId() throws Exception {
    assertEquals( 0, storageEntry.getStorageId() );
    storageEntry.setStorageId( 1 );
    assertEquals( 1, storageEntry.getStorageId() );
  }

  @Test
  public void testSetUser() throws Exception {
    assertNull( storageEntry.getUser() );
    storageEntry.setUser( "user" );
    assertEquals( "user", storageEntry.getUser() );
  }

  @Test
  public void testSetStorageValue() throws Exception {
    assertNull( storageEntry.getStorageValue() );
    storageEntry.setStorageValue( "storageValue" );
    assertEquals( "storageValue", storageEntry.getStorageValue() );
  }

  @Test
  public void testSetLastUpdatedDate() throws Exception {
    Date date = new Date();
    storageEntry.setLastUpdatedDate( date );
    assertEquals( date, storageEntry.getLastUpdatedDate() );
  }
}
