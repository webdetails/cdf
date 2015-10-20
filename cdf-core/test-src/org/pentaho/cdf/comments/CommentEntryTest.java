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
