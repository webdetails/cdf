/*!
 * Copyright 2002 - 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;

import java.sql.Date;

import static org.junit.Assert.assertEquals;
import static org.mockito.Matchers.any;
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
