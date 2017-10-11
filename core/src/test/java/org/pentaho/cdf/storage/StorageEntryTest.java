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
