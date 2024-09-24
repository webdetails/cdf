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

package org.pentaho.cdf.comments;

import junit.framework.TestCase;
import org.junit.Before;
import org.junit.Test;

import java.util.Date;

public class CommentEntryTest extends TestCase {
  CommentEntry commentEntry;

  @Before
  public void setUp() {
    commentEntry = new CommentEntry();
  }

  @Test
  public void testCreateWithArguments() throws Exception {
    CommentEntry entry = new CommentEntry( "page", "user", "comment" );
    assertEquals( "page", entry.getPage() );
    assertEquals( "user", entry.getUser() );
    assertEquals( "comment", entry.getComment() );
  }

  @Test
  public void testSetCommentId() throws Exception {
    assertEquals( 0, commentEntry.getCommentId() );
    commentEntry.setCommentId( 3 );
    assertEquals( 3, commentEntry.getCommentId() );
  }

  @Test
  public void testSetPage() throws Exception {
    assertNull( commentEntry.getPage() );
    commentEntry.setPage( "page" );
    assertEquals( "page", commentEntry.getPage() );
  }

  @Test
  public void testSetUser() throws Exception {
    assertNull( commentEntry.getUser() );
    commentEntry.setUser( "user" );
    assertEquals( "user", commentEntry.getUser() );
  }

  @Test
  public void testSetComment() throws Exception {
    assertNull( commentEntry.getComment() );
    commentEntry.setComment( "comment" );
    assertEquals( "comment", commentEntry.getComment() );
  }

  @Test
  public void testSetDeleted() throws Exception {
    assertFalse( commentEntry.isDeleted() );
    commentEntry.setDeleted( true );
    assertTrue( commentEntry.isDeleted() );
  }

  @Test
  public void testSetArchivd() throws Exception {
    assertFalse( commentEntry.isArchived() );
    commentEntry.setArchived( true );
    assertTrue( commentEntry.isArchived() );
  }

  @Test
  public void testSetCreatedDate() throws Exception {
    Date date = new Date( 2015, 01, 01 );
    commentEntry.setCreatedDate( date );
    assertEquals( date, commentEntry.getCreatedDate() );
  }
}
