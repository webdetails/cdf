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


package org.pentaho.cdf.comments;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;

import java.sql.Date;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doCallRealMethod;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;

public class CommentsEngineTest {

  @Test
  public void testEncodeComment() throws JSONException {
    CommentEntry comment = mock( CommentEntry.class );
    doReturn( 1 ).when( comment ).getCommentId();
    doReturn( "admin" ).when( comment ).getUser();
    doReturn( "page.wcdf\">" ).when( comment ).getPage();
    doReturn( Date.valueOf( "2000-01-01" ) ).when( comment ).getCreatedDate();
    doReturn( 100L ).when( comment ).getMinutesSinceCreation();
    doReturn( "<script>alert('Hacked!');</script>" ).when( comment ).getComment();
    doReturn( false ).when( comment ).isDeleted();
    doReturn( false ).when( comment ).isArchived();

    CommentsEngine engine = mock( CommentsEngine.class );
    doCallRealMethod().when( engine ).commentToJson( any(), any() );

    JSONObject json = engine.commentToJson( comment, "admin" );

    assertEquals( "page.wcdf&#34;&gt;", json.getString( "page" ) );
    assertEquals( "&lt;script&gt;alert(\\'Hacked!\\');&lt;/script&gt;", json.getString( "comment" ) );
  }
}
